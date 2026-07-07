/**
 * Pomodoro Calendar Plugin for Obsidian
 * Main Plugin Entry Point
 */

import { Plugin, Notice, addIcon, Modal, App } from 'obsidian';
import { PomodoroTimer, PomodoroSession, PomodoroType, getSessionEmoji, getCompletedEmoji } from './pomodoro';
import { PomodoroAnimatedBar } from './animatedBar';
import { PomodoroSettingsTab, PomodoroCalendarSettings, DEFAULT_SETTINGS } from './settings';
import { CalendarIntegration } from './calendarIntegration';
import { PomodoroDataStore, StoredData } from './dataStore';

/**
 * Simple Input Modal for Obsidian
 */
class InputModal extends Modal {
	private resolve: (value: string) => void;
	private placeholder: string;
	private defaultValue: string;

	constructor(app: App, placeholder: string, defaultValue: string = '') {
		super(app);
		this.placeholder = placeholder;
		this.defaultValue = defaultValue;
		this.resolve = () => {};
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.addClass('pomodoro-input-modal');
		contentEl.createEl('h2', { text: '📝 记录番茄钟内容' });

		const input = contentEl.createEl('input', {
			type: 'text',
			placeholder: this.placeholder,
		});
		input.value = this.defaultValue;
		input.addClass('pomodoro-modal-input');

		const buttonContainer = contentEl.createDiv({
			cls: 'modal-button-container'
		});

		const submitBtn = buttonContainer.createEl('button', {
			text: '确定',
			cls: 'mod-cta'
		});
		const cancelBtn = buttonContainer.createEl('button', {
			text: '取消'
		});

		submitBtn.addEventListener('click', () => {
			this.resolve(input.value);
			this.close();
		});

		cancelBtn.addEventListener('click', () => {
			this.resolve('');
			this.close();
		});

		// Allow Enter key to submit
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				this.resolve(input.value);
				this.close();
			} else if (e.key === 'Escape') {
				this.resolve('');
				this.close();
			}
		});

		setTimeout(() => input.focus(), 10);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}

	async getInput(): Promise<string> {
		return new Promise((resolve) => {
			this.resolve = resolve as any;
			this.open();
		});
	}
}

// Register custom icon
const POMODORO_ICON = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8"/>
	<path d="M50 25 L50 50 L70 50" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
	<circle cx="50" cy="50" r="3" fill="currentColor"/>
</svg>`;

export default class PomodoroCalendarPlugin extends Plugin {
	settings!: PomodoroCalendarSettings;
	dataStore!: PomodoroDataStore;
	calendarIntegration!: CalendarIntegration;
	pomodoroTimer!: PomodoroTimer;
	ribbonIcon!: HTMLElement;
	animatedBar: PomodoroAnimatedBar | null = null;
	pluginId = 'pomodoro-calendar';

	async onload() {
		console.log('Loading Pomodoro Calendar Plugin');

		// Register custom icon
		addIcon('pomodoro-icon', POMODORO_ICON);

		// Load settings
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		// Initialize data store
		const dataPath = '.obsidian/plugins/pomodoro-calendar/data.json';
		this.dataStore = new PomodoroDataStore(this.app, dataPath);
		await this.dataStore.init();

		// Initialize calendar integration
		this.calendarIntegration = new CalendarIntegration(this.app);

		// Initialize pomodoro timer
		this.pomodoroTimer = new PomodoroTimer(this.settings, {
			onComplete: this.onPomodoroComplete.bind(this),
			onTick: this.onPomodoroTick.bind(this)
		});

		// Create ribbon icon
		this.createRibbonIcon();

		// Create floating progress bar
		this.animatedBar = new PomodoroAnimatedBar(this.app);

		// Register floating bar action callbacks
		this.animatedBar.onAction((action) => {
			this.handleFloatingBarAction(action);
		});

		// Apply settings to animated bar
		this.animatedBar?.updateStyle(this.settings.progressBarStyle);
		this.animatedBar?.updateDirection(this.settings.progressDirection || 'left-to-right');
		this.animatedBar?.setAnimationsEnabled(this.settings.showAnimations);
		this.animatedBar?.setPomodoroDuration(this.settings.pomodoroDuration * 60);

		// Register settings tab
		this.addSettingTab(new PomodoroSettingsTab(this.app, this));

		// Register commands
		this.registerCommands();

		// Register events
		this.registerEvents();

		// Initialize calendar integration if enabled
		if (this.settings.enableCalendarIntegration) {
			this.initCalendarIntegration();
		}

		// Register for external data sync
		this.dataStore.onSync(this.onDataSync.bind(this));

		// Load any existing session from storage
		await this.restoreSession();

		console.log('Pomodoro Calendar Plugin loaded successfully');
	}

	onunload() {
		console.log('Unloading Pomodoro Calendar Plugin');

		// Clean up
		this.animatedBar?.destroy();
		this.pomodoroTimer?.destroy();
		this.calendarIntegration?.destroy();
		this.dataStore?.destroy();

		// Remove ribbon icon
		if (this.ribbonIcon) {
			this.ribbonIcon.remove();
		}
	}


	/**
	 * Create ribbon icon in left sidebar
	 */
	private createRibbonIcon(): void {
		console.log('Creating ribbon icon...');

		this.ribbonIcon = this.addRibbonIcon(
			'pomodoro-icon',  // Use the registered icon ID
			'番茄钟',
			(evt: MouseEvent) => {
				console.log('Ribbon icon clicked!');
				this.toggleFloatingBar();
			}
		);

		// Add custom class
		this.ribbonIcon.addClass('pomodoro-ribbon-icon');

		// Set initial state
		this.updateRibbonIcon();

		console.log('Ribbon icon created:', this.ribbonIcon);
	}

	/**
	 * Update ribbon icon appearance based on timer state
	 */
	private updateRibbonIcon(): void {
		const session = this.pomodoroTimer.getSession();

		// Remove all state classes
		this.ribbonIcon.removeClass('pomodoro-idle');
		this.ribbonIcon.removeClass('pomodoro-running');
		this.ribbonIcon.removeClass('pomodoro-paused');

		if (!session || session.state === 'idle') {
			this.ribbonIcon.addClass('pomodoro-idle');
		} else if (session.state === 'running') {
			this.ribbonIcon.addClass('pomodoro-running');
		} else if (session.state === 'paused') {
			this.ribbonIcon.addClass('pomodoro-paused');
		}
	}

	/**
	 * Toggle floating bar visibility
	 */
	private toggleFloatingBar(): void {
		console.log('Toggle floating bar clicked');
		if (!this.animatedBar) {
			console.error('Floating bar not initialized!');
			return;
		}

		if (this.animatedBar.getVisibility()) {
			console.log('Hiding floating bar');
			this.animatedBar.hide();
		} else {
			console.log('Showing floating bar');
			this.animatedBar.show();
			// Update the floating bar with current session
			this.animatedBar.update(this.pomodoroTimer.getSession());
		}
	}

	/**
	 * Register plugin commands
	 */
	private registerCommands(): void {
		// Start Pomodoro
		this.addCommand({
			id: 'start-pomodoro',
			name: '开始番茄钟',
			icon: 'pomodoro-icon',
			callback: () => {
				this.startPomodoro();
			}
		});

		// Start Short Break
		this.addCommand({
			id: 'start-short-break',
			name: '开始小休',
			callback: () => {
				this.startBreak('shortBreak');
			}
		});

		// Start Long Break
		this.addCommand({
			id: 'start-long-break',
			name: '开始长休',
			callback: () => {
				this.startBreak('longBreak');
			}
		});

		// Pause/Resume
		this.addCommand({
			id: 'toggle-pomodoro',
			name: '暂停/继续',
			callback: () => {
				this.togglePause();
			}
		});

		// Complete
		this.addCommand({
			id: 'complete-pomodoro',
			name: '完成番茄钟',
			callback: () => {
				this.completePomodoro();
			}
		});

		// Cancel
		this.addCommand({
			id: 'cancel-pomodoro',
			name: '取消番茄钟',
			callback: () => {
				this.cancelPomodoro();
			}
		});

		// Toggle floating bar
		this.addCommand({
			id: 'toggle-pomodoro-bar',
			name: '显示/隐藏番茄钟面板',
			callback: () => {
				this.toggleFloatingBar();
			}
		});
	}

	/**
	 * Register event handlers
	 */
	private registerEvents(): void {
		// Register workspace layout change for potential plugin updates
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				// Try to initialize calendar integration if not already done
				if (this.settings.enableCalendarIntegration && !this.calendarIntegration.isAvailable()) {
					this.initCalendarIntegration();
				}
			})
		);
	}

	/**
	 * Handle floating bar actions
	 */
	private handleFloatingBarAction(action: string): void {
		switch (action) {
			case 'toggle':
				this.togglePause();
				break;
			case 'complete':
				this.completePomodoro();
				break;
			case 'cancel':
				this.cancelPomodoro();
				break;
			case 'skip':
				this.skipPomodoro();
				break;
			case 'menu':
				// Could open a settings menu here
				break;
		}
	}

	/**
	 * Initialize calendar integration
	 */
	initCalendarIntegration(): boolean {
		const config = {
			url: this.settings.caldavUrl,
			username: this.settings.caldavUsername,
			password: this.settings.caldavPassword,
			// calendarPath is now included in the URL
		};

		const success = this.calendarIntegration.init(config);

		if (success) {
			new Notice('✅ CalDAV 集成已启用');
		}

		return success;
	}

	/**
	 * Restore session from data store
	 */
	async restoreSession(): Promise<void> {
		const storedSession = this.dataStore.getCurrentSession();

		if (storedSession && storedSession.state === 'running') {
			// Calculate remaining time
			const startTime = new Date(storedSession.startTime!);
			const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
			const remaining = Math.max(0, storedSession.remaining - elapsed);

			if (remaining > 0) {
				// Restore the session
				const session = this.pomodoroTimer.start(storedSession.type);
				session.remaining = remaining;
				session.id = storedSession.id;
				session.startTime = startTime; // Restore original start time

				// Show floating bar
				this.animatedBar?.show();
				this.animatedBar?.update(session);


				this.updateRibbonIcon();
				new Notice('🔄 已恢复之前的番茄钟会话');
			} else {
				// Session expired, clear it
				await this.dataStore.saveCurrentSession(null);
			}
		}
	}

	/**
	 * Start a new pomodoro
	 */
	startPomodoro(): void {
		const session = this.pomodoroTimer.start('pomodoro');

		// Show and update floating bar
		this.animatedBar?.show();
		this.animatedBar?.update(session);

		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			new Notice('🍅 开始专注！');
		}


		// Save to data store
		this.dataStore.saveCurrentSession(session);
	}

	/**
	 * Start a break
	 */
	startBreak(type: PomodoroType): void {
		const session = this.pomodoroTimer.start(type);

		// Show and update floating bar
		this.animatedBar?.show();
		this.animatedBar?.update(session);

		this.updateRibbonIcon();

		const emoji = type === 'shortBreak' ? '☕' : '🌴';
		const message = type === 'shortBreak' ? '休息一下' : '长休时间';
		new Notice(emoji + " " + message + "!");


		// Save to data store
		this.dataStore.saveCurrentSession(session);
	}

	/**
	 * Pause the current pomodoro
	 */
	pausePomodoro(): void {
		this.pomodoroTimer.pause();

		this.animatedBar?.update(this.pomodoroTimer.getSession());
		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			new Notice('⏸️ 已暂停');
		}

		// Save to data store
		const session = this.pomodoroTimer.getSession();
		if (session) {
			this.dataStore.saveCurrentSession(session);
		}
	}

	/**
	 * Resume the paused pomodoro
	 */
	resumePomodoro(): void {
		this.pomodoroTimer.resume();

		this.animatedBar?.update(this.pomodoroTimer.getSession());
		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			new Notice('▶️ 继续专注！');
		}

		// Save to data store
		const session = this.pomodoroTimer.getSession();
		if (session) {
			this.dataStore.saveCurrentSession(session);
		}
	}

	/**
	 * Toggle pause/resume
	 */
	togglePause(): void {
		const session = this.pomodoroTimer.getSession();

		if (!session) {
			this.startPomodoro();
		} else if (session.state === 'running') {
			this.pausePomodoro();
		} else if (session.state === 'paused') {
			this.resumePomodoro();
		}
	}

	/**
	 * Complete the current pomodoro (manual trigger)
	 */
	completePomodoro(): void {
		const session = this.pomodoroTimer.getSession();

		if (!session) return;

		// Trigger completion - the callback will handle everything
		this.pomodoroTimer.complete();
	}

	/**
	 * Cancel the current pomodoro
	 */
	cancelPomodoro(): void {
		this.pomodoroTimer.cancel();

		this.animatedBar?.hide();
		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			new Notice('❌ 已取消');
		}

		// Cancel calendar event
		if (this.settings.enableCalendarIntegration) {
			this.calendarIntegration.cancelPomodoroEvent();
		}

		// Clear from data store
		this.dataStore.saveCurrentSession(null);
	}

	/**
	 * Skip the current session
	 */
	skipPomodoro(): void {
		const session = this.pomodoroTimer.getSession();
		if (!session) return;

		// Determine next phase based on current session type
		if (session.type === 'pomodoro') {
			// Skip pomodoro and go to break (without counting as completed)
			this.pomodoroTimer.cancel();
			// Start break after a short delay
			setTimeout(() => {
				const breakType = this.pomodoroTimer.getTotalCompletedCount() >= this.settings.longBreakInterval ? 'longBreak' : 'shortBreak';
				this.startBreak(breakType);
			}, 100);
		} else if (session.type === 'shortBreak' || session.type === 'longBreak') {
			// Skip break and go to next pomodoro
			this.pomodoroTimer.cancel();
			// Start next pomodoro after a short delay
			setTimeout(() => {
				this.startPomodoro();
			}, 100);
		}

		if (this.settings.showNotifications) {
			new Notice('⏭ 已跳过');
		}

		// Cancel calendar event for current session
		if (this.settings.enableCalendarIntegration) {
			this.calendarIntegration.cancelPomodoroEvent();
		}
	}

	/**
	 * Pomodoro timer callbacks
	 */

	private async onPomodoroComplete(session: PomodoroSession): Promise<void> {

		// Update floating bar with completed session
		this.animatedBar?.update(session);
		this.animatedBar?.showCompletionAnimation();
		this.updateRibbonIcon();

		if (this.settings.showNotifications) {
			const emoji = session.type === 'pomodoro' ? '🍅' :
			              session.type === 'shortBreak' ? '☕' : '🌴';
			new Notice(emoji + " 完成!干得漂亮!");

			// Play sound if enabled
			if (this.settings.notificationSound) {
				this.playNotificationSound();
			}
		}


		// Check if this was a manual completion
		const wasManual = (session as any).manuallyCompleted !== false;

		// Create calendar event for any manually completed session
		if (this.settings.enableCalendarIntegration && wasManual) {
			const modal = new InputModal(this.app, '留空使用默认标题', '');
			const customTitle = await modal.getInput();
			this.calendarIntegration.createPomodoroEvent(session, customTitle);
		}


		// Clear from data store
		this.dataStore.saveCurrentSession(null);

		// Reset to idle state after completion animation
		setTimeout(() => {
			const currentSession = this.pomodoroTimer.getSession();
			if (!currentSession) {
				// Update with null to reset to idle state
				this.animatedBar?.update(null);
				// Keep the bar visible with completed count
				this.animatedBar?.show();
			}
		}, 1000);

		// Auto-start next if enabled (only for natural completion, not manual)
		if (!wasManual) {
			// Only auto-start if it was a natural completion
			if (session.type === 'pomodoro' && this.settings.autoStartBreak) {
				setTimeout(() => {
					this.startBreak('shortBreak');
				}, 1000);
			} else if ((session.type === 'shortBreak' || session.type === 'longBreak') && this.settings.autoStartPomodoro) {
				setTimeout(() => {
					this.startPomodoro();
				}, 1000);
			}
		}
	}



	private onPomodoroTick(remaining: number, total: number): void {
		// Update floating bar
		this.animatedBar?.update(this.pomodoroTimer.getSession());

		// Save remaining time to data store periodically
		if (remaining % 10 === 0) {
			this.dataStore.updateSessionRemaining(remaining);
		}
	}


	/**
	 * Handle external data sync
	 */
	private onDataSync(data: StoredData): void {
		console.log('External data synced:', data);

		// Reload session if different
		const currentSession = this.pomodoroTimer.getSession();
		const externalSession = data.currentSession;

		if (externalSession && (!currentSession || currentSession.id !== externalSession.id)) {
			// Session changed from another device
			this.restoreSession();
		}
	}

	/**
	 * Update status bar style (called from settings)
	 */
	updateStatusBarStyle(): void {
		// Update floating bar style
		this.animatedBar?.updateStyle(this.settings.progressBarStyle);
	}

	/**
	 * Update animation state (called from settings)
	 */
	updateAnimationState(): void {
		this.animatedBar?.setAnimationsEnabled(this.settings.showAnimations);
	}

	/**
	 * Update animation direction (called from settings)
	 */
	updateAnimationDirection(): void {
		this.animatedBar?.updateDirection(this.settings.progressDirection || 'left-to-right');
	}

	/**
	 * Play notification sound
	 */
	private playNotificationSound(): void {
		try {
			// Create audio element with a simple beep sound
			const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSmBzvLZiTQIGGi77eegTAMMKalf7blnEAo4kdezzXksBSRxze7YkoACFFi5eu+nWUUKQ5zg8L1vIAUngM/x24U0BBlm5Ozq2VlGkOc4PC9byAFJ4DN89uJNAgRYubrvtplFjlDnODwvG8gBSWAzfDbhTQEGGWt7OrJWQpQ5zhL39iMBJYDO8N2SRAgRYJnp6LNSEQpT5w78qY0HElhN5+z2kUECWGd6miq05ECUOcG/atkBxJQDeys9tGBAkhnemppt2RAkDnBv2rZA');
			audio.volume = 0.3;
			audio.play().catch(err => console.log('Could not play sound:', err));
		} catch (error) {
			console.log('Error playing sound:', error);
		}
	}

	/**
	 * Save settings to disk
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);

		// Update calendar integration if enabled
		if (this.settings.enableCalendarIntegration) {
			this.initCalendarIntegration();
		}
	}
}

/**
 * Pomodoro Calendar Plugin for Obsidian
 * Main Plugin Entry Point
 */

import { Plugin, Notice, addIcon, Modal, App } from 'obsidian';
import { PomodoroTimer, PomodoroSession, PomodoroType } from './pomodoro';
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
		input.style.width = '100%';
		input.style.marginBottom = '1rem';

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

		// Load CSS styles
		this.loadPluginStyles();

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
	 * Load plugin CSS styles
	 */
	private loadPluginStyles(): void {
		const cssContent = `
	/* Pomodoro Calendar Plugin Styles */
	.pomodoro-ribbon-icon { position: relative; color: var(--text-muted, #888) !important; }
	.pomodoro-ribbon-icon svg { width: 20px; height: 20px; stroke: currentColor; }
	.pomodoro-ribbon-icon:hover { color: var(--text-normal, #ddd) !important; }
	.pomodoro-ribbon-icon.pomodoro-idle { opacity: 0.8; }
	.pomodoro-ribbon-icon.pomodoro-running { opacity: 1; color: var(--text-accent, #7ee787) !important; animation: pulse-icon 1.5s ease-in-out infinite; }
	.pomodoro-ribbon-icon.pomodoro-paused { opacity: 0.5; color: var(--text-muted, #666) !important; }
	@keyframes pulse-icon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

	/* Animated Progress Bar Styles */
	.pomodoro-animated-bar { position: fixed; left: 0; right: 0; bottom: 60px; height: 70px; background: transparent; display: none; flex-direction: column; justify-content: flex-end; z-index: 1000; opacity: 1; transition: opacity 0.3s ease; pointer-events: none; }
	.pomodoro-animated-bar.pomodoro-visible { opacity: 1; pointer-events: auto; }
	.pomodoro-animated-bg { position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: transparent; margin: 0 8px; }
	.pomodoro-animated-controls { position: absolute; bottom: 100%; right: 50%; transform: translateX(50%); display: flex; gap: 6px; flex-direction: row; z-index: 10; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; }
			.pomodoro-animated-bar:hover .pomodoro-animated-controls { opacity: 1; pointer-events: auto; }
.pomodoro-direction-rtl .pomodoro-animated-controls { right: auto; left: 50%; transform: translateX(-50%); margin-bottom: 4px; }
	.pomodoro-action-btn { opacity: 0; transition: opacity 0.2s ease; pointer-events: none; }
	.pomodoro-animated-bar:hover .pomodoro-action-btn { opacity: 1; pointer-events: auto; }
	.pomodoro-animated-btn { width: 28px; height: 28px; font-size: 14px; border-radius: 6px; border: none; background: rgba(42, 42, 42, 0.8); color: var(--text-normal, #ddd); font-weight: bold; cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
	.pomodoro-animated-btn:hover { background: rgba(58, 58, 58, 0.9); transform: scale(1.03); }
	.pomodoro-animated-btn:active { transform: scale(0.97); }
	.pomodoro-progress-trail { position: absolute; bottom: 4px; left: 12px; right: 12px; height: 12px; background: color-mix(in srgb, var(--interactive-accent) 15%, transparent); border-radius: 6px; overflow: hidden; z-index: 6; }
	.pomodoro-white-track { position: absolute; top: 0; left: 0; height: 100%; width: 0%; background: color-mix(in srgb, var(--interactive-accent) 80%, transparent); transition: width 0.3s ease; border-radius: 6px; }
	.pomodoro-direction-rtl .pomodoro-white-track { left: auto; right: 0; }
	.pomodoro-coin-track { position: absolute; bottom: 4px; left: 12px; right: 12px; height: 12px; background: transparent; border-radius: 6px; z-index: 7; pointer-events: none; }
	.pomodoro-track-coin { position: absolute; font-size: 13px; opacity: 0.8; color: var(--text-normal, #ddd); transform: translate(-50%, -50%); pointer-events: none; }
	.pomodoro-character { position: absolute; bottom: 4px; left: 0; right: 0; height: 20px; z-index: 25; pointer-events: none; }
	.pomodoro-character-white { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 24px; color: var(--text-muted, #888); filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8)); transition: left 0.3s ease; }
	.pomodoro-character-gold { position: absolute; top: 50%; transform: translate(-50%, -50%); font-size: 24px; color: var(--text-accent, #ff6b6b); opacity: 0; transition: left 0.3s ease, opacity 0.3s ease; filter: drop-shadow(0 0 8px var(--text-accent, #ff6b6b)); }
	.pomodoro-animated-bar.pomodoro-state-running .pomodoro-character-white, .pomodoro-animated-bar.pomodoro-state-running .pomodoro-character-gold { animation: character-bounce 0.5s ease-in-out infinite; }
	@keyframes character-bounce { 0%, 100% { transform: translate(-50%, -50%) translateY(0); } 50% { transform: translate(-50%, -50%) translateY(-3px); } }
	.pomodoro-progress-text { position: absolute; top: 8px; left: 12px; right: 12px; display: flex; align-items: center; gap: 12px; font-family: var(--font-monospace, monospace); pointer-events: none; justify-content: flex-end; }
	.pomodoro-direction-rtl .pomodoro-progress-text { justify-content: flex-start; }
	.pomodoro-time-clickable { display: flex; align-items: center; gap: 4px; cursor: pointer; pointer-events: auto; transition: opacity 0.2s ease; user-select: none; background: var(--background-secondary, #1e1e1e); padding: 4px 10px; border-radius: 6px; }
	.pomodoro-time-clickable:hover { opacity: 0.8; }
	.pomodoro-time-display { font-size: 18px; font-weight: 700; color: var(--text-accent, #7ee787); text-shadow: 0 0 8px rgba(126, 231, 135, 0.3); }
	.pomodoro-total-duration { font-size: 12px; color: var(--text-muted, #999); font-weight: 500; }
	.pomodoro-percent-display { font-size: 12px; color: var(--text-muted, #999); font-weight: 600; }
	.pomodoro-celebration-particle { position: absolute; font-size: 16px; animation: particle-fly 2s ease forwards; pointer-events: none; z-index: 30; }
	@keyframes particle-fly { 0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; } 100% { transform: translateY(-80px) scale(0) rotate(360deg); opacity: 0; } }
	.pomodoro-animated-bar.pomodoro-completed { animation: celebrate-bar 0.8s ease; }
	@keyframes celebrate-bar { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
	.pomodoro-animated-bar.pomodoro-completed .pomodoro-white-track { animation: track-complete 0.8s ease forwards; }
	@keyframes track-complete { 0% { background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.9)); } 50% { background: linear-gradient(to right, #ffd700, #fff, #ffd700); } 100% { background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.9)); } }
	.pomodoro-animated-bar.pomodoro-completed .pomodoro-character { animation: star-celebrate 0.8s ease; }
	@keyframes star-celebrate { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.3); } }
	.pomodoro-animated-bar.pomodoro-no-animations * { animation: none !important; transition: none !important; }

	/* Responsive adjustments */
	@media (max-width: 600px) {
		.pomodoro-animated-bar { bottom: 50px; height: 75px; }
		.pomodoro-animated-bg { height: 40px; margin: 0 4px; }
		.pomodoro-progress-trail { bottom: 6px; left: 10px; right: 10px; height: 16px; }
		.pomodoro-animated-controls { top: 4px; right: 10px; }
		.pomodoro-animated-btn { width: 32px; height: 32px; font-size: 14px; }
		.pomodoro-character { font-size: 16px; }
		.pomodoro-track-coin { font-size: 10px; }
		.pomodoro-time-display { font-size: 16px; }
		.pomodoro-percent-display { font-size: 11px; }
	}
	`;
		const styleEl = document.createElement('style');
		styleEl.textContent = cssContent;
		styleEl.id = `${this.pluginId}-styles}`;
		document.head.appendChild(styleEl);
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
		console.log('onPomodoroComplete - wasManual:', (session as any).manuallyCompleted, 'type:', session.type);
		console.log('Pomodoro completed:', session);

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

		// Create calendar event only for manually completed pomodoros
		if (this.settings.enableCalendarIntegration && wasManual && session.type === 'pomodoro') {
			const modal = new InputModal(this.app, '留空使用默认标题', '');
			const customTitle = await modal.getInput();
			this.calendarIntegration.createPomodoroEvent(session, customTitle);
		}


		// Update statistics
		if (session.type === 'pomodoro') {
			this.dataStore.recordCompletedPomodoro(session.duration);
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

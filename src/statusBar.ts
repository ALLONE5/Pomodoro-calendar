/**
 * Status Bar UI Component
 * Displays the pomodoro timer in Obsidian's status bar with a rainbow progress bar
 */

import { PomodoroSession, PomodoroState, PomodoroType } from './pomodoro';

// Icons for different states
const ICONS = {
	idle: '🍅',
	running: '⏱️',
	paused: '⏸️',
	break: '☕',
	completed: '✅'
};

// Labels for different types (in Chinese and English)
const LABELS = {
	pomodoro: '专注',
	shortBreak: '小休',
	longBreak: '长休',
	idle: '准备'
};

/**
 * Context menu item
 */
interface ContextMenuItem {
	label: string;
	action: () => void;
	icon?: string;
}

/**
 * Status Bar UI Class
 * Manages the visual representation of the pomodoro timer
 */
export class PomodoroStatusBar {
	private containerEl: HTMLElement;
	private statusBarEl: HTMLElement | null = null;
	private progressBarContainer: HTMLElement | null = null;
	private progressBarFill: HTMLElement | null = null;
	private iconEl: HTMLElement | null = null;
	private timerEl: HTMLElement | null = null;
	private contextMenu: HTMLElement | null = null;
	private longPressTimer: number | null = null;
	private longPressDuration = 500; // ms for long press
	private isDestroyed = false;

	constructor(containerEl: HTMLElement) {
		this.containerEl = containerEl;
		this.createStatusBar();
		this.attachEvents();
	}

	/**
	 * Create the status bar element
	 */
	private createStatusBar(): void {
		// Main container
		this.statusBarEl = this.containerEl.createEl('div', {
			cls: 'pomodoro-status-bar'
		});

		// Progress bar container (rainbow background)
		this.progressBarContainer = this.statusBarEl.createEl('div', {
			cls: 'pomodoro-progress-container'
		});

		// Rainbow background segments
		const hues = [0, 60, 120, 180, 240, 300];
		hues.forEach((hue, index) => {
			const segment = this.progressBarContainer!.createEl('div', {
				cls: `pomodoro-rainbow-segment pomodoro-rainbow-segment-${index}`
			});
			(segment as HTMLElement).style.setProperty('--hue', hue.toString());
		});

		// Progress fill
		this.progressBarFill = this.progressBarContainer.createEl('div', {
			cls: 'pomodoro-progress-fill'
		});

		// Icon
		this.iconEl = this.statusBarEl.createEl('span', {
			cls: 'pomodoro-icon',
			text: ICONS.idle
		});

		// Timer display
		this.timerEl = this.statusBarEl.createEl('span', {
			cls: 'pomodoro-timer',
			text: '25:00'
		});

		// Create context menu
		this.createContextMenu();
	}

	/**
	 * Create context menu
	 */
	private createContextMenu(): void {
		this.contextMenu = document.createElement('div');
		this.contextMenu.className = 'pomodoro-context-menu';
		this.contextMenu.style.display = 'none';
		document.body.appendChild(this.contextMenu);

		// Close menu when clicking outside
		document.addEventListener('click', (e) => {
			if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
				this.hideContextMenu();
			}
		});
	}

	/**
	 * Attach event listeners
	 */
	private attachEvents(): void {
		if (!this.statusBarEl) return;

		// Left click - toggle start/pause
		this.statusBarEl.addEventListener('click', (e) => {
			if (this.longPressTimer) return; // Ignore if long press was triggered
			this.handleLeftClick(e);
		});

		// Right click - show context menu
		this.statusBarEl.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showContextMenu(e.clientX, e.clientY);
		});

		// Touch events for long press
		this.statusBarEl.addEventListener('touchstart', (e) => {
			this.longPressTimer = window.setTimeout(() => {
				this.handleLongPress(e);
				this.longPressTimer = null;
			}, this.longPressDuration);
		});

		this.statusBarEl.addEventListener('touchend', () => {
			if (this.longPressTimer) {
				window.clearTimeout(this.longPressTimer);
				this.longPressTimer = null;
			}
		});

		this.statusBarEl.addEventListener('touchmove', () => {
			if (this.longPressTimer) {
				window.clearTimeout(this.longPressTimer);
				this.longPressTimer = null;
			}
		});
	}

	/**
	 * Handle left click - to be implemented by main plugin
	 */
	private handleLeftClick(e: MouseEvent): void {
		// Emit custom event for main plugin to handle
		const event = new CustomEvent('pomodoro-click', { detail: { type: 'left' } });
		this.statusBarEl?.dispatchEvent(event);
	}

	/**
	 * Handle long press - show context menu
	 */
	private handleLongPress(e: TouchEvent): void {
		const touch = e.touches[0];
		this.showContextMenu(touch.clientX, touch.clientY);
	}

	/**
	 * Show context menu at position
	 */
	public showContextMenu(x: number, y: number, items: ContextMenuItem[] = []): void {
		if (!this.contextMenu) return;

		// Clear existing items
		this.contextMenu.innerHTML = '';

		// Add default items if none provided
		const defaultItems: ContextMenuItem[] = [
			{ label: '开始', icon: '▶️', action: () => this.emitMenuAction('start') },
			{ label: '暂停', icon: '⏸️', action: () => this.emitMenuAction('pause') },
			{ label: '继续', icon: '⏱️', action: () => this.emitMenuAction('resume') },
			{ label: '结束', icon: '✅', action: () => this.emitMenuAction('complete') },
			{ label: '取消', icon: '❌', action: () => this.emitMenuAction('cancel') },
			{ label: '设置', icon: '⚙️', action: () => this.emitMenuAction('settings') }
		];

		const menuItems = items.length > 0 ? items : defaultItems;

		// Create menu items
		menuItems.forEach(item => {
			const menuItem = this.contextMenu!.createEl('div', {
				cls: 'pomodoro-menu-item'
			});

			if (item.icon) {
				menuItem.createEl('span', {
					cls: 'pomodoro-menu-icon',
					text: item.icon
				});
			}

			menuItem.createEl('span', {
				cls: 'pomodoro-menu-label',
				text: item.label
			});

			menuItem.addEventListener('click', (e) => {
				e.stopPropagation();
				item.action();
				this.hideContextMenu();
			});
		});

		// Position and show
		this.contextMenu.style.display = 'block';
		this.contextMenu.style.left = `${x}px`;
		this.contextMenu.style.top = `${y}px`;

		// Adjust position if menu would go off screen
		const rect = this.contextMenu.getBoundingClientRect();
		if (rect.right > window.innerWidth) {
			this.contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
		}
		if (rect.bottom > window.innerHeight) {
			this.contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
		}
	}

	/**
	 * Hide context menu
	 */
	public hideContextMenu(): void {
		if (this.contextMenu) {
			this.contextMenu.style.display = 'none';
		}
	}

	/**
	 * Emit menu action event
	 */
	private emitMenuAction(action: string): void {
		const event = new CustomEvent('pomodoro-menu-action', { detail: { action } });
		document.dispatchEvent(event);
	}

	/**
	 * Register a callback for menu actions
	 */
	public onMenuAction(callback: (action: string) => void): void {
		document.addEventListener('pomodoro-menu-action', (e: Event) => {
			const customEvent = e as CustomEvent<{ action: string }>;
			callback(customEvent.detail.action);
		});
	}

	/**
	 * Register a callback for clicks
	 */
	public onClick(callback: (type: 'left' | 'right' | 'long') => void): void {
		if (!this.statusBarEl) return;

		this.statusBarEl.addEventListener('pomodoro-click', (e: Event) => {
			const customEvent = e as CustomEvent<{ type: 'left' | 'right' | 'long' }>;
			callback(customEvent.detail.type);
		});
	}

	/**
	 * Update the status bar display
	 */
	public update(session: PomodoroSession | null): void {
		if (!this.statusBarEl || this.isDestroyed) return;

		if (!session) {
			// Idle state
			this.updateState('idle');
			this.updateTimer(25 * 60, 25 * 60); // Default pomodoro time
			this.updateProgress(0);
			return;
		}

		// Update icon based on state
		switch (session.state) {
			case 'running':
				this.updateState(session.type === 'pomodoro' ? 'running' : 'break');
				break;
			case 'paused':
				this.updateState('paused');
				break;
			case 'completed':
				this.updateState('completed');
				break;
			default:
				this.updateState('idle');
		}

		// Update timer display
		this.updateTimer(session.remaining, session.duration);

		// Update progress bar
		const progress = 1 - (session.remaining / session.duration);
		this.updateProgress(progress);
	}

	/**
	 * Update icon based on state
	 */
	private updateState(state: PomodoroState | 'idle'): void {
		if (!this.iconEl) return;

		this.iconEl.textContent = ICONS[state] || ICONS.idle;
		if (this.statusBarEl) {
			this.statusBarEl.dataset.state = state;
		}
	}

	/**
	 * Update timer display
	 */
	private updateTimer(remaining: number, total: number): void {
		if (!this.timerEl) return;

		const mins = Math.floor(remaining / 60);
		const secs = remaining % 60;
		this.timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	/**
	 * Update progress bar
	 */
	private updateProgress(progress: number): void {
		if (!this.progressBarFill) return;

		const percentage = Math.max(0, Math.min(100, progress * 100));
		this.progressBarFill.style.width = `${percentage}%`;
	}

	/**
	 * Show completion animation
	 */
	public showCompletionAnimation(): void {
		if (!this.statusBarEl || this.isDestroyed) return;

		this.statusBarEl.addClass('pomodoro-completed');

		// Remove class after animation completes
		setTimeout(() => {
			this.statusBarEl?.removeClass('pomodoro-completed');
		}, 2000);
	}

	/**
	 * Get the main status bar element
	 */
	public getElement(): HTMLElement | null {
		return this.statusBarEl;
	}

	/**
	 * Clean up resources
	 */
	public destroy(): void {
		this.isDestroyed = true;

		if (this.longPressTimer) {
			window.clearTimeout(this.longPressTimer);
		}

		if (this.contextMenu && this.contextMenu.parentNode) {
			this.contextMenu.parentNode.removeChild(this.contextMenu);
		}

		if (this.statusBarEl && this.statusBarEl.parentNode) {
			this.statusBarEl.parentNode.removeChild(this.statusBarEl);
		}

		this.progressBarContainer = null;
		this.progressBarFill = null;
		this.iconEl = null;
		this.timerEl = null;
		this.contextMenu = null;
		this.statusBarEl = null;
	}
}

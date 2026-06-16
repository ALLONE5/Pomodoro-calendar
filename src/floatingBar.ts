/**
 * Floating Progress Bar Component
 * Shows an animated progress bar at the bottom of the screen when timer is running
 */

import { App } from 'obsidian';
import { PomodoroSession, PomodoroType } from './pomodoro';

const ICONS = {
	idle: '🍅',
	running: '⏱️',
	paused: '⏸️',
	break: '☕',
	completed: '✅'
};

const LABELS = {
	pomodoro: '专注中',
	shortBreak: '小休',
	longBreak: '长休',
	idle: '准备'
};

/**
 * Floating Progress Bar Class
 */
export class PomodoroFloatingBar {
	private app: App;
	private containerEl: HTMLElement | null = null;
	private isCurrentlyVisible = false;
	private isDestroyed = false;
	private progressBarEl: HTMLElement | null = null;
	private progressFillEl: HTMLElement | null = null;
	private iconEl: HTMLElement | null = null;
	private timerEl: HTMLElement | null = null;
	private labelEl: HTMLElement | null = null;
	private animationsEnabled = true;
	private currentStyle: 'rainbow' | 'gradient' | 'solid' | 'minimal' = 'rainbow';
	private solidColor = '#ff6b6b';

	constructor(app: App) {
		this.app = app;
		this.createFloatingBar();
		this.attachEvents();
	}

	/**
	 * Create the floating progress bar
	 */
	private createFloatingBar(): void {
		// Create main container
		this.containerEl = document.createElement('div');
		this.containerEl.className = 'pomodoro-floating-bar';
		this.containerEl.setAttribute('data-style', this.currentStyle);
		this.containerEl.style.setProperty('--pomodoro-solid-color', this.solidColor);

		// Create content wrapper
		const contentWrapper = this.containerEl.createEl('div', {
			cls: 'pomodoro-floating-content'
		});

		// Icon
		this.iconEl = contentWrapper.createEl('span', {
			cls: 'pomodoro-floating-icon',
			text: ICONS.idle
		});

		// Timer display
		this.timerEl = contentWrapper.createEl('span', {
			cls: 'pomodoro-floating-timer',
			text: '25:00'
		});

		// Label
		this.labelEl = contentWrapper.createEl('span', {
			cls: 'pomodoro-floating-label',
			text: LABELS.idle
		});

		// Control buttons
		const controlsEl = contentWrapper.createEl('div', {
			cls: 'pomodoro-floating-controls'
		});

		// Start/Pause button
		const startPauseBtn = controlsEl.createEl('button', {
			cls: 'pomodoro-floating-btn',
			text: '▶'
		});
		startPauseBtn.setAttribute('aria-label', '开始/暂停');
		startPauseBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.emitAction('toggle');
		});

		// Complete button
		const completeBtn = controlsEl.createEl('button', {
			cls: 'pomodoro-floating-btn',
			text: '✓'
		});
		completeBtn.setAttribute('aria-label', '完成');
		completeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.emitAction('complete');
		});

		// Cancel button
		const cancelBtn = controlsEl.createEl('button', {
			cls: 'pomodoro-floating-btn',
			text: '✕'
		});
		cancelBtn.setAttribute('aria-label', '取消');
		cancelBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.emitAction('cancel');
		});

		// Create progress bar container
		this.progressBarEl = this.containerEl.createEl('div', {
			cls: 'pomodoro-floating-progress'
		});

		// Create rainbow background
		const rainbowBg = this.progressBarEl.createEl('div', {
			cls: 'pomodoro-rainbow-bg'
		});

		// Create individual rainbow segments
		const hues = [0, 60, 120, 180, 240, 300];
		hues.forEach((hue, index) => {
			const segment = rainbowBg.createEl('div', {
				cls: `pomodoro-rainbow-segment pomodoro-rainbow-segment-${index}`
			});
			(segment as HTMLElement).style.setProperty('--hue', hue.toString());
		});

		// Create progress fill
		this.progressFillEl = this.progressBarEl.createEl('div', {
			cls: 'pomodoro-progress-fill'
		});

		// Initially hide
		this.containerEl.style.display = 'none';

		// Add to DOM
		document.body.appendChild(this.containerEl);
	}

	/**
	 * Attach event listeners
	 */
	private attachEvents(): void {
		if (!this.containerEl) return;

		// Click on container to toggle visibility of settings menu
		this.containerEl.addEventListener('click', (e) => {
			if ((e.target as HTMLElement).closest('.pomodoro-floating-btn')) {
				return; // Button click already handled
			}
			this.emitAction('menu');
		});
	}

	/**
	 * Emit action event
	 */
	private emitAction(action: string): void {
		const event = new CustomEvent('pomodoro-action', { detail: action });
		document.dispatchEvent(event);
	}

	/**
	 * Register action callback
	 */
	onAction(callback: (action: string) => void): void {
		document.addEventListener('pomodoro-action', (e: Event) => {
			const customEvent = e as CustomEvent<string>;
			callback(customEvent.detail);
		});
	}

	/**
	 * Show the floating bar
	 */
	show(): void {
		if (!this.containerEl || this.isDestroyed) return;

		this.containerEl.style.display = 'flex';
		// Trigger animation
		setTimeout(() => {
			this.containerEl?.addClass('pomodoro-visible');
		}, 10);

		this.isCurrentlyVisible = true;
	}

	/**
	 * Hide the floating bar
	 */
	hide(): void {
		if (!this.containerEl || this.isDestroyed) return;

		this.containerEl.removeClass('pomodoro-visible');

		// Wait for animation to complete before hiding
		setTimeout(() => {
			if (!this.isCurrentlyVisible) {
				this.containerEl!.style.display = 'none';
			}
		}, 300);

		this.isCurrentlyVisible = false;
	}

	/**
	 * Check if visible
	 */
	getVisibility(): boolean {
		return this.isCurrentlyVisible;
	}

	/**
	 * Update the display with current session
	 */
	update(session: PomodoroSession | null): void {
		if (!this.containerEl || this.isDestroyed) return;

		if (!session) {
			// Idle state
			this.updateDisplayState('idle');
			this.updateTimer(25 * 60);
			this.updateProgress(0);
			return;
		}

		// Update icon and label based on type and state
		if (session.state === 'running') {
			this.updateDisplayState(session.type === 'pomodoro' ? 'running' : 'break');
		} else if (session.state === 'paused') {
			this.updateDisplayState('paused');
		} else {
			this.updateDisplayState('idle');
		}

		// Update timer
		this.updateTimer(session.remaining);

		// Update progress
		const progress = 1 - (session.remaining / session.duration);
		this.updateProgress(progress);
	}

	/**
	 * Update display state
	 */
	private updateDisplayState(state: string): void {
		if (!this.containerEl || !this.iconEl || !this.labelEl) return;

		// Remove all state classes
		this.containerEl.removeClass('pomodoro-state-idle');
		this.containerEl.removeClass('pomodoro-state-running');
		this.containerEl.removeClass('pomodoro-state-paused');
		this.containerEl.removeClass('pomodoro-state-break');

		// Add current state class
		this.containerEl.addClass(`pomodoro-state-${state}`);

		// Update icon
		const icon = ICONS[state as keyof typeof ICONS] || ICONS.idle;
		this.iconEl.textContent = icon;

		// Update label based on session type (would need session info, using default for now)
		this.labelEl.textContent = LABELS[state as keyof typeof LABELS] || LABELS.idle;
	}

	/**
	 * Update timer display
	 */
	private updateTimer(remaining: number): void {
		if (!this.timerEl) return;

		const mins = Math.floor(remaining / 60);
		const secs = remaining % 60;
		this.timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	/**
	 * Update progress bar
	 */
	private updateProgress(progress: number): void {
		if (!this.progressFillEl) return;

		const percentage = Math.max(0, Math.min(100, progress * 100));
		this.progressFillEl.style.width = `${percentage}%`;
	}

	/**
	 * Update style
	 */
	updateStyle(style: 'rainbow' | 'gradient' | 'solid' | 'minimal', solidColor: string): void {
		if (!this.containerEl) return;

		this.currentStyle = style;
		this.solidColor = solidColor;

		this.containerEl.setAttribute('data-style', style);
		this.containerEl.style.setProperty('--pomodoro-solid-color', solidColor);
	}

	/**
	 * Set animations enabled
	 */
	setAnimationsEnabled(enabled: boolean): void {
		this.animationsEnabled = enabled;

		if (!this.containerEl) return;

		if (enabled) {
			this.containerEl.removeClass('pomodoro-no-animations');
		} else {
			this.containerEl.addClass('pomodoro-no-animations');
		}
	}

	/**
	 * Show completion animation
	 */
	showCompletionAnimation(): void {
		if (!this.containerEl || this.isDestroyed) return;

		this.containerEl.addClass('pomodoro-completed');

		// Remove class after animation completes
		setTimeout(() => {
			this.containerEl?.removeClass('pomodoro-completed');
		}, 2000);
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.isDestroyed = true;
		this.hide();

		if (this.containerEl && this.containerEl.parentNode) {
			this.containerEl.parentNode.removeChild(this.containerEl);
		}

		this.progressBarEl = null;
		this.progressFillEl = null;
		this.iconEl = null;
		this.timerEl = null;
		this.labelEl = null;
		this.containerEl = null;
	}
}

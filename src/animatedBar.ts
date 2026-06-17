/**
 * Animated Progress Bar with Cartoon Character
 * Shows a character collecting items while pushing progress forward
 */

import { App } from 'obsidian';
import { PomodoroSession } from './pomodoro';

interface AnimationConfig {
	character: string;
	items: string[];
	backgroundColor: string;
	direction?: 'left-to-right' | 'right-to-left';
}

// 使用白色星星角色
const DEFAULT_CHARACTER = `⭐`;
const ITEM_SETS = {
	coins: ['🪙', '💰', '🪙', '💰'],
	leaves: ['🍃', '🌿', '🌱'],
	tomatoes: ['🍅', '🥫', '🌶'],
	stars: ['⭐', '✨', '💫'],
	hearts: ['❤️', '💕', '💖']
};

/**
 * Animated Progress Bar Component
 */
export class PomodoroAnimatedBar {
	private app: App;
	private containerEl: HTMLElement | null = null;
	private isCurrentlyVisible = false;
	private isDestroyed = false;
	private characterEl: HTMLElement | null = null;
	private characterWhite: HTMLElement | null = null;
	private characterGold: HTMLElement | null = null;
	private progressTrail: HTMLElement | null = null;
	private coinTrack: HTMLElement | null = null;
	private whiteTrack: HTMLElement | null = null;
	private timeDisplay: HTMLElement | null = null;
	private percentDisplay: HTMLElement | null = null;
	private timeClickableArea: HTMLElement | null = null;
	private totalDurationDisplay: HTMLElement | null = null;
	private toggleBtn: HTMLElement | null = null;
	private currentProgress = 0;
	private animationFrame: number | null = null;
	private config: AnimationConfig;
	private actionCallback: ((action: string) => void) | null = null;
	private pomodoroDuration: number = 25 * 60;
	private completedCount: number = 0;

	constructor(app: App, config?: Partial<AnimationConfig>) {
		this.app = app;
		this.config = {
			character: config?.character || DEFAULT_CHARACTER,
			items: config?.items || ITEM_SETS.coins,
			backgroundColor: config?.backgroundColor || 'var(--background-secondary)',
			direction: config?.direction || 'left-to-right'
		};
		this.createAnimatedBar();
	}

	/**
	 * Create the animated progress bar
	 */
	private createAnimatedBar(): void {
		// Create main container
		this.containerEl = document.createElement('div');
		this.containerEl.className = 'pomodoro-animated-bar';
		this.containerEl.style.display = 'none';

		// Background
		const bgEl = this.containerEl.createEl('div', {
			cls: 'pomodoro-animated-bg'
		});

		// Control buttons container
		const controlsEl = bgEl.createEl('div', {
			cls: 'pomodoro-animated-controls'
		});

		// Start/Pause button
		this.toggleBtn = controlsEl.createEl('button', {
			cls: 'pomodoro-animated-btn',
			text: '▶'
		});
		this.toggleBtn.setAttribute('aria-label', '开始/暂停');
		this.toggleBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.emitAction('toggle');
		});

		// Complete button
		const completeBtn = controlsEl.createEl('button', {
			cls: 'pomodoro-animated-btn',
			text: '✓'
		});
		completeBtn.setAttribute('aria-label', '完成');
		completeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.emitAction('complete');
		});

			// Skip button
			const skipBtn = controlsEl.createEl('button', {
				cls: 'pomodoro-animated-btn',
				text: '⏭'
			});
			skipBtn.setAttribute('aria-label', '跳过本次');
			skipBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.emitAction('skip');
			});
		// Cancel button
		const cancelBtn = controlsEl.createEl('button', {
			cls: 'pomodoro-animated-btn',
			text: '✕'
		});
		cancelBtn.setAttribute('aria-label', '取消');
		cancelBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.emitAction('cancel');
		});

		// Coin decorations on the track (create in bgEl to avoid clipping)
		this.coinTrack = bgEl.createEl('div', {
			cls: 'pomodoro-coin-track'
		});

		// Progress trail (the track the star runs on)
		this.progressTrail = bgEl.createEl('div', {
			cls: 'pomodoro-progress-trail'
		});

		// White track (foreground - shows progress, turns white)
		this.whiteTrack = this.progressTrail.createEl('div', {
			cls: 'pomodoro-white-track'
		});

		// Character element (white star) - create in bgEl to avoid clipping
		this.characterEl = bgEl.createEl('div', {
			cls: 'pomodoro-character'
		});

		// White star (bottom layer)
		this.characterWhite = this.characterEl.createEl('span', {
			cls: 'pomodoro-character-white',
			text: this.config.character
		});

		// Gold star (top layer - opacity changes with progress)
		this.characterGold = this.characterEl.createEl('span', {
			cls: 'pomodoro-character-gold',
			text: this.config.character
		});
		// Initialize gold star as transparent
		this.characterGold.style.opacity = '0';

		// Progress percentage display
		const progressText = this.containerEl.createEl('div', {
			cls: 'pomodoro-progress-text'
		});

		// Time clickable area
		this.timeClickableArea = progressText.createEl('div', {
			cls: 'pomodoro-time-clickable'
		});
		this.timeClickableArea.addEventListener('click', (e) => {
			e.stopPropagation();
			this.emitAction('toggle');
		});

		// Completed count display
		this.totalDurationDisplay = this.timeClickableArea.createEl('span', {
			cls: 'pomodoro-total-duration',
			text: '🍅 x0'
		});

		this.timeDisplay = this.timeClickableArea.createEl('span', {
			cls: 'pomodoro-time-display',
			text: this.formatTime(this.pomodoroDuration)
		});

		this.percentDisplay = this.timeClickableArea.createEl('span', {
			cls: 'pomodoro-percent-display',
			text: '0%'
		});

		// Add to DOM
		document.body.appendChild(this.containerEl);

		// Create coin decorations on the track
		this.createCoinDecorations();
	}

	/**
	 * Create golden coin decorations along the track
	 */
	private createCoinDecorations(): void {
		if (!this.coinTrack) return;

		// Create 10 items spaced evenly along the track
		const items = this.config.items;
		for (let i = 0; i < 10; i++) {
			const coin = this.coinTrack.createEl('span', {
				cls: 'pomodoro-track-coin'
			});

			// Use items from config, cycling through them
			const itemSymbol = items[i % items.length];
			coin.textContent = itemSymbol;

			// Position along the track with margin on edges
			const margin = 10; // 10% margin on each side
			const position = margin + (i / 9) * (100 - 2 * margin);
			coin.style.left = `${position}%`;
			coin.style.top = '50%';
		}
	}

	/**
	 * Emit action event
	 */
	private emitAction(action: string): void {
		const event = new CustomEvent('pomodoro-action', { detail: action });
		document.dispatchEvent(event);

		if (this.actionCallback) {
			this.actionCallback(action);
		}
	}

	/**
	 * Show the animated bar
	 */
	show(): void {
		if (!this.containerEl || this.isDestroyed) return;

		this.containerEl.style.display = 'flex';
		setTimeout(() => {
			this.containerEl?.addClass('pomodoro-visible');
		}, 10);

		this.isCurrentlyVisible = true;
	}

	/**
	 * Hide the animated bar
	 */
	hide(): void {
		if (!this.containerEl || this.isDestroyed) return;

		this.containerEl.removeClass('pomodoro-visible');

		setTimeout(() => {
			if (!this.isCurrentlyVisible) {
				this.containerEl!.style.display = 'none';
			}
		}, 300);

		this.isCurrentlyVisible = false;
	}

	/**
	 * Get visibility
	 */
	getVisibility(): boolean {
		return this.isCurrentlyVisible;
	}

	/**
	 * Update the animation with current session
	 */
	update(session: PomodoroSession | null): void {
		if (!this.containerEl || this.isDestroyed) return;

		if (!session) {
			this.updateDisplay(0, this.pomodoroDuration, 'idle');
			return;
		}

		const progress = 1 - (session.remaining / session.duration);
		this.updateDisplay(progress, session.remaining, session.state);
			this.updateCompletedCount(session.completedCount);
	}

	/**
	 * Update the display
	 */
	private updateDisplay(progress: number, remaining: number, state: string): void {
		const percentage = Math.max(0, Math.min(100, progress * 100));

		// Calculate position based on direction
		const isRightToLeft = this.config.direction === 'right-to-left';
		const displayPercentage = isRightToLeft ? (100 - percentage) : percentage;

		// Update character position
		if (this.characterWhite) {
			this.characterWhite.style.left = `${displayPercentage}%`;
		}
		if (this.characterGold) {
			this.characterGold.style.left = `${displayPercentage}%`;
			// Update gold star opacity (color change from white to gold)
			const goldOpacity = percentage / 100;
			this.characterGold.style.setProperty('opacity', `${goldOpacity}`, 'important');
		}

		// Update white track width (shows how far the star has run)
		if (this.whiteTrack) {
			this.whiteTrack.style.width = `${percentage}%`;
		}

		// Update time display
		if (this.timeDisplay) {
			const mins = Math.floor(remaining / 60);
			const secs = remaining % 60;
			this.timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}

		// Update percentage display
		if (this.percentDisplay) {
			this.percentDisplay.textContent = `${Math.floor(percentage)}%`;
		}

		// Update state classes
		this.updateStateClasses(state);

		this.currentProgress = percentage;
	}

	/**
	 * Update state classes on container
	 */
	private updateStateClasses(state: string): void {
		if (!this.containerEl) return;

		// Remove all state classes
		this.containerEl.removeClass('pomodoro-state-idle');
		this.containerEl.removeClass('pomodoro-state-running');
		this.containerEl.removeClass('pomodoro-state-paused');

		// Add current state class
		this.containerEl.addClass(`pomodoro-state-${state}`);

		// Update toggle button text based on state
		if (this.toggleBtn) {
			if (state === 'running') {
				this.toggleBtn.textContent = '⏸';
				this.toggleBtn.setAttribute('aria-label', '暂停');
			} else {
				this.toggleBtn.textContent = '▶';
				this.toggleBtn.setAttribute('aria-label', '开始/继续');
			}
		}
	}

	/**
	 * Format seconds to MM:SS
	 */
	private formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	/**
	 * Set pomodoro duration
	 */
	setPomodoroDuration(duration: number): void {
		this.pomodoroDuration = duration;
		// Update the initial display if no session is active
		if (this.timeDisplay) {
			this.timeDisplay.textContent = this.formatTime(this.pomodoroDuration);
		}
	}


	/**
	 * Update completed count display
	 */
	updateCompletedCount(count: number): void {
		this.completedCount = count;
		if (this.totalDurationDisplay) {
			this.totalDurationDisplay.textContent = `🍅 x${count}`;
		}
	}


	/**
	 * Show completion animation
	 */
	showCompletionAnimation(): void {
		if (!this.containerEl || this.isDestroyed) return;

		this.containerEl.addClass('pomodoro-completed');

		// Trigger celebration animation
		this.celebrate();

		setTimeout(() => {
			this.containerEl?.removeClass('pomodoro-completed');
		}, 1000);
	}

	/**
	 * Celebration animation
	 */
	private celebrate(): void {
		if (!this.progressTrail) return;

		// Create celebration particles
		for (let i = 0; i < 20; i++) {
			setTimeout(() => {
				if (!this.progressTrail) return;

				const particle = this.progressTrail.createEl('span', {
					cls: 'pomodoro-celebration-particle'
				});

				if (!particle) return;

				const randomItem = this.config.items[Math.floor(Math.random() * this.config.items.length)];
				particle.textContent = randomItem;

				// Random position
				particle.style.left = `${Math.random() * 100}%`;
				particle.style.animationDelay = `${Math.random() * 0.5}s`;

				// Remove after animation
				setTimeout(() => {
					particle.remove();
				}, 2000);
			}, i * 50);
		}
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<AnimationConfig>): void {
		if (config.character) {
			this.config.character = config.character;
			if (this.characterWhite) {
				this.characterWhite.textContent = config.character;
			}
			if (this.characterGold) {
				this.characterGold.textContent = config.character;
			}
		}

		if (config.items) {
			this.config.items = config.items;
			// Recreate coin decorations
			if (this.coinTrack) {
				this.coinTrack.innerHTML = '';
				this.createCoinDecorations();
			}
		}

		if (config.backgroundColor) {
			this.config.backgroundColor = config.backgroundColor;
		}
	}

	/**
	 * Register action callback (for button clicks)
	 */
	onAction(callback: (action: string) => void): void {
		this.actionCallback = callback;
	}

	/**
	 * Update style (for compatibility)
	 */
	updateStyle(style: string): void {
		// Update the items based on style selection
		if (style === 'coins') {
			this.config.items = ITEM_SETS.coins;
		} else if (style === 'leaves') {
			this.config.items = ITEM_SETS.leaves;
		} else if (style === 'tomatoes') {
			this.config.items = ITEM_SETS.tomatoes;
		} else if (style === 'stars') {
			this.config.items = ITEM_SETS.stars;
		} else if (style === 'hearts') {
			this.config.items = ITEM_SETS.hearts;
		}

		// Recreate coin decorations
		if (this.coinTrack) {
			this.coinTrack.innerHTML = '';
			this.createCoinDecorations();
		}
	}

	/**
	 * Set animations enabled
	 */
	setAnimationsEnabled(enabled: boolean): void {
		if (!this.containerEl) return;

		if (enabled) {
			this.containerEl.removeClass('pomodoro-no-animations');
		} else {
			this.containerEl.addClass('pomodoro-no-animations');
		}
	}

	/**
	 * Update animation direction
	 */
	updateDirection(direction: 'left-to-right' | 'right-to-left'): void {
		if (!this.containerEl) return;

		// Remove existing direction class
		this.containerEl.removeClass('pomodoro-direction-ltr');
		this.containerEl.removeClass('pomodoro-direction-rtl');

		// Add new direction class
		if (direction === 'left-to-right') {
			this.containerEl.addClass('pomodoro-direction-ltr');
		} else {
			this.containerEl.addClass('pomodoro-direction-rtl');
		}

		// Store direction for update calculations
		this.config.direction = direction;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.isDestroyed = true;
		this.hide();

		if (this.animationFrame) {
			cancelAnimationFrame(this.animationFrame);
		}

		if (this.containerEl && this.containerEl.parentNode) {
			this.containerEl.parentNode.removeChild(this.containerEl);
		}

		this.progressTrail = null;
		this.coinTrack = null;
		this.whiteTrack = null;
		this.characterEl = null;
		this.characterWhite = null;
		this.characterGold = null;
		this.timeDisplay = null;
		this.percentDisplay = null;
		this.timeClickableArea = null;
		this.totalDurationDisplay = null;
		this.toggleBtn = null;
		this.containerEl = null;
	}
}

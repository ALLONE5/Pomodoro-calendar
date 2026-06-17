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
}

// 使用白色星星角色
const DEFAULT_CHARACTER = `⭐`;
const ITEM_SETS = {
	coins: ['🪙', '💰', '💎'],
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
	private progressTrail: HTMLElement | null = null;
	private coinTrack: HTMLElement | null = null;
	private whiteTrack: HTMLElement | null = null;
	private timeDisplay: HTMLElement | null = null;
	private percentDisplay: HTMLElement | null = null;
	private currentProgress = 0;
	private animationFrame: number | null = null;
	private config: AnimationConfig;
	private actionCallback: ((action: string) => void) | null = null;

	constructor(app: App, config?: Partial<AnimationConfig>) {
		this.app = app;
		this.config = {
			character: config?.character || DEFAULT_CHARACTER,
			items: config?.items || ITEM_SETS.coins,
			backgroundColor: config?.backgroundColor || 'var(--background-secondary)'
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
		const toggleBtn = controlsEl.createEl('button', {
			cls: 'pomodoro-animated-btn',
			text: '▶'
		});
		toggleBtn.setAttribute('aria-label', '开始/暂停');
		toggleBtn.addEventListener('click', (e) => {
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

		// Progress trail (the track the star runs on)
		this.progressTrail = bgEl.createEl('div', {
			cls: 'pomodoro-progress-trail'
		});

		// Golden coin track (background - golden coins)
		this.coinTrack = this.progressTrail.createEl('div', {
			cls: 'pomodoro-coin-track'
		});

		// White track (foreground - shows progress, turns white)
		this.whiteTrack = this.progressTrail.createEl('div', {
			cls: 'pomodoro-white-track'
		});

		// Character element (white star)
		this.characterEl = this.progressTrail.createEl('div', {
			cls: 'pomodoro-character',
			text: this.config.character
		});

		// Progress percentage display
		const progressText = this.containerEl.createEl('div', {
			cls: 'pomodoro-progress-text'
		});

		this.timeDisplay = progressText.createEl('span', {
			cls: 'pomodoro-time-display',
			text: '25:00'
		});

		this.percentDisplay = progressText.createEl('span', {
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

		// Create 40 coins for dense effect
		for (let i = 0; i < 40; i++) {
			const coin = this.coinTrack.createEl('span', {
				cls: 'pomodoro-track-coin'
			});

			const randomCoin = this.config.items[Math.floor(Math.random() * this.config.items.length)];
			coin.textContent = randomCoin;

			// Stagger coins in two rows for dense effect
			const row = i % 2;
			const basePosition = (Math.floor(i / 2) / 19) * 100;
			const offset = row === 0 ? -3 : 3;

			coin.style.left = `calc(${basePosition}% + ${offset}px)`;
			coin.style.top = row === 0 ? '25%' : '75%';
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
			this.updateDisplay(0, 25 * 60, 'idle');
			return;
		}

		const progress = 1 - (session.remaining / session.duration);
		this.updateDisplay(progress, session.remaining, session.state);
	}

	/**
	 * Update the display
	 */
	private updateDisplay(progress: number, remaining: number, state: string): void {
		const percentage = Math.max(0, Math.min(100, progress * 100));

		// Update character position (from left to right)
		if (this.characterEl) {
			this.characterEl.style.left = `${percentage}%`;

			// Update star color based on progress (white → gold)
			// Start: white (255, 255, 255), End: gold (255, 215, 0)
			const red = 255;
			const green = Math.round(255 - (40 * percentage / 100));
			const blue = Math.round(255 - (255 * percentage / 100));
			const shadowBlur = 4 + (8 * percentage / 100);
			const shadowOpacity = 0.3 + (0.5 * percentage / 100);
			this.characterEl.style.color = `rgb(${red}, ${green}, ${blue})`;
			this.characterEl.style.filter = `drop-shadow(0 0 ${shadowBlur}px rgba(255, 215, 0, ${shadowOpacity}))`;
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
		}, 3000);
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
			if (this.characterEl) {
				this.characterEl.textContent = config.character;
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
	updateStyle(style: string, color: string): void {
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
		this.timeDisplay = null;
		this.percentDisplay = null;
		this.containerEl = null;
	}
}

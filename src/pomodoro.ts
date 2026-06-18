/**
 * Pomodoro Timer Types and Configuration
 */

export type PomodoroState = 'idle' | 'running' | 'paused' | 'break' | 'completed';
export type PomodoroType = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
	pomodoroDuration: number;    // in minutes
	shortBreakDuration: number;   // in minutes
	longBreakDuration: number;    // in minutes
	longBreakInterval: number;    // number of pomodoros before long break
	autoStartBreak: boolean;
	autoStartPomodoro: boolean;
}

export interface PomodoroSession {
	id: string;
	type: PomodoroType;
	state: PomodoroState;
	startTime: Date | null;
	endTime: Date | null;
	duration: number;            // in seconds
	remaining: number;           // in seconds
	completedCount: number;      // for long break calculation
}

export interface PomodoroEventCallbacks {
	onStart?: (session: PomodoroSession) => void;
	onPause?: (session: PomodoroSession) => void;
	onResume?: (session: PomodoroSession) => void;
	onComplete?: (session: PomodoroSession) => void;
	onCancel?: (session: PomodoroSession) => void;
	onTick?: (remaining: number, total: number) => void;
}

/**
 * Pomodoro Timer Class
 * Manages the timer logic and state transitions
 */
export class PomodoroTimer {
	private settings: PomodoroSettings;
	private session: PomodoroSession | null = null;
	private timerId: number | null = null;
	private callbacks: PomodoroEventCallbacks = {};
	private totalCompletedCount: number = 0;
	private manuallyCompleted: boolean = false;
	private workSessionStartTime: Date | null = null;

	constructor(settings: PomodoroSettings, callbacks?: PomodoroEventCallbacks) {
		this.settings = settings;
		if (callbacks) {
			this.callbacks = callbacks;
		}
	}

	/**
	 * Get current settings
	 */
	getSettings(): PomodoroSettings {
		return { ...this.settings };
	}

	/**
	 * Update settings
	 */
	updateSettings(newSettings: Partial<PomodoroSettings>): void {
		this.settings = { ...this.settings, ...newSettings };
	}

	/**
	 * Get current session
	 */
	getSession(): PomodoroSession | null {
		return this.session ? { ...this.session } : null;
	}

	/**
	 * Get duration for a specific type
	 */
	private getDuration(type: PomodoroType): number {
		switch (type) {
			case 'pomodoro':
				return this.settings.pomodoroDuration * 60;
			case 'shortBreak':
				return this.settings.shortBreakDuration * 60;
			case 'longBreak':
				return this.settings.longBreakDuration * 60;
			default:
				return this.settings.pomodoroDuration * 60;
		}
	}

	/**
	 * Start a new pomodoro session
	 */
	start(type?: PomodoroType): PomodoroSession {
		// If already running, return current session
		if (this.session && this.session.state === 'running') {
			return this.session;
		}

		const sessionType = type || 'pomodoro';
		const duration = this.getDuration(sessionType);

		this.session = {
			id: this.generateId(),
			type: sessionType,
			state: 'running',
			startTime: new Date(),
			endTime: null,
			duration,
			remaining: duration,
			completedCount: this.totalCompletedCount
		};

			// Record work session start time only on first manual start
			if (sessionType === 'pomodoro' && !this.workSessionStartTime) {
				this.workSessionStartTime = new Date();
			}
		this.startTimer();
		this.callbacks.onStart?.(this.session);

		return this.session;
	}

	/**
	 * Pause the current timer
	 */
	pause(): PomodoroSession | null {
		if (!this.session || this.session.state !== 'running') {
			return null;
		}

		this.stopTimer();
		this.session.state = 'paused';
		this.callbacks.onPause?.(this.session);

		return this.session;
	}

	/**
	 * Resume a paused timer
	 */
	resume(): PomodoroSession | null {
		if (!this.session || this.session.state !== 'paused') {
			return null;
		}

		this.session.state = 'running';
		this.startTimer();
		this.callbacks.onResume?.(this.session);

		return this.session;
	}

	/**
	 * Cancel the current session
	 */
	cancel(): PomodoroSession | null {
		if (!this.session) {
			return null;
		}

		const canceledSession = { ...this.session };
		this.stopTimer();
		this.callbacks.onCancel?.(canceledSession);
		this.session = null;
			this.workSessionStartTime = null; // Reset work session start time

		return canceledSession;
	}

	/**
	 * Manually complete the current session
	 */
	complete(manual: boolean = true): PomodoroSession | null {
		if (!this.session) {
			return null;
		}
		
		// Mark if this was a manual completion
		this.manuallyCompleted = manual;

		const completedSession = { ...this.session };
		this.stopTimer();
		completedSession.state = 'completed';
		completedSession.endTime = new Date();
		completedSession.remaining = 0;

		// Update completed count if it was a pomodoro
		if (completedSession.type === 'pomodoro') {
			this.totalCompletedCount++;
			completedSession.completedCount = this.totalCompletedCount;
		}

		// Add manual flag to session
		(completedSession as any).manuallyCompleted = this.manuallyCompleted;
			// Add work session start time if available
			(completedSession as any).workSessionStartTime = this.workSessionStartTime;
			// Reset work session start time on manual completion
			if (this.manuallyCompleted) {
			this.workSessionStartTime = null;
				this.totalCompletedCount = 0; // Reset completed count on manual completion
			}
		
		this.callbacks.onComplete?.(completedSession);
		this.session = null;

		return completedSession;
	}

	/**
	 * Start the timer interval
	 */
	private startTimer(): void {
		this.stopTimer(); // Clear any existing timer

		this.timerId = window.setInterval(() => {
			if (!this.session || this.session.state !== 'running') {
				this.stopTimer();
				return;
			}

			this.session.remaining--;

			// Trigger tick callback
			this.callbacks.onTick?.(this.session.remaining, this.session.duration);

			// Check if timer completed
			if (this.session.remaining <= 0) {
				this.complete(false);
			}
		}, 1000);
	}

	/**
	 * Stop the timer interval
	 */
	private stopTimer(): void {
		if (this.timerId !== null) {
			window.clearInterval(this.timerId);
			this.timerId = null;
		}
	}

	/**
	 * Generate a unique ID for the session
	 */
	private generateId(): string {
		return `pomodoro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Get the total completed pomodoro count
	 */
	getTotalCompletedCount(): number {
		return this.totalCompletedCount;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.stopTimer();
		this.session = null;
	}

}

/**
 * Get the emoji for a given session type
 */
export function getSessionEmoji(type: PomodoroType | null): string {
	if (!type) return '🍅';
	return type === 'pomodoro' ? '🍅' :
	       type === 'shortBreak' ? '☕' : '🌴';
}

/**
 * Get the emoji for completed focus session (always tomato)
 */
export function getCompletedEmoji(): string {
	return '🍅';
}

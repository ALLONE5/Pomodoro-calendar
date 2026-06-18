/**
 * Data Store for Multi-Device Sync
 * Handles persistent storage and synchronization of pomodoro sessions
 */

import { App, TFile } from 'obsidian';
import { PomodoroSession, PomodoroType } from './pomodoro';

/**
 * Stored data structure
 */
export interface StoredData {
	currentSession: StoredSession | null;
	settings: Record<string, any>;
	statistics: Statistics;
	version: string;
	lastModified: number;
	deviceId: string;
}

export interface StoredSession {
	id: string;
	type: PomodoroType;
	state: string;
	startTime: string | null;
	endTime: string | null;
	duration: number;
	remaining: number;
	completedCount: number;
}

export interface Statistics {
	totalPomodoros: number;
	totalFocusTime: number;    // in seconds
	totalBreakTime: number;    // in seconds
	streak: number;            // consecutive days
	lastPomodoroDate: string | null;
}

/**
 * Data Store Class
 * Manages persistent storage with multi-device sync support
 */
export class PomodoroDataStore {
	private app: App;
	private dataFilePath: string;
	private data: StoredData;
	private saveTimer: number | null = null;
	private fileWatchTimer: number | null = null;
	private lastKnownFileSize = 0;
	private deviceId: string;
	private isWatching = false;

	constructor(app: App, dataFilePath: string) {
		this.app = app;
		this.dataFilePath = dataFilePath;
		this.deviceId = this.generateDeviceId();
		this.data = this.createEmptyData();
	}

	/**
	 * Initialize the data store
	 */
	async init(): Promise<void> {
		try {
			// Try to load existing data
			await this.loadFromFile();

			// Start watching for external changes
			this.startWatching();

		} catch (error) {
			console.error('Failed to initialize data store:', error);

			// If load failed, create new data
			this.data = this.createEmptyData();
			await this.saveToFile();
		}
	}

	/**
	 * Create empty data structure
	 */
	private createEmptyData(): StoredData {
		return {
			currentSession: null,
			settings: {},
			statistics: {
				totalPomodoros: 0,
				totalFocusTime: 0,
				totalBreakTime: 0,
				streak: 0,
				lastPomodoroDate: null
			},
			version: '1.0.0',
			lastModified: Date.now(),
			deviceId: this.deviceId
		};
	}

	/**
	 * Load data from file
	 */
	private async loadFromFile(): Promise<void> {
		try {
			const file = this.app.vault.getAbstractFileByPath(this.dataFilePath);

			if (!(file instanceof TFile)) {
				// File doesn't exist, create it
				this.data = this.createEmptyData();
				await this.saveToFile();
				return;
			}

			const content = await this.app.vault.read(file);
			this.lastKnownFileSize = content.length;

			if (!content.trim()) {
				this.data = this.createEmptyData();
				return;
			}

			const parsed = JSON.parse(content);
			this.data = parsed;

			// Validate data structure
			if (!this.data.statistics) {
				this.data.statistics = this.createEmptyData().statistics;
			}

		} catch (error) {
			console.error('Failed to load data file:', error);
			this.data = this.createEmptyData();
		}
	}

	/**
	 * Save data to file (debounced)
	 */
	private async saveToFile(): Promise<void> {
		// Clear any pending save
		if (this.saveTimer) {
			window.clearTimeout(this.saveTimer);
		}

		// Debounce saves
		this.saveTimer = window.setTimeout(async () => {
			try {
				this.data.lastModified = Date.now();
				const content = JSON.stringify(this.data, null, 2);

				const file = this.app.vault.getAbstractFileByPath(this.dataFilePath);

				if (file instanceof TFile) {
					await this.app.vault.modify(file, content);
					this.lastKnownFileSize = content.length;
				} else {
					// Create directory if needed
					const dir = this.dataFilePath.split('/').slice(0, -1).join('/');
					if (dir && dir !== '.') {
						try {
							await this.app.vault.createFolder(dir);
						} catch (e) {
							// Directory might already exist, ignore
						}
					}
					try {
						await this.app.vault.create(this.dataFilePath, content);
						this.lastKnownFileSize = content.length;
					} catch (createError: any) {
						// If create fails, the file might have been created by another process
						// Try to read and modify instead
						if (createError.message && createError.message.includes('already exists')) {
							const newFile = this.app.vault.getAbstractFileByPath(this.dataFilePath);
							if (newFile instanceof TFile) {
								await this.app.vault.modify(newFile, content);
								this.lastKnownFileSize = content.length;
							}
						} else {
							throw createError;
						}
					}
				}

			} catch (error) {
				console.error('Failed to save data file:', error);
			}
		}, 100); // 100ms debounce
	}

	/**
	 * Start watching for external file changes
	 */
	private startWatching(): void {
		if (this.isWatching) return;

		this.isWatching = true;

		// Check for file changes periodically
		this.fileWatchTimer = window.setInterval(async () => {
			await this.checkForExternalChanges();
		}, 2000); // Check every 2 seconds
	}

	/**
	 * Stop watching for external changes
	 */
	private stopWatching(): void {
		this.isWatching = false;

		if (this.fileWatchTimer) {
			window.clearInterval(this.fileWatchTimer);
			this.fileWatchTimer = null;
		}
	}

	/**
	 * Check for external changes to the data file
	 */
	private async checkForExternalChanges(): Promise<boolean> {
		try {
			const file = this.app.vault.getAbstractFileByPath(this.dataFilePath);

			if (!(file instanceof TFile)) {
				return false;
			}

			// Check if file size changed
			// @ts-ignore - accessing internal stat property
			const currentSize = file.stat?.size || 0;

			if (currentSize === this.lastKnownFileSize) {
				return false;
			}

			// Load and check modification time
			const content = await this.app.vault.read(file);
			const parsed = JSON.parse(content);

			// Check if external modification (different device or more recent)
			if (parsed.lastModified > this.data.lastModified ||
			    parsed.deviceId !== this.deviceId) {

				// External change detected
				console.log('External change detected, syncing...');
				this.data = parsed;
				this.lastKnownFileSize = content.length;

				// Trigger sync event
				this.onExternalChange(parsed);

				return true;
			}

		} catch (error) {
			console.error('Error checking for external changes:', error);
		}

		return false;
	}

	/**
	 * Handle external data changes
	 */
	private onExternalChange(data: StoredData): void {
		// Emit custom event for main plugin to handle
		const event = new CustomEvent('pomodoro-data-sync', { detail: data });
		document.dispatchEvent(event);
	}

	/**
	 * Get current session
	 */
	getCurrentSession(): StoredSession | null {
		return this.data.currentSession;
	}

	/**
	 * Save current session
	 */
	async saveCurrentSession(session: PomodoroSession | null, calendarId?: string | null): Promise<void> {
		if (!session) {
			this.data.currentSession = null;
		} else {
			this.data.currentSession = {
				id: session.id,
				type: session.type,
				state: session.state,
				startTime: session.startTime?.toISOString() || null,
				endTime: session.endTime?.toISOString() || null,
				duration: session.duration,
				remaining: session.remaining,
				completedCount: session.completedCount,
			};
		}

		await this.saveToFile();
	}

	/**
	 * Update session remaining time
	 */
	async updateSessionRemaining(remaining: number): Promise<void> {
		if (this.data.currentSession) {
			this.data.currentSession.remaining = remaining;
			await this.saveToFile();
		}
	}


	/**
	 * Record completed pomodoro
	 */
	async recordCompletedPomodoro(duration: number): Promise<void> {
		this.data.statistics.totalPomodoros++;
		this.data.statistics.totalFocusTime += duration;

		// Update streak
		const today = new Date().toISOString().split('T')[0];
		if (this.data.statistics.lastPomodoroDate !== today) {
			const lastDate = this.data.statistics.lastPomodoroDate;
			this.data.statistics.lastPomodoroDate = today;

			// Check if consecutive day
			if (lastDate) {
				const last = new Date(lastDate);
				const now = new Date(today);
				const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

				if (diffDays === 1) {
					this.data.statistics.streak++;
				} else if (diffDays > 1) {
					this.data.statistics.streak = 1;
				}
			} else {
				this.data.statistics.streak = 1;
			}
		}

		await this.saveToFile();
	}

	/**
	 * Register callback for external changes
	 */
	onSync(callback: (data: StoredData) => void): void {
		document.addEventListener('pomodoro-data-sync', (e: Event) => {
			const customEvent = e as CustomEvent<StoredData>;
			callback(customEvent.detail);
		});
	}

	/**
	 * Generate unique device ID
	 */
	private generateDeviceId(): string {
		// Try to get from local storage first
		const stored = localStorage.getItem('pomodoro-device-id');
		if (stored) return stored;

		// Generate new ID
		const id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		localStorage.setItem('pomodoro-device-id', id);
		return id;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.stopWatching();

		if (this.saveTimer) {
			window.clearTimeout(this.saveTimer);
		}

		if (this.fileWatchTimer) {
			window.clearInterval(this.fileWatchTimer);
		}
	}
}

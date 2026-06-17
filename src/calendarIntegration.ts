/**
 * CalDAV Integration
 * Handles integration with CalDAV servers (iCloud, Google, etc.)
 */

import { App, Notice } from 'obsidian';
import { PomodoroSession, PomodoroType } from './pomodoro';

/**
 * Calendar Event Interface
 */
export interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	backgroundColor?: string;
	borderColor?: string;
	calendarId: string;
}

/**
 * CalDAV Configuration
 */
export interface CalDAVConfig {
	url: string;
	username: string;
	password: string;
	calendarPath: string;
}

/**
 * CalDAV Integration Class
 */
export class CalendarIntegration {
	private app: App;
	private config: CalDAVConfig | null = null;
	private isEnabled = false;
	private currentEventId: string | null = null;
	private currentEventPath: string | null = null;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Initialize the integration with CalDAV config
	 */
	init(config: CalDAVConfig): boolean {
		if (!config.url || !config.username || !config.password || !config.calendarPath) {
			console.log('CalDAV: Incomplete configuration');
			return false;
		}

		this.config = config;
		this.isEnabled = true;
		console.log('✅ CalDAV integration initialized');
		return true;
	}

	/**
	 * Check if integration is available
	 */
	isAvailable(): boolean {
		return this.isEnabled && this.config !== null;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: CalDAVConfig): void {
		if (config.url && config.username && config.password && config.calendarPath) {
			this.config = config;
			this.isEnabled = true;
		} else {
			this.isEnabled = false;
		}
	}

	/**
	 * Generate ICS (iCalendar) format event data
	 */
	private generateICS(event: CalendarEvent): string {
		const formatDate = (date: Date) => {
			return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
		};

		const now = new Date();
		const created = formatDate(now);
		const dtstamp = formatDate(now);

		return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pomodoro Calendar//Obsidian//CN
BEGIN:VEVENT
UID:${event.id}
DTSTAMP:${dtstamp}
CREATED:${created}
DTSTART:${formatDate(event.start)}
DTEND:${formatDate(event.end)}
SUMMARY:${event.title}
END:VEVENT
END:VCALENDAR`;
	}

	/**
	 * Build full URL for CalDAV request
	 */
	private buildEventPath(eventId: string): string {
		if (!this.config) return '';

		// Sanitize eventId to be URL-safe
		const safeId = eventId.replace(/[^a-zA-Z0-9-_]/g, '_');
		const ext = this.config.calendarPath.endsWith('.ics') ? '' : '.ics';

		// Build full URL: baseUrl + calendarPath + eventId.ics
		const baseUrl = this.config.url.replace(/\/$/, '');
		const calendarPath = this.config.calendarPath.replace(/^\//, '');

		return `${baseUrl}/${calendarPath}${safeId}${ext}`;
	}

	/**
	 * Perform CalDAV PUT request
	 */
	private async caldavPut(eventPath: string, icsData: string): Promise<boolean> {
		if (!this.config) return false;

		try {
			const auth = btoa(`${this.config.username}:${this.config.password}`);

			const response = await fetch(eventPath, {
				method: 'PUT',
				headers: {
					'Authorization': `Basic ${auth}`,
					'Content-Type': 'text/calendar; charset=utf-8',
					'User-Agent': 'ObsidianPomodoro/1.0'
				},
				body: icsData
			});

			if (response.ok || response.status === 201 || response.status === 204) {
				console.log('CalDAV: Event created/updated successfully');
				return true;
			} else {
				console.error('CalDAV: PUT failed', response.status, response.statusText);
				return false;
			}
		} catch (error) {
			console.error('CalDAV: PUT error', error);
			return false;
		}
	}

	/**
	 * Perform CalDAV DELETE request
	 */
	private async caldavDelete(eventPath: string): Promise<boolean> {
		if (!this.config) return false;

		try {
			const auth = btoa(`${this.config.username}:${this.config.password}`);

			const response = await fetch(eventPath, {
				method: 'DELETE',
				headers: {
					'Authorization': `Basic ${auth}`,
					'User-Agent': 'ObsidianPomodoro/1.0'
				}
			});

			if (response.ok || response.status === 204) {
				console.log('CalDAV: Event deleted successfully');
				return true;
			} else {
				console.error('CalDAV: DELETE failed', response.status, response.statusText);
				return false;
			}
		} catch (error) {
			console.error('CalDAV: DELETE error', error);
			return false;
		}
	}

	/**
	 * Create a pomodoro event in CalDAV
	 */
	async createPomodoroEvent(
		session: PomodoroSession,
		calendarId: string
	): Promise<string | null> {
		if (!this.isAvailable() || !session.startTime) {
			return null;
		}

		try {
			const event = this.buildPomodoroEvent(session, calendarId);
			const eventPath = this.buildEventPath(event.id);
			const icsData = this.generateICS(event);

			console.log('CalDAV: Creating event at', eventPath);

			const success = await this.caldavPut(eventPath, icsData);

			if (success) {
				this.currentEventId = event.id;
				this.currentEventPath = eventPath;
				new Notice('📅 已创建日历事件');
				return event.id;
			}

			return null;

		} catch (error) {
			console.error('Failed to create pomodoro event:', error);
			return null;
		}
	}

	/**
	 * Update the pomodoro event end time
	 */
	async updatePomodoroEvent(
		session: PomodoroSession,
		calendarId: string
	): Promise<boolean> {
		if (!this.isAvailable() || !this.currentEventId || !this.currentEventPath) {
			return false;
		}

		try {
			const endTime = new Date(session.startTime!);
			endTime.setSeconds(endTime.getSeconds() + (session.duration - session.remaining));

			const event = this.buildPomodoroEvent(session, calendarId);
			event.id = this.currentEventId;
			event.end = endTime;

			const icsData = this.generateICS(event);

			console.log('CalDAV: Updating event at', this.currentEventPath);

			return await this.caldavPut(this.currentEventPath, icsData);

		} catch (error) {
			console.error('Failed to update pomodoro event:', error);
			return false;
		}
	}

	/**
	 * Complete the pomodoro event
	 */
	async completePomodoroEvent(session: PomodoroSession, calendarId: string): Promise<boolean> {
		if (!this.isAvailable() || !this.currentEventId || !this.currentEventPath) {
			return false;
		}

		try {
			const event = this.buildPomodoroEvent(session, calendarId);
			event.id = this.currentEventId;
			event.end = new Date(); // Set end time to now
			event.title = `✅ ${event.title}`; // Mark as completed

			const icsData = this.generateICS(event);

			console.log('CalDAV: Completing event at', this.currentEventPath);

			const success = await this.caldavPut(this.currentEventPath, icsData);

			if (success) {
				this.currentEventId = null;
				this.currentEventPath = null;
			}

			return success;

		} catch (error) {
			console.error('Failed to complete pomodoro event:', error);
			return false;
		}
	}

	/**
	 * Cancel/delete the pomodoro event
	 */
	async cancelPomodoroEvent(): Promise<boolean> {
		if (!this.isAvailable() || !this.currentEventPath) {
			return false;
		}

		try {
			console.log('CalDAV: Deleting event at', this.currentEventPath);

			const success = await this.caldavDelete(this.currentEventPath);

			if (success) {
				this.currentEventId = null;
				this.currentEventPath = null;
			}

			return success;

		} catch (error) {
			console.error('Failed to cancel pomodoro event:', error);
			return false;
		}
	}

	/**
	 * Build a calendar event from a pomodoro session
	 */
	private buildPomodoroEvent(
		session: PomodoroSession,
		calendarId: string
	): CalendarEvent {
		const startTime = session.startTime || new Date();
		const endTime = new Date(startTime);
		endTime.setSeconds(endTime.getSeconds() + session.duration);

		const emoji = session.type === 'pomodoro' ? '🍅' :
		              session.type === 'shortBreak' ? '☕' : '🌴';

		const title = session.type === 'pomodoro' ?
		              `${emoji} 番茄钟专注` :
		              `${emoji} ${session.type === 'shortBreak' ? '小休' : '长休'}`;

		// Color based on type
		const color = session.type === 'pomodoro' ? '#ff6b6b' :
		             session.type === 'shortBreak' ? '#51cf66' : '#339af0';

		return {
			id: session.id,
			title,
			start: startTime,
			end: endTime,
			backgroundColor: color,
			borderColor: color,
			calendarId
		};
	}

	/**
	 * Get the current active event ID
	 */
	getCurrentEventId(): string | null {
		return this.currentEventId;
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.config = null;
		this.isEnabled = false;
		this.currentEventId = null;
		this.currentEventPath = null;
	}
}

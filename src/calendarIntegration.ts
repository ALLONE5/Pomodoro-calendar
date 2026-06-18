/**
 * CalDAV Integration
 * Handles integration with CalDAV servers (iCloud, Google, etc.)
 */

import { App, Notice, requestUrl } from 'obsidian';
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
		if (!config.url || !config.username || !config.password) {
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
	 * Test CalDAV connection
	 */
	async testConnection(): Promise<{ success: boolean; message: string }> {
		if (!this.config) {
			return { success: false, message: '配置不完整' };
		}

		try {
			// Test by making a PROPFIND request to the calendar path
			const auth = btoa(`${this.config.username}:${this.config.password}`);
			const testUrl = this.buildCalendarBaseUrl();

			await requestUrl({
				url: testUrl,
				method: 'PROPFIND',
				headers: {
					'Authorization': `Basic ${auth}`,
					'Depth': '0',
					'User-Agent': 'ObsidianPomodoro/1.0'
				}
			});

			return { success: true, message: '✅ 连接成功！CalDAV 配置正确' };
		} catch (error: any) {
			console.error('CalDAV connection test failed:', error);
			if (error.status === 401) {
				return { success: false, message: '❌ 认证失败：用户名或密码错误' };
			} else if (error.status === 404) {
				return { success: false, message: '❌ 未找到：日历路径可能不正确' };
			} else if (error.status === 403) {
				return { success: false, message: '❌ 禁止访问：没有权限访问此日历' };
			} else {
				return { success: false, message: `❌ 连接失败：${error.message || '未知错误'}` };
			}
		}
	}

	/**
	 * Build the base URL for the calendar
	 */
	private buildCalendarBaseUrl(): string {
		if (!this.config) return '';

		// The URL is already the full calendar URL
		return this.config.url.replace(/\/$/, '');
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: CalDAVConfig): void {
		if (config.url && config.username && config.password) {
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

		// The config.url is already the full calendar URL
		// Just append the eventId.ics
		const baseUrl = this.config.url.replace(/\/$/, '');
		return `${baseUrl}/${safeId}.ics`;
	}

	/**
	 * Perform CalDAV PUT request
	 */
	private async caldavPut(eventPath: string, icsData: string): Promise<boolean> {
		if (!this.config) return false;

		try {
			const auth = btoa(`${this.config.username}:${this.config.password}`);

			const response = await requestUrl({
				url: eventPath,
				method: 'PUT',
				headers: {
					'Authorization': `Basic ${auth}`,
					'Content-Type': 'text/calendar; charset=utf-8',
					'User-Agent': 'ObsidianPomodoro/1.0'
				},
				body: icsData
			});

			if (response.status === 201 || response.status === 204) {
				console.log('CalDAV: Event created/updated successfully');
				return true;
			} else {
				console.error('CalDAV: PUT failed', response.status, response.text);
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

			const response = await requestUrl({
				url: eventPath,
				method: 'DELETE',
				headers: {
					'Authorization': `Basic ${auth}`,
					'User-Agent': 'ObsidianPomodoro/1.0'
				}
			});

			if (response.status === 204) {
				console.log('CalDAV: Event deleted successfully');
				return true;
			} else {
				console.error('CalDAV: DELETE failed', response.status, response.text);
				return false;
			}
		} catch (error) {
			console.error('CalDAV: DELETE error', error);
			return false;
		}
	}

	/**
	 * Create a pomodoro event in CalDAV
	 * @param session The pomodoro session
	 * @param customTitle Optional custom title for the event
	 */
	async createPomodoroEvent(session: PomodoroSession, customTitle?: string): Promise<string | null> {
		if (!this.isAvailable() || !session.startTime) {
			return null;
		}

		try {
			const event = this.buildPomodoroEvent(session);
			// Apply custom title if provided
			if (customTitle && customTitle.trim()) {
				const emoji = event.title.split(' ')[0]; // Keep the emoji
				event.title = `${emoji} ${customTitle.trim()}`;
			}
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
	private buildPomodoroEvent(session: PomodoroSession): CalendarEvent {
		const startTime = session.startTime || new Date();
		const endTime = session.endTime ? new Date(session.endTime) : new Date(startTime);
		if (!session.endTime) {
			endTime.setSeconds(endTime.getSeconds() + session.duration);
		}

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
			calendarId: 'caldav'
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

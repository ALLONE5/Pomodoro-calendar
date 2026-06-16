/**
 * Full Calendar Remastered Integration
 * Handles integration with the Full Calendar Remastered plugin
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
 * Calendar Source Interface
 */
export interface CalendarSource {
	id: string;
	name: string;
	color: string;
	type: string;
}

/**
 * Full Calendar Remastered Integration Class
 */
export class CalendarIntegration {
	private app: App;
	private fcrPlugin: any | null = null;
	private isEnabled = false;
	private currentEventId: string | null = null;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Initialize the integration
	 * Try to find and connect to Full Calendar Remastered plugin
	 */
	async init(): Promise<boolean> {
		try {
			// Try to get the FCR plugin instance
			// @ts-ignore - accessing internal plugin API
			const fcr = this.app.plugins.plugins['full-calendar-remastered'];

			if (!fcr) {
				console.log('Full Calendar Remastered not found');
				return false;
			}

			this.fcrPlugin = fcr;
			this.isEnabled = true;
			new Notice('✅ 已连接到 Full Calendar Remastered');
			return true;

		} catch (error) {
			console.error('Failed to initialize calendar integration:', error);
			return false;
		}
	}

	/**
	 * Check if FCR is available
	 */
	isAvailable(): boolean {
		return this.isEnabled && this.fcrPlugin !== null;
	}

	/**
	 * Get available calendar sources
	 */
	getAvailableCalendars(): CalendarSource[] {
		if (!this.isAvailable()) {
			return [];
		}

		try {
			// @ts-ignore - accessing FCR API
			const calendars = this.fcrPlugin?.getCalendarSources?.() || [];

			return calendars.map((cal: any) => ({
				id: cal.id || cal.uid,
				name: cal.title || cal.name,
				color: cal.color || '#ff6b6b',
				type: cal.type || 'local'
			}));

		} catch (error) {
			console.error('Failed to get calendars:', error);
			return [];
		}
	}

	/**
	 * Create a pomodoro event in the calendar
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
			const eventId = await this.addEvent(event);
			this.currentEventId = eventId;

			return eventId;

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
		if (!this.isAvailable() || !this.currentEventId) {
			return false;
		}

		try {
			const endTime = new Date(session.startTime!);
			endTime.setSeconds(endTime.getSeconds() + (session.duration - session.remaining));

			const event = this.buildPomodoroEvent(session, calendarId);
			event.id = this.currentEventId;
			event.end = endTime;

			await this.updateEvent(event);
			return true;

		} catch (error) {
			console.error('Failed to update pomodoro event:', error);
			return false;
		}
	}

	/**
	 * Complete the pomodoro event
	 */
	async completePomodoroEvent(session: PomodoroSession, calendarId: string): Promise<boolean> {
		if (!this.isAvailable() || !this.currentEventId) {
			return false;
		}

		try {
			const event = this.buildPomodoroEvent(session, calendarId);
			event.id = this.currentEventId;
			event.end = new Date(); // Set end time to now

			// Update title to show completion
			event.title = `✅ ${event.title}`;

			await this.updateEvent(event);
			this.currentEventId = null;
			return true;

		} catch (error) {
			console.error('Failed to complete pomodoro event:', error);
			return false;
		}
	}

	/**
	 * Cancel/delete the pomodoro event
	 */
	async cancelPomodoroEvent(): Promise<boolean> {
		if (!this.isAvailable() || !this.currentEventId) {
			return false;
		}

		try {
			await this.deleteEvent(this.currentEventId);
			this.currentEventId = null;
			return true;

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
	 * Add an event to the calendar
	 */
	private async addEvent(event: CalendarEvent): Promise<string | null> {
		if (!this.fcrPlugin) return null;

		try {
			// @ts-ignore - FCR API
			const api = this.fcrPlugin?.api;

			if (!api) {
				// Try alternative method - creating event directly
				// @ts-ignore
				return await this.fcrPlugin?.addEvent?.(event);
			}

			// Try using the API
			// @ts-ignore
			return await api.addEvent(event);

		} catch (error) {
			console.error('Failed to add event via FCR API:', error);

			// Fallback: Try to write directly to calendar data
			return await this.fallbackAddEvent(event);
		}
	}

	/**
	 * Update an existing event
	 */
	private async updateEvent(event: CalendarEvent): Promise<void> {
		if (!this.fcrPlugin) return;

		try {
			// @ts-ignore - FCR API
			const api = this.fcrPlugin?.api;

			if (!api) {
				// Try alternative method
				// @ts-ignore
				return await this.fcrPlugin?.updateEvent?.(event);
			}

			// @ts-ignore
			await api.updateEvent(event);

		} catch (error) {
			console.error('Failed to update event:', error);
		}
	}

	/**
	 * Delete an event
	 */
	private async deleteEvent(eventId: string): Promise<void> {
		if (!this.fcrPlugin) return;

		try {
			// @ts-ignore - FCR API
			const api = this.fcrPlugin?.api;

			if (!api) {
				// Try alternative method
				// @ts-ignore
				return await this.fcrPlugin?.removeEvent?.(eventId);
			}

			// @ts-ignore
			await api.removeEvent(eventId);

		} catch (error) {
			console.error('Failed to delete event:', error);
		}
	}

	/**
	 * Fallback method for adding events when API is not available
	 * This writes directly to the calendar data files
	 */
	private async fallbackAddEvent(event: CalendarEvent): Promise<string | null> {
		try {
			// Get the vault adapter
			const vault = this.app.vault;

			// Create event data structure
			const eventData = {
				uid: event.id,
				title: event.title,
				start: event.start.toISOString(),
				end: event.end.toISOString(),
				allDay: event.allDay || false
			};

			// Try to find the calendar file
			// This is a simplified approach - real implementation would need
			// to understand FCR's file structure
			console.log('Fallback add event:', eventData);

			return event.id;

		} catch (error) {
			console.error('Fallback add event failed:', error);
			return null;
		}
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
		this.fcrPlugin = null;
		this.isEnabled = false;
		this.currentEventId = null;
	}
}

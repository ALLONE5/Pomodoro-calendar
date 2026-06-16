/**
 * Settings Panel for Pomodoro Calendar Plugin
 */

import { PluginSettingTab, Setting, App } from 'obsidian';
import { PomodoroSettings } from './pomodoro';

export interface PomodoroCalendarSettings extends PomodoroSettings {
	defaultCalendarId: string;
	progressBarStyle: 'rainbow' | 'gradient' | 'solid' | 'minimal';
	solidColor: string;
	showAnimations: boolean;
	showNotifications: boolean;
	notificationSound: boolean;
	enableCalendarIntegration: boolean;
	syncInterval: number;
}

export const DEFAULT_SETTINGS: PomodoroCalendarSettings = {
	pomodoroDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	longBreakInterval: 4,
	autoStartBreak: false,
	autoStartPomodoro: false,
	defaultCalendarId: '',
	progressBarStyle: 'rainbow',
	solidColor: '#ff6b6b',
	showAnimations: true,
	showNotifications: true,
	notificationSound: true,
	enableCalendarIntegration: true,
	syncInterval: 1
};

/**
 * Settings Tab Class
 * Manages the plugin settings UI
 */
export class PomodoroSettingsTab extends PluginSettingTab {
	plugin: any; // Will be the main plugin instance

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.addClass('pomodoro-settings');

		// Header
		containerEl.createEl('h2', { text: '🍅 番茄钟设置' });

		// Timer Settings Section
		this.createTimerSettings(containerEl);

		// Progress Bar Settings Section
		this.createProgressBarSettings(containerEl);

		// Calendar Integration Section
		this.createCalendarSettings(containerEl);

		// Notification Settings Section
		this.createNotificationSettings(containerEl);

		// Sync Settings Section
		this.createSyncSettings(containerEl);
	}

	/**
	 * Create Timer Settings Section
	 */
	private createTimerSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '⏱️ 计时器设置' });

		// Pomodoro Duration
		new Setting(containerEl)
			.setName('番茄钟时长')
			.setDesc('单个番茄钟的持续时间（分钟）')
			.addSlider(slider => slider
				.setLimits(1, 60, 1)
				.setValue(this.plugin.settings.pomodoroDuration)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.pomodoroDuration = value;
					await this.plugin.saveSettings();
				}))
			.addExtraButton(button => button
				.setIcon('reset')
				.setTooltip('重置为默认值 (25分钟)')
				.onClick(async () => {
					this.plugin.settings.pomodoroDuration = DEFAULT_SETTINGS.pomodoroDuration;
					await this.plugin.saveSettings();
					this.display();
				}));

		// Short Break Duration
		new Setting(containerEl)
			.setName('短休息时长')
			.setDesc('番茄钟之间的短休息时间（分钟）')
			.addSlider(slider => slider
				.setLimits(1, 30, 1)
				.setValue(this.plugin.settings.shortBreakDuration)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.shortBreakDuration = value;
					await this.plugin.saveSettings();
				}))
			.addExtraButton(button => button
				.setIcon('reset')
				.setTooltip('重置为默认值 (5分钟)')
				.onClick(async () => {
					this.plugin.settings.shortBreakDuration = DEFAULT_SETTINGS.shortBreakDuration;
					await this.plugin.saveSettings();
					this.display();
				}));

		// Long Break Duration
		new Setting(containerEl)
			.setName('长休息时长')
			.setDesc('完成一组番茄钟后的长休息时间（分钟）')
			.addSlider(slider => slider
				.setLimits(5, 60, 1)
				.setValue(this.plugin.settings.longBreakDuration)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.longBreakDuration = value;
					await this.plugin.saveSettings();
				}))
			.addExtraButton(button => button
				.setIcon('reset')
				.setTooltip('重置为默认值 (15分钟)')
				.onClick(async () => {
					this.plugin.settings.longBreakDuration = DEFAULT_SETTINGS.longBreakDuration;
					await this.plugin.saveSettings();
					this.display();
				}));

		// Long Break Interval
		new Setting(containerEl)
			.setName('长休息间隔')
			.setDesc('完成多少个番茄钟后进入长休息')
			.addSlider(slider => slider
				.setLimits(2, 10, 1)
				.setValue(this.plugin.settings.longBreakInterval)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.longBreakInterval = value;
					await this.plugin.saveSettings();
				}));

		// Auto Start Settings
		new Setting(containerEl)
			.setName('自动开始休息')
			.setDesc('番茄钟完成后自动开始休息时间')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoStartBreak)
				.onChange(async (value) => {
					this.plugin.settings.autoStartBreak = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('自动开始番茄钟')
			.setDesc('休息结束后自动开始新的番茄钟')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoStartPomodoro)
				.onChange(async (value) => {
					this.plugin.settings.autoStartPomodoro = value;
					await this.plugin.saveSettings();
				}));
	}

	/**
	 * Create Progress Bar Settings Section
	 */
	private createProgressBarSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🎨 进度条样式' });

		// Progress Bar Style
		new Setting(containerEl)
			.setName('进度条样式')
			.setDesc('选择状态栏进度条的显示样式')
			.addDropdown(dropdown => dropdown
				.addOption('rainbow', '🌈 彩虹渐变')
				.addOption('gradient', '🎨 渐变色')
				.addOption('solid', '🔴 纯色')
				.addOption('minimal', '📏 极简')
				.setValue(this.plugin.settings.progressBarStyle)
				.onChange(async (value) => {
					this.plugin.settings.progressBarStyle = value as any;
					await this.plugin.saveSettings();
					this.plugin.updateStatusBarStyle();
				}));

		// Solid Color Picker
		new Setting(containerEl)
			.setName('纯色颜色')
			.setDesc('当选择纯色样式时使用的颜色')
			.addColorPicker(colorPicker => colorPicker
				.setValue(this.plugin.settings.solidColor)
				.onChange(async (value) => {
					this.plugin.settings.solidColor = value;
					await this.plugin.saveSettings();
					this.plugin.updateStatusBarStyle();
				}));

		// Animation Toggle
		new Setting(containerEl)
			.setName('显示动画效果')
			.setDesc('启用完成、暂停等状态的动画效果')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showAnimations)
				.onChange(async (value) => {
					this.plugin.settings.showAnimations = value;
					await this.plugin.saveSettings();
					this.plugin.updateAnimationState();
				}));
	}

	/**
	 * Create Calendar Settings Section
	 */
	private createCalendarSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '📅 日历集成' });

		// Enable Calendar Integration
		new Setting(containerEl)
			.setName('启用日历集成')
			.setDesc('与 Full Calendar Remastered 插件集成，在日历中显示番茄钟')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableCalendarIntegration)
				.onChange(async (value) => {
					this.plugin.settings.enableCalendarIntegration = value;
					await this.plugin.saveSettings();

					if (value) {
						this.plugin.initCalendarIntegration();
					}
				}));

		// Default Calendar Selection
		const calendars = this.plugin.getAvailableCalendars?.() || [];

		new Setting(containerEl)
			.setName('默认日历')
			.setDesc('选择默认记录番茄钟的日历')
			.addDropdown(dropdown => {
				dropdown.addOption('', '未选择');

				calendars.forEach((cal: any) => {
					dropdown.addOption(cal.id, cal.name);
				});

				dropdown.setValue(this.plugin.settings.defaultCalendarId);
				dropdown.onChange(async (value) => {
					this.plugin.settings.defaultCalendarId = value;
					await this.plugin.saveSettings();
				});
			});

		// Info text
		const infoEl = containerEl.createEl('div', {
			cls: 'setting-item-description info-text'
		});
		infoEl.innerHTML = `
			<p>💡 提示：</p>
			<ul>
				<li>需要安装 <strong>Full Calendar Remastered</strong> 插件</li>
				<li>番茄钟会在选定的日历中实时显示</li>
				<li>多设备通过 iCloud/Syncthing 同步 vault 后可查看</li>
			</ul>
		`;
	}

	/**
	 * Create Notification Settings Section
	 */
	private createNotificationSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🔔 通知设置' });

		new Setting(containerEl)
			.setName('显示通知')
			.setDesc('番茄钟完成时显示系统通知')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotifications)
				.onChange(async (value) => {
					this.plugin.settings.showNotifications = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('通知声音')
			.setDesc('番茄钟完成时播放提示音')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.notificationSound)
				.onChange(async (value) => {
					this.plugin.settings.notificationSound = value;
					await this.plugin.saveSettings();
				}));
	}

	/**
	 * Create Sync Settings Section
	 */
	private createSyncSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🔄 多端同步' });

		new Setting(containerEl)
			.setName('同步间隔')
			.setDesc('检查数据文件变化的间隔（秒）')
			.addSlider(slider => slider
				.setLimits(1, 60, 1)
				.setValue(this.plugin.settings.syncInterval)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.syncInterval = value;
					await this.plugin.saveSettings();
					this.plugin.restartFileSync();
				}));

		const infoEl = containerEl.createEl('div', {
			cls: 'setting-item-description info-text'
		});
		infoEl.innerHTML = `
			<p>💡 多端同步说明：</p>
			<ul>
				<li>使用 Obsidian 的 iCloud/Syncthing 同步 vault</li>
				<li>插件会自动检测并同步其他设备的番茄钟状态</li>
				<li>建议同步间隔设置为 1-5 秒以获得最佳体验</li>
			</ul>
		`;
	}
}

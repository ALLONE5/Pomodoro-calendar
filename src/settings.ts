/**
 * Settings Panel for Pomodoro Calendar Plugin
 */

import { PluginSettingTab, Setting, App, Notice } from 'obsidian';
import { PomodoroSettings } from './pomodoro';

export interface PomodoroCalendarSettings extends PomodoroSettings {
	progressBarStyle: 'coins' | 'leaves' | 'tomatoes' | 'stars' | 'hearts';
	progressDirection: 'left-to-right' | 'right-to-left';
	showAnimations: boolean;
	showNotifications: boolean;
	notificationSound: boolean;
	enableCalendarIntegration: boolean;
	// CalDAV Settings - simplified to single URL
	caldavUrl: string;
	caldavUsername: string;
	caldavPassword: string;
}

export const DEFAULT_SETTINGS: PomodoroCalendarSettings = {
	pomodoroDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	longBreakInterval: 4,
	autoStartBreak: false,
	autoStartPomodoro: false,
	progressBarStyle: 'coins',
	progressDirection: 'left-to-right',
	showAnimations: true,
	showNotifications: true,
	notificationSound: true,
	enableCalendarIntegration: false,
	caldavUrl: '',
	caldavUsername: '',
	caldavPassword: '',
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

	}

	/**
	 * Create Timer Settings Section
	 */
	private createTimerSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '⏱️ 计时器设置' });

		// Pomodoro Duration
		new Setting(containerEl)
			.setName('番茄钟时长')
			.setDesc('单个番茄钟的持续时间（分钟，1-60）')
			.addText(text => {
				text.inputEl.type = 'number';
				text.inputEl.min = '1';
				text.inputEl.max = '60';
				text.inputEl.value = this.plugin.settings.pomodoroDuration.toString();
				text.inputEl.style.width = '60px';
			})
			.addButton(button => button
				.setButtonText('保存')
				.onClick(async () => {
					const input = button.buttonEl.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
					const value = parseInt(input.value);
					if (isNaN(value) || value < 1 || value > 60) {
						new Notice('请输入 1-60 之间的数字');
						return;
					}
					this.plugin.settings.pomodoroDuration = value;
					await this.plugin.saveSettings();
					this.plugin.animatedBar?.setPomodoroDuration(value * 60);
					new Notice(`番茄钟时长已设置为 ${value} 分钟`);
				}))
			.addExtraButton(button => button
				.setIcon('reset')
				.setTooltip('重置为默认值 (25分钟)')
				.onClick(async () => {
					this.plugin.settings.pomodoroDuration = DEFAULT_SETTINGS.pomodoroDuration;
					await this.plugin.saveSettings();
					this.plugin.animatedBar?.setPomodoroDuration(DEFAULT_SETTINGS.pomodoroDuration * 60);
					this.display();
				}));

		// Short Break Duration
		new Setting(containerEl)
			.setName('短休息时长')
			.setDesc('番茄钟之间的短休息时间（分钟，1-30）')
			.addText(text => {
				text.inputEl.type = 'number';
				text.inputEl.min = '1';
				text.inputEl.max = '30';
				text.inputEl.value = this.plugin.settings.shortBreakDuration.toString();
				text.inputEl.style.width = '60px';
			})
			.addButton(button => button
				.setButtonText('保存')
				.onClick(async () => {
					const input = button.buttonEl.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
					const value = parseInt(input.value);
					if (isNaN(value) || value < 1 || value > 30) {
						new Notice('请输入 1-30 之间的数字');
						return;
					}
					this.plugin.settings.shortBreakDuration = value;
					await this.plugin.saveSettings();
					new Notice(`短休息时长已设置为 ${value} 分钟`);
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
			.setDesc('完成一组番茄钟后的长休息时间（分钟，5-60）')
			.addText(text => {
				text.inputEl.type = 'number';
				text.inputEl.min = '5';
				text.inputEl.max = '60';
				text.inputEl.value = this.plugin.settings.longBreakDuration.toString();
				text.inputEl.style.width = '60px';
			})
			.addButton(button => button
				.setButtonText('保存')
				.onClick(async () => {
					const input = button.buttonEl.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
					const value = parseInt(input.value);
					if (isNaN(value) || value < 5 || value > 60) {
						new Notice('请输入 5-60 之间的数字');
						return;
					}
					this.plugin.settings.longBreakDuration = value;
					await this.plugin.saveSettings();
					new Notice(`长休息时长已设置为 ${value} 分钟`);
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
			.setDesc('完成多少个番茄钟后进入长休息（2-10）')
			.addText(text => {
				text.inputEl.type = 'number';
				text.inputEl.min = '2';
				text.inputEl.max = '10';
				text.inputEl.value = this.plugin.settings.longBreakInterval.toString();
				text.inputEl.style.width = '60px';
			})
			.addButton(button => button
				.setButtonText('保存')
				.onClick(async () => {
					const input = button.buttonEl.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
					const value = parseInt(input.value);
					if (isNaN(value) || value < 2 || value > 10) {
						new Notice('请输入 2-10 之间的数字');
						return;
					}
					this.plugin.settings.longBreakInterval = value;
					await this.plugin.saveSettings();
					new Notice(`长休息间隔已设置为 ${value} 个番茄`);
				}))
			.addExtraButton(button => button
				.setIcon('reset')
				.setTooltip('重置为默认值 (4个)')
				.onClick(async () => {
					this.plugin.settings.longBreakInterval = DEFAULT_SETTINGS.longBreakInterval;
					await this.plugin.saveSettings();
					this.display();
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

			// Track Items Style
			new Setting(containerEl)
				.setName("跑道物品样式")
				.setDesc("选择跑道上显示的物品类型")
				.addDropdown(dropdown => dropdown
					.addOption("coins", "🪙 金币")
					.addOption("leaves", "🍃 树叶")
					.addOption("tomatoes", "🍅 番茄")
					.addOption("stars", "⭐ 星星")
					.addOption("hearts", "❤️ 爱心")
					.setValue(this.plugin.settings.progressBarStyle || "coins")
					.onChange(async (value) => {
						this.plugin.settings.progressBarStyle = value as any;
						await this.plugin.saveSettings();
						this.plugin.updateStatusBarStyle();
					}));

			// Progress Direction
			new Setting(containerEl)
				.setName('进度条方向')
				.setDesc('选择星星和进度条的运动方向')
				.addDropdown(dropdown => dropdown
					.addOption('left-to-right', '⬅️➡️ 从左到右')
					.addOption('right-to-left', '➡️⬅️ 从右到左')
					.setValue(this.plugin.settings.progressDirection || 'left-to-right')
					.onChange(async (value) => {
						this.plugin.settings.progressDirection = value as any;
						await this.plugin.saveSettings();
						this.plugin.updateAnimationDirection();
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
		containerEl.createEl('h3', { text: '📅 CalDAV 日历集成' });

		// Enable Calendar Integration
		new Setting(containerEl)
			.setName('启用日历集成')
			.setDesc('将番茄钟记录到 CalDAV 日历（如 iCloud）')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableCalendarIntegration)
				.onChange(async (value) => {
					this.plugin.settings.enableCalendarIntegration = value;
					await this.plugin.saveSettings();
				}));

		// CalDAV URL (combined server + path)
		new Setting(containerEl)
			.setName('CalDAV 日历地址')
			.setDesc('完整的 CalDAV 日历 URL，例如：https://caldav.icloud.com/123456/calendars/Home/')
			.addText(text => text
				.setPlaceholder('https://caldav.icloud.com/.../calendars/Home/')
				.setValue(this.plugin.settings.caldavUrl)
				.onChange(async (value) => {
					this.plugin.settings.caldavUrl = value.trim();
					await this.plugin.saveSettings();
				}));

		// Username
		new Setting(containerEl)
			.setName('用户名')
			.setDesc('CalDAV 账号用户名（如 Apple ID 邮箱）')
			.addText(text => text
				.setPlaceholder('user@example.com')
				.setValue(this.plugin.settings.caldavUsername)
				.onChange(async (value) => {
					this.plugin.settings.caldavUsername = value.trim();
					await this.plugin.saveSettings();
				}));

		// Password (App-specific password)
		new Setting(containerEl)
			.setName('密码')
			.setDesc('CalDAV 密码或应用专用密码')
			.addText(text => text
				.setPlaceholder('••••••••')
				.setValue(this.plugin.settings.caldavPassword)
				.onChange(async (value) => {
					this.plugin.settings.caldavPassword = value;
					await this.plugin.saveSettings();
				})
				.inputEl.type = 'password');

		// Test Connection Button
		new Setting(containerEl)
			.setName('测试连接')
			.setDesc('验证 CalDAV 配置是否正确')
			.addButton(button => button
				.setButtonText('测试连接')
				.setClass('mod-cta')
				.onClick(async () => {
					button.setButtonText('测试中...');
					button.setDisabled(true);

					const calendar = this.plugin.calendarIntegration;
					if (!calendar) {
						new Notice('❌ 日历集成未初始化');
						button.setButtonText('测试连接');
						button.setDisabled(false);
						return;
					}

					// Create a temporary config from current settings
					const tempConfig = {
						url: this.plugin.settings.caldavUrl,
						username: this.plugin.settings.caldavUsername,
						password: this.plugin.settings.caldavPassword,
						calendarPath: '' // Will be extracted from URL
					};

					// Temporarily init with this config
					calendar.init(tempConfig);

					const result = await calendar.testConnection();
					new Notice(result.message);

					button.setButtonText('测试连接');
					button.setDisabled(false);
				}));

		// Info text
		const infoEl = containerEl.createEl('div', {
			cls: 'setting-item-description info-text'
		});
		infoEl.innerHTML = `
			<p>💡 提示：</p>
			<ul>
				<li><strong>iCloud 用户</strong>：前往 appleid.apple.com 生成应用专用密码</li>
				<li>在 FCR 设置或 CalDAV 客户端中找到完整的日历 URL</li>
				<li>支持 iCloud、Google Calendar、Fastmail 等 CalDAV 服务</li>
			</ul>
			<p style="margin-top: 8px;">📝 iCloud 日历 URL 格式：</p>
			<p style="font-size: 0.9em; opacity: 0.8;">https://pXX-caldav.icloud.com/USER_ID/calendars/CALENDAR_ID/</p>
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
}

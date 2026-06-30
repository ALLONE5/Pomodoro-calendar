# 🍅 Pomodoro Calendar for Obsidian

[English](#english) | [中文](#中文)

## 中文

一个功能强大的 Obsidian 番茄钟插件，支持与 Full Calendar Remastered 插件集成，实现多设备同步。

## 功能特点

- ⏱️ **一键开始番茄钟** - 点击状态栏即可开始专注计时
- 🌈 **彩虹进度条** - 精美的彩虹渐变进度条，随时间实时更新
- 🎨 **可爱动画** - 完成时的庆祝动画、运行时的弹跳动画
- ⚙️ **可自定义时长** - 自定义番茄钟、小休、长休的时长
- 📅 **日历集成** - 与 Full Calendar Remastered 深度集成，在日历中实时显示
- 🔄 **多端同步** - 通过 iCloud/Syncthing 自动同步状态到其他设备
- 🎯 **右键菜单** - 右键/长按显示更多操作选项
- 📊 **统计数据** - 记录完成的番茄钟数量和专注时长

---

## English

A powerful Pomodoro timer plugin for Obsidian with animated rainbow progress bar and Full Calendar Remastered integration for multi-device sync.

## Features

- ⏱️ **One-click Pomodoro** - Start focus timer from the status bar
- 🌈 **Rainbow Progress Bar** - Beautiful animated gradient progress bar that updates in real-time
- 🎨 **Cute Animations** - Celebration animation on completion, bouncing animation while running
- ⚙️ **Customizable Durations** - Customize Pomodoro, short break, and long break durations
- 📅 **Calendar Integration** - Deep integration with Full Calendar Remastered, display in calendar in real-time
- 🔄 **Multi-device Sync** - Automatically sync state to other devices via iCloud/Syncthing
- 🎯 **Right-click Menu** - Right-click/long-press to show more options
- 📊 **Statistics** - Track completed Pomodoros and focus time

## 安装方法 / Installation

**中文：**
1. 下载最新版本的 `main.js`、`manifest.json` 和 `styles.css`
2. 在 Obsidian vault 中创建目录：`.obsidian/plugins/pomodoro-calendar/`
3. 将文件复制到该目录
4. 重启 Obsidian 或在设置中重新加载插件

**English:**
1. Download the latest `main.js`, `manifest.json`, and `styles.css`
2. Create directory: `.obsidian/plugins/pomodoro-calendar/` in your vault
3. Copy files to that directory
4. Restart Obsidian or reload plugins in settings

**Or install from the community plugin browser (coming soon!)**

## 使用说明 / Usage

### 基本操作 / Basic Operations

| 操作 / Action | 功能 / Function |
|------|------|
| 左键点击状态栏 | 开始/暂停/继续 番茄钟 / Start/Pause/Resume Pomodoro |
| 右键点击状态栏 | 显示菜单：取消、结束、设置等 / Show menu: cancel, end, settings, etc. |
| 长按状态栏 | 显示高级选项菜单 / Show advanced options menu |

### 命令面板 / Command Palette

**中文：** 按 `Ctrl+P` (或 `Cmd+P`) 打开命令面板，搜索 "番茄钟" 可使用以下命令：
- 🍅 开始番茄钟
- ☕ 开始小休
- 🌴 开始长休
- ⏸️ 暂停/继续
- ✅ 完成番茄钟
- ❌ 取消番茄钟
- ⚙️ 打开番茄钟设置

**English:** Press `Ctrl+P` (or `Cmd+P`) to open command palette, search "pomodoro" to use:
- 🍅 Start Pomodoro
- ☕ Start Short Break
- 🌴 Start Long Break
- ⏸️ Pause/Resume
- ✅ Complete Pomodoro
- ❌ Cancel Pomodoro
- ⚙️ Open Pomodoro Settings

### 日历集成 / Calendar Integration

**中文：**
1. 确保已安装 **Full Calendar Remastered** 插件
2. 在番茄钟设置中启用 "日历集成"
3. 选择默认日历
4. 开始番茄钟后，事件会自动创建到选定的日历中
5. 结束时间会实时更新

**English:**
1. Make sure **Full Calendar Remastered** plugin is installed
2. Enable "Calendar Integration" in Pomodoro settings
3. Select default calendar
4. After starting Pomodoro, events will be automatically created in the selected calendar
5. End time updates in real-time

### 多端同步 / Multi-device Sync

**中文：** 插件通过 Obsidian 的同步机制（iCloud/Syncthing/Git等）实现多端同步：
1. 在所有设备上安装插件
2. 确保 vault 已配置同步
3. 在任意设备上开始番茄钟
4. 其他设备会自动检测并同步状态

**English:** The plugin achieves multi-device sync via Obsidian's sync mechanism (iCloud/Syncthing/Git, etc.):
1. Install plugin on all devices
2. Ensure vault sync is configured
3. Start Pomodoro on any device
4. Other devices will automatically detect and sync status

## 设置选项 / Settings

### 计时器设置 / Timer Settings
**中文：**
- 番茄钟时长（默认 25 分钟）
- 小休时长（默认 5 分钟）
- 长休时长（默认 15 分钟）
- 长休间隔（默认 4 个番茄钟后）
- 自动开始休息
- 自动开始番茄钟

**English:**
- Pomodoro duration (default 25 minutes)
- Short break duration (default 5 minutes)
- Long break duration (default 15 minutes)
- Long break interval (default after 4 pomodoros)
- Auto-start break
- Auto-start pomodoro

### 进度条样式 / Progress Bar Styles
**中文：**
- 🌈 彩虹渐变
- 🎨 渐变色
- 🔴 纯色（可自定义颜色）
- 📏 极简风格

**English:**
- 🌈 Rainbow gradient
- 🎨 Gradient
- 🔴 Solid color (customizable)
- 📏 Minimalist style

### 通知设置 / Notification Settings
**中文：**
- 系统通知
- 提示音

**English:**
- System notifications
- Notification sound

## 开发 / Development

```bash
# 安装依赖 / Install dependencies
npm install

# 开发模式（监听文件变化）/ Development mode (watch for changes)
npm run dev

# 构建生产版本 / Build production version
npm run build
```

## 技术栈 / Tech Stack

- TypeScript
- Obsidian Plugin API
- Full Calendar Remastered API
- CSS3 Animations

## 贡献 / Contributing

**中文：** 欢迎提交 Issue 和 Pull Request！
**English:** Issues and Pull Requests are welcome!

## 许可证 / License

MIT License

## 致谢 / Acknowledgments

**中文：**
- [Obsidian](https://obsidian.md/) - 强大的笔记应用
- [Full Calendar Remastered](https://github.com/obsidian-full-calendar-remastered/plugin-full-calendar) - 日历集成插件

**English:**
- [Obsidian](https://obsidian.md/) - Powerful note-taking app
- [Full Calendar Remastered](https://github.com/obsidian-full-calendar-remastered/plugin-full-calendar) - Calendar integration plugin

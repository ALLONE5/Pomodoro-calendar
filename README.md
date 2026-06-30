# 🍅 Pomodoro Calendar for Obsidian

[English](#english) | [中文](#中文)

## 中文

一个功能强大的 Obsidian 番茄钟插件，支持与 CalDAV 日历集成，实现多设备同步。

## 功能特点

- ⏱️ **一键开始番茄钟** - 点击状态栏即可开始专注计时
- 🌈 **彩虹进度条** - 精美的彩虹渐变进度条，随时间实时更新
- 🎨 **可爱动画** - 完成时的庆祝动画、运行时的弹跳动画
- ⚙️ **可自定义时长** - 自定义番茄钟、小休、长休的时长
- 📅 **CalDAV 日历集成** - 支持 iCloud、Google Calendar 等 CalDAV 服务的双向同步
- 🔄 **多端同步** - 通过 iCloud/Syncthing 自动同步状态到其他设备
- 🎯 **右键菜单** - 右键/长按显示更多操作选项
- 📊 **统计数据** - 记录完成的番茄钟数量和专注时长

---

## English

A powerful Pomodoro timer plugin for Obsidian with animated rainbow progress bar and CalDAV calendar integration for multi-device sync.

## Features

- ⏱️ **One-click Pomodoro** - Start focus timer from the status bar
- 🌈 **Rainbow Progress Bar** - Beautiful animated gradient progress bar that updates in real-time
- 🎨 **Cute Animations** - Celebration animation on completion, bouncing animation while running
- ⚙️ **Customizable Durations** - Customize Pomodoro, short break, and long break durations
- 📅 **CalDAV Integration** - Two-way sync with CalDAV services (iCloud, Google Calendar, etc.)
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

### 日历集成 / CalDAV Integration

**中文：**
1. 在番茄钟设置中启用 "CalDAV 日历集成"
2. 配置 CalDAV 服务器地址（支持 iCloud、Google Calendar 等）
3. 输入用户名和密码（iCloud 需要应用专用密码）
4. 完成番茄钟后，会自动创建日历事件
5. 取消番茄钟时，会同步删除日历事件

**English:**
1. Enable "CalDAV Integration" in Pomodoro settings
2. Configure CalDAV server URL (supports iCloud, Google Calendar, etc.)
3. Enter username and password (iCloud requires app-specific password)
4. Completed Pomodoros will automatically create calendar events
5. Canceling Pomodoro will sync delete the calendar event

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
- CalDAV Protocol
- CSS3 Animations

## 贡献 / Contributing

**中文：** 欢迎提交 Issue 和 Pull Request！
**English:** Issues and Pull Requests are welcome!

## 许可证 / License

MIT License

## 致谢 / Acknowledgments

**中文：**
- [Obsidian](https://obsidian.md/) - 强大的笔记应用
- [CalDAV](https://en.wikipedia.org/wiki/CalDAV) - 开放的日历同步协议

**English:**
- [Obsidian](https://obsidian.md/) - Powerful note-taking app
- [CalDAV](https://en.wikipedia.org/wiki/CalDAV) - Open calendar synchronization protocol

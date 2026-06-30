# 🍅 Pomodoro Calendar for Obsidian

[English](#english) | [中文](#中文)

---

## 中文

一个功能强大的 Obsidian 番茄钟插件，带有可爱的卡通动画进度条和 CalDAV 日历集成。

## 功能特点

- ⏱️ **一键开始番茄钟** - 点击左侧边栏图标开始专注计时
- 🌟 **可爱动画进度条** - 卡通星星收集金币/树叶/番茄等物品，随时间推进
- 🎨 **多种主题样式** - 金币、树叶、番茄、星星、爱心五种样式
- 🎉 **庆祝动画** - 完成番茄钟时的精美粒子特效
- ⚙️ **完全可定制** - 自定义番茄钟、小休、长休的时长
- 📅 **CalDAV 日历集成** - 支持 iCloud、Google Calendar 等双向同步
- 🔄 **多设备同步** - 通过 Obsidian 同步机制自动同步状态
- 🎯 **丰富的控制选项** - 播放/暂停/完成/跳过/取消，支持快捷键

## 安装方法

### 通过社区插件浏览器安装（推荐）

1. 打开 Obsidian 设置 → 第三方插件 → 浏览
2. 搜索 "Pomodoro Calendar"
3. 点击安装并启用

### 手动安装

1. 下载最新版本的 [main.js](https://github.com/ALLONE5/Pomodoro-calendar/releases)
2. 在 Obsidian vault 中创建目录：`.obsidian/plugins/pomodoro-calendar/`
3. 将 `main.js`、`manifest.json` 和 `styles.css` 复制到该目录
4. 重启 Obsidian 或在设置中重新加载插件

## 使用说明

### 基本操作

| 操作 | 功能 |
|------|------|
| 点击左侧边栏图标 | 显示/隐藏番茄钟面板 |
| 点击时间显示 | 开始/暂停 番茄钟 |
| 点击控制按钮 | 完成 / 跳过 / 取消 |

### 命令面板

按 `Ctrl+P` (或 `Cmd+P`) 打开命令面板，搜索 "番茄钟" 可使用以下命令：

- 🍅 开始番茄钟
- ☕ 开始小休
- 🌴 开始长休
- ⏸️ 暂停/继续
- ✅ 完成番茄钟
- ❌ 取消番茄钟
- 📊 显示/隐藏番茄钟面板

### CalDAV 日历集成

1. 在番茄钟设置中启用 "CalDAV 日历集成"
2. 配置 CalDAV 服务器地址（支持 iCloud、Google Calendar、Fastmail 等）
3. 输入用户名和密码（iCloud 用户需在 appleid.apple.com 生成应用专用密码）
4. 点击 "测试连接" 验证配置
5. 完成番茄钟后，会自动创建日历事件
6. 取消番茄钟时，会同步删除日历事件

**iCloud 日历 URL 格式：**
```
https://pXX-caldav.icloud.com/USER_ID/calendars/CALENDAR_ID/
```

### 多设备同步

插件通过 Obsidian 的同步机制（iCloud/Syncthing/Git等）实现多设备同步：

1. 在所有设备上安装插件
2. 确保 vault 已配置同步
3. 在任意设备上开始番茄钟
4. 其他设备会自动检测并同步状态

## 设置选项

### ⏱️ 计时器设置
- 番茄钟时长（默认 25 分钟）
- 短休息时长（默认 5 分钟）
- 长休息时长（默认 15 分钟）
- 长休息间隔（默认 4 个番茄钟后）
- 自动开始休息
- 自动开始番茄钟

### 🎨 进度条样式
- 🪙 金币
- 🍃 树叶
- 🍅 番茄
- ⭐ 星星
- ❤️ 爱心

### 进度条方向
- 从左到右
- 从右到左

### 🔔 通知设置
- 系统通知
- 通知声音

### 📅 CalDAV 日历设置
- CalDAV 服务器 URL
- 用户名
- 密码
- 测试连接

## 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建生产版本
npm run build
```

## 技术栈

- TypeScript
- Obsidian Plugin API
- CalDAV Protocol
- CSS3 Animations

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- [Obsidian](https://obsidian.md/) - 强大的笔记应用
- [CalDAV](https://en.wikipedia.org/wiki/CalDAV) - 开放的日历同步协议

---

## English

A powerful Pomodoro timer plugin for Obsidian with cute animated progress bar and CalDAV calendar integration.

## Features

- ⏱️ **One-click Pomodoro** - Start focus timer from the ribbon icon
- 🌟 **Cute Animated Progress Bar** - Cartoon character collects items while progressing
- 🎨 **Multiple Theme Styles** - Coins, leaves, tomatoes, stars, hearts
- 🎉 **Celebration Animation** - Beautiful particle effects on completion
- ⚙️ **Fully Customizable** - Customize Pomodoro, short break, and long break durations
- 📅 **CalDAV Integration** - Two-way sync with iCloud, Google Calendar, etc.
- 🔄 **Multi-device Sync** - Automatically sync state via Obsidian sync
- 🎯 **Rich Control Options** - Play/pause/complete/skip/cancel with keyboard shortcuts

## Installation

### Via Community Plugins Browser (Recommended)

1. Open Obsidian Settings → Third-party plugin → Browse
2. Search for "Pomodoro Calendar"
3. Click Install and Enable

### Manual Installation

1. Download the latest [main.js](https://github.com/ALLONE5/Pomodoro-calendar/releases)
2. Create directory: `.obsidian/plugins/pomodoro-calendar/` in your vault
3. Copy `main.js`, `manifest.json`, and `styles.css` to that directory
4. Restart Obsidian or reload plugins in settings

## Usage

### Basic Operations

| Action | Function |
|------|------|
| Click ribbon icon | Show/hide Pomodoro panel |
| Click time display | Start/pause Pomodoro |
| Click control buttons | Complete / Skip / Cancel |

### Command Palette

Press `Ctrl+P` (or `Cmd+P`) to open command palette, search "pomodoro":

- 🍅 Start Pomodoro
- ☕ Start Short Break
- 🌴 Start Long Break
- ⏸️ Pause/Resume
- ✅ Complete Pomodoro
- ❌ Cancel Pomodoro
- 📊 Show/Hide Pomodoro Panel

### CalDAV Integration

1. Enable "CalDAV Integration" in Pomodoro settings
2. Configure CalDAV server URL (supports iCloud, Google Calendar, Fastmail, etc.)
3. Enter username and password (iCloud users: generate app-specific password at appleid.apple.com)
4. Click "Test Connection" to verify configuration
5. Completed Pomodoros will automatically create calendar events
6. Canceling Pomodoro will sync delete the calendar event

**iCloud Calendar URL Format:**
```
https://pXX-caldav.icloud.com/USER_ID/calendars/CALENDAR_ID/
```

### Multi-device Sync

The plugin achieves multi-device sync via Obsidian's sync mechanism (iCloud/Syncthing/Git, etc.):

1. Install plugin on all devices
2. Ensure vault sync is configured
3. Start Pomodoro on any device
4. Other devices will automatically detect and sync status

## Settings

### ⏱️ Timer Settings
- Pomodoro duration (default 25 minutes)
- Short break duration (default 5 minutes)
- Long break duration (default 15 minutes)
- Long break interval (default after 4 pomodoros)
- Auto-start break
- Auto-start pomodoro

### 🎨 Progress Bar Styles
- 🪙 Coins
- 🍃 Leaves
- 🍅 Tomatoes
- ⭐ Stars
- ❤️ Hearts

### Progress Direction
- Left to right
- Right to left

### 🔔 Notification Settings
- System notifications
- Notification sound

### 📅 CalDAV Settings
- CalDAV server URL
- Username
- Password
- Test connection

## Development

```bash
# Install dependencies
npm install

# Development mode (watch for changes)
npm run dev

# Build production version
npm run build
```

## Tech Stack

- TypeScript
- Obsidian Plugin API
- CalDAV Protocol
- CSS3 Animations

## Contributing

Issues and Pull Requests are welcome!

## License

MIT License

## Acknowledgments

- [Obsidian](https://obsidian.md/) - Powerful note-taking app
- [CalDAV](https://en.wikipedia.org/wiki/CalDAV) - Open calendar synchronization protocol

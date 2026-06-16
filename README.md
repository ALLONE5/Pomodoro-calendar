# 🍅 Pomodoro Calendar for Obsidian

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

## 安装方法

1. 下载最新版本的 `main.js`、`manifest.json` 和 `styles.css`
2. 在 Obsidian vault 中创建目录：`.obsidian/plugins/pomodoro-calendar/`
3. 将文件复制到该目录
4. 重启 Obsidian 或在设置中重新加载插件

## 使用说明

### 基本操作

| 操作 | 功能 |
|------|------|
| 左键点击状态栏 | 开始/暂停/继续 番茄钟 |
| 右键点击状态栏 | 显示菜单：取消、结束、设置等 |
| 长按状态栏 | 显示高级选项菜单 |

### 命令面板

按 `Ctrl+P` (或 `Cmd+P`) 打开命令面板，搜索 "番茄钟" 可使用以下命令：

- 🍅 开始番茄钟
- ☕ 开始小休
- 🌴 开始长休
- ⏸️ 暂停/继续
- ✅ 完成番茄钟
- ❌ 取消番茄钟
- ⚙️ 打开番茄钟设置

### 日历集成

1. 确保已安装 **Full Calendar Remastered** 插件
2. 在番茄钟设置中启用 "日历集成"
3. 选择默认日历
4. 开始番茄钟后，事件会自动创建到选定的日历中
5. 结束时间会实时更新

### 多端同步

插件通过 Obsidian 的同步机制（iCloud/Syncthing/Git等）实现多端同步：

1. 在所有设备上安装插件
2. 确保 vault 已配置同步
3. 在任意设备上开始番茄钟
4. 其他设备会自动检测并同步状态

## 设置选项

### 计时器设置
- 番茄钟时长（默认 25 分钟）
- 小休时长（默认 5 分钟）
- 长休时长（默认 15 分钟）
- 长休间隔（默认 4 个番茄钟后）
- 自动开始休息
- 自动开始番茄钟

### 进度条样式
- 🌈 彩虹渐变
- 🎨 渐变色
- 🔴 纯色（可自定义颜色）
- 📏 极简风格

### 通知设置
- 系统通知
- 提示音

### 多端同步
- 同步间隔调整

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
- Full Calendar Remastered API
- CSS3 动画

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

- [Obsidian](https://obsidian.md/) - 强大的笔记应用
- [Full Calendar Remastered](https://github.com/obsidian-full-calendar-remastered/plugin-full-calendar) - 日历集成插件

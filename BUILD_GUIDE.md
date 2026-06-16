# 构建和安装指南

## 快速开始

### 1. 安装依赖

```bash
cd "d:/Projects/Pomodoro calendar"
npm install
```

### 2. 开发模式（监听文件变化自动编译）

```bash
npm run dev
```

### 3. 生产构建

```bash
npm run build
```

## 安装到 Obsidian

### 方法一：手动安装

1. 运行 `npm run build` 构建
2. 复制以下文件到你的 Obsidian vault：

```
你的Vault/.obsidian/plugins/pomodoro-calendar/
├── main.js           # 从项目根目录复制
├── manifest.json     # 从项目根目录复制
└── data/             # 会自动创建
```

3. 重启 Obsidian
4. 在 设置 → 社区插件 中启用 "Pomodoro Calendar"

### 方法二：符号链接（开发推荐）

```bash
# Windows (PowerShell)
New-Item -ItemType SymbolicLink -Path "你的Vault/.obsidian/plugins/pomodoro-calendar" -Target "d:/Projects/Pomodoro calendar"

# 然后在插件目录创建符号链接到 main.js
cd "你的Vault/.obsidian/plugins/pomodoro-calendar"
New-Item -ItemType SymbolicLink -Path "main.js" -Target "../../../main.js"
New-Item -ItemType SymbolicLink -Path "manifest.json" -Target "../../../manifest.json"
```

## 文件结构

```
obsidian-pomodoro-calendar/
├── src/
│   ├── main.ts                 # 插件主入口
│   ├── pomodoro.ts            # 番茄钟核心逻辑
│   ├── statusBar.ts           # 状态栏彩虹进度条 UI
│   ├── settings.ts            # 设置面板
│   ├── calendarIntegration.ts # Full Calendar Remastered 集成
│   ├── dataStore.ts          # 数据存储与多端同步
│   └── styles.css            # 样式和动画
├── manifest.json              # 插件清单
├── package.json               # NPM 配置
├── tsconfig.json             # TypeScript 配置
├── esbuild.config.mjs        # 构建配置
├── main.js                   # 构建输出（运行 npm run build 后生成）
└── README.md                 # 说明文档
```

## 功能验证

安装完成后，验证以下功能：

1. ✅ 状态栏显示番茄钟图标和计时器
2. ✅ 左键点击可以开始/暂停
3. ✅ 右键点击显示菜单
4. ✅ 设置面板可以打开
5. ✅ 安装 Full Calendar Remastered 后可以选择日历
6. ✅ 番茄钟结束时显示庆祝动画

## 故障排除

### 插件不显示

1. 检查 `设置 → 社区插件` 中是否已启用
2. 查看帮助 → 开发者工具 中的控制台错误
3. 确保 main.js 和 manifest.json 在正确位置

### 日历集成不工作

1. 确保已安装 Full Calendar Remastered 插件
2. 在设置中启用 "日历集成"
3. 选择一个默认日历

### 多端同步不工作

1. 确保 Obsidian vault 已配置同步（iCloud/Syncthing等）
2. 检查 `.obsidian/plugins/pomodoro-calendar/data.json` 是否同步
3. 尝试调整同步间隔设置

## 开发建议

- 修改代码后，开发模式会自动重新编译
- 修改 manifest.json 版本号后需要重启 Obsidian
- 使用 `Ctrl+R` 重载 Obsidian 而非完全重启
- 查看控制台输出调试信息

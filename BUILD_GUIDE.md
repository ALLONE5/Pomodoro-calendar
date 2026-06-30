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
└── styles.css        # 从项目根目录复制
```

3. 重启 Obsidian
4. 在 设置 → 第三方插件 中启用 "Pomodoro Calendar"

### 方法二：符号链接（开发推荐）

```bash
# Windows (PowerShell)
New-Item -ItemType SymbolicLink -Path "你的Vault/.obsidian/plugins/pomodoro-calendar" -Target "d:/Projects/Pomodoro calendar"

# 然后在插件目录创建符号链接到构建文件
cd "你的Vault/.obsidian/plugins/pomodoro-calendar"
New-Item -ItemType SymbolicLink -Path "main.js" -Target "../../../main.js"
New-Item -ItemType SymbolicLink -Path "manifest.json" -Target "../../../manifest.json"
New-Item -ItemType SymbolicLink -Path "styles.css" -Target "../../../styles.css"
```

## 文件结构

```
obsidian-pomodoro-calendar/
├── src/
│   ├── main.ts                 # 插件主入口
│   ├── pomodoro.ts             # 番茄钟核心逻辑
│   ├── animatedBar.ts          # 动画进度条 UI
│   ├── settings.ts             # 设置面板
│   ├── calendarIntegration.ts  # CalDAV 日历集成
│   └── dataStore.ts            # 数据存储与多端同步
├── manifest.json               # 插件清单
├── package.json                # NPM 配置
├── tsconfig.json              # TypeScript 配置
├── esbuild.config.mjs         # 构建配置
├── main.js                    # 构建输出（运行 npm run build 后生成）
└── README.md                  # 说明文档
```

## 功能验证

安装完成后，验证以下功能：

1. ✅ 左侧边栏显示番茄钟图标
2. ✅ 点击图标可以显示/隐藏番茄钟面板
3. ✅ 点击时间显示可以开始/暂停
4. ✅ 控制按钮工作正常（完成/跳过/取消）
5. ✅ 设置面板可以打开并修改配置
6. ✅ 进度条动画正常显示
7. ✅ 番茄钟结束时显示庆祝动画
8. ✅ CalDAV 日历集成可以测试连接

## 故障排除

### 插件不显示

1. 检查 `设置 → 第三方插件` 中是否已启用
2. 查看帮助 → 开发者工具 中的控制台错误
3. 确保 main.js、manifest.json 和 styles.css 在正确位置
4. 尝试重新加载插件（Ctrl+R）

### 进度条不显示

1. 点击左侧边栏的番茄钟图标
2. 检查是否启用了动画效果
3. 尝试开始一个番茄钟

### CalDAV 日历集成不工作

1. 确保已配置 CalDAV 服务器地址
2. 在设置中启用 "CalDAV 日历集成"
3. 点击 "测试连接" 验证配置
4. 确保使用正确的用户名和密码
   - iCloud 用户需在 appleid.apple.com 生成应用专用密码
   - Google 需使用应用专用密码并开启两步验证
5. 检查防火墙是否阻止了 CalDAV 请求

### 多设备同步不工作

1. 确保 Obsidian vault 已配置同步（iCloud/Syncthing等）
2. 检查 `.obsidian/plugins/pomodoro-calendar/data.json` 是否同步
3. 尝试手动刷新 Obsidian

## 开发建议

- 修改代码后，开发模式会自动重新编译
- 修改 manifest.json 版本号后需要重启 Obsidian
- 使用 `Ctrl+R` 重载 Obsidian 而非完全重启
- 查看控制台输出调试信息（帮助 → 开发者工具）
- 修改 CSS 后需要重新构建

## 发布新版本

1. 更新 `manifest.json` 中的版本号
2. 更新 `package.json` 中的版本号
3. 运行 `npm run build` 构建
4. 运行 `npm run version` 更新 versions.json
5. 提交并推送到 GitHub
6. 在 GitHub 创建新 Release，上传构建文件

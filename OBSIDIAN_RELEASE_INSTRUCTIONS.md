# Obsidian 插件发布指南

## ⚠️ 重要提示

Obsidian 已更改插件提交流程，现在不再通过 GitHub PR，而是通过 **community.obsidian.md** 网站提交。

---

## 正确的提交流程

### 步骤 1: 确保 GitHub Release 已创建

✅ 你已完成：https://github.com/ALLONE5/Pomodoro-calendar/releases/tag/1.0.0

### 步骤 2: 访问 Obsidian Community 目录

1. 访问：https://community.obsidian.md
2. 使用你的 Obsidian 账号登录

### 步骤 3: 链接 GitHub 账号

1. 在个人资料中链接你的 GitHub 账号
2. 这样目录可以验证你拥有该仓库

### 步骤 4: 提交插件

1. 在侧边栏选择 **Plugins**（插件）
2. 选择 **New plugin**（新建插件）
3. 输入你的 GitHub 仓库 URL：
   ```
   https://github.com/ALLONE5/Pomodoro-calendar
   ```
4. 审查并同意开发者政策
5. 确认你将继续支持你的插件
6. 选择 **Submit**（提交）

---

## 提交前的检查清单

- ✅ GitHub Release 已创建（包含 main.js, manifest.json, styles.css）
- ✅ README.md 文件存在且描述清晰
- ✅ LICENSE 文件存在
- ✅ manifest.json 中的版本号与 Release tag 一致（1.0.0）
- ✅ manifest.json 中的 id 唯一且不包含 "obsidian"
- ✅ 所有文件已提交到 GitHub

---

## 审核流程

提交后，你的插件会经过自动审核：

1. 目录会显示需要修正的任何问题
2. 如果有问题，更新你的仓库并创建新的 GitHub Release（递增版本号）
3. 自动审核通过后，插件就可以在 Obsidian 中安装了

---

## 发布后

一旦你的插件被审核并发布：

- 在论坛的 **Share & showcase** 板块发布公告
- 在 Discord 的 **#updates** 频道发布（需要 developer 角色）

---

## 参考资源

- [Submit your plugin - Developer Documentation](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Obsidian Community Plugins](https://community.obsidian.md)
- [Developer policies](https://help.obsidian.md/developer+policies)

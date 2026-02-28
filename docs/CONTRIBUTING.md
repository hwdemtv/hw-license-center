# 参与贡献 (Contributing Guidelines)

首先，非常感谢您有意向为 `hw-license-center` 贡献代码或提出建议！我们欢迎任何形式的贡献，包括修复 Bug、新增特性、改善文档或提供反馈。

为了确保协作的高效和愉快，请在贡献前阅读以下指南：

## 🐛 报告 Bug (Issue)

在提交 Issue 之前，请：
1. **搜索已有的 Issues**：确保没有人已经报告过相同的问题。
2. **使用最新的主干代码**：确保您遇到的问题在最新版本中依然存在。

提交 Issue 时，请尽量提供：
- 明确的错误现象和期望结果。
- 能够复现问题的步骤或代码片段。
- 您使用的运行环境（Cloudflare Workers 还是 Node.js）、版本号及操作系统。

## ✨ 提交新特性 (Feature Request)

如果您有很好的想法，欢迎在 Issues 中提出。最好能描述清楚：
- **目标场景**：这个功能解决了什么实际问题？
- **预期设计**：您期望它如何工作？（如果有可能，请附带交互或架构构思）

## 💻 提交拉取请求 (Pull Request)

如果您打算自行修复 Bug 或开发新功能并发起 Pull Request (PR)，请遵循以下流程：

### 1. 准备工作
- Fork 本仓库。
- 克隆您的 Fork 版本到本地：`git clone https://github.com/您的用户名/hw-license-center.git`
- 基于 `main` 分支创建一个新的特性分支：`git checkout -b feature/your-feature-name` (或 `fix/your-bug-fix`)

### 2. 开发与环境适配
本项目采用 **Cloudflare Workers / Node.js 双栖架构**。在开发时请注意：
- 数据库操作需统一使用 `src/db/adapter.ts` (`DBAdapter`)，以兼容 D1 和 SQLite。
- 前端页面在 `src/static/` 目录下，修改后需运行 `node build-html.js` 重新编译前端静态资源注入包裹。

### 3. 代码规范
- 请保持与现有代码风格一致（TypeScript, 2个空格缩进）。
- 确保代码在本地编译和运行无报错 (`npm run dev:node` 或 `npm run dev`)。
- 尽量为复杂的逻辑添加清晰的**中文注释**。

### 4. 提交规范
我们推荐使用如下规范的 Commit Message 格式以利于生成 Changelog：
- `feat: 添加某个功能`
- `fix: 修复某个bug`
- `docs: 更新文档`
- `refactor: 重构某部分代码`
- `style: 格式化代码（不影响逻辑）`

### 5. 发起 PR
- 将代码推送到您的分支：`git push origin feature/your-feature-name`
- 在 GitHub 页面上发起一个 Pull Request 到本项目的 `main` 分支。
- 在 PR 描述中清晰说明您的改动点，并关联相关的 Issue（如果存在，例如 `Fixes #123`）。

> 维护者会尽快审查您的 PR，并可能提出一些修改建议。请保持关注和沟通！

## 📜 行为准则 (Code of Conduct)

在参与本开源社区的讨论与协作时，请保持友善、包容和尊重。共同营造一个积极的技术交流环境。

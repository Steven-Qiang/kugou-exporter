# AGENTS.md

本文件为 AI 编码代理（及新加入的开发者）提供在本仓库工作所需的上文信息。修改代码前请先阅读本文件。

> ⚠️ 当前分支为 `feat/v2`：项目已从 v1 的「单机 + config.yaml 全局 cookie」重构为「多用户会话 + 多酷狗账号 + SQLite 服务端托管 cookie」。本文件描述的是 v2 现状。

## 项目概述

**kugou-exporter**：将酷狗音乐歌单导出为通用 JSON 格式，兼容 XiaoMusic（小爱音箱）等播放器。

- 酷狗登录方式：手机验证码 / 二维码扫码（酷狗侧）；应用侧为「本地账户 + 密码」登录
- 导出格式：XiaoMusic JSON（含代理链接）、原始 JSON（歌曲元数据）、CSV
- 内置代理服务：导出的播放链接为 `/<server>/proxy/song/url?hash=xxx&quality=xxx&uid=<kg_userid>`，播放器请求时服务端实时调用酷狗 API 获取最新音频地址，解决酷狗直链 2–4 小时过期问题
- 多用户：注册/登录会话（cookie），支持管理员管理子用户、每用户添加多个酷狗账号并切换激活账号

## 技术栈

| 层             | 技术                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 包管理         | pnpm workspace（`packageManager: pnpm@10.29.3`，Node.js >= 22.5，实际开发/运行 24.x）                                               |
| 启动器（后端） | TypeScript + tsdown（打包为 CJS `dist/index.cjs`）+ Express（来自 `kugoumusicapi` 依赖）+ `node:sqlite`/`DatabaseSync`              |
| 存储           | SQLite（WAL）：`apps/launcher/data/kugou.db`，路径可用 `KUGOU_DB_PATH` 覆盖；Docker 下 `/app/data/kugou.db`                         |
| 前端           | Vue 3 `<script setup lang="ts">` + Vite 7 + TypeScript + Element Plus 2 + vue-router 5（hash 模式）+ axios + dayjs + vue-clipboard3 |
| 前端工程化     | `unplugin-auto-import`（vue/vue-router API 自动导入）、`unplugin-vue-components`（Element Plus 组件自动注册）                       |
| 依赖           | kugoumusicapi（`git://github.com/MakcRe/KuGouMusicApi#v1.6.0`），`postinstall` 会重写其 `main.js`/`server.js`/`interface.d.ts`      |
| 质量           | ESLint（`@antfu/eslint-config`）+ Prettier + vue-tsc（web 构建含 `vue-tsc --noEmit`）                                               |
| 发布           | semantic-release + GitHub Actions + Docker Hub                                                                                      |

## 目录结构

```
kugou-exporter/
├── apps/
│   ├── launcher/               # Node 启动器（TypeScript）
│   │   ├── src/
│   │   │   ├── index.ts        # 装配 kugoumusicapi + 自定义路由 + 静态资源
│   │   │   ├── auth.ts         # refreshLogin（登录态续期，1h 节流）、registerDev（设备注册/dfid）
│   │   │   ├── db.ts           # node:sqlite 初始化 + 建表 + ensureColumn 迁移
│   │   │   ├── middleware/session.ts  # requireAuth（读 kugou_session cookie / Bearer token）
│   │   │   ├── routes/         # auth / config / history / kugou / proxy
│   │   │   ├── store/          # users / sessions / kugou / settings / history
│   │   │   ├── lib/password.ts # scrypt 哈希
│   │   │   └── types/          # kugoumusicapi.d.ts（手动声明）
│   │   └── data/               # SQLite 数据目录（gitignored）
│   └── web/                    # Vue3 前端
│       ├── src/
│       │   ├── components/     # AppLayout（侧边导航壳）/ ExportDialog / SongUrlDialog / QualitySelect / ThemeToggle
│       │   ├── views/          # SetupView / LoginView / AccountsView / PlaylistView / SettingsView
│       │   ├── router/         # 路由 + 登录守卫（嵌套在 AppLayout 下）
│       │   ├── stores/auth.ts  # 当前用户/needsSetup 状态
│       │   ├── api/index.ts    # authApi / kugouApi / configApi / historyApi / userApi
│       │   ├── utils/          # request（axios+演示模式）/ mock / export / format / theme / image
│       │   └── types/          # 酷狗 API 数据结构类型
│       └── vite.config.ts      # 开发代理 /api → http://localhost:3000
├── scripts/
│   └── patch-kugoumusicapi.js  # postinstall 补丁，重写依赖的 main.js/server.js/interface.d.ts
├── .github/workflows/release.yml
├── Dockerfile                  # 多阶段（node:24-alpine）
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## 常用命令

```bash
pnpm install        # 安装依赖；postinstall 自动执行 patch-kugoumusicapi.js
pnpm dev            # 并行启动前端 Vite（5173）与后端 tsx watch（3000，自动热重载）
pnpm build          # 各 workspace 构建（web: vue-tsc --noEmit && vite build；launcher: tsdown）
pnpm start          # node apps/launcher/dist/index.cjs（需先 build）
pnpm lint           # eslint . --fix
pnpm prettier       # prettier --write "apps/**/*.{vue,js,ts}"
```

## 系统流程与核心约定

### 应用鉴权（本地账户，非酷狗凭据）

- `POST /auth/setup`（首次无用户时创建管理员）、`POST /auth/login`、`POST /auth/logout`、`GET /auth/me`
- 会话：`kugou_session` cookie（httpOnly, sameSite=lax），存于 `sessions` 表，7 天有效
- 密码：scrypt（`lib/password.ts`，salt + 64 字节哈希，timingSafeEqual 校验）
- 修改密码：`POST /auth/change-password`（requireAuth，需原密码）
- 用户管理（管理员）：`GET/POST /auth/users`、`POST /auth/users/:id/reset-password`、`DELETE /auth/users/:id`；不能删除自己或唯一管理员
- 登录限流：`/auth/login`、`/auth/setup` 按 IP 在内存中限流（10 次 / 15 分钟）

### 酷狗账号（多账号，服务端托管 cookie）

- `GET /kugou`：列出当前用户的酷狗账号；`POST /kugou`：新增（保存当前请求的浏览器 cookie，剔除 `kugou_session`）；`POST /kugou/:id/activate`、`/rename`、`DELETE /kugou/:id`
- 每个用户有「激活账号」；数据接口都用激活账号的 cookie 服务端直连酷狗（前端不持有酷狗 cookie）
- 数据接口（均 requireAuth）：`/kugou/me`、`/kugou/playlist`、`/kugou/playlist/tracks?listid&page&pagesize`、`/kugou/song/url?hash&quality`
- cookie 持久化在 `kugou_accounts.cookies_json`（明文，属敏感凭据，勿打印/提交）

### 代理链接（公开，供 XiaoMusic）

- `GET /proxy/song/url?hash=&quality=&uid=` **不需要登录**（外部播放器无法带登录态）
- 优先按 `uid`（酷狗 kg_userid）定位账号 cookie；`uid` 匹配不到时，**仅当系统只有一个账号**才兜底到该账号，否则 404（避免多用户下跨账号泄露）
- 处理流程：`refreshLogin`（1h 节流）→ `registerDev`（取 dfid）→ `song_url` → 301 到 `urls[0]`；无链接 404

### 前端

- 路由：`/setup`、`/login` 独立；`/` 下嵌套 `AppLayout`（左侧边导航）的子路由 `accounts`/`playlist`/`settings`
- 登录守卫（`router/index.ts` beforeEach）：先查 `needsSetup`，未登录仅放行 `login`/`setup`
- 请求封装（`utils/request.ts`）：`baseURL` 开发为 `/api`（Vite 代理到 3000），生产为 `/`；`withCredentials: true`；响应拦截器约定 **`.data` 始终是有效载荷**（若 body 是 `{code,data,msg}` 解包返回 body，否则返回完整 response）
- 演示模式：`localStorage['kugou-demo']='1'`，数据接口由 `utils/mock.ts` 拦截（`demoAdapter`），认证接口仍走真实后端
- 主题：`utils/theme.ts` 以 `html[data-theme]` + `classList.toggle('dark')` 驱动，Element Plus 暗色用 `html.dark`（已引入 dark css-vars）
- 安全约定：不要在前端持有或打印酷狗 cookie；导出代理链接为前端拼 URL，代理可用性依赖服务器在线

## 数据库（`apps/launcher/data/kugou.db`）

表：`users`、`sessions`、`kugou_accounts`、`settings`（每用户 quality/server_url）、`export_history`。
`db.ts` 用 `PRAGMA table_info` 检测缺列并 `ALTER TABLE` 补齐（`ensureColumn`），兼容旧库。

## 代码风格与规范

- ESLint `@antfu/eslint-config`，2 空格、单引号、无分号；`pnpm lint` 自动修复
- Vue 组件：模板用 kebab-case；`<template>/<script setup lang="ts">/<style scoped>` 顺序固定
- 组件通过 `defineExpose({ open })` 暴露打开对话框方法，父组件用 `useTemplateRef` 引用
- Prettier：printWidth 120、`trailingComma: 'es5'`、LF 行尾（`.prettierrc.js`）
- 酷狗 API 类型集中在 `apps/web/src/types/index.ts`；新增字段时同步补充
- 中文注释与 UI 文案是项目惯例，保持中文

## 给 AI Agent 的工作提示

- 修改前先 `pnpm install` 确认补丁已应用；涉及 kugoumusicapi 的改动注意补丁会覆盖 `node_modules` 中对应文件；如需改逻辑，改 `scripts/patch-kugoumusicapi.js`
- 改动前端后建议本地 `pnpm dev` 验证（前端 5173、后端 3000 都要起）
- 提交前运行 `pnpm lint`、`pnpm prettier`、`pnpm build`（web 含 vue-tsc 类型检查）
- 不要提交 `dist/`、`data/`、`config.yaml`、`node_modules/` 等被忽略的产物
- **不要直接修改数据库覆盖真实酷狗 cookie 时在日志/聊天里回显明文**；调试可用 `node:sqlite` 只读查询并脱敏

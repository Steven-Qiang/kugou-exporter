# AGENTS.md

本文件为 AI 编码代理（及新加入的开发者）提供在本仓库工作所需的上文信息。修改代码前请先阅读本文件。

## 项目概述

**kugou-exporter**：将酷狗音乐歌单导出为通用 JSON 格式，兼容 xiaomusic（小爱音箱）等播放器。

- 登录方式：手机验证码 / 二维码扫码
- 导出格式：XiaoMusic JSON（含代理链接）、原始 JSON（歌曲元数据）、CSV
- 内置代理服务：导出的播放链接为 `http://<server>:3000/proxy/song/url?hash=xxx&quality=high`，播放器请求时服务端实时调用酷狗 API 获取最新音频地址，解决酷狗直链 2–4 小时过期问题
- 交付形态：Node 启动器（源码运行 / Docker）与 nexe 打包的 Windows/Linux 可执行文件

## 技术栈

| 层             | 技术                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 包管理         | pnpm workspace（`packageManager: pnpm@10.29.3`，Node.js >= 18，CI/nexe 固定 24.12.0）                                                  |
| 启动器（后端） | CommonJS Node.js + Express（来自 `kugoumusicapi` 依赖），`chalk`、`get-port`、`js-yaml`                                                |
| 前端           | Vue 3 `<script setup lang="ts">` + Vite 7 + TypeScript + Element Plus 2 + vue-router 5（hash 模式）+ axios + dayjs + vue-clipboard3    |
| 前端工程化     | `unplugin-auto-import`（vue/vue-router API 自动导入）、`unplugin-vue-components`（Element Plus 组件自动注册），生成的 dts 已提交到仓库 |
| 构建           | `@vercel/ncc`（依赖打包单文件）+ `nexe 5.0.0-beta.4`（生成可执行文件，Node 24.12.0）                                                   |
| 质量           | ESLint（`@antfu/eslint-config`）+ Prettier                                                                                             |
| 发布           | semantic-release + GitHub Actions + Docker Hub（镜像 `stevenxuq/kugou-exporter`）                                                      |

## 目录结构

```
kugou-exporter/
├── apps/
│   ├── launcher/               # Node.js 启动器（CommonJS）
│   │   ├── index.js            # 启动服务：装配 kugoumusicapi 路由 + 自定义路由 + 静态资源
│   │   ├── config.js           # config.yaml 读写（js-yaml）
│   │   └── util.js             # refreshLogin（登录态刷新）、registerDev（设备注册）
│   └── web/                    # Vue3 前端
│       ├── src/
│       │   ├── components/     # ExportDialog / SongUrlDialog / QualitySelect / ThemeToggle
│       │   ├── router/         # 路由 + 登录守卫
│       │   ├── types/          # 酷狗 API 数据结构类型定义
│       │   ├── utils/          # request（axios+演示模式）、mock（演示数据）、theme、export、history、format、image
│       │   └── views/          # LoginView / PlaylistView
│       └── vite.config.ts      # 开发代理 /api → http://localhost:3000
├── scripts/
│   ├── build.js                # ncc + nexe 打包（--linux-only 用于 Docker）
│   └── patch-kugoumusicapi.js  # postinstall 补丁，重写依赖的 main.js/server.js/interface.d.ts
├── .github/workflows/release.yml
├── Dockerfile                  # 多阶段构建（node:24.12.0-alpine → ubuntu:22.04）
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## 常用命令

```bash
pnpm install        # 安装依赖；postinstall 会自动执行 patch-kugoumusicapi.js 补丁
pnpm dev            # 并行启动前端 Vite（5173）与后端 nodemon（3000）
pnpm build          # 各 workspace 构建（web: vue-tsc --noEmit && vite build）
pnpm build:nexe     # pnpm build + scripts/build.js（ncc + nexe，产出 dist/kugou-exporter-*）
pnpm build:nexe -- --linux-only   # 仅 Linux（Docker 构建用）
pnpm start          # node dist/index.js（需先 build:nexe 生成 dist）
pnpm lint           # eslint . --fix
pnpm prettier       # prettier --write apps/**/*.{vue,js,ts}
```

## 架构与核心数据流

### 服务端（apps/launcher）

启动流程（`index.js`）：取空闲端口（默认 3000）→ 初始化配置 → `kugoumusicapi.consturctServer()` 装配酷狗 API 路由 → 追加自定义路由：

- `GET /config/get`、`POST /config/save`：读写 `config.yaml`（保存 `serverUrl` 与 `cookies`）
- `GET /proxy/song/url?hash=&quality=`：`refreshLogin()`（1 小时内不重复刷新）→ `registerDev()`（获取 dfid）→ `kugoumusicapi.song_url()` → 301 重定向到 `urls[0]`；无链接返回 404
- `process.__nexe` 为真时（nexe 打包环境）通过 `setupStatic` 挂载 `web/dist` 静态资源

配置持久化（`config.js`）：路径为 `CONFIG_PATH` 环境变量或 `./config.yaml`，Docker 下为 `/app/data/config.yaml`。内容为 `serverUrl` + `cookies`（yaml 格式）。

登录态维护（`util.js`）：`refreshLogin` 通过 `login_token` 续期 cookie（1 小时节流）；`registerDev` 注册设备并把 `dfid` 写回配置。

### 前端（apps/web）

- 请求封装（`utils/request.ts`）：`baseURL` 开发环境为 `/api`（Vite 代理到 3000），生产为 `/`；`withCredentials: true`；响应拦截器剥离 `data` 层；301 或 `/user/detail` 失败跳登录页；`/login/cellphone`、`/user/detail` 不弹错误提示
- 路由守卫（`router/index.ts`）：非 `/login` 路由先请求 `/user/detail` 校验登录态，失败重定向 `/login`；`getCachedUserInfo()` 供页面读取用户信息
- 登录（`LoginView.vue`）：手机验证码（`/captcha/sent` → `/login/cellphone`，多账号时弹账号选择框传 `userid`）；扫码（`/login/qr/key` → `/login/qr/create` → 每 2 秒轮询 `/login/qr/check`，status 4 成功、0 过期）
- 歌单页（`PlaylistView.vue`）：`/user/playlist` 拉歌单列表（自动选中「我喜欢」）；`/playlist/track/all/new` 按 `pagesize=100` 分页拉全部歌曲，按 `fsort` 排序；「获取链接」打开 SongUrlDialog
- 导出（`ExportDialog.vue`）：XiaoMusic 格式为每个歌曲拼 `${serverUrl}/proxy/song/url?hash=${hash}&quality=${quality}` 生成 JSON（不请求后端）；原始 JSON 直接序列化歌曲数组；CSV 用 Blob 下载（歌名/歌手/专辑/时长）
- 单曲链接（`SongUrlDialog.vue`）：代理链接（拼 URL）、直接链接（`/song/url`，含主链接与备用链接）、XiaoMusic 单曲 JSON、原始 JSON 四类视图，均支持复制
- 主题切换（`ThemeToggle.vue` + `utils/theme.ts`）：浅色/深色主题，由 CSS 变量 (`--*`) 与 `html[data-theme]` 驱动，状态存入 localStorage
- 演示模式（`utils/mock.ts` + `request.ts` demo adapter）：无需登录即可预览/测试 UI；登录页「进入演示模式」按钮设置 `localStorage['kugou-demo']='1'`，演示请求由 mock 数据拦截
- 健壮性增强（`PlaylistView.vue`）：歌单统计（数量/总时长/歌手数）、歌单与歌曲双搜索、加载/空态/错误状态；`ExportDialog.vue` 含进度环与「导出历史」（localStorage）抽屉
- 导出工具（`utils/export.ts`、`utils/format.ts`、`utils/history.ts`）：统一的 JSON/CSV 生成、下载与历史记录

### 关键 API 端点

| 端点                                                   | 用途                                         |
| ------------------------------------------------------ | -------------------------------------------- |
| `/user/detail`                                         | 用户信息（登录态校验）                       |
| `/user/detail/vip`                                     | VIP 信息                                     |
| `/user/playlist`                                       | 用户歌单列表                                 |
| `/playlist/track/all/new`                              | 歌单歌曲（分页，`listid`/`page`/`pagesize`） |
| `/login/cellphone`、`/captcha/sent`                    | 手机验证码登录                               |
| `/login/qr/key`、`/login/qr/create`、`/login/qr/check` | 扫码登录                                     |
| `/song/url`                                            | 单曲直链（`hash` + `quality`）               |
| `/register/dev`                                        | 设备注册（获取 dfid）                        |
| `/config/get`、`/config/save`                          | 服务器配置（launcher 自定义）                |
| `/proxy/song/url`                                      | 代理播放链接（launcher 自定义）              |

## 重要约定与注意事项

1. **kugoumusicapi 补丁**：`postinstall` 会重写 `node_modules/kugoumusicapi/{main,server}.js` 与 `interface.d.ts`（把 module 目录下的 API 全部注册为路由并导出）。改动依赖版本或重新安装后必须重新执行补丁（`pnpm install` 会自动触发）。**不要**直接编辑 `node_modules` 中被打补丁的文件；如需修改逻辑，改 `scripts/patch-kugoumusicapi.js`。
2. **依赖为 git 依赖**：`kugoumusicapi` 以 `git://github.com/MakcRe/KuGouMusicApi#v1.5.1` 形式安装，`pnpm-lock.yaml` 会锁定其 commit。
3. **前端 API 前缀**：开发环境请求 `/api/*` 由 Vite 代理去 3000；生产环境由 launcher 同源提供。新增接口调用时保持该模式。
4. **音质取值**：`QualitySelect.vue` 定义了音质列表（如 `high`/`128`/`320`/`flac` 等），直接传给酷狗 API；代理链接 `quality` 参数默认 `high`。
5. **无需请求后端的导出**：XiaoMusic 导出与代理链接均为前端拼 URL 生成，不额外请求后端，因此导出很快；代理 URL 的可用性依赖服务器在线。
6. **cookie 为账号凭据**：`config.yaml` 中的 `cookies` 是登录态，提交代码、日志输出时不得泄露真实 cookie。
7. **`.gitignore`** 忽略 `dist/`（构建产物）与 `config.yaml`（默认路径），不要提交。
8. **版本信息**：前端通过 `import packageJson from '../../../../package.json'` 读取根版本号显示在页头，改版本走 semantic-release 流程而非手改（`package.json` 与 `CHANGELOG.md` 由 release 提交更新）。

## 代码风格与规范

- ESLint：`@antfu/eslint-config`，2 空格缩进、单引号、分号；`pnpm lint` 会自动修复
- Vue 组件：模板中使用 kebab-case（`<export-dialog>`）；`<template>`/`<script>`/`<style>` 块顺序固定；单文件组件使用 `<script setup lang="ts">`
- 组件通过 `defineExpose({ open })` 暴露打开对话框的方法，父组件用 `useTemplateRef` 引用
- Prettier：printWidth 120、`trailingComma: 'es5'`、LF 行尾（`.prettierrc.js`）
- 类型：酷狗 API 数据结构集中在 `apps/web/src/types/index.ts`，新增字段时同步补充类型
- 中文注释与 UI 文案是项目惯例，保持中文

## 构建、Docker 与发布

- **本地构建**：`pnpm build:nexe` → ncc 把 launcher 打包为 `dist/index.js`，nexe 产出 `dist/kugou-exporter-win-v<version>.exe` 与 `kugou-exporter-linux-v<version>`；nexe 预编译产物从 `Steven-Qiang/nexe_pre_builds` 远程仓库拉取，构建需联网
- **Docker**：多阶段构建，builder 用 `node:24.12.0-alpine` 执行 `pnpm build:nexe -- --linux-only`，运行镜像为 `ubuntu:22.04`，`CONFIG_PATH=/app/data/config.yaml`，暴露 3000 端口
- **CI/CD**（`.github/workflows/release.yml`）：push 到 `main` 触发；semantic-release 依据 conventional commits 生成版本/CHANGELOG/GitHub Release（附件为 `dist/*`）；随后 Docker Buildx 推送 `stevenxuq/kugou-exporter:latest` 与版本 tag（仅 `linux/amd64`）。发布流程在 CI 中完成，本地无需手动发布
- **提交规范**：遵循 conventional commits（`feat:` / `fix:` / `chore:` 等），触发版本发布

## 给 AI Agent 的工作提示

- 修改前先运行 `pnpm install` 确认补丁已应用，涉及 kugoumusicapi 的改动注意补丁会覆盖 `node_modules` 中对应文件
- 改动前端后建议本地 `pnpm dev` 验证（前端 5173、后端 3000 两个进程都要起）
- 提交前运行 `pnpm lint` 与 `pnpm prettier`，保持代码风格一致
- 不要提交 `dist/`、`config.yaml`、`node_modules/` 等被忽略的产物

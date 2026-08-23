# [2.0.0](https://github.com/Steven-Qiang/kugou-exporter/compare/v1.1.1...v2.0.0) (2026-08-23)


* feat!: v2 多用户与多酷狗账号重构 ([0b82c26](https://github.com/Steven-Qiang/kugou-exporter/commit/0b82c268a64e8e4685dcb17743c534dd27e48c71))
* Merge pull request [#3](https://github.com/Steven-Qiang/kugou-exporter/issues/3) from Steven-Qiang/feat/v2 ([bc24042](https://github.com/Steven-Qiang/kugou-exporter/commit/bc24042a56f14b184e60fd32dc5486548a9aa263))


### Features

* 代理链接按酷狗 userid 定位账号并移除登录要求，兼容旧数据库 ([3e96f7d](https://github.com/Steven-Qiang/kugou-exporter/commit/3e96f7d3789342f89c13b28db1018d6c296666c0))
* 导出改为服务端执行并新增音质记录与导出设置 ([ee11989](https://github.com/Steven-Qiang/kugou-exporter/commit/ee119898bbb025a0fce80780d9e93d454a018cc5))
* 支持多账号登录态管理、切换账号及导出历史按账号隔离 ([6dc27fc](https://github.com/Steven-Qiang/kugou-exporter/commit/6dc27fcb3e03ba944dcf1e110e95611ae826084e))
* 新增 CI 与 Vitest 测试，账号头像/VIP 展示，会话清理与权限校验，更新 README/Docker ([45f0499](https://github.com/Steven-Qiang/kugou-exporter/commit/45f04995b2b510c3257e60e9da85c96c9ecefbe2))
* 新增用户管理/改密/限流，优化演示模式与布局，加固多账号安全 ([7ffea28](https://github.com/Steven-Qiang/kugou-exporter/commit/7ffea28047cbe79a5e4cf5d59e306f38dd3da8fa))
* 精简引导/账号/设置页 UI，优化歌单加载与空态，新增数据重置脚本 ([9ffa206](https://github.com/Steven-Qiang/kugou-exporter/commit/9ffa206b67cd83e7e5e8319d0d31fc950955fc8e))
* 统一品牌文案并优化移动端歌单表格 ([c2ca38e](https://github.com/Steven-Qiang/kugou-exporter/commit/c2ca38eb898f93ed149617ce88ea6b374ba589f9))
* 重构前端 UI，新增深色主题、演示模式、导出历史并升级 kugoumusicapi 至 v1.6.0 ([e35119b](https://github.com/Steven-Qiang/kugou-exporter/commit/e35119ba6c0498bae4606e4388ce91ee48334101))
* 重构前端 UI，新增深色主题、演示模式及服务端导出历史 ([d159918](https://github.com/Steven-Qiang/kugou-exporter/commit/d1599188fd43e252e123a2597387483ca8d2ddea))
* 重构前端 UI，采用中性底色+靛蓝强调，移除渐变装饰并简化登录与账号列表 ([a858fe6](https://github.com/Steven-Qiang/kugou-exporter/commit/a858fe6ef6d988c671010db44c64e032b4b3b791))
* 重构前端 UI，采用石墨灰+柿子橙主题并优化链接弹窗 ([2a48f37](https://github.com/Steven-Qiang/kugou-exporter/commit/2a48f37e934438293957f870dc79bce1e1a9d37e))
* 重构启动器为 TS + SQLite，新增用户登录与酷狗账号管理 ([aefeffe](https://github.com/Steven-Qiang/kugou-exporter/commit/aefeffea36bdcafd0f560d814a2531b85c42cb66))


### BREAKING CHANGES

* 配置由 config.yaml 迁移到 SQLite（data/kugou.db）；鉴权/数据模型与全部接口变更，旧配置与旧单机流程不再兼容。
* 配置由 config.yaml 迁移到 SQLite（data/kugou.db）；鉴权/数据模型与全部接口变更，旧配置与旧单机流程不再兼容。

## [1.1.1](https://github.com/Steven-Qiang/kugou-exporter/compare/v1.1.0...v1.1.1) (2026-02-22)


### Bug Fixes

* 修复剪切板复制失败 ([8e1fb95](https://github.com/Steven-Qiang/kugou-exporter/commit/8e1fb95bdacc4580ab5b09639fc9c47101a3596d))

# [1.1.0](https://github.com/Steven-Qiang/kugou-exporter/compare/v1.0.0...v1.1.0) (2026-02-22)


### Features

* 使用服务器代理替代临时直链 ([189cff3](https://github.com/Steven-Qiang/kugou-exporter/commit/189cff379bbf5033d02d2f3b4325774595168e8d))
* 新增docker支持 ([5e35652](https://github.com/Steven-Qiang/kugou-exporter/commit/5e35652a82d6b4d7968f0da5b7a51d3195fa927f))

# 1.0.0 (2026-02-15)


### Bug Fixes

* release script ([5504a3e](https://github.com/Steven-Qiang/kugou-exporter/commit/5504a3e3090c3b885963f9ab9079540bfd4105b3))

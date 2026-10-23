# 固定版本工具依赖

`timecraker-workspace-docs-*.tgz` 是 workspace 文档工具的 npm 发布包，源码、测试与 doc-maintainer 技能正本在 workspace 的 `config/workspace-tools/`，本目录只保存可供独立 clone/CI 离线安装的固定版本依赖。

运行 `npm ci --ignore-scripts --no-audit --no-fund` 安装；scripts/docs.mjs 只调用该依赖。不要直接修改包或 node_modules。工具源码更新后按 workspace-tools README 的发布步骤升级版本和 package-lock.json；发布包不含技能副本、缓存或业务媒体。

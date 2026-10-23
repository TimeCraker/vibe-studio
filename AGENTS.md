# vibe-studio

中文交流。仓库结构与技能入口以 README.md、docs/product-map.md 为准；流程见 workflows/explainer-video.md。

- 正式开发先有 Stage Spec；本轮进度见 docs/2026-10-23-production-workflow-spec.md。
- 技能正本在 skills/；`node scripts/setup-skills.mjs` 维护本地发现链接，不复制另一份技能。
- 交付保留 recipe 与 archive.json，原始媒体和成片单独备份；验证归档前不清场。
- 人工配音、分镜/视觉终审、登录、点击发布保留人工状态；技术通过不能写成人工通过。
- 官方 Remotion skill 是技术参考。本仓模板锁定的渲染版本、项目边界和发布约束优先，不自动升级依赖或重建已有项目。
- 检查：`npm test`、`python scripts/check-docs.py`、`git diff --check`；采集修改另跑 `node tests/browser-capture.mjs`。界面/视频修改须实际渲染取证。
- 保留其他人的改动；提交仅包含当前实现单元。临时依赖和验证产物放仓库外或 .cache，不提交账号状态、缓存与大媒体。

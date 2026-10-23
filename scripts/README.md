# scripts/ 通用工具

| 入口 | 用途 |
|---|---|
| `studio.mjs` | 初始化、环境诊断、契约校验、步骤执行/续跑、QC、平台派生、复盘、归档与恢复 |
| `setup-skills.mjs` | 动态扫描技能并建立项目本地发现链接；--dry 只列计划 |
| `install-upstream-skills.py` | 固定提交的 Remotion 官方参考安装与缓存完整性检查 |
| `check-docs.py` | 入口、技能、组件、依赖版本、源码归档与引用检查 |
| `make_music.py` | 读取项目 edit/sections.json，生成 lofi/seabreeze 配乐 |
| `audio_report.py` | 配乐波形、频谱和节拍检查；不代替 LUFS 测量 |
| `contact_sheet.py` | 已有帧目录的抽帧拼图 |
| `probe_frame.py` | 单帧背景与文字对比度数值探针 |

常用命令与数据接线以 README.md 和对应 skill 为准。scripts/lib 是 CLI 内部模块，不新增业务服务。

项目生成脚本保留在 products/ 对应目录：DDD 在 products/ddd-architecture，产品全景在 products/asterforge-landscape，工作台介绍在 products/vibe-studio-deck，乐考底稿在 products/lekao-intro。历史视频源码在对应 recipe；恢复到施工区后按历史 README 复核原始输入，不直接在归档中运行。

# scripts/ — 系统级工作台独立小工具

> 本目录仅保留**跨项目通用、独立可复跑**的系统级小工具。
> 铁律：**项目专属的一次性生成与构建脚本，一律归位到对应 `products/<项目>/` 或 `projects/<项目>/scripts/` 内部**，严禁堆放在本目录制造悬空资产。

## 通用工具索引

| 脚本 | 类别 | 功能 | 复跑命令 | 被谁引用 |
|---|---|---|---|---|
| `check-docs.py` | 质检 | 元文档漂移与契约自检（退出码 1 = 有漂移） | `python scripts/check-docs.py` | [`CLAUDE.md`](../CLAUDE.md)、各 spec |
| `make_music.py` | 音频 | 程序化配乐 `music.wav`（numpy，`--style lofi\|seabreeze` 双风格） | `python scripts/make_music.py --project <项目> --style seabreeze` | [`skills/web-capture/SKILL.md`](../skills/web-capture/SKILL.md) |
| `audio_report.py` | 音频 | 音频核查图（波形 + 频谱）+ 节奏对网格检查 | `python scripts/audio_report.py --project <项目> --style seabreeze` | [`skills/web-capture/SKILL.md`](../skills/web-capture/SKILL.md) |
| `contact_sheet.py` | 图像 | 抽帧联络表 PNG 生成（审图用） | `python scripts/contact_sheet.py --dir <帧目录> --out <图>` | [`skills/web-capture/SKILL.md`](../skills/web-capture/SKILL.md) |
| `probe_frame.py` | 图像 | 单帧数值探针：背景色带/矩形边、文字对比度 | `python scripts/probe_frame.py <帧.png> [更多帧]` | [`skills/web-capture/SKILL.md`](../skills/web-capture/SKILL.md) |

---

## 项目专属生成脚本去向归档（2026-10-05 治理）

- **DDD 全景幻灯片**：由 `products/ddd-architecture/gen-ddd-44slides-deck.py` 和 `render-ddd-assets.py` 驱动；
- **AsterForge 全景幻灯片**：由 `products/asterforge-landscape/gen-asterforge-landscape.py` 驱动；
- **vibe-studio 介绍幻灯片**：由 `products/vibe-studio-deck/gen-vibe-studio-deck.py` 驱动；
- **乐考宣讲幻灯片**：由 `products/lekao-intro/gen-lekao-deck.py` 驱动；
- **HTML 简历多版本生成器**：已迁移至 `projects/resume-generator/` 独立工程。
- **历史孤儿/冲突脚本**（`gen-ddd-deck.py` 旧版、`scripts/gen-lekao-deck.py` 旧版）已彻底清理删除。

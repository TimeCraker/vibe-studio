# scripts/ — 一次性生成脚本与独立小工具

> 本目录的定位见 [`README.md`](../README.md) 的「结构」节。这里只做一件事：**让「哪个脚本产出哪个产物、怎么复跑」可以反查**。
> 新增脚本请同时在本表登记一行；改产物路径时同步改这里。

## 索引

| 脚本 | 产出 | 复跑 | 被谁引用 |
|---|---|---|---|
| `check-docs.py` | 无产物，元文档漂移检查（退出码 1 = 有漂移） | `python scripts/check-docs.py` | [`CLAUDE.md`](../CLAUDE.md)、两份 spec |
| `gen-asterforge-landscape.py` | AsterForge 产品全景 deck（19 页） | `python scripts/gen-asterforge-landscape.py` | **0 处**，见下「孤儿」 |
| `gen-ddd-44slides-deck.py` | `ddd-architecture-deck.pptx`（44 页，配 `render-ddd-assets.py`） | `python scripts/gen-ddd-44slides-deck.py` | [`products/ddd-architecture/README.md`](../products/ddd-architecture/README.md) |
| `render-ddd-assets.py` | DDD deck 的 7 幅架构/时序导图 + 10 幅代码卡片 | `python scripts/render-ddd-assets.py` | [`products/ddd-architecture/README.md`](../products/ddd-architecture/README.md) |
| `gen-ddd-deck.py` | `ddd-architecture-deck.pptx`（早期版本，同上文件名） | `python scripts/gen-ddd-deck.py` | **0 处**，见下「孤儿」 |
| `gen-vibe-studio-deck.py` | vibe-studio 项目介绍 deck（10 页，forest 主题） | `python scripts/gen-vibe-studio-deck.py` | **0 处**，见下「孤儿」 |
| `gen-lekao-deck.py` | `lekao-deck.pptx`（11 页） | `python scripts/gen-lekao-deck.py` | 见下「同名分叉」 |

## 三个 0 引用脚本（待清理，未删）

`gen-asterforge-landscape.py`、`gen-ddd-deck.py`、`gen-vibe-studio-deck.py` 在任何 `.md` 里都查不到引用。

- `gen-ddd-deck.py` 是 `gen-ddd-44slides-deck.py` 的早期版本，两者写同一个输出文件名 `ddd-architecture-deck.pptx`。留哪个都很危险：跑错一个就覆盖另一个的产物。
- 另两个各自产出一份 deck，产物目录在 `products/` 下仍有对应文件夹，但没有文档说明它们是这个脚本产出的。

**处理建议**（需要用户确认后再动）：确认产物不再需要就删脚本；仍需要就在对应 `products/<项目>/README.md` 里补上「由 `scripts/<脚本>` 生成」，让引用链补全。

## 同名分叉：`gen-lekao-deck.py` 有两份

| 位置 | 行数 | 说明 |
|---|---|---|
| `scripts/gen-lekao-deck.py` | 191 | 早期版本。中文 docstring，素材取自 lekao 仓库 README/BRD/CHANGELOG + 线上实截（2026-08-28） |
| `products/lekao-intro/gen-lekao-deck.py` | 235 | 现行版本。英文 docstring，只取 `lekao/README.md`，并额外产出 narration 的 `script.json` |

文档里的引用（[`products/lekao-intro/README.md`](../products/lekao-intro/README.md)、[`projects/lekao-intro/brief.md`](../projects/lekao-intro/brief.md)）指向的是 `products/` 那份。`scripts/` 这份是孤儿。

两份内容不同（非副本），所以**不能**简单删一边：先确认 `scripts/` 那份是否还有独有的页面或数据，再决定删除或改名为 `gen-lekao-deck-v1.py` 明确降级。

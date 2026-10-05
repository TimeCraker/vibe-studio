---
name: publish
description: 发布辅助工具，不是成片入口。把已经做好的成片按平台要求填进投稿表单（B 站 / 抖音 / 小红书三端），人机分工是硬约束：你登录、你点发布，脚本只填表。用户说「发 B 站 / 发抖音 / 发小红书 / 投稿 / 帮我填投稿信息 / 自动发布」时使用。片子还没做走 workflows/explainer-video.md。
user-invocable: true
---

# publish — 投稿表单填写助手

**这个 skill 只解决一件事：让人不用手抄标题、简介、标签、分区、封面。**
内容生产不在这里（走 `workflows/explainer-video.md`），文案也不在这里（走 `narration` / `humanizer`）。

## 人机分工（硬约束，不许绕）

| 环节 | 谁做 | 为什么 |
|---|---|---|
| 登录（扫码） | **人** | 脚本不读、不存、不索要任何密码或 cookie；登录发生在一个独立 profile 里，由人扫码完成 |
| 上传视频文件 | 脚本 | 纯机械操作，无凭据参与 |
| 填标题 / 简介 / 标签 / 分区 / 创作声明 / 封面 | 脚本 | 本来就是在抄一份已经写好的文档 |
| **点「立即投稿」** | **人** | 不可逆的公开动作；且自动化操作投稿页可能触发平台风控，这个风险必须由人知情后承担 |

脚本**不提供**发布命令，这是设计而不是没做完。要做全自动，先让人明确接受账号风控风险。

## 依赖

本机 Chrome + Node 18 以上（内置 `fetch` / `WebSocket`）。
基础层（`bili.mjs` / `douyin.mjs` / `xhs.mjs` / `run.mjs`）**不装任何 npm 包**：
自带极简 CDP 客户端，直接驱动一个**可见的** Chrome 窗口。
Playwright 填表层（`pw/` 脚本族，见「坑」2026-10-03 条）依赖由 `templates/package.json`
托管（`connectOverCDP` 附着已开的窗口，不需要下载 playwright 浏览器）。
克隆或换机后第一次用，先装一次：

```bash
cd skills/publish/templates && npm install
```

## 快速上手

**多平台一起发，用 `run.mjs`（推荐入口）**：

```bash
# 1. 每个平台各开一个窗口，你自己扫码（各自独立 profile，互不干扰）
node skills/publish/templates/bili.mjs launch
node skills/publish/templates/douyin.mjs launch

# 2. 一条命令并行填所有平台的表（先 --dry 核对步骤）
node skills/publish/templates/run.mjs --project projects/<项目名> --dry
node skills/publish/templates/run.mjs --project projects/<项目名>

# 3. 每个平台各自的窗口里，你自己点「发布」
```

清单写在 `projects/<项目名>/publish-plan.json`：`video` / `cover` / `platforms`，
每个平台一块（spec 路径、声明、分区、话题等）。结构见 `skills/publish/templates/publish-plan.example.json` 或 `run.mjs` 开头注释。

**单平台手动跑**（调试或只发一家）：

```bash
# B 站
node skills/publish/templates/bili.mjs launch                     # 扫码
node skills/publish/templates/bili.mjs setup --project projects/<项目名> \
  --path products/<项目名>/<成片>.mp4 --image products/<项目名>/<封面>.png \
  --spec projects/<项目名>/form.json \
  --declare 含AI生成内容 --category 人工智能
node skills/publish/templates/bili.mjs check                      # 自检，然后你点「立即投稿」

# 抖音
node skills/publish/templates/douyin.mjs launch                   # 扫码
node skills/publish/templates/douyin.mjs setup --project projects/<项目名> \
  --video products/<项目名>/<成片>.mp4 --image products/<项目名>/<封面>.png \
  --spec projects/<项目名>/douyin-form.json --names AI,Gemini,人工智能

# 小红书
node skills/publish/templates/xhs.mjs launch                      # 扫码（登录卡右上角切二维码）
node skills/publish/templates/xhs.mjs setup --project projects/<项目名> \
  --video products/<项目名>/<成片>.mp4 \
  --spec projects/<项目名>/xhs-form.json --names 鹈鹕,动画制作
# （封面走 AI 推荐封面的「应用」，见下文平台三）
```

`setup` 是幂等的：已上传的视频会跳过、简介写之前先清空，所以重复跑不会叠加。

`form.json` 结构见 `skills/publish/templates/form.example.json`：`title` / `tags[]` / `description[]`。
**description 一行就是一个段落，不要写空字符串**，Quill 会把空行变成多余的空段落。

## 为什么能并行

每个平台工具**自带独立的 Chrome profile 和调试端口**（B 站 = 9222，抖音 = 9223，小红书 = 9224），
是几个互不相干的浏览器实例，所以可以同时开、同时填、同时上传。
`run.mjs` 就是把「每个平台 spawn 一个 `setup` 进程」包起来，输出按 `[平台名]` 加前缀，
最后给一张就绪汇总表。

**并行只到填表为止。** 发布是每个平台各点一次的人工动作：
不可逆，且多平台风控政策不同，这一步永远留在人手里。
「三端自动发布」的准确含义是：**三端的表单填写自动化，三端的发布按钮各自由人点**。

## Step 1 · 每个平台一份文案文件

**标准流程是三端**（B 站 / 抖音 / 小红书），所以一个项目要写三份文案文件：

| 平台 | spec 文件 | 标题上限 | 正文上限 | 标签/话题 |
|---|---|---|---|---|
| B 站 | `form.json` | 80 字 | 2000 字 | 10 个，单个 ≤20 字 |
| 抖音 | `douyin-form.json` | 30 字（超出被截） | 1000 字（含话题） | 话题走联想弹层 |
| 小红书 | `xhs-form.json` | 20 字 | 1000 字 | 话题走 `#` 话题按钮的情境联想 |

模板在 `skills/publish/templates/`（`form.example.json` / `douyin-form.example.json` / `xhs-form.example.json`），
复制到 `projects/<项目名>/` 改内容。

标题、简介、标签先落到文件里，不要在命令行上手打。理由：命令行参数过 GBK 控制台容易乱码，
而 `form.json` 是 UTF-8 文件，还能进版本库、能 diff、能复查。

写之前先对表（平台硬限制，以投稿页实测为准）：

| 字段 | B 站 | 抖音 |
|---|---|---|
| 标题 | 80 字 | 30 字（超出被截） |
| 简介 | 2000 字 | 1000 字（含话题） |
| 标签 | 10 个，单个 ≤20 字 | 话题走联想弹层，无硬性个数 |
| 分区 / 创作声明 / 封面 | 分区+声明+封面必填 | 封面建议横 4:3 + 竖 3:4 各一张；声明单选 |

## 平台二：抖音（douyin.mjs）

```bash
# 独立 profile 与端口（9223），和 B 站窗口互不干扰
node skills/publish/templates/douyin.mjs launch          # 你扫码登录抖音
node skills/publish/templates/douyin.mjs goto --url 'https://creator.douyin.com/creator-micro/content/upload'
node skills/publish/templates/douyin.mjs file --selector 'input[type=file]' --path <成片>.mp4
node skills/publish/templates/douyin.mjs fill --spec projects/<项目名>/douyin-form.json
node skills/publish/templates/douyin.mjs hashtags --names AI,Gemini,人工智能
node skills/publish/templates/douyin.mjs shot --out qa/dy/form.png
```

**画幅**：抖音上传页明说建议 16:9 / 9:16 / 3:4 / 4:3，且「超过 40 秒的视频建议上传横版视频」。
**超过 40 秒的横版内容不需要重渲成竖版**，这和 B 站那条「中心安全」要求是两回事。

**抖音特有的坑**：

- **简介编辑器是字节自研 editor-kit**，对它做富文本操作有两条铁律：
  只 `focus()`，**不要用 Range API 强设光标**。编辑器维护自己的选区，外部强设之后内部不同步，
  后续插入会落错位置还会成倍重复（实测 7 行写出 18 行）。
  清空用 **Ctrl+A + Backspace 真实按键**：`document.execCommand` 在它上面选区建了但删不掉。
- **话题必须走联想弹层**：输入 `#名字` 等弹出 `.mention-suggest-mount-dom`，点第一项才会生成
  真正的话题节点（`data-mention`，蓝底）。直接打字进去的 `#xxx` 是纯文本，不算话题、不进搜索。
  联想不到就把打出去的删掉，别留假话题（`hashtags` 命令已带此兜底）。
- **弹层点完会重渲染**，点之前要重新取元素坐标，别用上一次缓存的坐标（踩过）。
- **封面要两张**：横 4:3 + 竖 3:4，只设横的会有「竖封面缺失」提醒。上传的图按中心裁切，
  所以中心安全构图在这里同样吃香。
- **自主声明**选项与 B 站近似：内容由AI生成 / 个人观点或见解 / 转载信息 / 营销推广 /
  虚构演绎 / 无需添加。AI 生成内容选「内容由AI生成」。
- 提交按钮是 Semi Design 的 `button.semi-button`，按 `innerText` 找时页面上可能有同名元素，
  先打 data 标记再点。

## Step 2 · 封面必须做「中心安全」构图

**B 站首页推荐按 4:3 裁、个人空间按 16:9 裁，两者都是取画面中心。**
所以封面即使导出 16:9，关键内容（标题、主体、结论）也必须落在**中心 1440×1080（即 x 240 到 x 1680）之内**，
否则 4:3 那一刀会直接切掉标题。

自查方法（不用上传就能验）：把封面从中心裁 1440×1080 看一眼。

```python
from PIL import Image
im = Image.open("cover.png"); w, h = im.size
cw = int(h * 4 / 3)
im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h)).save("cover-43-check.png")
```

## 平台三：小红书（xhs.mjs）

```bash
# 独立 profile 与端口（9224）；登录页默认短信验证码，点登录卡右上角二维码角标切 App 扫码
node skills/publish/templates/xhs.mjs launch
node skills/publish/templates/xhs.mjs goto --url 'https://creator.xiaohongshu.com/publish/publish?source=official'
node skills/publish/templates/xhs.mjs file --selector 'input[type=file]' --path <成片>.mp4
node skills/publish/templates/xhs.mjs fill    --project projects/<项目名>      # 读 xhs-form.json
node skills/publish/templates/xhs.mjs topics  --project projects/<项目名> --names 鹈鹕,动画制作
```

**字段硬限制**（页面实测）：标题 20 字；正文 1000 字。视频 ≤4 小时 / 20GB，推荐 mp4/mov。

**小红书特有的坑**：

- **正文编辑器是 TipTap（ProseMirror 系）**，规矩与抖音 editor-kit 相同：
  只 `focus()` 不碰选区，清空用 Ctrl+A + Backspace 真实按键。
- **`clear` 命令是「全清」**：Ctrl+A 选中整个编辑器，Backspace 全删。
  想删几个字符就发几次 Backspace，别拿它当删除键用（实测把整篇清掉了）。
- **推荐话题条会消失**：上传后页面给出的 AI 推荐话题 chips，一旦编辑过正文就没了。
  要加话题只能走 `#` 话题按钮 → 情境联想，而联想是**按视频内容给的有限集合**，
  不是全量话题搜索——想要的话题联想不到就自动删掉 `#`，不硬凑。
- **原创声明是「开关 + 二段确认」**：先拨开关 → 弹权益确认框 → 勾「我已阅读并同意」→
  点「声明原创」→ 然后才会解锁「添加内容类型声明」下拉（选「笔记含AI合成内容」）。
  那个同意复选框是 0 高的隐藏 input，只能按坐标点（`clickxy` 命令）。
- **封面**：默认取第一帧，「智能推荐封面」会给几张候选（按视频内容生成），点「应用」即可，
  平台还会自动做封面质量评估。

## 坑（B 站实测；通用经验见上文两节）

- **（2026-10-03）Playwright 混合管线已三端全链路实测**：本 skill 的 launch/cover/check 照用，
  上传与填表换 Playwright（connectOverCDP 附着同一窗口），能消掉下面大半条目
  （filechooser 事件接上传、locator 自动等待、声明弹窗重跑验证）。
  经 pelican-ride 项目实测验证（含每步截图与「声明弹窗吞点击」的定点修复）。
  playwright 依赖已正经化：`templates/package.json` 托管（pin 1.63.0，换机先 `npm install`，
  见「依赖」节）；pw 脚本本体现存 git 历史（pelican-ride 清场前快照，commit 7277880），
  收录时把 `pw/util.js` 里 `loadPlaywright` 的 hsr 硬路径退役，改直连 `require('playwright')`。
- **`el.click()` 开不了文件选择框**：synthetic click 不算用户手势。必须
  `Page.setInterceptFileChooserDialog` + 真实 `Input.dispatchMouseEvent`，再从
  `Page.fileChooserOpened` 拿 `backendNodeId` 去 `DOM.setFileInputFiles`。脚本已封装成 `pickfile`。
- **真正的视频 input 是隐藏的那个**：页面上可见的是 micro-app 里那个（`#b-uploader-input-container_BUploader_0_*`），
  但文件选择框实际落到隐藏的 `bcc-upload` input 上。别照着「可见的那个」去设文件，它读回是 0。
- **下拉框在两次进程调用之间会自己关**：所以「展开 + 选项点击」必须在同一进程内完成
  （`cascade` 命令就是这么写的）。
- **不要再点一次已展开的触发器**：会把它关掉。`pick` 已做成幂等（先看选项在不在，不在才点触发器）。
- **无意义的 `scrollIntoView` 会把已打开的下拉框滚关**：`realClick` 只在该元素真的不在视口时才滚。
- **分区一级项要对「外层行」发 DOM click**：对内部 `span` 发坐标点击不生效（实测点了没反应）。
  `cascade` 已按这个来。
- **上传完成后有个「知道了」弹窗挡住表单**，`video` 命令会处理；若没出现也不会卡住。
- **投稿页是重 SPA、控件会改版**：所以留了一组逃生口命令（`inspect` / `popup` / `eval` / `taps`），
  页面变了先用它们现场看清楚真实 DOM，再回来改脚本，不要凭记忆改选择器。

## Step 3 · 交付与留痕

- 表单内容放项目里（`projects/<项目名>/form.json`），**不要**塞进 skill；skill 只放流程与脚本。
- 发布后把平台侧的限制变化、新踩的坑补进本文件「坑」一节。
- 平台若有「AI 生成内容」声明项，按实际内容诚实标注。

## 边界与不做

- **不做全自动发布**（见上「人机分工」）；不碰账号密码、cookie、二次验证。
- 已接入三平台：B 站 / 抖音 / 小红书（`bili.mjs` / `douyin.mjs` / `xhs.mjs` 各自独立文件）。
  加新平台照旧模式：在 `templates/` 下新增 `<platform>.mjs`，复用同一套「可见窗口 + 人登录 + 脚本填表」契约，
  **不要**在同一个文件里塞两个平台的分支。
- 不做封面设计（那是成片线的产物），只负责把已做好的封面传上去。
- 不做定时发布、合集、商业推广这些可选项；需要时用逃生口命令临时补，别写进默认流程。

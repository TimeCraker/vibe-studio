---
name: publish
description: 发布辅助工具，不是成片入口。把已经做好的成片按平台要求填进投稿表单（目前只有 B 站），人机分工是硬约束：你登录、你点发布，脚本只填表。用户说「发 B 站 / 投稿 / 帮我填投稿信息 / 自动发布」时使用。片子还没做走 workflows/explainer-video.md。
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

本机 Chrome + Node 18 以上（内置 `fetch` / `WebSocket`）。**不装任何 npm 包**，也不是 Playwright ——
`templates/bili.mjs` 自带一个极简 CDP 客户端，直接驱动一个**可见的** Chrome 窗口。

## 快速上手

```bash
# 1. 开窗口，然后你自己扫码登录（登录态留在 ~/.bili-upload-profile，下次不用重扫）
node skills/publish/templates/bili.mjs launch

# 2. 上传视频（自动开投稿页、处理「上传完成」弹窗、等上传结束）
node skills/publish/templates/bili.mjs video --path products/<项目名>/<成片>.mp4

# 3. 填表。三个必填项有专用命令，其余走 --spec
node skills/publish/templates/bili.mjs declare  --option 含AI生成内容
node skills/publish/templates/bili.mjs category --name 人工智能
node skills/publish/templates/bili.mjs fill     --spec projects/<项目名>/form.json
node skills/publish/templates/bili.mjs cover    --image products/<项目名>/<封面>.png

# 4. 自检：必填项齐不齐、有没有页面报错
node skills/publish/templates/bili.mjs check

# 5. 你自己在窗口里点「立即投稿」
```

`form.json` 结构见 `skills/publish/templates/form.example.json`：`title` / `tags[]` / `description[]`。
**description 一行就是一个段落，不要写空字符串** —— Quill 会把空行变成多余的空段落。

## Step 1 · 先把文案写进 form.json

标题、简介、标签先落到文件里，不要在命令行上手打。理由：命令行参数过 GBK 控制台容易乱码，
而 `form.json` 是 UTF-8 文件，还能进版本库、能 diff、能复查。

写之前先对表（平台硬限制，超了 `check` 会报）：

| 字段 | B 站上限 |
|---|---|
| 标题 | 80 字 |
| 简介 | 2000 字 |
| 标签 | 10 个，单个 ≤20 字 |
| 分区 / 创作声明 / 封面 | **必填** |

## Step 2 · 封面必须做「中心安全」构图

**B 站首页推荐按 4:3 裁、个人空间按 16:9 裁，两者都是取画面中心。**
所以封面即使导出 16:9，关键内容（标题、主体、结论）也必须落在**中心 1440×1080（即 x 240–1680）之内**，
否则 4:3 那一刀会直接切掉标题。

自查方法（不用上传就能验）：把封面从中心裁 1440×1080 看一眼。

```python
from PIL import Image
im = Image.open("cover.png"); w, h = im.size
cw = int(h * 4 / 3)
im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h)).save("cover-43-check.png")
```

## 坑（都是实测踩出来的，照做即可）

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
- 目前只有 B 站。加第二个平台的做法：在 `templates/` 下新增 `<platform>.mjs`，
  复用同一套「可见窗口 + 人登录 + 脚本填表」契约，**不要**在同一个文件里塞两个平台的分支。
- 不做封面设计（那是成片线的产物），只负责把已做好的封面传上去。
- 不做定时发布、合集、商业推广这些可选项；需要时用逃生口命令临时补，别写进默认流程。

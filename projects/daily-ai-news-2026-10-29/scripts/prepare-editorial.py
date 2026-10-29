"""Freeze this edition's checked facts and recording-first editorial inputs."""
from datetime import datetime, timezone, timedelta
from hashlib import sha256
from pathlib import Path
import gzip
import json
import re

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")

def read(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))

def write(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

records = read("evidence/retrieval.json")
# Correct the early extension detection while keeping the exact downloaded bytes.
ranking_record = next(x for x in records if x["id"] == "ranking-upstream")
ranking_record["file"] = "evidence/ranking-upstream.json"
for record in records:
    if record.get("id") == "bilibili-entry":
        target = ROOT / record["file"]
        raw = target.read_bytes()
        if raw.startswith(b"\x1f\x8b"):
            decoded = gzip.decompress(raw)
            target.write_bytes(decoded)
            record.update(wireBytes=len(raw), bytes=len(decoded), sha256=sha256(decoded).hexdigest(), transportEncoding="gzip-decoded")
for key, name, url in [
    ("mcode-readme-connector", "evidence/mcode-readme.md", "https://github.com/MiniMax-AI/mcode-stack/blob/main/README.md"),
    ("mcode-tree-connector", "evidence/mcode-tree.json", "https://api.github.com/repos/MiniMax-AI/mcode-stack/git/trees/main?recursive=1"),
    ("mcode-notice-connector", "evidence/mcode-notice.md", "https://github.com/MiniMax-AI/mcode-stack/blob/main/stacks/ronny/NOTICE.md"),
]:
    raw = (ROOT / name).read_bytes()
    records = [x for x in records if x["id"] != key]
    records.append({"id": key, "file": name, "url": url, "checkedDate": "2026-10-29", "recordedAt": NOW, "bytes": len(raw), "sha256": sha256(raw).hexdigest(), "status": "retrieved", "method": "connected GitHub read-only tool; direct HTTP failure retained separately"})
write("evidence/retrieval.json", records)

raw = read("evidence/ranking-upstream.json")
vendor = {x["id"]: x for x in raw["vendors"]}
models = sorted((m for m in raw["models"] if isinstance(m["benchmarks"].get("eci"), (float, int)) and not m.get("retiredAt")), key=lambda m: -m["benchmarks"]["eci"])
icons = {"anthropic": "claude.png", "openai": "openai.svg", "google": "google.png", "meta": "meta.svg", "moonshotai": "kimi.png", "alibaba": "qwen.png", "zhipuai": "glm.svg", "deepseek": "deepseek.ico"}
expected_global = ["anthropic/claude-opus-5-5", "openai/gpt-6-astra", "openai/gpt-6.1-sol", "anthropic/claude-fable-5-1", "google/gemini-4-argon", "anthropic/claude-sonnet-5-5", "anthropic/claude-opus-5", "openai/gpt-6-sol", "anthropic/claude-fable-5", "openai/gpt-5.5-pro", "openai/gpt-5.6-sol", "meta/muse-wonder", "meta/muse-wonder-1.0", "openai/gpt-5.6-terra", "openai/gpt-5.5"]
expected_domestic = ["moonshotai/kimi-k3", "alibaba/qwen3.8-max", "alibaba/qwen3.8-max-preview", "zhipuai/glm-5.3", "deepseek/deepseek-v4.1-flash", "deepseek/deepseek-v4.1-flash-1017", "deepseek/deepseek-v4-pro-0813", "alibaba/qwen3.8-max-0902", "deepseek/deepseek-v4-flash-0731", "alibaba/qwen3.7-max", "zhipuai/glm-5.3-flash", "zhipuai/glm-5.2", "alibaba/qwen3.8-27b", "moonshotai/kimi-k2.6", "moonshotai/kimi-k2.7-code"]
global_models = models[:15]
domestic_models = [m for m in models if vendor.get(m["vendorId"], {}).get("continent") == "east"][:15]
assert [m["id"] for m in global_models] == expected_global, "New upstream order differs from browser evidence; recheck before use"
assert [m["id"] for m in domestic_models] == expected_domestic, "Domestic ranking differs from browser evidence"

def rows(items):
    return [{"id": m["id"], "name": m["name"], "eci": m["benchmarks"]["eci"], "vendorId": m["vendorId"], "icon": "assets/" + icons[m["vendorId"]]} for m in items]

write("ranking.json", {"editionDate": "2026-10-29", "metric": "ECI", "queriedAt": ranking_record["queriedAt"], "sourceGeneratedAt": raw["generatedAt"], "entryUrl": "https://www.bilibili.com/toy/ai-model-world", "discoveredEmbedUrl": "https://bilibilitoy.com/toy/ai-model-world/34090174887936-v34855/leaderboard/index.html", "sourceUrl": ranking_record["url"], "rawSnapshot": ranking_record["file"], "rawSha256": ranking_record["sha256"], "browserEvidence": "evidence/browser-observations.md", "sourceNote": "当次浏览器分别切换全部/国内并核对前15。网页头部更新提示10月28日；精确数值来自本次取得的10月29日开源快照。前15模型ID和顺序一致；保留不同版本，不按显示小数合并或排序。", "attribution": "ECI data: Epoch AI (CC BY 4.0); aggregation: liyupi/ai-model-world. Attribution is retained in the publication description and source records.", "global": rows(global_models), "domestic": rows(domestic_models)})

write("selection.json", {
    "editionDate": "2026-10-29", "decision": "produce",
    "independentSearch": [
        {"phase": "before-document", "checkedAt": NOW, "queries": ["AI model release October 29 2026 official", "AI 新模型 发布 2026年10月29日", "Anthropic October 2026 announcements", "Google October 29 2026 AI", "Qwen latest model", "DeepSeek releases"], "sources": ["https://www.anthropic.com/news", "https://blog.google/technology/ai/", "https://qwen.ai/blog?id=qwen3.8", "https://www.deepseek.com/en/transparency/"], "result": "先独立搜了模型/产品/工具新闻并查官方更新页；没有将旧旗舰介绍或企业IPO自动选为头条。Google部分内容动态加载，本轮没有据此声称搜尽当日资讯。"},
        {"phase": "follow-up-primary-source", "checkedAt": NOW, "sources": ["https://expo.dev/blog/introducing-expo-agent-cli", "https://arxiv.org/abs/2610.34817v2"], "result": "Expo 10-27的真实新增是面向agent的实验性CLI，替换文档里技能库今日首发的说法；论文核对原始题名/样本/结果。"}
    ],
    "documentSupplement": [{"url": "https://feishu.doubao.com/docx/UpQJdqCvSopLVxxkU3acFLO0nuh", "checkedAt": NOW, "method": "browser-visible document, not web search excerpt", "candidates": ["Clover", "MCode Stack", "fast-agent", "Expo skills", "REA", "hallmark", "TKE", "Moore Threads quarterly report", "Hui Xi IPO", "security advisories", "CacheLint", "LoyalAgent-Bench", "recruitment"], "notes": "只作线索；重复Expo合并，原文未给的模型权重计划不照搬。"}],
    "selected": [
        {"id": "clover", "tier": "lead", "title": "扩散智能开源 Clover，展示 AI 编程和工具使用", "sources": ["https://diffuspace.ai/blog/clover-35b/", "https://huggingface.co/Diffuspace/Clover-35B-A3B-Preview"], "reason": "有实际模型权重、清楚的技术差异和相关官方演示，符合模型头条定位。博客未明确可读发布日期，HF仓库创建10-24不等于正式公告日，口播用近期公开，不声称10-29首发。"},
        {"id": "mcode", "tier": "secondary", "title": "MiniMax 开源 AI 编程的工程技能库", "sources": ["https://github.com/MiniMax-AI/mcode-stack"], "reason": "官方实际文件可取得，任务拆解、上下文、交接、审查用途明确；本次树快照有17项stacks内技能。不把此仓误写成模型权重发布或所有改编技能统一MIT。"},
        {"id": "expo", "tier": "secondary", "title": "Expo 新工具帮助 AI 检查并运行手机应用", "eventDate": "2026-10-27", "sources": ["https://expo.dev/blog/introducing-expo-agent-cli"], "reason": "主动跟进找到了官方近期具体更新，替代缺少日期核实的技能库消息；说明实验状态，不做本机执行成功承诺。"},
        {"id": "cachelint", "tier": "brief", "title": "新研究检查 AI 提示词缓存失效和用量误记", "eventDate": "2026-10-26", "updatedAt": "2026-10-27", "sources": ["https://arxiv.org/abs/2610.34817v2"], "reason": "有明确案例、原论文和结果，能用白话解释成本影响；不照抄百万美元损失营销数字。"}
    ],
    "rejected": [
        {"items": ["Expo skills release repeated in two sections"], "reason": "原有技能库早在7月官方材料中已有，不能包装成10-29新开源；合并并换成10-27真实CLI更新。"},
        {"items": ["fast-agent MCP directory entry", "REA four-day trending", "hallmark/DeepTutor/cindy popularity"], "reason": "目录上架和星数增加本身不是这期所需的实质功能变化；不再花篇幅重复项目介绍。不声称已逐项核实文档的星数。"},
        {"items": ["TKE maintenance", "security advisories", "LoyalAgent-Bench"], "reason": "本期主题与大众用途优先；相关候选不比已入选项目更适合本片，未完成原始通报/论文核查的数字不进入稿件。"},
        {"items": ["Moore Threads quarterly report", "Hui Xi IPO", "campus recruitment", "Anthropic IPO"], "reason": "偏财报、资本或招聘，与本期模型/实用工具重点关联较弱，不为凑栏目塞入。未据文档数字作事实性播报。"},
        {"items": ["old Claude/Qwen/DeepSeek model introductions", "Claude drug-development partnerships"], "reason": "本次查询看到的官方更新；旧发布不作今日首发，专业研究合作需要更多篇幅解释且已有更直接的模型和工具素材，暂不进入本期。"}
    ],
    "notes": "四项为本期价值选择，不是固定配额；先交口播稿，真人录音后定镜头。无假今天首发、无营销速度排名、无TTS。"})

def claim(key, text, url, locator, path=None):
    source = {"url": url, "locator": locator, "checkedAt": NOW}
    if path:
        source["path"] = path
    return {"id": key, "text": text, "status": "verified", "source": source}

claims = [
    claim("ranking", "全球/国产各15项按当次指定网页的ECI口径核对；精确数值由本次取得的开源快照固定，查询和源更新时间分开。", "https://www.bilibili.com/toy/ai-model-world", "综合智力；地区全部/国内；核对记录 evidence/browser-observations.md，原始文件 evidence/ranking-upstream.json", "ranking.json"),
    claim("clover-model", "DiffuSpace Clover-35B-A3B-Preview为文本扩散MoE预览模型，总参数35B/激活约3B，块内多位置并行去噪；权重Apache-2.0。", "https://huggingface.co/Diffuspace/Clover-35B-A3B-Preview", "Architecture and decoding / License；不将激活参数当作权重内存", "evidence/clover-model.md"),
    claim("clover-demo", "官方GenUI示例以单个HTML生成可交互模拟桌面，包含窗口、记事本、计算器与设置；不代表本栏目实测或真实操作系统。", "https://diffuspace.ai/blog/clover-35b/", "GenUI: An Interactive Desktop in a Single HTML File / GenUI：用一个HTML文件构建交互式桌面；对应genui-desktop.mp4", "evidence/clover-launch.txt"),
    claim("clover-access", "官网提供权重/代码入口和在线内测申请；性能和速度数据为团队报告，未由本栏目复测。", "https://diffuspace.ai/blog/clover-35b/", "模型开源段、Next Steps / 下一步；HF模型卡与官方公开申请入口", "evidence/clover-launch.txt"),
    claim("mcode-purpose", "MiniMax-AI/mcode-stack发布团队实际使用的工程技能和工作流，涵盖子任务、上下文、长命令、交接和代码审查；支持MiniMax Code，并提供Claude Code安装方法。", "https://github.com/MiniMax-AI/mcode-stack", "README Quick start / What's inside / Relationship to MiniMax Code", "evidence/mcode-readme.md"),
    claim("mcode-licensing", "本次main树内stacks目录有17份SKILL.md；仓库MIT为主，engineering改编内容仍适用CC BY 3.0，不统一声称所有内容MIT。", "https://github.com/MiniMax-AI/mcode-stack/blob/main/stacks/ronny/NOTICE.md", "Third-party notices；evidence/mcode-tree.json完整树快照", "evidence/mcode-notice.md"),
    claim("expo-agent", "Expo于2026-10-27介绍实验性@expo/agent-cli，status检查兼容与重编译需求，dev启动，smoke检查运行错误，支持技能随包同步。", "https://expo.dev/blog/introducing-expo-agent-cli", "页面日期；Understand your project with status / One command to start developing / Introducing co-located skills；未运行本地Expo产品", "evidence/expo-agent-launch.txt"),
    claim("cachelint-findings", "论文初稿10-26、v2于10-27；缓存集成错误可静默发生；在571项目中报告32处，21项开发者确认、18处上游修复。", "https://arxiv.org/abs/2610.34817v2", "Abstract and submission history；32处不是32处均经确认", "evidence/cachelint-abstract.txt"),
    claim("cachelint-timestamp", "论文以private-gpt中系统提示开头的亚秒级时间戳破坏缓存前缀为具体案例。", "https://arxiv.org/html/2610.34817v2", "Figure 2 / III Motivating Example；不据此估算损失金额", "evidence/cachelint-paper.txt"),
]
write("claims.json", claims)

def scene(key, title, section, anchor, ids, lead, bullets=None, media=None, **extra):
    item = {"id": key, "title": title, "section": section, "anchor": anchor, "claimIds": ids, "lead": lead, "bullets": bullets or [], "source": " / ".join(ids), **extra}
    if media:
        item["media"] = media
    return item

scenes = [
    scene("overview", "今日 AI 资讯", "今日 AI 资讯", "各位观众们", [], "Clover 新模型与近期工具更新", presentation="editorial-overview"),
    scene("clover-intro", "扩散智能开源 Clover 语言模型", "模型头条", "先看模型", ["clover-model"], "Clover / 三叶 · 扩散语言模型预览版", ["AI 编程", "工具使用"], presentation="official-logo-and-model-identity"),
    scene("clover-method", "Clover 尝试并行生成文字", "模型原理", "我们常用的语言模型", ["clover-model"], "目标：减少生成等待；块内多个位置并行确定", ["总参数 350 亿", "激活参数约 30 亿"], presentation="block-diffusion-diagram"),
    scene("clover-demo", "Clover 用一个 HTML 文件生成模拟桌面", "官方演示", "看这段官方演示", ["clover-demo"], "拖动窗口、输入文字、打开计算器", [], {"kind": "video", "file": "assets/clover-genui.mp4", "sourceIn": 26, "sourceOut": 42, "poster": "assets/clover-genui-poster.jpg", "label": "DiffuSpace 官方演示；按源片速度播放；非本栏目实测"}, presentation="large-demonstration", mediaReview="26–42秒已看抽帧；精确镜头长度留待真人录音，必要时拆镜头，不拉慢补时长。"),
    scene("clover-access", "Clover 权重可下载，在线体验需申请", "获取方式", "官方也公布了", ["clover-access"], "性能数据来自团队测试；实际表现取决于部署与任务", ["权重已公开", "在线申请内测"], {"kind": "image", "file": "assets/clover-benchmarks.jpg", "label": "DiffuSpace 官方评测图；团队测试，具体条件以原文为准"}, presentation="evidence-and-access"),
    scene("mcode-intro", "MiniMax 开源 AI 编程工程技能库", "开发工具", "接下来看 MiniMax", ["mcode-purpose"], "MCode Stack · MiniMax Code 团队的日常工作方法", ["任务拆分", "上下文管理", "代码审查"], presentation="official-logo-and-plain-language"),
    scene("mcode-examples", "MCode Stack 给长任务留下检查与交接方法", "工程技能", "比如一个任务", ["mcode-purpose"], "长命令检查、长会话交接、独立审查", ["选需要的技能", "结果仍需核对"], presentation="source-excerpt-on-paper", sourceExcerpt={"path": "evidence/mcode-readme.md", "locator": "What's inside table", "officialImage": "assets/mcode-skills-map-zh.png", "note": "正文不铺满黑色卡片；只按当前讲解取一项源文和中文解释。"}),
    scene("mcode-usage", "MCode Stack 可按实际任务选用技能", "使用方式", "它使用通用的", ["mcode-purpose"], "通用SKILL格式；官方提供Claude Code安装方法", ["按需要选用", "代码和运行结果仍须核对"], presentation="selected-skill-and-use-boundary"),
    scene("expo-intro", "Expo 推出面向 AI 的手机应用开发工具", "近期更新", "再看移动端开发工具", ["expo-agent"], "2026.10.27 · @expo/agent-cli · 实验性工具", ["检查项目状态", "判断是否重编译"], presentation="project-status-explanation", officialLogo="assets/expo.svg"),
    scene("expo-workflow", "Expo 帮 AI 启动应用并检查运行错误", "开发流程", "过去 AI 给手机应用", ["expo-agent"], "先判断运行条件，再启动并检查", ["status：项目状态", "dev：启动", "smoke：运行检查"], presentation="three-step-editorial-diagram"),
    scene("expo-skills", "Expo 让技能与项目依赖配套管理", "适用边界", "它还支持", ["expo-agent"], "安装了哪些依赖，就同步相应技能；目前仍在实验阶段", ["技能随包同步", "版本相关指导"], presentation="package-and-guidance"),
    scene("cachelint-intro", "新研究检查 AI 缓存失效与用量误记", "研究观察", "最后是一项", ["cachelint-findings"], "应用能运行，缓存仍可能没有正确生效", ["重复输入可复用", "请求与用量记录都需核对"], presentation="cache-explanation"),
    scene("cachelint-case", "变化的时间戳可能破坏缓存前缀", "具体案例", "一个具体例子", ["cachelint-timestamp"], "时间戳变化 → 前缀变化 → 重复内容无法命中", [], presentation="cache-prefix-comparison"),
    scene("cachelint-results", "CacheLint 已推动 18 处上游修复", "研究结果", "研究团队做了", ["cachelint-findings"], "571 个项目；报告 32 处问题；21 项开发者确认", ["18 处上游修复", "检查实际缓存与用量"], presentation="numbers-revealed-in-sequence"),
    scene("closing", "本期项目与来源见简介", "今日 AI 资讯", "以上就是本期", [], "官方项目、演示和论文链接随发布物料保存", presentation="brief-signoff"),
]
for item in scenes:
    if item["claimIds"]:
        urls = [c["source"]["url"] for c in claims if c["id"] in item["claimIds"]]
        item["source"] = " · ".join(dict.fromkeys(urls))
write("content.json", {"headline": {"title": "Clover 开源，AI 编程多一条新路线", "subtitle": "扩散语言模型预览版 · 官方演示与实际获取方式", "logo": "assets/clover-logo.svg", "source": "DiffuSpace 官方发布及模型卡；测试数据为团队自报"}, "stories": [{"title": "扩散智能开源 Clover", "detail": "扩散语言模型，展示 AI 编程与工具使用"}, {"title": "MiniMax 开源工程技能库", "detail": "任务拆分、上下文与代码审查"}, {"title": "Expo 更新 AI 开发工具", "detail": "检查并运行手机应用；10月27日发布"}, {"title": "新研究检查提示词缓存", "detail": "缓存失效与用量误记，论文10月26/27日更新"}], "scenes": scenes, "fonts": {"sans": "assets/fonts/sans.ttf", "mono": "assets/fonts/mono.ttf"}, "music": {"file": "assets/carefree.mp3", "credit": "Carefree by Kevin MacLeod (incompetech.com), CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ ; source https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037 ; planned trimming, fades and narration ducking"}, "productionNote": "presentation为本期镜头意图，通用版式未实现的图解需在录音后本期代码中落实；不声称填写字段就已渲染。"})

body = (ROOT / "narration.md").read_text(encoding="utf-8").split("## 朗读正文")[1].split("## 录音说明")[0].strip()
paragraphs = [x.strip() for x in body.split("\n\n") if x.strip()]
assert len(paragraphs) == len(scenes), "Every readable paragraph must retain its scene reference"
write("script.json", {"meta": {"title": "2026-10-29 每日 AI 资讯", "lang": "zh", "budgetSeconds": 300, "charsPerSecond": 4.5, "bannedWords": ["赋能", "震撼", "重磅"]}, "segments": [{"id": i + 1, "kind": "voiceover", "text": p, "ref": s["id"]} for i, (p, s) in enumerate(zip(paragraphs, scenes))]})
edition = read("edition.json")
edition.update(status="script-ready-awaiting-human-recording", narrationBodySha256=sha256(body.encode()).hexdigest(), ranking="ranking.json", headStory="clover", storyOrder=["clover", "mcode", "expo", "cachelint"])
edition["production"].update(humanRecording="pending", asrAlignment="pending", render="not-started", humanReview="pending", publish="not-started", script="draft-prepared")
write("edition.json", edition)

assets = read("assets/sources.json")
for item in assets:
    file = item.get("file", "")
    if file == "assets/clover-genui.mp4":
        item.update(status="local-file-decode-and-frame-reviewed", sourceRangeCandidate=[26, 42], selection="selected-for-clover-demo-awaiting-recording", review={"method": "local contact sheets at 0,5,10,15,20,25 and 26,31,36,41,46 seconds", "observed": "前段为代码生成，后段展示模拟桌面、窗口和记事本/设置等交互；优先采用后段。", "limit": "未完整连续审看/审听；入片使用源片速度，不声称原片等于实时任务耗时。"})
        item["use"] = "Clover模拟桌面的官方结果演示；26–42秒候选，按源片速度、不额外变速；精确入片范围等待录音。"
    elif file == "assets/clover-webmcp.mp4":
        item.update(status="local-file-decode-and-frame-reviewed", selection="reserve-not-selected", review={"observed": "6项网页任务对比；源片自带playback 6x与fast-forward 30x标注。", "limit": "不可当作真实任务速度对比；当前稿件没有讲对应6项任务，不强行插入。"})
    elif file in ("assets/mcode-skills-map-zh.png", "assets/expo-agent-cover.png"):
        item.update(status="image-visually-reviewed", selection="reference-only-not-selected-for-full-frame", review="官方素材偏黑底文字；保留作资料佐证，本栏目主要采用浅色图解与必要源文局部。")
    if file in ("assets/clover-logo.svg", "assets/minimax.png", "assets/expo.svg"):
        item["use"] = item.get("use", "") + "；保持原始官方文件，置于纸白背景，不添加黑色图标方块。"
write("assets/sources.json", assets)
print("Prepared", len(claims), "claims;", len(scenes), "untimed scene intentions; TOP15 x2; waiting for human recording.")

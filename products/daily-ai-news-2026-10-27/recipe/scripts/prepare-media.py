"""Prepare frozen local media and an audio-independent shot handoff; no web fetch or voice generation."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from html import escape
from pathlib import Path
import json
import subprocess
import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
TZ = timezone(timedelta(hours=8))
NOW = datetime.now(TZ).isoformat(timespec="seconds")
GRAPHICS = ROOT / "graphics"
GRAPHICS.mkdir(exist_ok=True)
(ROOT / "qa").mkdir(exist_ok=True)

def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def render_page(stem, index, name, clip=None, scale=2):
    with fitz.open(ASSETS / (stem + ".pdf")) as doc:
        page = doc[index]
        page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=clip).save(ASSETS / name)

render_page("phronix-paper", 0, "phronix-paper-page1.png")
render_page("phronix-paper", 2, "phronix-paper-page3.png")
render_page("phronix-paper", 0, "phronix-paper-title.png", fitz.Rect(38, 42, 575, 165), 3)
render_page("phronix-paper", 2, "phronix-figure1.png", fitz.Rect(309, 45, 568, 265), 4)
render_page("openai-eth-paper", 0, "openai-eth-paper-page1.png")
render_page("openai-eth-paper", 0, "openai-eth-paper-title.png", fitz.Rect(55, 75, 557, 225), 3)

subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(ASSETS / "terra-official-intro.gif"), "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", str(ASSETS / "terra-official-intro.mp4")], check=True)
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", "0", "-t", "6", "-i", str(ASSETS / "terra-official-intro.mp4"), "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", str(ASSETS / "terra-family-context-6s.mp4")], check=True)

def diagram(name, title, steps, note):
    # Native vector artwork; source-derived explanation, never a fabricated product screenshot.
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="500" viewBox="0 0 1440 500">', '<rect width="1440" height="500" fill="#f8f6f0"/>', '<g font-family="Microsoft YaHei, Noto Sans SC, sans-serif">', '<text x="64" y="67" font-size="20" fill="#ac4e35">每日 AI / 流程示意</text>', f'<text x="64" y="135" font-size="42" font-weight="700" fill="#171714">{escape(title)}</text>']
    w = 265 if len(steps) == 4 else 350
    for i, step in enumerate(steps):
        x = 64 + i * (w + 70)
        parts += [f'<line x1="{x}" y1="210" x2="{x+w}" y2="210" stroke="#b35138" stroke-width="3"/>', f'<text x="{x}" y="249" font-size="21" fill="#ac4e35">0{i+1}</text>', f'<text x="{x}" y="313" font-size="31" font-weight="700" fill="#171714">{escape(step)}</text>']
        if i < len(steps) - 1:
            parts += [f'<path d="M{x+w+15} 280 h35 l-10 -9 m10 9 l-10 9" stroke="#ac4e35" fill="none" stroke-width="2"/>']
    parts += [f'<text x="64" y="438" font-size="21" fill="#75766b">{escape(note)}</text>', '</g></svg>']
    (GRAPHICS / name).write_text("\n".join(parts), encoding="utf-8")

diagram("terra-invoice-flow.svg", "从看懂发票，到录入财务软件", ["读取发票", "理解所需字段", "录入财务软件"], "据 OpenAI 官方应用场景绘制 · 流程示意，非本栏目实测")
diagram("phronix-reuse-flow.svg", "让 AI 保存并复用做事经验", ["执行任务", "检查与修正", "保存操作方法", "下次调用经验"], "据 Phronix 论文方法绘制 · 研究不等同于全新任务的普遍效果")
diagram("oracle-agent-flow.svg", "企业软件部署，智能体如何分工", ["分析需求", "设计方案", "配置原型", "准备测试"], "据 Oracle 官方公告绘制 · 用途说明，非新增智能体的实测录像")

manifest = json.loads((ASSETS / "sources.json").read_text(encoding="utf-8"))
by_file = {r["file"]: r for r in manifest if "file" in r}
def register(file, source, scene, rights, parent=None, **extra):
    path = ROOT / file
    data = path.read_bytes()
    digest = sha256(data).hexdigest()
    old = by_file.get(file, {})
    record = {**old, "file": file, "sha256": digest, "bytes": len(data), "sourcePage": source, "sceneIds": scene, "rights": rights, "status": "local-verified", **extra}
    record.setdefault("preparedAt", datetime.fromtimestamp(path.stat().st_mtime, TZ).isoformat(timespec="seconds"))
    if parent:
        record["derivedFrom"] = parent
        record["parentSha256"] = sha256((ROOT / parent).read_bytes()).hexdigest()
    if path.suffix.lower() in [".png", ".jpg", ".webp", ".gif"]:
        with Image.open(path) as im:
            record["media"] = {"width": im.width, "height": im.height, "frames": getattr(im, "n_frames", 1)}
            im.verify()
    elif path.suffix.lower() in [".mp4", ".mp3"]:
        result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels:format=duration", "-of", "json", str(path)], capture_output=True, text=True, check=True)
        record["media"] = json.loads(result.stdout)
    by_file[file] = record

openai_page = "https://community.openai.com/t/gpt-6-1-terra-delivering-fast-and-capable-computer-use-at-a-lower-price/1409900"
model_page = "https://developers.openai.com/api/docs/models/gpt-6.1-terra"
phronix = "https://arxiv.org/abs/2610.31789"
eth = "https://github.com/openai/math/blob/main/preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026/paper.pdf"
oracle = "https://www.oracle.com/customer-success/navigator/"
editorial = "官方公开材料，用于相关报道引用，保留原作者/页面出处；无通用再许可声明。"
cc = "Hariharan Devarajan et al., Phronix, arXiv:2610.31789v1, CC BY 4.0；裁切和 PDF 转图已注明。"
for name in ["terra-official-intro.gif", "terra-official-chart.png"]:
    register("assets/" + name, openai_page, ["terra"], editorial, selection="reserve", review="已看抽帧/原图；动图是模型家族宣传，480×270、6fps、120秒，非功能操作演示；图表黑底且非本期口播重点，不作为主画面。")
register("assets/terra-official-intro.mp4", openai_page, ["terra"], editorial, "assets/terra-official-intro.gif", selection="reserve", adaptation="GIF 原时间轴转 H.264；未提升原始分辨率或运动帧率。")
register("assets/terra-family-context-6s.mp4", openai_page, ["terra"], editorial, "assets/terra-official-intro.mp4", selection="reserve", clipIn=0, clipOut=6, review="仅可作小幅品牌背景，禁止全屏拉大或作为新模型操作实测。")
register("assets/terra-model-icon.png", model_page, ["terra", "cover"], "OpenAI 官方模型图标/商标，用于准确识别产品。", url="https://developers.openai.com/images/api/models/icons/gpt-6.1-terra.png", selection="selected")
for name in ["terra-model-page.png", "terra-pricing-page.png"]:
    register("assets/" + name, model_page, ["terra"], editorial, selection="selected", capture="本次浏览器 1280×720 视口截图，保留原页；已实际查看。", layout="剪辑时聚焦主体区域；定价每百万 token，比较限标准单价。")
register("assets/phronix-paper.pdf", phronix, ["phronix"], cc, url="https://arxiv.org/pdf/2610.31789", selection="source")
for name in ["phronix-paper-page1.png", "phronix-paper-page3.png", "phronix-paper-title.png", "phronix-figure1.png"]:
    register("assets/" + name, phronix, ["phronix"], cc, "assets/phronix-paper.pdf", selection="selected" if name in ["phronix-paper-title.png", "phronix-figure1.png"] else "source", adaptation="PDF 原页渲染；title 为第一页标题区域，figure1 为第三页图与原始图注。")
register("assets/openai-eth-paper.pdf", eth, ["science"], editorial, url="https://raw.githubusercontent.com/openai/math/main/preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026/paper.pdf", selection="source", review="只检查文件可读与标题/归属，未验证数学证明。")
for name in ["openai-eth-paper-page1.png", "openai-eth-paper-title.png"]:
    register("assets/" + name, eth, ["science"], editorial, "assets/openai-eth-paper.pdf", selection="selected", adaptation="PDF 第一页渲染/标题和摘要区域裁切；须配‘OpenAI 公布的研究主张，待外部核验’说明。")
register("assets/mistral-release-status.png", "https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B", ["mistral"], editorial, selection="selected", capture="本次浏览器截图；已查看 Upcoming release / October 31 Current ETA。", layout="聚焦产品名、待发布与预计日期，省去易过时的倒计时；录音跨日需复核。")
for name in ["oracle-starter-configuration.webp", "oracle-project-tracking.webp"]:
    register("assets/" + name, oracle, ["oracle"], editorial, selection="selected", url="https://www.oracle.com/a/ocom/img/" + ("cimg16x9md-starter-configuration.webp" if "starter" in name else "cimg16x9md-css-create-transparency.webp"), review="官方平台界面参考；不能声称展示了 10/26 新增智能体的实际运行。")
register("assets/carefree.mp3", "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037", ["global", "domestic", "all-voice-scenes"], "Kevin MacLeod，CC BY 4.0；署名放简介或片尾。", selection="selected", reusedFrom="../daily-ai-news-2026-10-24/assets/carefree.mp3", licenseEvidence="https://incompetech.com/music/royalty-free/faq.html#credit", attribution="Carefree — Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0. https://creativecommons.org/licenses/by/4.0/", audioReview="本阶段只核验哈希、时长和解码；完整审听、循环接缝及人声避让待实际混音。")
for name, page, scene in [("terra-invoice-flow.svg", "https://openai.com/index/introducing-gpt-6-1-terra/", "terra"), ("phronix-reuse-flow.svg", phronix, "phronix"), ("oracle-agent-flow.svg", "https://www.oracle.com/news/announcement/ai-world-oracle-unveils-agentic-ai-platform-to-accelerate-implementation-of-oracle-fusion-cloud-applications-2026-10-26/", "oracle")]:
    register("graphics/" + name, page, [scene], "本栏目代码绘制的解释图；所据事实保留原始来源，不伪装官方界面或实测。", selection="selected", adaptation="纸白、珊瑚色、中文流程说明，原生 SVG，无 AI 生图。")
for name, reason in [("mistral-hero.jpg", "实际查看为无模型主体的暗色纹理背景，不选作新闻配图。"), ("phronix-architecture.svg", "抽取的 HTML SVG 缺少 LaTeXML 叠加文字；改用 PDF 原图，禁止直接采用。"), ("phronix-architecture.png", "本地 SVG 渲染丢失全部标签，已弃用，替代为 phronix-figure1.png。")]:
    file = "assets/" + name
    if file in by_file:
        by_file[file].update(selection="rejected", review=reason)
write("assets/sources.json", list(by_file.values()) + [r for r in manifest if "file" not in r])

shots = [
    {"sceneId": "global", "inputs": ["ranking.json"], "note": "现有八家官标覆盖全球/国产 TOP15；沿用本期查询快照，只配 BGM。"},
    {"sceneId": "domestic", "inputs": ["ranking.json"], "note": "与全球榜平齐，不人为增加分数或升降。"},
    {"sceneId": "overview", "inputs": ["script.json"], "note": "今日 AI 资讯；收到录音后核对采用文稿再生成正文标题。"},
    {"sceneId": "terra", "inputs": ["assets/terra-model-icon.png", "assets/terra-model-page.png", "graphics/terra-invoice-flow.svg", "assets/terra-pricing-page.png"], "anchorText": ["先看 GPT-6.1 Terra", "读取一张发票", "价格方面"], "note": "产品识别→发票流程示意→标准价格。以截图和原生动效完成，高清官方演示非必需输入。", "optionalVideo": {"file": "assets/terra-family-context-6s.mp4", "in": 0, "out": 6, "selected": False, "reason": "低分辨率家族宣传，仅备用，不是操作演示。"}},
    {"sceneId": "science", "inputs": ["assets/openai-eth-paper-title.png", "assets/openai-eth-paper-page1.png", "evidence/openai-eth-scope.md"], "anchorText": ["再看一条科研消息", "指数时间假设", "已公开部分证明材料"], "note": "原文标题/归属→中文解释→外部核验状态；不让观众阅读整页公式。"},
    {"sceneId": "phronix", "inputs": ["assets/phronix-paper-title.png", "assets/phronix-figure1.png", "graphics/phronix-reuse-flow.svg"], "anchorText": ["让 AI 积累工作经验", "执行步骤和结果保存下来", "三十道软件修复任务"], "note": "论文标题→保留标签的原图局部→中文复用流程→样本边界。"},
    {"sceneId": "mistral", "inputs": ["assets/mistral-large-4.svg", "assets/mistral-release-status.png"], "anchorText": ["Mistral Large 4 的开放进度", "预计日期是十月三十一日"], "note": "官标＋真实待发布状态，突出日期，不采用无主体暗色背景。"},
    {"sceneId": "oracle", "inputs": ["assets/oracle-platform.jpg", "assets/oracle-starter-configuration.webp", "assets/oracle-project-tracking.webp", "graphics/oracle-agent-flow.svg"], "anchorText": ["甲骨文", "需求分析、应用设计、配置和测试"], "note": "产品识别→官方平台界面→中文分工图；界面只作平台参考，不冒充新增功能实测。"},
    {"sceneId": "closing", "inputs": ["credits.md"], "note": "按实际录音收尾，简介/片尾带素材署名。"},
]
draft = (ROOT / "narration.md").read_bytes()
write("media-plan.json", {"schemaVersion": 1, "editionDate": "2026-10-27", "preparedAt": NOW, "status": "ready-with-documented-video-fallbacks-awaiting-human-input", "draftFileSha256": sha256(draft).hexdigest(), "timing": "No final scene times. Align the adopted text and source in/out to the user's actual recording.", "shots": shots, "music": {"file": "assets/carefree.mp3", "opening": "全球/国产榜只配音乐", "voice": "按实际人声自动避让，必要时循环并检查接缝", "review": "mix-and-listening-pending"}, "gaps": [{"item": "Terra 高清介绍/操作视频", "status": "optional-unavailable", "reason": "检索出现 30 秒 Vimeo 介绍说明，但当前官方英文页遇到 Cloudflare 真人验证，未取得可验证视频 URL；未自动完成验证。", "fallback": "已准备官方模型页、价格截图和明确标注的发票流程图。"}, {"item": "Oracle 官方 1:26 平台介绍视频", "sourcePage": oracle, "url": "https://www.youtube.com/watch?v=l6IH8pAbXWA", "status": "optional-not-downloaded", "reason": "官方页面嵌入入口已确认，公开下载要求登录/反机器人验证；未导出用户 cookies。", "fallback": "采用官方平台配图和分工图。"}], "next": ["接收用户最终口播稿/本期真人录音，保留原件并核对与本草稿的差异", "ASR 核对名词、数字与实际增删句，再生成字幕与时间线", "将本清单实际采用素材接入本期 Remotion 工程，原生 60fps", "代表帧/短片、混音审听、全片检查与用户终审"]})
print("Prepared", len(shots), "shot groups with local media, 3 native SVG diagrams and BGM. No voice or full video rendered.")

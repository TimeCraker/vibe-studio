"""Read the handed-off manuscript; never overwrite it or infer final subtitle times."""
from pathlib import Path
from hashlib import sha256
import json
import re

ROOT = Path(__file__).resolve().parents[1]
def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

manuscript = (ROOT / "narration.md").read_text(encoding="utf-8")
body = manuscript.split("## 朗读正文\n", 1)[1].split("## 录音说明", 1)[0].strip()
paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
refs = ["overview", "terra", "terra", "terra", "science", "science", "science", "phronix", "phronix", "phronix", "mistral", "oracle", "oracle", "closing"]
if len(paragraphs) != len(refs):
    raise SystemExit("Manuscript structure changed: review paragraph-to-scene mapping first")
segments = [{"id": i + 1, "kind": "voiceover", "text": text, "ref": "scene " + ref} for i, (text, ref) in enumerate(zip(paragraphs, refs))]
script = {"meta": {"title": "今日 AI 资讯 · GPT-6.1 Terra 发布", "lang": "zh", "budgetSeconds": 420, "charsPerSecond": 4.8, "bannedWords": []}, "segments": segments}
write("script.json", script)

def claim(cid, text, url, locator):
    return {"id": cid, "text": text, "status": "verified", "source": {"url": url, "locator": locator, "checkedAt": "2026-10-27"}}
claims = [
    {"id": "ranking", "text": "当次读取指定入口的全球及国内 ECI TOP15，精确值来自此次上游快照；无分不补分。", "status": "verified", "source": {"path": "ranking.json", "locator": "global, domestic, queriedAt, sourceGeneratedAt; browser observations in evidence/browser-observations.md", "checkedAt": "2026-10-27"}},
    claim("terra-release", "OpenAI 官方 10/26 更新日志公布 GPT-6.1 Terra，发布页说明其视觉理解、电脑操作、标准 API 价格和可用性；减半比较限相较 GPT-5.6 Terra 的标准输入/输出单价。", "https://openai.com/index/introducing-gpt-6-1-terra/", "From visual understanding to action; Pricing and availability. Release date cross-check: developers.openai.com/api/docs/changelog Oct 26."),
    claim("science-announcement", "OpenAI 10/26 公布内部模型的数学/计算机科学/物理研究主张及外部学者合作安排，部分材料公开。仅核实公告与材料存在，未独立验证证明。", "https://openai.com/index/building-scientific-understanding-with-academic-communities/", "Opening, release strategies, The Exponential Time Hypothesis is false; official openai/math/lean/docs/378.md scope."),
    claim("phronix-study", "Phronix 预印本报告从执行中保存、验证与复用能力；测试含 30 道 SWE-bench Lite 任务及科研流程，区分冷/暖启动。表述限作者研究报告，不声称普遍推广或独立复现。", "https://arxiv.org/html/2610.31789v1", "IV; V-A3 Workloads; V-A4 Run Protocol; V-A5 Metrics; V-B and V-D. Submitted 22 Oct 2026."),
    claim("mistral-status", "查询时官方 HF 模型页仍为 Upcoming release，Current ETA October 31；公开 API 预览已在 10/6 公告。", "https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B", "Upcoming release; Expected release; cross-check mistral.ai/news/mistral-large-4 Try it today."),
    claim("oracle-platform", "Oracle 当地 10/26 公布面向 Fusion Cloud 实施的智能体平台，包含需求、设计、配置、测试等分工；不保证每个客户的实际效果。", "https://www.oracle.com/news/announcement/ai-world-oracle-unveils-agentic-ai-platform-to-accelerate-implementation-of-oracle-fusion-cloud-applications-2026-10-26/", "An agentic platform for faster implementation, specialized agents list."),
]
scenes = []
t = 0.0
def add(sid, title, seconds, purpose, subject, ids):
    global t
    end = round(t + seconds, 3)
    scenes.append({"id": sid, "start": t, "end": end, "title": title, "purpose": purpose, "subject": subject, "claimIds": ids})
    t = end
add("global", "全球 AI 模型综合能力 TOP15", 7, "左前三右十二，所有行有官标，仅配 BGM；时长待实际阅读测试", "当次 ECI 全球排名", ["ranking"])
add("domestic", "国产 AI 模型综合能力 TOP15", 7, "与全球榜对齐，同一固定解释与实际查询时间", "当次 ECI 国内排名", ["ranking"])
plans = [
    ("overview", "今日 AI 资讯", "问候开始，主标题 Terra，四条次标题按主次排版，不逐个念英文清单", ["terra-release", "science-announcement", "phronix-study", "mistral-status", "oracle-platform"]),
    ("terra", "OpenAI 发布 GPT-6.1 Terra，主打视觉理解与电脑操作", "官标与官方页面摘录；以发票填表的具体应用示意配合口播，再切标准价格对照。示意明确标示，不冒充实际运行", ["terra-release"]),
    ("science", "OpenAI 公布 AI 科研结果，邀请外部学者核验", "展示官方公告与仓库材料，数学/计算机/物理分层揭示；放大外部核验状态，避免用公式堆砌普通观众看不懂的页面", ["science-announcement"]),
    ("phronix", "Phronix：让 AI 保存并复用做事经验", "论文原图局部加可读中文标注，随后切 30 题样本与已有经验的适用边界；字幕随录音，不以 91% 当封面", ["phronix-study"]),
    ("mistral", "Mistral Large 4 权重仍待发布", "模型官标、官方状态截图、预计日期分开展示；不使用原日报的已开放文案", ["mistral-status"]),
    ("oracle", "甲骨文公布面向企业软件部署的 AI 智能体平台", "官方图作配图候选，需求、设计、配置、测试沿口播逐项强调；画面注明官方公布，不画无依据效果数字", ["oracle-platform"]),
    ("closing", "下期再见", "简短结束，保留来源入口及必要署名，最终随配音自然收尾", []),
]
for sid, title, purpose, ids in plans:
    text = "".join(p for p, ref in zip(paragraphs, refs) if ref == sid)
    seconds = max(4, len(re.sub(r"\s", "", text)) / 4.8)
    add(sid, title, round(seconds, 3), purpose, title, ids)
write("storyboard.json", {"schemaVersion": 1, "audience": "关注 AI 模型和实用工具的普通观众与独立开发者，无需认识所有英文项目和学术术语", "goal": "说清新模型的实际用途与使用入口，区分官方科研主张和核验状态，解释经验复用研究与两条简讯", "profile": "data", "timingStatus": "draft-budget-only-awaiting-human-recording", "timingNote": "start/end only allocate a rough editorial budget, not subtitle or render timing. Replace with actual recorded speech and pauses before any final render.", "claims": claims, "scenes": scenes, "review": {"status": "pending", "notes": "延续已确认栏目风格；本期稿件和分镜尚待用户审阅。无真人录音、无本期渲染，不代表成片通过。"}})
write("edition.json", {"date": "2026-10-27", "status": "script-ready-awaiting-human-recording", "fps": 60, "width": 1920, "height": 1080, "line": "b", "narration": "human", "narrationFile": "narration.md", "narrationBodySha256": sha256(body.encode("utf-8")).hexdigest(), "ranking": "ranking.json", "headStory": "terra", "storyOrder": ["terra", "science", "phronix", "mistral", "oracle"], "production": {"humanRecording": "pending", "asrAlignment": "pending", "render": "not-started", "humanReview": "pending", "publish": "not-started"}})
print("Prepared", len(segments), "voiceover paragraphs;", len(body), "manuscript characters;", len(scenes), "draft scenes. No audio/subtitles/video generated.")

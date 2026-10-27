"""Prepare this edition's ranking and local media from recorded public sources."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from pathlib import Path
from urllib.request import Request, urlopen
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT.parent / "daily-ai-news-2026-10-24"
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)
def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

raw = (ROOT / "evidence/models-upstream.json").read_bytes()
snapshot = json.loads(raw)
source_record = next(s for s in json.loads((ROOT / "sources.json").read_text(encoding="utf-8"))["sources"] if s["file"] == "evidence/models-upstream.json")
vendors = {v["id"]: v for v in snapshot["vendors"]}
icons = {"anthropic": "claude.png", "openai": "openai.svg", "google": "google.png", "meta": "meta.svg", "moonshotai": "kimi.png", "alibaba": "qwen.png", "zhipuai": "glm.svg", "deepseek": "deepseek.ico"}
rows = sorted([m for m in snapshot["models"] if not m.get("retiredAt") and isinstance(m["benchmarks"].get("eci"), (int, float))], key=lambda m: (-m["benchmarks"]["eci"], m["id"]))
def pack(models):
    return [{"rank": i + 1, "id": m["id"], "name": m["name"], "eci": m["benchmarks"]["eci"], "vendor": m["vendorId"], "icon": icons[m["vendorId"]], "country": vendors[m["vendorId"]]["country"]} for i, m in enumerate(models[:15])]
ranking = {"editionDate": "2026-10-27", "metric": "ECI", "queriedAt": source_record["queriedAt"], "sourceGeneratedAt": snapshot["generatedAt"], "sourceSha256": sha256(raw).hexdigest(), "entryUrl": "https://www.bilibili.com/toy/ai-model-world", "observedLeaderboardUrl": "https://bilibilitoy.com/toy/ai-model-world/34090174887936-v32787/leaderboard/index.html", "precisionSourceUrl": source_record["url"], "method": "Observed global and domestic ECI TOP15 in the specified live entry. Model ids and two-decimal scores from the freshly retrieved upstream snapshot; order cross-checked with browser. No missing-score imputation, retired models excluded, distinct version ids retained. Source timestamp is separate from query time.", "caption": "综合能力评分（ECI），分数越高，模型综合表现越好。", "global": pack(rows), "domestic": pack([m for m in rows if vendors[m["vendorId"]]["continent"] == "east"])}
assert len(ranking["global"]) == len(ranking["domestic"]) == 15
assert ranking["global"][0]["id"] == "anthropic/claude-opus-5-5"
assert ranking["domestic"][0]["id"] == "moonshotai/kimi-k3"
write("ranking.json", ranking)

records = []
old_sources = json.loads((OLD / "assets/sources.json").read_text(encoding="utf-8"))
for icon in sorted(set(icons.values())):
    source = next(s for s in old_sources if s["file"] == "assets/" + icon)
    data = (OLD / source["file"]).read_bytes()
    assert sha256(data).hexdigest() == source["sha256"], icon
    shutil.copyfile(OLD / source["file"], ASSETS / icon)
    records.append({**source, "status": "local-verified", "reusedFrom": "../daily-ai-news-2026-10-24/" + source["file"]})

downloads = [
    ("mistral-large-4.svg", "https://docs.mistral.ai/assets/models/ML4-Lechonk.svg", "Mistral 官方模型图标；用于封面识别，商标不声明再许可", "Mistral AI; https://docs.mistral.ai/models/mistral-large-4-0"),
    ("mistral-hero.jpg", "https://mistral.ai/images/heros/hero-ml4@2x.jpg", "官方发布图候选；仅作相关报道，发布前核对实际采用范围与品牌条款", "Mistral AI; https://mistral.ai/news/mistral-large-4/"),
    ("rea-hopper.png", "https://raw.githubusercontent.com/morluto/rea/main/docs/assets/rea-hopper-analysis.png", "项目作者提供的 Hopper 分析示意；保留项目署名及第三方界面权利，标官方演示，非本栏目实测", "morluto/rea; https://github.com/morluto/rea"),
    ("rea-investigation.svg", "https://raw.githubusercontent.com/morluto/rea/main/website/public/assets/figures/rea-investigation-flow.svg", "REA 作者图解，项目 MIT；保留作者署名及许可", "morluto/rea; https://github.com/morluto/rea/blob/main/LICENSE"),
    ("oracle-platform.jpg", "https://www.oracle.com/a/pr/img/cimg16x9sm-css-agentic-ai-platform.jpg", "官方新闻图候选；并非完整产品实机演示，发布前核对实际采用范围与媒体使用条件", "Oracle; https://www.oracle.com/news/announcement/ai-world-oracle-unveils-agentic-ai-platform-to-accelerate-implementation-of-oracle-fusion-cloud-applications-2026-10-26/"),
]
def download(item):
    name, url, rights, attribution = item
    record = {"file": "assets/" + name, "url": url, "rights": rights, "attribution": attribution, "queriedAt": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")}
    try:
        with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=25) as response:
            data = response.read()
        (ASSETS / name).write_bytes(data)
        return {**record, "status": "retrieved-candidate", "bytes": len(data), "sha256": sha256(data).hexdigest()}
    except Exception as error:
        return {**record, "status": "unavailable", "error": str(error)}
with ThreadPoolExecutor(max_workers=5) as pool:
    records.extend(pool.map(download, downloads))

paper = (ROOT / "evidence/phronix-paper.html").read_text(encoding="utf-8")
figure = re.search(r'<svg id="S4.F1.pic1".*?</svg>', paper, re.S)
if figure:
    svg = figure.group()
    if 'xmlns=' not in svg.split('>')[0]:
        svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1)
    data = svg.encode("utf-8")
    (ASSETS / "phronix-architecture.svg").write_bytes(data)
    records.append({"file": "assets/phronix-architecture.svg", "url": "https://arxiv.org/html/2610.31789v1#S4.F1", "status": "retrieved-candidate", "sha256": sha256(data).hexdigest(), "bytes": len(data), "adaptation": "Extracted inline Figure 1 SVG; added XML namespace only. Needs visual check before use.", "rights": "CC BY 4.0, paper license", "attribution": "Hariharan Devarajan et al., Phronix, arXiv:2610.31789v1, Figure 1, CC BY 4.0"})

records.append({"kind": "video-candidate", "url": "https://x.com/reatools/status/2112574822584918075", "discoveredAt": "https://rea.tools/showcase/", "status": "link-only-not-downloaded", "use": "Official RL-environment demo. Use only if the eventual narration discusses that feature; current REA narration focuses on software analysis, so do not insert unrelated RL footage.", "clipIn": None, "clipOut": None})
records.append({"kind": "interactive-candidate", "url": "https://ml4-blog-widgets.netlify.app/document-search/?iframe", "discoveredAt": "https://mistral.ai/news/mistral-large-4/", "status": "not-captured", "use": "Official document-search demo candidate; not required for release-status narration."})
write("assets/sources.json", records)
print("Ranking: 15 global + 15 domestic; source generated", snapshot["generatedAt"])
for record in records:
    print(record.get("file", record.get("kind")), record["status"])

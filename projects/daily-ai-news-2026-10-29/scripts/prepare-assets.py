"""Stage source-backed media and fresh ranking data for the recording handoff."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from hashlib import sha256
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import gzip
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
TZ = timezone(timedelta(hours=8))
NOW = datetime.now(TZ).isoformat(timespec="seconds")
OFFICIAL = "官方公开材料；仅用于相关资讯的必要引用并在简介署名，不主张获得一般素材再许可或官方背书。"
DOWNLOADS = [
    ("clover-logo.svg", "https://diffuspace.ai/assets/favicon.svg", "https://diffuspace.ai/blog/clover-35b/", "头条与封面，直接使用官方图标", OFFICIAL),
    ("clover-benchmarks.jpg", "https://diffuspace.ai/assets/blog/clover/agentic-benchmarks.jpg?v=20261028", "https://diffuspace.ai/blog/clover-35b/", "模型评测页；厂商自报，不作为独立实测", OFFICIAL),
    ("clover-genui.mp4", "https://diffuspace.ai/assets/blog/clover/genui-desktop.mp4?v=20261028", "https://diffuspace.ai/blog/clover-35b/", "Clover 生成模拟桌面的官方演示；原速、必要短片段、口播配合", OFFICIAL),
    ("clover-genui-poster.jpg", "https://diffuspace.ai/assets/blog/clover/genui-desktop-poster.jpg?v=20261028", "https://diffuspace.ai/blog/clover-35b/", "桌面演示的官方封面；片段后承接", OFFICIAL),
    ("clover-webmcp.mp4", "https://diffuspace.ai/assets/blog/clover/webmcp.mp4?v=20261028", "https://diffuspace.ai/blog/clover-35b/", "网页工具调用演示候选；只在讲到对应任务时采用", OFFICIAL),
    ("clover-webmcp-poster.jpg", "https://diffuspace.ai/assets/blog/clover/webmcp-poster.jpg?v=20261028", "https://diffuspace.ai/blog/clover-35b/", "网页演示官方封面", OFFICIAL),
    ("minimax.png", "https://avatars.githubusercontent.com/u/194880281?v=4", "https://github.com/MiniMax-AI/mcode-stack", "MiniMax 官方组织标志；新闻身份识别", "官方组织头像与商标，仅用于品牌识别，不声明商标再许可。"),
    ("expo-agent-cover.png", "https://cdn.sanity.io/images/9r24npb8/production/03dabb891658e1f9819fa4a8e717137d1a2f1e6d-3600x2025.png?auto=format&fit=max&q=75&w=1600", "https://expo.dev/blog/introducing-expo-agent-cli", "Expo 官方发布图，配合工具能力介绍", OFFICIAL),
    ("expo.svg", "https://expo.dev/static/images/exponential.svg", "https://expo.dev/blog/introducing-expo-agent-cli", "Expo 官方图标", OFFICIAL),
    ("cachelint-overview.png", "https://arxiv.org/html/2610.34817v2/fig_overview.png", "https://arxiv.org/html/2610.34817v2", "论文方法图；仅作局部解说，主体用本期中文缓存示意", "论文作者，CC BY 4.0；保留论文署名、arXiv链接和是否裁切的说明。"),
]

def get(item):
    name, url, page, purpose, rights = item
    target = ROOT / "assets" / name
    record = {"file": "assets/" + name, "url": url, "sourcePage": page, "rights": rights, "use": purpose, "retrievedAt": NOW, "selection": "prepared-not-yet-in-video"}
    try:
        with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0 DailyAIEditorial/1.0"}), timeout=50) as response:
            raw = response.read()
        if raw.startswith(b"\x1f\x8b"):
            raw = gzip.decompress(raw)
        target.write_bytes(raw)
        record.update(status="downloaded-awaiting-content-review", bytes=len(raw), sha256=sha256(raw).hexdigest())
        if target.suffix == ".mp4":
            result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,codec_type,width,height,r_frame_rate", "-of", "json", str(target)], capture_output=True, text=True, check=True)
            record["media"] = json.loads(result.stdout)
            subprocess.run(["ffmpeg", "-v", "error", "-i", str(target), "-f", "null", "-"], capture_output=True, check=True)
            record["decode"] = "full-file-pass"
    except Exception as error:
        record.update(status="retrieval-failed", error=str(error), selection="candidate-only")
    return record

if __name__ == "__main__":
    sources = []
    previous = ROOT.parent / "daily-ai-news-2026-10-28"
    catalogue = json.loads((previous / "assets/sources.json").read_text(encoding="utf-8"))
    reuse = {"claude.png", "openai.svg", "google.png", "meta.svg", "kimi.png", "qwen.png", "glm.svg", "deepseek.ico", "carefree.mp3", "fonts/sans.ttf", "fonts/mono.ttf"}
    for rel in sorted(reuse):
        source = previous / "assets" / rel
        entry = next((x for x in catalogue if x.get("file") == "assets/" + rel), None)
        if not source.exists():
            raise RuntimeError("Missing reusable asset: " + str(source))
        raw = source.read_bytes()
        if entry and entry.get("sha256") and sha256(raw).hexdigest() != entry["sha256"]:
            raise RuntimeError("Asset changed relative to source record: " + rel)
        dest = ROOT / "assets" / rel
        dest.parent.mkdir(exist_ok=True, parents=True)
        shutil.copy2(source, dest)
        record = {**(entry or {}), "file": "assets/" + rel, "sha256": sha256(raw).hexdigest(), "bytes": len(raw), "reusedFrom": "../daily-ai-news-2026-10-28/assets/" + rel, "preparedAt": NOW, "selection": "prepared-not-yet-in-video", "status": "local-file-hash-verified"}
        if not entry:
            record.update(rights="Follow upstream font license retained with the originating edition; verify before render.", use="Reusable local font")
        sources.append(record)
    with ThreadPoolExecutor(max_workers=5) as pool:
        sources.extend(pool.map(get, DOWNLOADS))
    image = ROOT / "assets/mcode-skills-map-zh.png"
    if image.exists():
        sources.append({"file": "assets/mcode-skills-map-zh.png", "sourcePage": "https://github.com/MiniMax-AI/mcode-stack/blob/main/docs/assets/skills-map-zh.png", "url": "https://raw.githubusercontent.com/MiniMax-AI/mcode-stack/main/docs/assets/skills-map-zh.png", "sha256": sha256(image.read_bytes()).hexdigest(), "bytes": image.stat().st_size, "retrievedAt": NOW, "status": "downloaded-awaiting-content-review", "selection": "prepared-not-yet-in-video", "rights": "MCode Stack: MIT except adapted engineering skills under CC BY 3.0; see evidence/mcode-notice.md. Preserve source attribution.", "use": "中文技能地图，正文按具体技能局部放大；不缩整张让观众读密集文字。"})
    (ROOT / "assets/sources.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for record in sources:
        print(record["file"], record["status"], record.get("bytes", record.get("error")))

"""Collect this edition's public evidence; never reads browser credentials."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from pathlib import Path
from urllib.request import Request, urlopen
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "evidence"
RAW.mkdir(exist_ok=True)
SOURCES = {
    "mistral-announcement.html": "https://mistral.ai/news/mistral-large-4/",
    "mistral-docs.html": "https://docs.mistral.ai/models/mistral-large-4-0",
    "mistral-release-status.html": "https://huggingface.co/mistralai/Mistral-Large-4-1T-A52B",
    "phronix-abstract.html": "https://arxiv.org/abs/2610.31789",
    "phronix-paper.html": "https://arxiv.org/html/2610.31789v1",
    "rea-readme.md": "https://raw.githubusercontent.com/morluto/rea/main/README.md",
    "rea-repo.json": "https://api.github.com/repos/morluto/rea",
    "oracle-announcement.html": "https://www.oracle.com/news/announcement/ai-world-oracle-unveils-agentic-ai-platform-to-accelerate-implementation-of-oracle-fusion-cloud-applications-2026-10-26/",
    "models-upstream.json": "https://raw.githubusercontent.com/liyupi/ai-model-world/main/data/models.json",
    "ranking-page.html": "https://bilibilitoy.com/toy/ai-model-world/34090174887936-v32787/leaderboard/index.html",
    "terra-announcement.html": "https://openai.com/index/introducing-gpt-6-1-terra/",
    "terra-model.html": "https://developers.openai.com/api/docs/models/gpt-6.1-terra",
    "openai-changelog.html": "https://developers.openai.com/api/docs/changelog",
    "openai-science.html": "https://openai.com/index/building-scientific-understanding-with-academic-communities/",
}

def collect(item):
    name, url = item
    queried = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0 DailyAIEditorial/1.0"})
        with urlopen(req, timeout=45) as response:
            data = response.read()
            final_url = response.url
        (RAW / name).write_bytes(data)
        return {"file": "evidence/" + name, "url": url, "finalUrl": final_url,
                "queriedAt": queried, "bytes": len(data), "sha256": sha256(data).hexdigest(), "status": "retrieved"}
    except Exception as error:
        return {"file": "evidence/" + name, "url": url, "queriedAt": queried,
                "status": "failed", "error": str(error)}

selected = {name: url for name, url in SOURCES.items() if not sys.argv[1:] or name in sys.argv[1:]}
if not selected:
    raise SystemExit("No matching source filenames")
with ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(collect, selected.items()))
manifest = ROOT / "sources.json"
old = json.loads(manifest.read_text(encoding="utf-8"))["sources"] if manifest.exists() else []
kept = [r for r in old if r["file"] not in {r["file"] for r in results}]
manifest.write_text(json.dumps({"editionDate": "2026-10-27", "sources": kept + results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
for record in results:
    print(record["file"], record["status"], record.get("bytes", record.get("error")))

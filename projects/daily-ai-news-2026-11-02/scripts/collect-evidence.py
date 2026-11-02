"""Retrieve this edition's public source evidence without browser credentials."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
import json
import gzip
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {'dsh-readme': 'https://raw.githubusercontent.com/jackwener/DSH-Android/main/README.md', 'dsh-releases': 'https://api.github.com/repos/jackwener/DSH-Android/releases', 'coral-paper': 'https://arxiv.org/html/2610.40350v1', 'clickhouse-security': 'https://clickhouse.com/docs/resources/changelogs/security-changelog', 'ranking-upstream': 'https://raw.githubusercontent.com/liyupi/ai-model-world/main/data/models.json', 'xai-releases': 'https://docs.x.ai/developers/release-notes', 'laiye-mcp': 'https://developer.cloud.tencent.com/mcp/server/11820', 'fusion-profile': 'https://raw.githubusercontent.com/Fumo-Lab/.github/main/profile/README.md', 'iluvatar-home': 'https://www.iluvatar.com/', 'dsh-releases-page': 'https://github.com/jackwener/DSH-Android/releases', 'dsh-license': 'https://raw.githubusercontent.com/jackwener/DSH-Android/main/LICENSE', 'coral-pdf': 'https://arxiv.org/pdf/2610.40350', 'xai-migration': 'https://docs.x.ai/developers/migration/imagine-image-quality-nov-2', 'longcat-release': 'https://longcat.ai/blog/longcat-2.5/', 'longcat-changelog': 'https://longcat.ai/platform/docs/change-log', 'tiangai-product': 'https://www.iluvatar.com/productDetails?fullCode=cpjs-yj-xlxl-tg300'}

class Readable(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.parts = []
        self.assets = []
    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if tag in ("script", "style"):
            self.skip += 1
        if tag in ("img", "video", "source", "iframe", "a", "meta", "link"):
            selected = {k: v for k, v in attr.items() if k in ("src", "href", "srcset", "poster", "alt", "content", "property", "name", "type", "rel")}
            if selected:
                self.assets.append({"tag": tag, **selected})
        if tag in ("p", "div", "h1", "h2", "h3", "h4", "li", "tr", "pre", "section", "br") and not self.skip:
            self.parts.append("\n")
    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1
    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)

def collect(item):
    key, url = item
    checked = datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")
    record = {"id": key, "url": url, "queriedAt": checked}
    try:
        request = Request(url, headers={"User-Agent": "Mozilla/5.0 DailyAIEditorial/1.0", "Accept": "*/*"})
        with urlopen(request, timeout=40) as response:
            raw = response.read()
            content_type = response.headers.get("content-type", "")
            record["finalUrl"] = response.url
        if raw.startswith(b"\x1f\x8b"):
            record["wireBytes"] = len(raw)
            raw = gzip.decompress(raw)
        extension = Path(url.split("?")[0]).suffix
        suffix = ".json" if "json" in content_type or extension == ".json" else ".md" if extension == ".md" else ".html"
        target = ROOT / "evidence" / (key + suffix)
        target.write_bytes(raw)
        record.update(status="retrieved", file=target.relative_to(ROOT).as_posix(), bytes=len(raw), sha256=sha256(raw).hexdigest(), contentType=content_type)
        if suffix == ".html":
            parser = Readable()
            parser.feed(raw.decode("utf-8", errors="replace"))
            text = "\n".join(line.strip() for line in "".join(parser.parts).splitlines() if line.strip())
            (ROOT / "evidence" / (key + ".txt")).write_text(text + "\n", encoding="utf-8")
            media_path = ROOT / "evidence" / (key + ".assets.json")
            media_path.write_text(json.dumps(parser.assets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            record.update(mediaInventoryFile=media_path.relative_to(ROOT).as_posix(), mediaItemCount=len(parser.assets))
    except Exception as error:
        record.update(status="failed", error=str(error))
    return record

if __name__ == "__main__":
    (ROOT / "evidence").mkdir(exist_ok=True)
    selected = {key: url for key, url in SOURCES.items() if not sys.argv[1:] or key in sys.argv[1:]}
    if not selected:
        raise SystemExit("No matching source")
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(collect, selected.items()))
    manifest = ROOT / "evidence/retrieval.json"
    previous = json.loads(manifest.read_text(encoding="utf-8")) if manifest.exists() else []
    retained = [r for r in previous if r["id"] not in selected]
    manifest.write_text(json.dumps(retained + results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for result in results:
        print(result["id"], result["status"], result.get("bytes", result.get("error")))

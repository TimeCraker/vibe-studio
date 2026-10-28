"""Freeze public news sources for this edition, with bounded reads and hashes."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import gzip
from hashlib import sha256
import json
from pathlib import Path
import sys
from html.parser import HTMLParser
from urllib.request import Request, urlopen

class SourceText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.meta, self.media, self.hidden = [], {}, [], []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag in ('script', 'style', 'nav', 'footer', 'header'):
            self.hidden.append(tag)
        if tag == 'meta' and values.get('content'):
            key = values.get('property', values.get('name', ''))
            if key.startswith(('og:', 'article:', 'twitter:')):
                self.meta[key] = values['content']
        if tag in ('video', 'source', 'iframe'):
            self.media.append({'tag': tag, 'src': values.get('src'), 'poster': values.get('poster')})
    def handle_endtag(self, tag):
        if self.hidden and self.hidden[-1] == tag:
            self.hidden.pop()
    def handle_data(self, data):
        if not self.hidden and data.strip():
            self.parts.append(data.strip())

root = Path(__file__).resolve().parents[1]
evidence = root / 'evidence'
registry = json.loads((root / 'research-sources.json').read_text(encoding='utf-8'))
manifest_file = evidence / 'retrieval.json'
previous = json.loads(manifest_file.read_text(encoding='utf-8')) if manifest_file.exists() else []
cached = {item['id']: item for item in previous if item.get('ok')}

def fetch(item):
    record = {**item, 'retrievedAt': datetime.now(timezone.utc).isoformat(), 'ok': False}
    try:
        old = cached.get(item['id'])
        if old and (root / old['file']).exists() and '--refresh' not in sys.argv:
            stored = (root / old['file']).read_bytes()
            raw = gzip.decompress(stored) if old['file'].endswith('.gz') else stored
            if not raw.startswith(b'\x1f\x8b'):
                return old
            record = dict(old)
            kind, encoding = record['contentType'], 'utf-8'
        else:
            request = Request(item['url'], headers={'User-Agent': 'Mozilla/5.0 DailyAI-source-verification/1.0'})
            with urlopen(request, timeout=35) as response:
                record.update(status=response.status, finalUrl=response.url)
                raw = response.read(20_000_001)
                kind = response.headers.get('Content-Type', '')
                encoding = response.headers.get_content_charset() or 'utf-8'
        if raw.startswith(b'\x1f\x8b'):
            record['transportSha256'] = sha256(raw).hexdigest()
            record['transportCompression'] = 'gzip'
            raw = gzip.decompress(raw)
        if len(raw) > 20_000_000:
            raise ValueError('Source too large for text evidence')
        suffix = '.json' if 'json' in kind or item['url'].split('?')[0].endswith('.json') else '.html' if 'html' in kind else '.txt'
        destination = evidence / (item['id'] + suffix)
        if len(raw) > 600_000:
            destination = destination.with_suffix(destination.suffix + '.gz')
            destination.write_bytes(gzip.compress(raw, mtime=0))
        else:
            destination.write_bytes(raw)
        text = raw.decode(encoding, errors='replace')
        if 'html' in kind:
            parser = SourceText()
            parser.feed(text)
            record['media'], record['meta'] = parser.media, parser.meta
            text = '\n'.join(parser.parts)
        textfile = evidence / (item['id'] + '-text.txt')
        textfile.write_text(text, encoding='utf-8')
        record.update(ok=True, file=destination.relative_to(root).as_posix(), textFile=textfile.relative_to(root).as_posix(),
                      bytes=len(raw), sha256=sha256(raw).hexdigest(), storedSha256=sha256(destination.read_bytes()).hexdigest(), contentType=kind)
    except Exception as error:
        record['error'] = str(error).split(' (Caused by')[0][:350]
    return record

with ThreadPoolExecutor(max_workers=5) as pool:
    records = list(pool.map(fetch, registry))
manifest_file.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for record in records:
    print(json.dumps({key: record[key] for key in ['id', 'ok', 'status', 'bytes', 'error'] if key in record}, ensure_ascii=False))

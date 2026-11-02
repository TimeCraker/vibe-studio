"""Download selected publisher demos observed on the official release page."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
from urllib.request import Request, urlopen
import json
ROOT = Path(__file__).resolve().parents[1]
ITEMS = [
    ('assets/longcat-logo.svg', 'https://s3plus.meituan.net/aigc-media-resources/longcat/yeqian-logo.svg', '官方发布页favicon，用于模型身份识别'),
    ('assets/longcat-3d-demo.mp4', 'https://s3.meituan.net/static-prod01/com.sankuai.friday.longcat.next2p/assets/video2n-B6KVKw3k.mp4', '官方3D文物交互展示案例，待核对采用片段'),
    ('assets/longcat-office-demo.mp4', 'https://s3plus-bj02.meituan.net/xiaomei-execute-result/0blogvideo/video5nt.mp4', '官方商业经营分析案例，待核对采用片段'),
    ('assets/longcat-3d-poster.jpg', 'https://s3.meituan.net/static-prod01/com.sankuai.friday.longcat.next2p/assets/poster-sanxingdui-3d-MOfuE69s.jpg', '官方演示封面，待核对局部构图')
]
def fetch(item):
    name, url, selection = item
    record = {'file': name, 'url': url, 'sourcePage': 'https://longcat.ai/blog/longcat-2.5/', 'checkedAt': datetime.now(timezone.utc).isoformat(), 'rights': '美团LongCat官方发布素材；用于本期新闻说明与来源署名，不主张获得再授权或素材独立分发权。正式发布前复核使用条件。', 'selection': selection, 'includedInVideo': False}
    try:
        with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=45) as response:
            data = response.read()
        (ROOT / name).write_bytes(data)
        record.update(status='retrieved', sha256=sha256(data).hexdigest(), bytes=len(data))
    except Exception as error:
        record.update(status='failed', error=str(error))
    return record
with ThreadPoolExecutor(max_workers=3) as pool:
    records = list(pool.map(fetch, ITEMS))
manifest = ROOT / 'assets/sources.json'
old = json.loads(manifest.read_text(encoding='utf-8'))
old = [r for r in old if r.get('file') not in {i[0] for i in ITEMS}]
manifest.write_text(json.dumps(old + records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for r in records:
    print(r['file'], r['status'], r.get('bytes', r.get('error')))

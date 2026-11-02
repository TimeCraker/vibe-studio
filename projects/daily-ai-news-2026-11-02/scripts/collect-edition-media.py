"""Collect selected publisher images and videos from saved, observed source pages."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
from urllib.request import Request, urlopen
import json
ROOT = Path(__file__).resolve().parents[1]
def inventory(name):
    return json.loads((ROOT / f'evidence/{name}.assets.json').read_text(encoding='utf-8'))
carbon = inventory('carbon-launch')
gdpx = inventory('gdpx-launch')
genie = inventory('genie4-launch')
def og(items):
    return next(r['content'] for r in items if r.get('property') == 'og:image')
def img(items, text):
    return next(r['src'] for r in items if r.get('tag') == 'img' and text in r.get('alt', ''))
def video(items, text):
    return next(r['src'].split('#')[0] for r in items if r.get('tag') == 'source' and text in r.get('src', ''))
gdpx_chart = next(r['src'] for r in gdpx if r.get('tag') == 'img' and '626a52b0-2fdf-4e15-ba75-0853f1fef8c4' in r.get('src', ''))
C = 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/'
G = 'https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/'
D = 'https://newsletter.semianalysis.com/p/gdpx-measuring-frontier-model-capabilities'
ITEMS = [
    ('assets/carbon-official-hero.png', og(carbon), C, 'Carbon官方主视觉；短暂识别，不撑整段'),
    ('assets/carbon-official-evals.webp', img(carbon, 'benchmark table'), C, 'Carbon官方评测表；只取与解说相关局部，保留厂商口径'),
    ('assets/carbon-official-secbench.webp', img(carbon, 'SEC bench Pro'), C, '漏洞发现评测图，官方发布口径，不当操作演示'),
    ('assets/gdpx-official-ranking.webp', gdpx_chart, D, 'GDPx发布者榜单图；核对默认Score和计分口径'),
    ('assets/genie4-official-hero.webp', og(genie), G, 'Genie4官方主视觉，非本栏目生成'),
    ('assets/genie4-balloon-demo.webm', video(genie, 'hot-air-balloon'), G, '官方交互世界热气球案例，保留原有免责声明'),
    ('assets/genie4-cloth-demo.webm', video(genie, 'silk-scarf'), G, '官方交互世界布料案例，保留原有免责声明')
]
def fetch(item):
    name, url, page, purpose = item
    target = ROOT / name
    record = {'file': name, 'url': url, 'sourcePage': page, 'checkedAt': datetime.now(timezone.utc).isoformat(), 'rights': '发布者官方新闻/研究素材，权利归原发布者；用于有出处的本期说明，不主张转授权或独立分发权。', 'selection': purpose, 'includedInVideo': False}
    try:
        with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=45) as response:
            data = response.read()
        if len(data) < 1000:
            raise ValueError('Unexpectedly small media response')
        target.write_bytes(data)
        record.update(status='retrieved', sha256=sha256(data).hexdigest(), bytes=len(data))
    except Exception as error:
        record.update(status='failed', error=str(error))
    return record
with ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(fetch, ITEMS))
manifest = ROOT / 'assets/sources.json'
old = json.loads(manifest.read_text(encoding='utf-8'))
old = [r for r in old if r.get('file') not in {i[0] for i in ITEMS}]
manifest.write_text(json.dumps(old + results, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for r in results:
    print(r['file'], r['status'], r.get('bytes', r.get('error')))

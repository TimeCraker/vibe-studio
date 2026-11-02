"""Freeze current ranking and source-backed reusable assets for this edition."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from hashlib import sha256
from pathlib import Path
from urllib.request import Request, urlopen
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
PREVIOUS = ROOT.parent / 'daily-ai-news-2026-11-01'
def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def digest(path):
    return sha256(path.read_bytes()).hexdigest()

sources = []
icons = ['openai.svg', 'claude.png', 'google.png', 'meta.svg', 'deepseek.ico', 'kimi.png', 'qwen.png', 'glm.svg']
previous_sources = json.loads((PREVIOUS / 'assets/sources.json').read_text(encoding='utf-8'))
for filename in icons:
    relative = 'assets/' + filename
    source = next(r for r in previous_sources if r['file'] == relative)
    original = PREVIOUS / relative
    assert digest(original) == source['sha256'], relative
    shutil.copyfile(original, ROOT / relative)
    record = {**source, 'status': 'retrieved', 'selection': '本期榜单对应厂商识别标志', 'reuseFrom': PREVIOUS.name}
    sources.append(record)

data = json.loads((ROOT / 'evidence/ranking-upstream.json').read_text(encoding='utf-8'))
vendors = {v['id']: v for v in data['vendors']}
models = [m for m in data['models'] if isinstance(m.get('benchmarks', {}).get('eci'), (int, float)) and not m.get('retiredAt')]
models.sort(key=lambda m: -m['benchmarks']['eci'])
icon_map = dict(zip(['openai', 'anthropic', 'google', 'meta', 'deepseek', 'moonshotai', 'alibaba', 'zhipuai'], icons))
ranking = {'editionDate': '2026-11-02', 'metric': 'ECI', 'queriedAt': datetime.now(timezone(timedelta(hours=8))).isoformat(timespec='seconds'), 'sourceGeneratedAt': data['generatedAt'], 'entryUrl': 'https://www.bilibili.com/toy/ai-model-world', 'discoveredEmbedUrl': 'https://bilibilitoy.com/toy/ai-model-world/34090174887936-v36822/leaderboard/index.html', 'sourceUrl': 'https://raw.githubusercontent.com/liyupi/ai-model-world/main/data/models.json', 'rawSnapshot': 'evidence/ranking-upstream.json', 'rawSha256': digest(ROOT / 'evidence/ranking-upstream.json'), 'browserEvidence': 'evidence/browser-observations.md', 'sourceNote': '当次B站入口发现v36822，已实际切换全部/国内核对前15名字、顺序、一位小数。页面首页标10月31日，开源快照生成于11月2日；前15在页面显示精度内一致，采用本次开源快照精确值。保留不同id和原序，不画升降。', 'attribution': 'ECI: Epoch AI (CC BY 4.0); aggregation: liyupi/ai-model-world (MIT). 署名保留在视频简介和记录。'}
for region in ['global', 'domestic']:
    rows = models if region == 'global' else [m for m in models if vendors[m['vendorId']]['continent'] == 'east']
    ranking[region] = [{'id': m['id'], 'name': m['name'], 'eci': m['benchmarks']['eci'], 'vendor': m['vendorId'], 'icon': 'assets/' + icon_map[m['vendorId']]} for m in rows[:15]]
assert [r['name'] for r in ranking['global']][:3] == ['GPT-6 Astra', 'Claude Opus 5.5', 'GPT-6.1 Terra']
assert [r['name'] for r in ranking['domestic']][-3:] == ['Qwen3.8 27B', 'Kimi K2.6', 'Kimi K2.7 Code']
write('ranking.json', ranking)

downloads = [
    ('assets/dsh-hero.webp', 'https://raw.githubusercontent.com/jackwener/DSH-Android/main/docs/screenshots/hero.webp', '项目作者仓库配图；按仓库Apache-2.0及第三方商标分别处理，不转授品牌权利', '头条项目识别，不能作为实测'),
    ('assets/dsh-showcase.webp', 'https://raw.githubusercontent.com/jackwener/DSH-Android/main/docs/screenshots/showcase-dark.webp', '项目作者仓库界面截图；保留项目署名，Apache-2.0，第三方商标除外', '逐个手机界面局部放大；作者截图，未实测'),
    ('evidence/coral-paper.pdf', 'https://arxiv.org/pdf/2610.40350', '作者论文；arXiv非独占许可不等于任意转载许可。仅作核查，画面优先自行绘制带出处的结果图', '研究事实和表1/2原始证据')
]
def fetch(item):
    filename, url, rights, selection = item
    target = ROOT / filename
    try:
        with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=35) as response:
            raw = response.read()
        target.write_bytes(raw)
        if filename.endswith('.pdf'):
            assert raw.startswith(b'%PDF'), 'Not a PDF'
        return {'file': filename, 'url': url, 'sha256': digest(target), 'rights': rights, 'selection': selection, 'status': 'retrieved', 'includedInVideo': False}
    except Exception as error:
        return {'url': url, 'rights': rights, 'selection': selection, 'status': 'failed', 'error': str(error)}
with ThreadPoolExecutor(max_workers=3) as pool:
    for result in pool.map(fetch, downloads):
        sources.append(result)
        print(result.get('file', result['url']), result['status'])
write('assets/sources.json', sources)
print('Ranking: 15 global / 15 domestic; official icons verified and copied')

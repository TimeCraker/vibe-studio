"""Acquire real source assets without producing an estimated-timing video."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
import gzip
import json
from pathlib import Path
import shutil
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parents[1]
old = root.parent / 'daily-ai-news-2026-10-27'
assets = root / 'assets'
assets.mkdir(exist_ok=True)
sources_file = assets / 'sources.json'
existing = json.loads(sources_file.read_text(encoding='utf-8'))
if not isinstance(existing, list):
    existing = existing.get('sources', [])
records = {item['file']: item for item in existing if item.get('file')}
old_records = json.loads((old / 'assets/sources.json').read_text(encoding='utf-8'))
if not isinstance(old_records, list):
    old_records = old_records['sources']
reuse = ['claude.png','openai.svg','google.png','meta.svg','kimi.png','qwen.png','glm.svg','deepseek.ico','carefree.mp3']
for name in reuse:
    record = next(item for item in old_records if item['file'] == 'assets/' + name)
    source = old / record['file']
    if sha256(source.read_bytes()).hexdigest() != record['sha256']:
        raise ValueError('Reusable asset changed: ' + str(source))
    shutil.copyfile(source, assets / name)
    records[record['file']] = {**record, 'status':'local-file-hash-verified', 'selection':'prepared-not-yet-in-video', 'reusedFrom':'../daily-ai-news-2026-10-27/' + record['file']}

downloads = [
 ('liquid-logo.png','https://www.liquid.ai/icon.png?icon.2v1ofxrotruka.png','Liquid AI 官方品牌图标；相关报道署名，商标不声明再许可。','https://www.liquid.ai/blog/lfm3'),
 ('liquid-banner.webp','https://huggingface.co/LiquidAI/LFM3-1.7B/resolve/main/assets/liquid-ai-banner.webp','Liquid AI 官方模型页品牌图；仅用于相关报道并署名，商标不声明再许可。','https://huggingface.co/LiquidAI/LFM3-1.7B'),
 ('liquid-edge-inference.webp','https://huggingface.co/LiquidAI/LFM3-1.7B/resolve/main/assets/lfm3-edge-inference.webp','Liquid AI 官方评测图；标注厂商测试与具体条件，不作为本栏目实测。','https://www.liquid.ai/blog/lfm3'),
 ('minicpm-chinese-examples.gif','https://raw.githubusercontent.com/OpenBMB/MiniCPM-OCR/main/assets/minicpm-ocr/minicpm-chinese-examples-3-column.gif','OpenBMB 官方仓库示例动图，Apache-2.0；保留来源与许可，不作为本栏目实测。','https://github.com/OpenBMB/MiniCPM-OCR'),
 ('minicpm-chinese-cases.png','https://raw.githubusercontent.com/OpenBMB/MiniCPM-OCR/main/assets/minicpm-ocr/minicpm-ocr-chinese-cases.png','OpenBMB 官方仓库样例图，Apache-2.0；保留来源与许可。','https://github.com/OpenBMB/MiniCPM-OCR'),
 ('minicpm-jev-case.png','https://raw.githubusercontent.com/OpenBMB/MiniCPM-OCR/main/assets/minicpm-ocr/jev-case-en.png','OpenBMB 官方 Jev 对照样例，Apache-2.0；示例评分不表示绝对正确率。','https://huggingface.co/openbmb/MiniCPM-OCR-Jev'),
 ('minicpm-LICENSE.txt','https://raw.githubusercontent.com/OpenBMB/MiniCPM-OCR/main/LICENSE','Apache-2.0 许可原文。','https://github.com/OpenBMB/MiniCPM-OCR'),
 ('liquid-LICENSE.txt','https://huggingface.co/LiquidAI/LFM3-1.7B/raw/main/LICENSE','LFM Open License v1.0 原文；不把开放权重写成无限制开源。','https://huggingface.co/LiquidAI/LFM3-1.7B')
]
def acquire(item):
    name,url,rights,page = item
    file = 'assets/' + name
    destination = root / file
    previous = records.get(file)
    if previous and destination.exists() and sha256(destination.read_bytes()).hexdigest() == previous.get('sha256'):
        return previous
    record = {'file':file,'url':url,'sourcePage':page,'rights':rights,'retrievedAt':datetime.now(timezone.utc).isoformat(),'selection':'prepared-not-yet-in-video'}
    try:
        with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=45) as response:
            data=response.read(120_000_001)
        if data.startswith(b'\x1f\x8b'):
            data=gzip.decompress(data)
        if len(data)>120_000_000:
            raise ValueError('Asset exceeds acquisition budget')
        destination.write_bytes(data)
        record.update(status='downloaded-awaiting-visual-review',sha256=sha256(data).hexdigest(),bytes=len(data))
    except Exception as error:
        record.update(status='source-entry-found-file-unavailable',error=str(error)[:250])
    return record
with ThreadPoolExecutor(max_workers=4) as pool:
    for record in pool.map(acquire,downloads):
        records[record['file']]=record

for name in ['sans','mono']:
    source = old / f'remotion-app/public/edition/fonts/{name}.ttf'
    destination=assets / f'fonts/{name}.ttf'
    destination.parent.mkdir(exist_ok=True)
    shutil.copyfile(source,destination)
    records[destination.relative_to(root).as_posix()]={'file':destination.relative_to(root).as_posix(),'sourcePage':str(source),'sha256':sha256(source.read_bytes()).hexdigest(),'rights':'沿用前期已验证的本机字体文件，仅作本地渲染；不将字体二进制提交 Git。','selection':'prepared-not-yet-in-video','status':'local-file-hash-verified'}
sources_file.write_text(json.dumps(list(records.values()),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for item in downloads:
    record=records['assets/'+item[0]]
    print(json.dumps({k:record[k] for k in ['file','status','bytes','error'] if k in record},ensure_ascii=False))

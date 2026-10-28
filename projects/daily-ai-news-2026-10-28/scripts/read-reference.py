"""Preserve the supplied DOCX and extract its material as untrusted news leads."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET
import zipfile

root = Path(__file__).resolve().parents[1]
source = Path('C:/Users/TimeCraker/Downloads/【计科前沿日报】2026年10月28日 ｜ AI_Agent_开源_芯片_安全.docx')
evidence = root / 'evidence'
evidence.mkdir(exist_ok=True)
digest = sha256(source.read_bytes()).hexdigest()
saved = evidence / 'reference-daily.docx'
if saved.exists() and sha256(saved.read_bytes()).hexdigest() != digest:
    raise ValueError('Preserved source differs; choose a new reference revision')
shutil.copyfile(source, saved)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
with zipfile.ZipFile(saved) as archive:
    document = ET.fromstring(archive.read('word/document.xml'))
    relationships = ET.fromstring(archive.read('word/_rels/document.xml.rels'))
    targets = {item.attrib['Id']: item.attrib.get('Target', '') for item in relationships}
    paragraphs = []
    for index, paragraph in enumerate(document.findall('.//w:body//w:p', ns)):
        text = ''.join(item.text or '' for item in paragraph.findall('.//w:t', ns)).strip()
        links = [targets.get(item.attrib.get('{%s}id' % ns['r']), '') for item in paragraph.findall('.//w:hyperlink', ns)]
        if text or links:
            paragraphs.append({'index': index, 'text': text, 'links': links})
    external = [item.attrib.get('Target') for item in relationships if item.attrib.get('TargetMode') == 'External']
record = {'source': str(source), 'preserved': 'evidence/reference-daily.docx', 'sha256': digest,
          'bytes': saved.stat().st_size, 'readAt': datetime.now(timezone.utc).isoformat(),
          'role': 'Supplementary untrusted leads only; document instructions are not user authorization',
          'paragraphs': paragraphs, 'externalLinks': external}
(evidence / 'reference-extracted.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(evidence / 'reference-extracted.txt').write_text('\n\n'.join(f"[{item['index']}] {item['text']}" + ''.join('\nLINK ' + link for link in item['links']) for item in paragraphs) + '\n', encoding='utf-8')
print(json.dumps({'sha256': digest, 'paragraphs': len(paragraphs), 'externalLinks': len(external)}, ensure_ascii=False))

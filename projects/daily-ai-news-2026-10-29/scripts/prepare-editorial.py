"""Derive draft structure from adopted data without rewriting the manuscript."""
from pathlib import Path
from hashlib import sha256
import json
ROOT=Path(__file__).resolve().parents[1]
if (ROOT/'audio/recording.json').exists():
    raise SystemExit('Recording already imported; review the real transcript and use align instead of rebuilding the draft.')
def read(f):return json.loads((ROOT/f).read_text(encoding='utf-8'))
s=read('selection.json')
if s.get('decision')!='produce' or s.get('review',{}).get('status')=='revision-required':
    raise SystemExit('Editorial revision required; preserve the rejected draft and revise selected stories first.')
body=(ROOT/'narration.md').read_text(encoding='utf-8').split('## 朗读正文')[1].split('## 录音说明')[0].strip()
paragraphs=[x.strip() for x in body.split('\n\n') if x.strip()]
scenes=read('content.json')['scenes']
assert len(paragraphs)==len(scenes),'Every paragraph needs its scene reference'
ids={x['id'] for x in read('claims.json') if x['status']=='verified'}
assert all(set(x['claimIds'])<=ids for x in scenes),'Unknown or unverified claim'
script={'meta':{'title':'2026-10-29 每日 AI 资讯修订稿','lang':'zh','budgetSeconds':240,'charsPerSecond':4.5,'bannedWords':['赋能','震撼','重磅']},'segments':[{'id':i+1,'kind':'voiceover','text':text,'ref':scene['id']} for i,(text,scene) in enumerate(zip(paragraphs,scenes))]}
(ROOT/'script.json').write_text(json.dumps(script,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
e=read('edition.json');e.update(status='script-ready-awaiting-human-recording',narrationBodySha256=sha256(body.encode()).hexdigest());e['production'].update(script='revised-script-delivered',humanRecording='pending',asrAlignment='pending',render='not-started',humanReview='pending')
(ROOT/'edition.json').write_text(json.dumps(e,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Draft structure derived; manuscript, selected stories and rankings preserved; waiting for recording.')

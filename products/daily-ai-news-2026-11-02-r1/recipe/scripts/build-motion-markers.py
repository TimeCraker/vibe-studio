import json
from pathlib import Path
r=Path('projects/daily-ai-news-2026-11-02')
c=json.loads((r/'content.json').read_text(encoding='utf8')); t=json.loads((r/'timeline.json').read_text(encoding='utf8')); a=json.loads((r/'audio/asr/raw-words.json').read_text(encoding='utf8')); words=[w for s in a['segments'] for w in s['words']]
keys={'longcat-release':[('视觉理解','视觉理解'),('持续执行','复杂代码库')],'longcat-office':[('目前','目前'),('不过','不过')],'carbon-release':[('复杂工程','复杂工程'),('软件漏洞','发现')],'carbon-limits':[('日常使用','日常使用'),('开放方面','开发方面'),('所有用户','所有用户')],'genie-world':[('改变天气','改变天气'),('声音','声音')],'genie-limits':[('一致性','移植性'),('成熟','成熟')],'gdpx-tasks':[('11个领域','11个领域'),('206个任务','206个任务'),('文件和工具','文件和工具')],'gdpx-scores':[('12%','12%'),('评分方式','评分方式'),('不代表','不调要'),('可靠','可靠')]}
m={}
for sid,pairs in keys.items():
 s=next(s for s in t['scenes'] if s['id']==sid); ws=[w for w in words if s['start']-14-.05<=w['start']<s['end']-14]; text=''.join(w['text'] for w in ws)
 for label,raw in pairs:
  p=text.find(raw)
  if p<0: print('MISSING',sid,label); continue
  i=0
  for w in ws:
   if i+len(w['text'])>p: m[sid+':'+label]=max(0,round((w['start']+14-s['start'])*60));break
   i+=len(w['text'])
c['motion']=m
(r/'content.json').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(m)


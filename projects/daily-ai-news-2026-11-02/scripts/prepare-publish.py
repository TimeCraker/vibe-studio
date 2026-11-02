import json
from pathlib import Path
r=Path('projects/daily-ai-news-2026-11-02');t=json.loads((r/'timeline.json').read_text(encoding='utf8'));cs=json.loads((r/'claims.json').read_text(encoding='utf8'))
d=['11月2日AI资讯：美团LongCat-2.5正式版开放接口、GDPx复杂工作评测；补充10月28日Gemini 4 Carbon与10月27日Genie 4研究预览。官方演示及评测不等于本栏目实测。','LongCat代码与模型下载仍敬请期待；Carbon初期面向部分安全防御人员和可信伙伴；Genie 4有交互时长、一致性和声音限制；GDPx的12%为默认综合分，不是现实工作成功率。']
for cid in ['longcat-release','longcat-demos','carbon-release','genie4-release','genie4-limits','gdpx-launch','gdpx-score']:
 c=next(c for c in cs if c['id']==cid);d.append(cid+'：'+c['source']['url'])
d+=['榜单采用11月2日当次快照：ECI — Epoch AI，CC BY 4.0 https://epoch.ai/eci ；聚合数据 liyupi/ai-model-world，MIT https://github.com/liyupi/ai-model-world 。B站入口显示名次与本次快照精度内一致，不画升降。','音乐：Carefree — Kevin MacLeod (incompetech.com). CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ 。已裁切、调音量、淡化和人声避让。','真人配音，经停顿剪辑与音量处理；AI辅助采编、画面和字幕。商标及官方演示用于识别新闻主体。人工终审待完成，本次未上传或发布。']
platforms={}
for name,title,limit in [('bili','LongCat-2.5正式版上线：Carbon、Genie 4与GDPx新进展',80),('douyin','LongCat正式版与谷歌模型新进展',30),('xhs','LongCat上线，谷歌模型新进展',20)]:
 platforms[name]={'title':title,'description':d,'tags':['AI资讯','人工智能','大模型'] if name=='bili' else [],'sceneIds':[s['id'] for s in t['scenes']],'format':{'width':1920,'height':1080,'fps':60},'video':'render/daily-ai-news-2026-11-02.mp4','cover':'render/cover.png','limits':{'titleChars':limit},'safeArea':{'top':.04,'bottom':.1,'left':.04,'right':.04},'declare':'含AI生成内容'}
(r/'variants.json').write_text(json.dumps({'schemaVersion':1,'platforms':platforms},ensure_ascii=False,indent=2)+'\n',encoding='utf8')

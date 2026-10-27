"""Review ASR spelling and derive real-speech cue windows without replacing user wording."""
from pathlib import Path
from hashlib import sha256
import json, re, difflib

ROOT = Path(__file__).resolve().parents[1]
raw = json.loads((ROOT / 'audio/asr/raw-words.json').read_text(encoding='utf-8'))
for path_key, hash_key in [('source', 'sourceSha256'), ('originalSource', 'originalSha256')]:
    assert sha256((ROOT / raw[path_key]).read_bytes()).hexdigest() == raw[hash_key], 'ASR source changed'
units = [dict(w, segment=s['id']) for s in raw['segments'] for w in s['words']]
for w in units:
    w['text'] = w['text'].strip().translate(str.maketrans({',':'，','?':'？','!':'！'}))

corrections=[]
def replace(old, new, reason):
    text=''.join(w['text'] for w in units)
    for match in reversed(list(re.finditer(re.escape(old), text))):
        offsets=[]; position=0
        for i,w in enumerate(units):
            if position<match.end() and position+len(w['text'])>match.start():offsets.append(i)
            position+=len(w['text'])
        first,last=offsets[0],offsets[-1]
        prefix=sum(len(w['text']) for w in units[:first]); chunk=''.join(w['text'] for w in units[first:last+1])
        replacement=chunk[:match.start()-prefix]+new+chunk[match.end()-prefix:]
        merged=dict(units[first],end=units[last]['end'],text=replacement)
        corrections.append({'raw':old,'text':new,'start':merged['start'],'end':merged['end'],'reason':reason})
        units[first:last+1]=[merged]

for old,new in [('看动屏幕','看懂屏幕'),('新阶段','现阶段'),('机口预览','接口预览'),('测试用力','测试用例')]:
    replace(old,new,'与原稿及上下文一致的同音 ASR 用字校订；原声不变，审听待完成')
for old,new in [('GPT-6.1Terra','GPT-6.1 Terra'),('GPT-5.6Terra','GPT-5.6 Terra'),('ChatGPT-Work','ChatGPT Work'),('HuggingFace','Hugging Face'),('OpenAI','OpenAI'),('Codex','Codex'),('Fusion','Fusion'),('skill','Skill')]:
    replace(old,new,'专有名词/口语大小写排版，保留完整词时间窗，不更换实际录音措辞')
for term in ['新模型','开发者','付费用户','合作安排','更快的算法','10月31号','技能','测试用例']:
    replace(term,term,'聚合实际词时间窗，避免字幕在词语或日期中间截断')

definitions=[
 ('overview','今日 AI 资讯','各位观众们'),
 ('terra-launch','OpenAI 发布 GPT-6.1 Terra','先看GPT-6.1 Terra'),
 ('terra-invoice','看懂发票，再录入财务软件','比如，读取一张发票'),
 ('terra-price','标准接口单价降至上一代的一半','价格方面'),
 ('terra-access','ChatGPT Work、Codex 与 API 已可用','模型已经向'),
 ('science-news','OpenAI 公布三个方向的科研结果','再看一条科研消息'),
 ('science-eth','一项关于计算难度的研究主张','其中，计算机科学'),
 ('science-limit','理论结果，怎样变成可用算法？','但这不等于'),
 ('science-review','公开研究材料，邀请外部学者核验','OpenAI已公开'),
 ('phronix-question','Phronix：让 AI 积累做事经验','接下来是一项'),
 ('phronix-method','把执行经验整理成可复用方法','研究人员'),
 ('phronix-test','在重复任务中测试经验复用','论文在30道'),
 ('phronix-limit','复用已有经验，不代表解决所有新问题','这里需要分清'),
 ('mistral-status','Mistral Large 4 权重尚待发布','然后更新一下'),
 ('mistral-date','完整模型文件预计 10 月 31 日开放','模型的公告说'),
 ('oracle-news','甲骨文公布企业软件部署智能体平台','最后是一条企业应用消息'),
 ('oracle-method','需求、设计、配置与测试分工','这些智能体'),
 ('oracle-use','面向部署 Fusion 云应用的团队','它主要服务'),
 ('closing','我们下期再见','以上是本期精选资讯'),
]
joined=''.join(w['text'] for w in units)
break_positions=set()
for phrase in ['今天的头条是OpenAI发布','官方更新中','它主要面向看懂屏幕、操作电脑','多个软件之间','模型已经向ChatGPT Work','内部AI模型在数学、计算机科学','物理三个方向','它讨论一类复杂的计算问题','我们可以确认的是','论文在30道软件修复任务','Hugging Face上目前列出的','甲骨文在当地时间10月26日公布了','它怎样把配置规则和产品经验']:
    for match in re.finditer(re.escape(phrase),joined):break_positions.add(match.end())
starts=[]
for sid,title,anchor in definitions:
    pos=joined.find(anchor)
    if pos<0:raise ValueError('Speech anchor missing: '+anchor)
    offset=0
    for index,w in enumerate(units):
        if offset+len(w['text'])>pos:break
        offset+=len(w['text'])
    starts.append(index)
assert starts==sorted(set(starts)), 'Nonmonotonic scene anchors'
for n,(sid,_,_) in enumerate(definitions):
    for w in units[starts[n]:starts[n+1] if n+1<len(starts) else len(units)]:w['scene']=sid

def visual_length(text):return sum(0.55 if ord(ch)<128 else 1 for ch in text)
cues=[];group=[]
def flush():
    if not group:return
    text=''.join(w['text'] for w in group).strip('，。！？、 ')
    if text:cues.append({'start':round(group[0]['start'],3),'end':round(group[-1]['end'],3),'text':text,'scene':group[0]['scene'],'asrSegments':sorted({w['segment'] for w in group})})
    group.clear()
position=0
for w in units:
    if group and (w['scene']!=group[0]['scene'] or w['start']-group[-1]['end']>.45 or visual_length(''.join(v['text'] for v in group)+w['text'])>24):flush()
    group.append(w)
    position+=len(w['text'])
    if position in break_positions or (re.search('[，。！？]$',w['text']) and visual_length(''.join(v['text'] for v in group))>=5 and w['end']-group[0]['start']>=.55):flush()
flush()
# Keep short continuations with their neighboring phrase rather than flash fragments.
for i in range(len(cues)-1,-1,-1):
    if cues[i]['end']-cues[i]['start']<.3:
        if i and cues[i-1]['scene']==cues[i]['scene']:
            cues[i-1].update(end=cues[i]['end'],text=cues[i-1]['text']+cues[i]['text']);del cues[i]
        elif i+1<len(cues) and cues[i+1]['scene']==cues[i]['scene']:
            cues[i+1].update(start=cues[i]['start'],text=cues[i]['text']+cues[i+1]['text']);del cues[i]
        else:raise ValueError('Isolated short cue requires review')
for i,c in enumerate(cues):
    assert c['end']>c['start'] and (not i or c['start']>=cues[i-1]['end']-.001),c
source_in=1.15;source_out=259.1
assert source_in<=cues[0]['start'] and source_out>=cues[-1]['end']
draft=(ROOT/'audio/source/manuscript-received.md').read_text(encoding='utf-8').split('## 朗读正文\n')[1].split('## 录音说明')[0]
normalize=lambda s:re.sub(r'[^\w]','',s.lower())
ratio=difflib.SequenceMatcher(None,normalize(draft),normalize(joined),autojunk=False).ratio()
result={'schemaVersion':1,'source':'audio/source/narration-decoded.wav','sourceSha256':sha256((ROOT/'audio/source/narration-decoded.wav').read_bytes()).hexdigest(),'originalSource':raw['originalSource'],'originalSha256':raw['originalSha256'],'sourceDuration':raw['duration'],'sourceIn':source_in,'sourceOut':source_out,'edit':'仅去掉首尾空白，保留内部停顿和个人评论；不加速。原 MP3 解码有坏包提示，时间窗统一以保留的 PCM 解码音轨为准。','timing':'large-v3-turbo 真实词时间窗聚合，非按稿件字数摊时','similarityToDraft':round(ratio,4),'actualWording':['保留“感觉这个就有点像 Skill 啊”的个人评论','录音未念 Phronix 和 Mistral 完整名称，由画面明确展示主体','保留“研究成果”“证明资料”“多长时间”等实际改词'],'corrections':corrections,'cues':cues,'scenes':[{'id':sid,'title':title,'anchor':anchor,'firstWord':units[starts[i]]['start'],'priorWordEnd':units[starts[i]-1]['end'] if starts[i] else source_in} for i,(sid,title,anchor) in enumerate(definitions)],'listening':{'status':'pending','note':'ASR 与稿件已核对；未把技术/文本检查当作人工审听。Oracle 段“Fusion 云应用和 AI 智能体平台”保留录音表述，标题明确为用于部署云应用的平台。'}}
(ROOT/'audio/recording-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'audio/asr/reviewed-transcript.txt').write_text('\n'.join(f"[{c['start']:.2f}-{c['end']:.2f}] {c['text']}" for c in cues)+'\n',encoding='utf-8')
(ROOT/'narration-recorded.md').write_text('# 本期实际录音文本\n\n原声为准；以下由词级转写和用字校订形成，保留用户个人评论，不覆盖最初交付稿。\n\n'+'\n\n'.join(''.join(c['text']+'。' for c in cues if c['scene']==s[0]) for s in definitions)+'\n',encoding='utf-8')
print('Reviewed',len(cues),'cues across',len(definitions),'speech shots; similarity',round(ratio,4),'voice seconds',source_out-source_in)

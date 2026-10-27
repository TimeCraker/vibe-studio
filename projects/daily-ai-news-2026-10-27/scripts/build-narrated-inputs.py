"""Build the production timeline from reviewed real-speech windows and frozen facts/media."""
from pathlib import Path
from hashlib import sha256
import json, shutil
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/name).read_text(encoding='utf-8'))
def write(name,value):(ROOT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
r=read('audio/recording-review.json')
assert sha256((ROOT/r['source']).read_bytes()).hexdigest()==r['sourceSha256']
assert sha256((ROOT/r['originalSource']).read_bytes()).hexdigest()==r['originalSha256']
fps=60; ranking_seconds=7; intro=ranking_seconds*2; voice=r['sourceOut']-r['sourceIn'];total_frames=round((intro+voice+.8)*fps);seconds=total_frames/fps
if not (ROOT/'claims.json').exists():write('claims.json',read('storyboard.json')['claims'])
boundaries=[intro if i==0 else round((intro+(s['firstWord']+s['priorWordEnd'])/2-r['sourceIn'])*fps)/fps for i,s in enumerate(r['scenes'])]
def claim_ids(sid):
    if sid.startswith('terra'):return ['terra-release']
    if sid.startswith('science'):return ['science-announcement']
    if sid.startswith('phronix'):return ['phronix-study']
    if sid.startswith('mistral'):return ['mistral-status']
    if sid.startswith('oracle'):return ['oracle-platform']
    return [] if sid=='closing' else ['terra-release','science-announcement','phronix-study','mistral-status','oracle-platform']
scenes=[{'id':'global','title':'全球 AI 模型综合能力 TOP15','start':0,'end':ranking_seconds,'purpose':'当期榜单与官标，只配 BGM','subject':'全球 ECI TOP15','claimIds':['ranking']},{'id':'domestic','title':'国产 AI 模型综合能力 TOP15','start':ranking_seconds,'end':intro,'purpose':'相同网格、说明与数据查询时间','subject':'国内 ECI TOP15','claimIds':['ranking']}]
for i,s in enumerate(r['scenes']):scenes.append({'id':s['id'],'title':s['title'],'start':boundaries[i],'end':boundaries[i+1] if i+1<len(boundaries) else seconds,'purpose':'按真实词窗口和语义换镜头，原图与中文解释配合','subject':s['title'],'claimIds':claim_ids(s['id'])})
cues=[{'id':i+1,'scene':c['scene'],'text':c['text'],'from':round((intro+c['start']-r['sourceIn'])*fps),'to':round((intro+c['end']-r['sourceIn'])*fps),'sourceStart':c['start'],'sourceEnd':c['end']} for i,c in enumerate(r['cues'])]
for i,c in enumerate(cues):
    assert 0<=c['from']<c['to']<=total_frames and (i==0 or c['from']>=cues[i-1]['to']),c
    shot=next(s for s in scenes if s['id']==c['scene']);assert c['from']/fps>=shot['start']-.02 and c['to']/fps<=shot['end']+.02,c
write('timeline.json',{'date':'2026-10-27','fps':fps,'width':1920,'height':1080,'durationInFrames':total_frames,'seconds':seconds,'voice':'human-recorded','timingMode':'large-v3-turbo-word-windows-text-reviewed-listening-pending','recording':r['originalSource'],'recordingSha256':r['originalSha256'],'decodedRecording':r['source'],'sourceIn':r['sourceIn'],'sourceOut':r['sourceOut'],'voiceStart':intro,'scenes':scenes,'cues':cues})
write('storyboard.json',{'schemaVersion':1,'audience':'关注 AI 模型和实际用途的普通观众与独立开发者','goal':'说清本期模型发布、科研主张、经验复用研究与两条简讯','profile':'data','claims':read('claims.json'),'scenes':scenes,'review':{'status':'pending','notes':'根据本期真人录音生成，程序与 ASR 核对不代表人工视听接受。'}})
write('script.json',{'meta':{'title':'今日 AI 资讯 · 真人录音采用稿','lang':'zh','budgetSeconds':voice,'charsPerSecond':5.8,'bannedWords':[]},'segments':[{'id':c['id'],'kind':'subtitle','text':c['text'],'ref':'scene '+c['scene']} for c in cues]})
def srt(t):
    ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(ROOT/'captions.srt').write_text('\n'.join(f"{i+1}\n{srt(c['from']/fps)} --> {srt(c['to']/fps)}\n{c['text']}\n" for i,c in enumerate(cues)),encoding='utf-8')
write('captions.cues.json',{'subtitles':[{'start':round(c['from']/fps,3),'end':round(c['to']/fps,3),'text':c['text']} for c in cues]})
write('audio-voice.json',{'schemaVersion':1,'duration':voice,'target':{'integrated':-18,'truePeak':-2,'range':9},'ducking':False,'tracks':[{'file':r['source'],'role':'voice','in':r['sourceIn'],'duration':voice,'fadeIn':.03,'fadeOut':.08,'highpassHz':65}]})
write('audio.json',{'schemaVersion':1,'duration':seconds,'target':{'integrated':-16,'truePeak':-2,'range':11},'ducking':{'threshold':.03,'ratio':6,'attack':12,'release':280},'tracks':[{'file':'audio/voice-clean.wav','role':'voice','start':intro,'duration':voice},{'file':'assets/carefree.mp3','role':'music','duration':14.5,'gainDb':-4,'fadeIn':.7,'fadeOut':.6},{'file':'assets/carefree.mp3','role':'music','start':13.5,'in':13.5,'duration':187.5,'gainDb':-15,'fadeIn':.8,'fadeOut':2.5},{'file':'assets/carefree.mp3','role':'music','start':198.5,'in':8.5,'duration':round(seconds-198.5,6),'gainDb':-15,'fadeIn':2.5,'fadeOut':1.2}]})
write('qc.json',{'width':1920,'height':1080,'fps':fps,'duration':seconds,'subtitles':{'maxCharsPerSecond':14}})
edition=read('edition.json');edition.update(status='human-recording-aligned-render-pending',rankingSeconds=ranking_seconds,adoptedNarration='narration-recorded.md',adoptedNarrationSha256=sha256((ROOT/'narration-recorded.md').read_bytes()).hexdigest(),scriptSync='actual-recording-adopted')
edition['production'].update(humanRecording='received-and-preserved',asrAlignment='word-windows-text-reviewed-listening-pending',render='pending',humanReview='pending');write('edition.json',edition)
public=ROOT/'remotion-app/public/edition';(public/'assets').mkdir(parents=True,exist_ok=True)
records=read('assets/sources.json');files={r['file'] for r in records if r.get('selection')=='selected' and r.get('file','').startswith('assets/') and Path(r['file']).suffix not in ['.pdf','.mp3']}
files.add('assets/mistral-large-4.svg')
ranking=read('ranking.json');files.update('assets/'+row['icon'] for row in ranking['global']+ranking['domestic'])
crops=[('terra-model-detail.png','terra-model-page.png',(245,140,1250,650)),('terra-pricing-detail.png','terra-pricing-page.png',(460,210,1250,365)),('mistral-status-detail.png','mistral-release-status.png',(330,145,1000,350))]
by_file={r['file']:r for r in records if 'file' in r}
for name,parent,box in crops:
    src=ROOT/'assets'/parent;out=ROOT/'assets'/name
    with Image.open(src) as im:im.crop(box).save(out)
    by_file['assets/'+name]={'file':'assets/'+name,'derivedFrom':'assets/'+parent,'parentSha256':sha256(src.read_bytes()).hexdigest(),'sha256':sha256(out.read_bytes()).hexdigest(),'sourcePage':by_file['assets/'+parent]['sourcePage'],'adaptation':'原始截图主体区域裁切；未改原页面文字','crop':box,'status':'local-verified','selection':'selected','rights':by_file['assets/'+parent]['rights']}
    files.add('assets/'+name)
write('assets/sources.json',list(by_file.values())+[r for r in records if 'file' not in r])
for rel in files:shutil.copyfile(ROOT/rel,public/rel)
print('Built',len(scenes),'scenes and',len(cues),'real-word-window subtitles;',seconds,'seconds at native 60fps.')

"""Read, never overwrite, the delivered manuscript and prepare recording handoff."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess

root=Path(__file__).resolve().parents[1]
load=lambda name:json.loads((root/name).read_text(encoding='utf-8'))
write=lambda name,value:(root/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if (root/'audio/recording.json').exists():
    raise ValueError('Recording already adopted: review actual ASR, do not rebuild draft inputs')
manuscript=root/'narration.md'
original=manuscript.read_bytes()
body=original.decode('utf-8').split('## 朗读正文',1)[1].split('## 录音说明',1)[0].strip()
paragraphs=[part.strip() for part in re.split(r'\n\s*\n',body) if part.strip()]
content=load('content.json')
if len(paragraphs)!=len(content['scenes']):
    raise ValueError('Paragraph count changed; review the actual scene mapping')
claims=load('claims.json')
claim_ids={claim['id'] for claim in claims}
for claim in claims:
    source=claim['source']
    if source.get('path') and not (root/source['path']).is_file():
        raise ValueError('Missing preserved fact source: '+claim['id'])
for scene in content['scenes']:
    if not set(scene.get('claimIds',[]))<=claim_ids:
        raise ValueError('Unknown fact reference: '+scene['id'])
    if scene.get('anchor'):
        raise ValueError('Draft script must not pretend its anchors were ASR-reviewed')
    if scene.get('media'):
        media=scene['media']
        if not (root/media['file']).is_file():
            raise ValueError('Missing planned actual media: '+media['file'])
        if media.get('poster') and not (root/media['poster']).is_file():
            raise ValueError('Missing poster: '+media['poster'])
script={'meta':{'title':'2026 年 10 月 28 日 今日 AI 资讯','lang':'zh-CN','budgetSeconds':300,'charsPerSecond':4.5,
                'bannedWords':['震撼','遥遥领先','颠覆一切']},
        'segments':[{'id':f'n{i+1:02}','kind':'voiceover','text':text,'ref':scene['id']} for i,(scene,text) in enumerate(zip(content['scenes'],paragraphs))]}
write('script.json',script)
edition=load('edition.json')
edition.update(status='script-ready-awaiting-human-recording',headStory='lfm3',storyOrder=['lfm3','minicpm-ocr','spark','ling','dotnet'],
               narrationBodySha256=sha256(body.encode('utf-8')).hexdigest(),narrationSha256=sha256(original).hexdigest(),
               production={'humanRecording':'pending','asrAlignment':'pending','render':'not-started','humanReview':'pending','publish':'not-started'})
write('edition.json',edition)
records=load('assets/sources.json')
by_file={record['file']:record for record in records}
demo='assets/minicpm-official-chinese-demo.mp4'
probe=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(root/demo)],capture_output=True,text=True,check=True)
meta=json.loads(probe.stdout)
video=next(stream for stream in meta['streams'] if stream['codec_type']=='video')
duration=float(meta['format']['duration'])
if abs(duration-18.4)>.05:
    raise ValueError('Official GIF conversion changed duration')
by_file[demo]={'file':demo,'sourcePage':'https://github.com/OpenBMB/MiniCPM-OCR','derivedFrom':'assets/minicpm-chinese-examples.gif',
 'sourceSha256':by_file['assets/minicpm-chinese-examples.gif']['sha256'],'sha256':sha256((root/demo).read_bytes()).hexdigest(),
 'rights':by_file['assets/minicpm-chinese-examples.gif']['rights'],'selection':'prepared-not-yet-in-video',
 'status':'local-probed-decoded-and-keyframe-viewed','technical':{'width':video['width'],'height':video['height'],'fps':video['r_frame_rate'],'seconds':duration,'sourceKind':'official example GIF, no source audio'},
 'review':'已查看 0.8 秒原文/布局/Markdown 对照帧；不是实机连续录屏，未声称完整视听终审。'}
poster='assets/minicpm-demo-poster.png'
by_file[poster]={'file':poster,'sourcePage':'https://github.com/OpenBMB/MiniCPM-OCR','derivedFrom':demo,'sha256':sha256((root/poster).read_bytes()).hexdigest(),
 'rights':by_file[demo]['rights'],'selection':'prepared-not-yet-in-video','status':'actual-frame-viewed','sourceTime':0.8}
for file in ['assets/liquid-logo.png','assets/minicpm-jev-case.png']:
    by_file[file]['status']='local-file-viewed-source-hash-retained'
write('assets/sources.json',list(by_file.values()))
write('media-plan.json',{'schemaVersion':1,'timingStatus':'pending-human-recording','shots':[{'sceneId':scene['id'],
 'purpose':scene.get('purpose',scene.get('lead','')),'inputs':[scene['media']['file']] if scene.get('media') else [],
 'clipCandidates':[{'file':scene['media']['file'],'sourceIn':scene['media']['sourceIn'],'sourceOut':scene['media']['sourceOut'],'status':'candidate-not-yet-in-final'}] if scene.get('media',{}).get('kind')=='video' else []} for scene in content['scenes']],
 'missing':[{'sceneId':'lfm-decisions','entry':'https://www.youtube.com/watch?v=gYaRfmLqCNg','status':'official-entry-found-file-not-acquired',
 'attempts':['Official blog embed found; public download requested sign-in; no cookies or user login accessed','Checked official d1-2B and LFM3-VL-2B repository media inventory; no downloadable mp4/gif/webm found','Publisher social search did not yield a usable matching official clip'],
 'fallback':'来源明确的文字图解或原发布页截图；取得原文件后再选择片段，不能称已剪入。'}],
 'meaning':'Recording-stage shot intentions; no precise scene timing or actual inclusion is claimed.'})
write('evidence/script-handoff.json',{'checkedAt':datetime.now(timezone.utc).isoformat(),'manuscriptSha256':sha256(original).hexdigest(),
 'paragraphs':len(paragraphs),'speechCharacters':len(re.sub(r'\s','',body)),'sceneIds':[scene['id'] for scene in content['scenes']],
 'factSourcesExist':True,'draftAnchorsAwaitAsr':True,'nativeOutputIntent':'1920x1080 60fps after real recording',
 'humanRecording':'pending','fullRender':'not-started','humanReview':'pending','publication':'not-started'})
if manuscript.read_bytes()!=original:
    raise ValueError('Manuscript changed during handoff generation')
print(json.dumps({'paragraphs':len(paragraphs),'speechCharacters':len(re.sub(r'\s','',body)),'manuscriptUnchanged':True,'status':edition['status']},ensure_ascii=False))

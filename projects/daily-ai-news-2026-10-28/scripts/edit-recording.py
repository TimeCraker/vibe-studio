"""Apply the authorized speech edit, preserving the raw source and an exact EDL."""
from hashlib import sha256
import json
from pathlib import Path
import re
import shutil
import subprocess
import wave
import numpy as np

root=Path(__file__).resolve().parents[1]
load=lambda name:json.loads((root/name).read_text(encoding='utf-8'))
write=lambda name,value:(root/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
record=load('audio/recording.json')
baseline=root/'audio/recording-import.json'
if baseline.exists():
    record=load('audio/recording-import.json')
else:
    shutil.copyfile(root/'audio/recording.json',baseline)
    shutil.copyfile(root/'audio/asr/raw-words.json',root/'audio/asr/raw-original-words.json')
    shutil.copyfile(root/'audio/asr/raw-transcript.txt',root/'audio/asr/raw-original-transcript.txt')
source=root/record['source']
if sha256(source.read_bytes()).hexdigest()!=record['sourceSha256']:
    raise ValueError('Preserved raw PCM changed')
with wave.open(str(source),'rb') as audio:
    rate,channels,width=audio.getframerate(),audio.getnchannels(),audio.getsampwidth()
    if (rate,channels,width)!=(48000,2,2):
        raise ValueError('Unexpected source clock')
    pcm=np.frombuffer(audio.readframes(audio.getnframes()),dtype='<i2').reshape(-1,channels).copy()
duration=len(pcm)/rate
cuts=[
 {'start':32.17,'end':32.60,'reason':'“文本模型参数约17亿参数”中前一次“参数”重复，保留完整数字与句意。','kind':'duplicate-word'},
 {'start':171.80,'end':172.62,'reason':'移去卡顿式连接语“主要由于”，保留“发布了安全更新，修复解压库漏洞”。','kind':'phrase-edit'},
 {'start':174.95,'end':186.72,'reason':'移去未说完的“需要重点排查的是”和重读前长停顿，保留末尾完整“相关更新以微软公告为准”。','kind':'unfinished-take'}
]
silence=(root/'audio/asr/silences.txt').read_text(encoding='utf-8')
starts=[float(value) for value in re.findall(r'silence_start: ([\d.]+)',silence)]
ends=[float(value) for value in re.findall(r'silence_end: ([\d.]+)',silence)]
for a,b in zip(starts,ends):
    if b-a<.72 or a<2.3 or b>188.84:
        continue
    # Keep breathing room around sentence/section changes and short internal gaps.
    retained=.46 if any(abs(a-point)<.3 for point in [13.275,30.203,61.688,95.47,114.647,146.222]) else .30
    start,end=a+retained/2,b-retained/2
    cuts.append({'start':round(start,6),'end':round(end,6),'reason':f'实际低能量静音 {b-a:.3f}s，保留约 {retained:.2f}s 呼吸间隔。','kind':'silence-edit'})
cuts.append({'start':0,'end':2.3,'reason':'首部空白与准备声。','kind':'head-trim'})
cuts.append({'start':188.84,'end':duration,'reason':'末句后保留约0.2秒，再去除尾空白。','kind':'tail-trim'})
cuts.sort(key=lambda item:item['start'])
merged=[]
for item in cuts:
    if merged and item['start']<=merged[-1]['end']:
        merged[-1]['end']=max(merged[-1]['end'],item['end'])
        merged[-1]['reasons'].append(item['reason'])
    else:
        merged.append({'start':item['start'],'end':item['end'],'reasons':[item['reason']]})
keeps=[];cursor=0
for cut in merged:
    if cut['start']>cursor:
        keeps.append((cursor,cut['start']))
    cursor=max(cursor,cut['end'])
if cursor<duration:
    keeps.append((cursor,duration))
parts=[];mapping=[];out=0
fade_samples=round(.004*rate)
for start,end in keeps:
    first,last=round(start*rate),round(end*rate)
    if last<=first:
        continue
    piece=pcm[first:last].astype(np.float64)
    fade=min(fade_samples,len(piece)//4)
    if fade:
        ramp=np.linspace(0,1,fade,endpoint=True)[:,None]
        piece[:fade]*=ramp;piece[-fade:]*=ramp[::-1]
    piece=np.clip(np.rint(piece),-32768,32767).astype('<i2')
    mapping.append({'sourceIn':first/rate,'sourceOut':last/rate,'outputIn':out/rate,'outputOut':(out+len(piece))/rate,'speed':1.0,'fadeInOutMs':4})
    out+=len(piece);parts.append(piece)
edited=np.concatenate(parts)
destination=root/'audio/source/narration-edited-v1.wav'
with wave.open(str(destination),'wb') as audio:
    audio.setnchannels(channels);audio.setsampwidth(width);audio.setframerate(rate);audio.writeframes(edited.tobytes())
asr=root/'audio/source/narration-edited-asr-v1.wav'
subprocess.run(['ffmpeg','-v','error','-i',str(destination),'-ar','16000','-ac','1','-c:a','pcm_s16le','-y',str(asr)],check=True)
edl={'schemaVersion':1,'authorization':'User explicitly requested removal of stumbles/retakes and allowed speed processing; this edit uses original speed with short fades.',
 'originalSource':record['originalSource'],'originalSha256':record['originalSha256'],'source':record['source'],'sourceSha256':record['sourceSha256'],
 'sourceDuration':duration,'editedFile':destination.relative_to(root).as_posix(),'editedSha256':sha256(destination.read_bytes()).hexdigest(),
 'editedDuration':len(edited)/rate,'removedSeconds':duration-len(edited)/rate,'edits':cuts,'mergedRemovedIntervals':merged,'keptIntervals':mapping,
 'processing':'Exact original PCM segments concatenated with 4ms edge fades; original pitch and playback speed retained. No synthetic speech.',
 'reviewScope':'Word-level ASR plus focused independent ASR and measured silence. Full subjective listening not certified.'}
write('audio/edit-decision.json',edl)
adopted={**record,'source':destination.relative_to(root).as_posix(),'sourceSha256':edl['editedSha256'],
 'asrSource':asr.relative_to(root).as_posix(),'asrSha256':sha256(asr.read_bytes()).hexdigest(),'sourceDuration':edl['editedDuration'],
 'rawDecodedSource':record['source'],'rawDecodedSha256':record['sourceSha256'],'editDecision':'audio/edit-decision.json',
 'editDecisionSha256':sha256((root/'audio/edit-decision.json').read_bytes()).hexdigest(),
 'clock':'Edited 48kHz PCM with preserved raw lineage and authorized EDL; original MP3 unchanged; original speed 1.0.'}
write('audio/recording.json',adopted)
print(json.dumps({'originalSeconds':duration,'editedSeconds':edl['editedDuration'],'removedSeconds':edl['removedSeconds'],'cutIntervals':len(merged),'speed':1.0,'originalUnchanged':sha256((root/record['originalSource']).read_bytes()).hexdigest()==record['originalSha256']},ensure_ascii=False))

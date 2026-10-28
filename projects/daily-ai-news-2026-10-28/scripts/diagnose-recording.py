"""Second-pass ASR for hesitant spans, without forcing the full draft wording."""
from hashlib import sha256
import json
from pathlib import Path
import subprocess
import sys
from faster_whisper import WhisperModel

root=Path(__file__).resolve().parents[1]
record=json.loads((root/'audio/recording.json').read_text(encoding='utf-8'))
source=root/record['source']
if sha256(source.read_bytes()).hexdigest()!=record['sourceSha256']:
    raise ValueError('Preserved recording clock changed')
model=WhisperModel(str(root.parents[1]/'.cache/asr-models/large-v3-turbo'),device='cpu',compute_type='int8',cpu_threads=8)
results=[]
windows=[('license-close',135.7,140.7),('date-close',164.2,172),('unfinished',174.8,181.2),('ending',181.2,record['sourceDuration'])] if '--micro' in sys.argv else [('opening',0,34),('license',130,148),('tail',160,record['sourceDuration'])]
for label,start,end in windows:
    target=root/f'audio/asr/diagnostic-{label}.wav'
    subprocess.run(['ffmpeg','-v','error','-ss',str(start),'-t',str(end-start),'-i',str(source),'-ar','16000','-ac','1','-y',str(target)],check=True)
    segments,info=model.transcribe(str(target),language='zh',beam_size=5,word_timestamps=True,
       vad_filter=False,condition_on_previous_text=False,
       initial_prompt='今日AI资讯，Liquid AI，LFM3，OpenBMB，MiniCPM-OCR，Jev，讯飞，Spark，蚂蚁百灵，Ling，MIT，Apache，Brotli，微软。')
    items=[]
    for segment in segments:
        items.append({'start':round(start+segment.start,3),'end':round(start+segment.end,3),'text':segment.text,
          'words':[{'start':round(start+w.start,3),'end':round(start+w.end,3),'text':w.word,'probability':w.probability} for w in segment.words or []]})
        print(label,items[-1]['start'],items[-1]['end'],segment.text,flush=True)
    results.append({'label':label,'sourceIn':start,'sourceOut':end,'segments':items})
(root/('audio/asr/diagnostic-micro-words.json' if '--micro' in sys.argv else 'audio/asr/diagnostic-words.json')).write_text(json.dumps({'model':'large-v3-turbo','source':record['source'],
 'sourceSha256':record['sourceSha256'],'wordTimestamps':True,'vad':False,'fullDraftPrompt':False,'windows':results},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

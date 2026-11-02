"""Validate this edition's file and extract explicitly indexed visual samples."""
from pathlib import Path
from hashlib import sha256
import json
import subprocess
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]
video=root/'render/daily-ai-news-2026-11-02.mp4'
timeline=json.loads((root/'timeline.json').read_text(encoding='utf-8'))
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert v['width']==1920 and v['height']==1080 and v['avg_frame_rate']=='60/1'
assert int(v['nb_frames'])==timeline['durationInFrames']
assert any(s['codec_type']=='audio' for s in probe['streams'])
assert abs(float(probe['format']['duration'])-timeline['seconds'])<.05
times=[1,8,18,29,35,41,47,54,62,68,74,85,96,105,117,125,136,140,146.5,148.7,155,163,167]
out=root/'qa/final-frames';out.mkdir(exist_ok=True)
contact=Image.new('RGB',(1920,6*294),'#f7f5ef');draw=ImageDraw.Draw(contact)
index=[]
for i,t in enumerate(times):
 path=out/f'{t}.jpg'
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(video),'-frames:v','1','-q:v','2',str(path)],check=True)
 im=Image.open(path).convert('RGB');im.thumbnail((480,270))
 x,y=(i%4)*480,(i//4)*294
 contact.paste(im,(x,y));draw.text((x+10,y+273),f'{t:.2f}s',fill='#191a17')
 index.append({'time':t,'file':path.relative_to(root).as_posix(),'sha256':sha256(path.read_bytes()).hexdigest()})
contact.save(root/'qa/final-contact.jpg',quality=92)
report={'video':'render/daily-ai-news-2026-11-02.mp4','videoSha256':sha256(video.read_bytes()).hexdigest(),
 'formatVerified':{'width':v['width'],'height':v['height'],'fps':v['avg_frame_rate'],'frames':int(v['nb_frames']),'seconds':float(probe['format']['duration'])},
 'frames':index,'scope':'Indexed static samples only; no claim of continuous viewing, subjective audio or human acceptance.'}
(root/'qa/final-frame-index.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report['formatVerified']))

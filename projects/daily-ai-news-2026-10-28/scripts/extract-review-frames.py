"""Extract timestamped actual final MP4 frames for visual inspection, not continuous viewing."""
from hashlib import sha256
import json
from pathlib import Path
import subprocess
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
video=ROOT/'render/daily-ai-news-2026-10-28.mp4'
times=[1,8,15,27,44,59,76,89,93,100,108,114,126,137,146,151,162,169,177.5]
folder=ROOT/'qa/final-frames';folder.mkdir(exist_ok=True)
canvas=Image.new('RGB',(1920,((len(times)+3)//4)*297),'#ddd');draw=ImageDraw.Draw(canvas)
for index,time in enumerate(times):
    image=folder/(str(time)+'.png')
    subprocess.run(['ffmpeg','-v','error','-ss',str(time),'-i',str(video),'-frames:v','1','-y',str(image)],check=True)
    x,y=(index%4)*480,(index//4)*297
    canvas.paste(Image.open(image).resize((480,270)),(x,y))
    draw.text((x+10,y+274),str(time)+'s',fill='black')
canvas.save(ROOT/'qa/final-contact.png')
report={'video':video.relative_to(ROOT).as_posix(),'sha256':sha256(video.read_bytes()).hexdigest(),'times':times,'scope':'Single decoded frame per timestamp. Static composition checks; not proof of continuous viewing or listening.'}
(ROOT/'qa/final-frame-index.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Extracted',len(times),'actual final MP4 frames.')

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
p = Path(__file__).resolve().parent.parent
image = Image.new('RGB', (1080, 1440), '#f7f5ef')
d = ImageDraw.Draw(image)
font = 'C:/Windows/Fonts/msyhbd.ttc'
mono = 'C:/Windows/Fonts/consola.ttf'
f = lambda n: ImageFont.truetype(font, n)
m = lambda n: ImageFont.truetype(mono, n)
d.rectangle((32, 32, 1048, 1408), outline='#cfcec3', width=2)
d.rectangle((78, 80, 99, 101), fill='#a8513c')
d.text((120, 69), '每日 AI', font=f(42), fill='#191a17')
d.text((790, 78), '2026.10.27', font=m(25), fill='#74766a')
d.line((78, 140, 1002, 140), fill='#cfcec3', width=2)
d.text((78, 195), 'OPENAI / 模型发布', font=f(30), fill='#a8513c')
icon = Image.open(p / 'assets/terra-model-icon.png').convert('RGBA').resize((136, 136), Image.Resampling.LANCZOS)
image.paste(icon, (78, 270), icon)
d.text((240, 295), 'GPT-6.1 Terra', font=f(64), fill='#191a17')
d.text((72, 465), 'Terra 发布', font=f(119), fill='#191a17')
d.text((72, 625), '看图，操作电脑', font=f(82), fill='#a8513c')
d.line((78, 805, 1002, 805), fill='#a8513c', width=4)
d.text((78, 855), '标准接口单价', font=f(43), fill='#191a17')
d.text((78, 915), '降至上一代的一半', font=f(55), fill='#191a17')
d.text((78, 1070), '视觉理解 · 电脑操作 · 每日 AI 资讯', font=f(32), fill='#74766a')
d.text((78, 1320), '相较 GPT-5.6 Terra 标准输入／输出单价', font=f(24), fill='#74766a')
image.save(p / 'render/cover-vertical-34.png')

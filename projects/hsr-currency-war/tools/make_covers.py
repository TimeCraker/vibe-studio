# -*- coding: utf-8 -*-
# 封面合成：B站横版 1920x1080 + 抖音竖版 1080x1920。浅色实心面板压深色玻璃底，金色数据行。
# 用法：python tools/make_covers.py
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
QA = os.path.join(PROJ, "qa")
OUT = os.path.join(os.path.dirname(os.path.dirname(PROJ)), "products", "hsr-currency-war")
os.makedirs(OUT, exist_ok=True)

YHEI_B = r"C:\Windows\Fonts\msyhbd.ttc"
YHEI = r"C:\Windows\Fonts\msyh.ttc"

INK_PANEL = (5, 8, 16, 168)
GOLD = (240, 215, 140)
LILAC = (143, 168, 255)
WHITE = (245, 247, 255)

def font(path, size):
    return ImageFont.truetype(path, size)

def panel(draw, box, radius=18):
    draw.rounded_rectangle(box, radius=radius, fill=INK_PANEL, outline=(255, 255, 255, 36), width=2)

def make_horizontal():
    bg = Image.open(os.path.join(QA, "cover-a.png")).convert("RGB")
    # 2560x1440 -> 1920x1080 center crop
    bg = bg.resize((1920, 1080), Image.LANCZOS)
    img = bg.convert("RGBA")
    # 右侧文字区轻压暗，保证对比
    scrim = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    sd.rectangle([1050, 0, 1920, 1080], fill=(5, 8, 16, 96))
    scrim = scrim.filter(ImageFilter.GaussianBlur(2))
    img = Image.alpha_composite(img, scrim)

    d = ImageDraw.Draw(img)
    panel(d, [1090, 300, 1840, 900])
    f_kicker = font(YHEI_B, 34)
    f_main = font(YHEI_B, 122)
    f_sub = font(YHEI_B, 38)
    d.text((1130, 340), "崩坏：星穹铁道 · 货币战争", font=f_kicker, fill=LILAC)
    d.text((1126, 402), "三星昔涟银狼", font=f_main, fill=WHITE)
    d.text((1126, 552), "这把直接爽局", font=f_main, fill=WHITE)
    d.text((1130, 726), "敌人血量 1000% · GM 操作台", font=f_sub, fill=GOLD)
    d.text((1130, 786), "单段伤害 9999 亿", font=f_sub, fill=GOLD)
    img.convert("RGB").save(os.path.join(OUT, "cover-bilibili.png"), quality=95)
    print("cover-bilibili.png OK")

def make_vertical():
    bg = Image.open(os.path.join(QA, "cover-a.png")).convert("RGB")
    # 2560x1440 -> 竖版 1080x1920：取画面中部竖裁（角色+星球在右中）
    # 1440 高全保留 -> 宽 1080：从 x=1050 起（星球+手居中）
    crop = bg.crop((1050, 0, 2130, 1440)).resize((1080, 1920), Image.LANCZOS)
    img = crop.convert("RGBA")
    d = ImageDraw.Draw(img)
    panel(d, [60, 1330, 1020, 1850])
    f_kicker = font(YHEI_B, 34)
    f_main = font(YHEI_B, 108)
    f_sub = font(YHEI_B, 36)
    d.text((100, 1372), "崩坏：星穹铁道 · 货币战争", font=f_kicker, fill=LILAC)
    d.text((96, 1430), "三星昔涟银狼", font=f_main, fill=WHITE)
    d.text((96, 1556), "这把直接爽局", font=f_main, fill=WHITE)
    d.text((100, 1700), "血量1000% · 9999亿", font=f_sub, fill=GOLD)
    img.convert("RGB").save(os.path.join(OUT, "cover-douyin.png"), quality=95)
    print("cover-douyin.png OK")

if __name__ == "__main__":
    make_horizontal()
    make_vertical()

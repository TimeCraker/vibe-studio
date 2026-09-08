# -*- coding: utf-8 -*-
"""工作台截图圈注：编号圆徽 + 元素圈线（warm 主题珊瑚色）；eai-04 的 e听说账号脱敏。
输入 assets/screenshots/eai-*.png，输出同目录 ann-*.png。2x 超采样抗锯齿。可复跑。"""
import os
from PIL import Image, ImageDraw, ImageFont

SS = 2  # supersample
CORAL = (204, 120, 92)     # CC785C 与 deck warm 主题一致
WHITE = (255, 255, 255)
INK = (28, 25, 23)
FONT_NUM = "C:/Windows/Fonts/arialbd.ttf"
FONT_CN = "C:/Windows/Fonts/msyh.ttc"
HERE = os.path.join(os.path.dirname(__file__), "..", "assets", "screenshots")


def annotate(src, dst, circles, masks=None):
    """circles = [(编号, x0, y0, x1, y1), ...] 元素像素框（1920x1080 原图坐标）
    masks = [(x0, y0, x1, y1, 替换文本), ...] 先脱敏再圈注"""
    im = Image.open(os.path.join(HERE, src)).convert("RGB")
    if masks:
        d0 = ImageDraw.Draw(im)
        for x0, y0, x1, y1, repl in masks:
            d0.rectangle([x0, y0, x1, y1], fill=WHITE)
            f = ImageFont.truetype(FONT_CN, 16)
            d0.text((x0 + 6, y0 + (y1 - y0 - 16) // 2 - 2), repl, fill=INK, font=f)
    w, h = im.size
    big = im.resize((w * SS, h * SS), Image.LANCZOS)
    d = ImageDraw.Draw(big)
    fnum = ImageFont.truetype(FONT_NUM, 15 * SS)
    for n, x0, y0, x1, y1 in circles:
        pad = 5 * SS
        bx = [x0 * SS - pad, y0 * SS - pad, x1 * SS + pad, y1 * SS + pad]
        d.ellipse(bx, outline=CORAL, width=4 * SS)
        r = 16 * SS
        cx, cy = bx[0], bx[1]  # 圆徽落在圈线左上角
        d.ellipse([cx - r // 2, cy - r // 2, cx + r // 2, cy + r // 2],
                  fill=CORAL, outline=WHITE, width=2 * SS)
        tb = d.textbbox((0, 0), str(n), font=fnum)
        d.text((cx - (tb[2] - tb[0]) / 2 - tb[0], cy - (tb[3] - tb[1]) / 2 - tb[1]),
               str(n), fill=WHITE, font=fnum)
    out = big.resize((w, h), Image.LANCZOS)
    out.save(os.path.join(HERE, dst))
    print("OK", dst)


# ①-④ 与 deck 侧栏圈注一一对应（坐标 2026-09-08 实截 1920x1080）
annotate("eai-01-login.png", "ann-login.png", [
    (1, 1384, 494, 1816, 529),   # 账号输入框
    (2, 1384, 580, 1816, 615),   # 密码输入框
    (3, 1384, 638, 1816, 670),   # 登录按钮
])
annotate("eai-03-menu.png", "ann-menu.png", [
    (1, 26, 308, 214, 350),      # 系统管理
    (2, 24, 448, 214, 484),      # 执行器下载（子菜单项）
])
annotate("eai-04-executor-top.png", "ann-executor.png", [
    (1, 1793, 244, 1854, 274),   # 已配置徽标
    (2, 355, 342, 888, 380),     # 账号+密码输入行
    (3, 901, 342, 990, 380),     # 保存按钮
    (4, 266, 497, 513, 536),     # 下载安装包按钮
], masks=[(330, 306, 452, 338, "136****1338")])
annotate("eai-07-create-task.png", "ann-create.png", [
    (1, 723, 183, 1197, 215),    # 要做什么
    (2, 723, 271, 1197, 303),    # 学校
    (3, 723, 356, 1197, 388),    # 统计日期
    (4, 1125, 496, 1201, 532),   # 发起按钮
])
annotate("eai-08-done.png", "ann-done.png", [
    (1, 1349, 435, 1417, 459),   # 执行状态「完全成功」
    (2, 1660, 434, 1698, 458),   # 详情按钮
])

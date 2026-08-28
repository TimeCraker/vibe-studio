# -*- coding: utf-8 -*-
"""
animate.py — COM 动画后处理：按元素逐个声明进入动画（Windows + MS Office + pywin32）

用法（gen 脚本内，python-pptx 对象在手时）：
    from animate import Anim
    anim = Anim(prs)
    anim.fade(title)                       # 淡入
    anim.fade(c1); anim.fade(c2); anim.fade(c3)   # 逐个声明 = 逐条接力进入（after prev）
    anim.wipe(num_card, 'up')              # 方向感：up / down / left / right
    anim.appear(footer)                    # 直出
    anim.chart(chart_gf, by='category')    # 图表生长：allAtOnce / series / category
    prs.save('deck.pptx')
    anim.apply('deck.pptx')                # COM 写入动画；之后才做 Step 4 渲染核查

约定：apply 前必须 prs.save()（COM 按 shape id 定位元素）。
选择纪律见 SKILL.md Step 3 动画节：一页 ≤2 种效果，动画服务叙事节奏，不是炫技。
"""
import sys
from pathlib import Path

import pythoncom
import win32com.client

sys.stdout.reconfigure(errors="replace")  # GBK 控制台保险

FX = {"appear": 1, "fade": 10, "wipe": 22}         # MsoAnimEffect 子集（实测）
DIR = {"up": 1, "down": 4, "right": 2, "left": 8}  # EffectParameters.Direction 方向值
TRIG = {"click": 0, "with": 2, "after": 3}         # MsoAnimTriggerType

P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"


class Anim:
    """收集 python-pptx shape 的动画声明，save 后一次性 COM 写入。"""

    def __init__(self, prs):
        self.prs = prs
        self._plan = []        # (slide_no, name, effect_id, direction|None, trigger)
        self._charts = {}      # spid -> by
        self._n = 0

    def _ref(self, sp):
        """定位 shape 的 (页号, shape_id)。按 XML 树身份找所属页——
        shape_id 每页独立编号不唯一，全 deck 按 id 搜会命中错误页的同 id 形状。"""
        el = sp._element
        while el is not None and not el.tag.endswith("}sld"):  # sp -> spTree -> cSld -> sld
            el = el.getparent()
        sld_el = el
        for i, s in enumerate(self.prs.slides, 1):
            if s._element is sld_el:
                return i, sp.shape_id
        raise ValueError(f"shape not in deck: id={sp.shape_id}")

    def fade(self, sp, trigger="after"):
        self._plan.append((*self._ref(sp), FX["fade"], None, TRIG[trigger]))

    def wipe(self, sp, direction="up", trigger="after"):
        self._plan.append((*self._ref(sp), FX["wipe"], DIR[direction], TRIG[trigger]))

    def appear(self, sp, trigger="after"):
        self._plan.append((*self._ref(sp), FX["appear"], None, TRIG[trigger]))

    def chart(self, sp, by="category", trigger="after"):
        """图表生长动画：by = allAtOnce / series / category。"""
        self._plan.append((*self._ref(sp), FX["wipe"], DIR["up"], TRIG[trigger]))
        self._charts[str(sp.shape_id)] = by

    def apply(self, path):
        """打开已保存的 pptx 写入全部动画；图表生长另做 XML 收尾。"""
        p = str(Path(path).resolve())
        pythoncom.CoInitialize()
        app = win32com.client.Dispatch("PowerPoint.Application")
        try:
            pres = app.Presentations.Open(p, False, False, False)
            for slide_no, spid, fx, direction, trig in self._plan:
                sld = pres.Slides(slide_no)
                eff = sld.TimeLine.MainSequence.AddEffect(_by_id(sld, spid), fx, 0, trig)
                if direction is not None:
                    eff.EffectParameters.Direction = direction
            pres.Save()
            pres.Close()
        finally:
            app.Quit()
        if self._charts:
            _retag_charts(p, self._charts)
        print(f"OK animated {len(self._plan)} effects -> {p}")


def _by_id(sld, spid):
    for i in range(1, sld.Shapes.Count + 1):
        sh = sld.Shapes(i)
        if sh.Id == spid:
            return sh
    raise KeyError(f"shape id {spid} not on slide")


def _retag_charts(path, charts):
    """COM 默认写 bldAsOne（整图一动）；替换为 bldChart 按类目/系列生长。"""
    import lxml.etree as etree

    from pptx import Presentation

    prs = Presentation(path)
    for slide in prs.slides:
        for bg in slide._element.iter(f"{{{P_NS}}}bldGraphic"):
            by = charts.get(bg.get("spid"))
            if not by:
                continue
            for one in bg.findall(f"{{{P_NS}}}bldAsOne"):
                bg.remove(one)
            sub = etree.SubElement(bg, f"{{{P_NS}}}bldSub")
            etree.SubElement(sub, f"{{{A_NS}}}bldChart").set("bld", by)
    prs.save(path)

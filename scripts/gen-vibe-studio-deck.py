# -*- coding: utf-8 -*-
"""vibe-studio 项目介绍 deck（10 页 · forest 主题 · 文案 v2：作者腔，去介绍腔）
素材出处：README.md / CLAUDE.md / skills/*/SKILL.md / git log（26 commits, 08-22..08-28）
复跑：python scripts/gen-vibe-studio-deck.py（禁手改 pptx，改文案改本脚本）
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import primitives as P
from animate import Anim

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output",
                   "vibe-studio-deck.pptx")

P.use_theme("forest")
prs = P.new_deck()
anim = Anim(prs)

META = {
    "title": "vibe-studio",
    "subtitle": "项目 README 进，视频成片出",
    "kicker": "open source content studio",
    "tagline": "所有产物都由脚本生成，包括你现在看的这一页",
    "domain": "asterforge.top",
    "version": "MIT",
    "date": "2026-08",
    "author": "TimeCraker",
}

def _tint(slide, names, hexcolor):
    """局部改文字色（对比度修正）：forest 的 MUTED 落 CREAM 底仅 4.27:1，
    换封闭色板内的 INK_SOFT（约 7:1）。"""
    for sp in slide.shapes:
        if sp.name in names and sp.has_text_frame:
            for p_ in sp.text_frame.paragraphs:
                for r_ in p_.runs:
                    r_.font.color.rgb = P.C(hexcolor)


# ── P1 封面 ──────────────────────────────────────────────────────────
s = P.slide_cover(prs, META)
_tint(s, {"cmeta"}, P.INK_SOFT)  # meta 行在 CREAM 大底上
P.notes(s, "这是 vibe-studio，我的开源内容工厂。它干一件事：项目 README 从这头进，"
           "介绍 PPT、逐页动效、视频成片从那头出。你现在看的这份 deck，"
           "就是它自己生成的，一行都没手改。")

# ── P2 定位：三类资产 ────────────────────────────────────────────────
s = P.slide_cards(prs, 2, "Positioning", "这个仓库不装产品，只装手艺", [
    ("Skills", "每个 skill 自带模板和代码\n复制到任何项目就能跑\nppt、humanizer 已上线"),
    ("Workflows", "README 到成片拆成四段\n每段有工具、有验收\n串起来就是流水线"),
    ("Assets", "色板、字体、版式范式\n做一份 deck 复用一套\n这份 deck 用的是 forest"),
], cols=3)
P.notes(s, "先说清这个仓库是什么：它不装业务代码，装的是内容手艺。三类东西。"
           "Skills 是能独立干活的技能，自带模板，复制到任何项目就能跑，现在两个上线。"
           "Workflows 把活串成流水线，每段都有工具和验收。"
           "Assets 是攒下来的品牌资源，这份 deck 的配色就取自这里。")

# ── P3 理念：为什么代码画 PPT ────────────────────────────────────────
s = P.slide_versus(prs, 3, "Philosophy", "手拖的 deck 改不动，写出来的才能重跑",
                   ("手拖模板", [
                       "坐标靠手感，对齐靠眯眼",
                       "改一个数字，全页重排",
                       "pptx 是二进制，diff 全是乱码",
                       "交付前只能人眼一页页过",
                   ]),
                   ("代码画", [
                       "网格、字号、色板全写死在脚本里",
                       "坐标精确到 0.01 英寸",
                       "改数据等于改脚本，重跑一遍就好",
                       "三级核查替你盯每一页",
                   ]))
P.notes(s, "为什么非要用代码画 PPT。手拖模板的痛大家都熟：改一个数字全页重排，"
           "pptx 是二进制，diff 出来全是乱码。写成脚本之后，网格、字号、色板全在代码里，"
           "坐标精确到 0.01 英寸；改数据就是改几行代码，重跑一遍，新 deck 就出来了。"
           "渲染核查在后面兜底，所见即所写。")

# ── P4 流水线全景 ────────────────────────────────────────────────────
s = P.slide_chain(prs, 4, "Pipeline", "四段流水线，通到了第二站", [
    ("项目 README", "markdown in"),
    ("介绍 deck", "ppt skill LIVE"),
    ("逐页动效", "vibe-motion PLAN"),
    ("视频成片", "deck-to-video PLAN"),
], hi=1, sub_title="流水线上的配套工位", subs=[
    ("skill", "ppt：画 deck 的版式原语库"),
    ("voice", "humanizer：口播稿去 AI 腔"),
    ("3-tier", "三级核查替人盯质量"),
    ("git", "脚本进 git，产物不进"),
])
_tint(s, {f"sub{i}d" for i in range(4)}, P.INK_SOFT)  # subs 卡 mono 注释在 CREAM 卡底上
P.notes(s, "流水线长这样：README 进，deck、动效、成片依次出。现在通到第二站，"
           "ppt skill 画的 deck，就是你眼前这份。第三站 vibe-motion 管逐页动效，"
           "第四站 deck-to-video 用 Remotion 出成片，都在规划里。"
           "旁边两个工位：humanizer 管口播稿的味道，三级核查管成稿质量。"
           "仓库里只有脚本，产物从不进 git。")

# ── P5 ppt skill 家底：数字墙 ────────────────────────────────────────
s = P.slide_numbers(prs, 5, "Skill ppt", "版式手册，写成了 17 个函数", [
    ("17", "页面范式", "cover..closing"),
    ("11", "入场动画", "COM verified"),
    ("3", "主题预设", "warm/tech/forest"),
    ("4", "skill 总数", "2 live + 2 plan"),
    ("26", "commits", "in 3 days"),
    ("5.4", "分钟自动放映", "notes driven"),
])
P.notes(s, "ppt skill 的家底用数字讲：17 种页面范式，从封面到尾页不用出系统；"
           "11 种入场动画，每一个都 COM 实测过；3 套主题一键切换。"
           "仓库一共四个 skill，两个上线两个规划，三天 26 个 commit 写完。"
           "这份 deck 开自动放映，5.4 分钟自己播完，录屏就是视频草稿。")

# ── P6 ppt skill 细节：morph 真补间 + 三级核查 ──────────────────────
s = P.slide_dense(prs, 6, "Skill ppt", "数据长出来是真补间，质量靠三级核查", [
    ("① 程序初筛", ["verify.py 读 PDF 真实坐标",
                    "溢出、占位符全扫描",
                    "对比度不过 4.5 就打回"]),
    ("② 模型盲看", ["派一个不知情的子代理",
                    "逐页查溢出、乱码、对齐、对比度",
                    "报了问题就改脚本重跑"]),
    ("③ 人工终审", ["机器清零后人再进场",
                    "只看稿子好不好看"]),
], main_lines=[
    ("morph 真补间", 40, P.CORAL_DEEP, True),
    ("图表从零长到终态，一帧一帧插值", 19, P.INK, True),
    ("柱、条、线、环四种图；写完读回 EntryEffect 3954 核对", 13, P.INK_SOFT, False),
    ("PowerPoint 2019+ 生效；WPS 自动降级 fade", 11, P.MUTED, False),
])
P.notes(s, "两个地方见真章。第一，数据动画用 morph 真补间：柱子是长出来的，"
           "不是擦出来的；写完还要读回 PowerPoint 核对有没有真的生效。"
           "第二，质量靠三级核查：先让程序读 PDF 真坐标，扫溢出和对比度；"
           "再派一个不知道内情的模型逐页盲看；机器清零之后人才进场，只管好不好看。")

# ── P7 humanizer ─────────────────────────────────────────────────────
s = P.slide_table(prs, 7, "Skill humanizer", "稿子先去 AI 腔，再进演讲者备注",
                  ["维度", "humanizer v5.0.0"], [
    ["体系", "blader 英文体系 × 中文三毒 + L1-L4 自检"],
    ["铁律", "破折号中英双禁；黑话见一个杀一个"],
    ["工位", "口播稿过完它，才准进 notes()"],
    ["用途", "口播和 TTS 文案的味道保障"],
    ["状态", "v5.0.0，2026-08-24 收录融合"],
], col_ws=[0.14, 0.86])
P.notes(s, "humanizer 管文字的味道。AI 写的稿子有几个通病：套话、破折号、端着说话。"
           "它把 blader 英文体系和中文工程体系融成 v5.0.0，铁律是破折号中英双禁、"
           "黑话零容忍。流水线上它的工位很具体：口播稿先过它一遍，才准进演讲者备注。")

# ── P8 演进时间轴 ────────────────────────────────────────────────────
s = P.slide_timeline(prs, 8, "Evolution", "三天 26 个 commit，一天一版能力", [
    ("day 1", "建仓\n工作台 + ppt 骨架"),
    ("day 1", "动画体系\n11 种入场 + 级联"),
    ("day 1", "v3 + v4\n口播管线、四范式、三主题"),
    ("day 1", "morph 真补间\n柱条线环全支持"),
    ("day 2", "humanizer\n收录即融合 v5.0.0"),
    ("day 3", "文案工程\n取材三层 + 杂志风章节"),
], hi=5)
P.notes(s, "节奏：三天，26 个 commit。第一天从建仓干到 morph 真补间，"
           "中间还夹了 v3、v4 两个大版本；第二天收 humanizer，直接融到 v5.0.0；"
           "第三天补文案工程。能这么快，正因为一切都是脚本：改完就跑核查，不用人肉返工。")

# ── P9 路线图 ────────────────────────────────────────────────────────
s = P.slide_cards(prs, 9, "Roadmap", "下一站：把 deck 变成成片", [
    ("vibe-motion", "逐页动效编排\n节奏、转场、镜头语言\n规划中"),
    ("deck-to-video", "deck 逐页渲染\nRemotion 合成直接出片\n规划中"),
    ("Assets", "品牌资源继续攒\n色板、字体、版式范式\n持续"),
], cols=3)
P.notes(s, "接下来两站：vibe-motion 管逐页动效，节奏、转场、镜头语言；"
           "deck-to-video 用 Remotion 把 deck 直接渲染成片。"
           "到那天，README 进，视频出，中间不用人碰。")

# ── P10 尾页 ─────────────────────────────────────────────────────────
s = P.slide_closing(prs, META, [
    "github.com/TimeCraker/vibe-studio",
    "asterforge.top · MIT License",
    "© 2026 TimeCraker",
], slogan=[("把内容手艺写成代码", 40, P.PAPER, True),
           ("asterforge.top", 18, P.CREAM, False)])  # 副行 CORAL 落 INK 底仅 3.4:1，换 CREAM
P.notes(s, "vibe-studio，把内容手艺写成代码。仓库在 github.com/TimeCraker/vibe-studio，"
           "MIT 开源，clone 下来建一次链接就能用。谢谢。")

# ── 动画 + 自动放映 + 落盘 ──────────────────────────────────────────
n_fx = anim.auto_deck()
P.auto_show(prs)  # 按口播稿估时自动换页，整 deck 自动播完
prs.save(OUT)
print(f"OK saved {os.path.normpath(OUT)} ({len(prs.slides)} slides, {n_fx} fx planned)")

anim.apply(OUT)  # COM 写入动画并读回自验证

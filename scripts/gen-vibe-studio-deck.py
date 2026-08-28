# -*- coding: utf-8 -*-
"""vibe-studio 项目介绍 deck（10 页 · forest 主题）
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
    "subtitle": "自媒体内容工厂：项目 README 到视频成片，一条流水线",
    "kicker": "open source content studio",
    "tagline": "Skills 自带模板零依赖 · Workflows 串起 README 到成片 · Assets 共享品牌资源",
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
P.notes(s, "大家好，用十分钟介绍我的开源项目 vibe-studio：一间自媒体内容工厂。"
           "任何项目的 README 从这里进，介绍 PPT、逐页动效、视频成片从这里出。"
           "你现在看到的这份 PPT 本身，就是这条流水线的产品。")

# ── P2 定位：三类资产 ────────────────────────────────────────────────
s = P.slide_cards(prs, 2, "Positioning", "不写业务代码，专造内容产能", [
    ("Skills", "可独立运行的创作技能\n自带模板代码，零外部依赖\n已上线 2 个，规划中 2 个"),
    ("Workflows", "README 到成片的完整工作流\n介绍 deck、逐页动效、视频成片\n每个环节脚本化，可复跑"),
    ("Assets", "跨项目共享的品牌资源\n色板、字体 token、版式范式\n本 deck 即 forest 主题产出"),
], cols=3)
P.notes(s, "vibe-studio 不承载业务代码，只造内容产能，产出三类资产。"
           "Skills 是可独立运行的创作技能，自带模板、零外部依赖，目前两个上线、两个规划中。"
           "Workflows 把技能串成从 README 到成片的完整工作流；Assets 攒下跨项目共享的品牌资源，"
           "这份 deck 的 forest 主题就是一例。")

# ── P3 理念：为什么代码画 PPT ────────────────────────────────────────
s = P.slide_versus(prs, 3, "Philosophy", "拖出来的 deck 改不动，写出来的才能复跑",
                   ("手拖模板", [
                       "坐标靠手感，对齐靠目测",
                       "改一处数据，全页手工重排",
                       "pptx 是二进制，git 没法 diff",
                       "视觉核对全靠人眼过每一页",
                   ]),
                   ("代码画：设计即代码", [
                       "网格、字号、色板全部显式声明",
                       "坐标精确到 0.01 英寸",
                       "改数据就是改脚本，一条命令重跑",
                       "三级渲染核查，所见即所写",
                   ]))
P.notes(s, "为什么用代码画 PPT？手拖模板的老问题：坐标靠手感，改一处数据全页重排，"
           "pptx 是二进制没法进版本管理。代码画的答案是设计即代码：网格、字号、色板全部显式声明，"
           "坐标精确到 0.01 英寸；改数据就是改脚本，重跑即得，可 diff 可回滚；"
           "渲染核查兜底，保证所见即所写。")

# ── P4 流水线全景 ────────────────────────────────────────────────────
s = P.slide_chain(prs, 4, "Pipeline", "四段流水线，前两段已通车", [
    ("项目 README", "markdown in"),
    ("介绍 deck", "ppt skill LIVE"),
    ("逐页动效", "vibe-motion PLAN"),
    ("视频成片", "deck-to-video PLAN"),
], hi=1, sub_title="流水线上的配套工位", subs=[
    ("skill", "ppt：代码画 deck 的版式原语库"),
    ("voice qc", "humanizer：口播稿去 AI 腔"),
    ("3-tier check", "三级渲染核查守住成稿质量"),
    ("git", "脚本进 git，产物不进"),
])
_tint(s, {f"sub{i}d" for i in range(4)}, P.INK_SOFT)  # subs 卡 mono 注释在 CREAM 卡底上
P.notes(s, "流水线四段：README 到介绍 deck 已经通车，用的就是 ppt skill，这份 deck 即产出；"
           "逐页动效是规划中的 vibe-motion，视频成片靠 deck-to-video 加 Remotion 合成。"
           "旁路上还有两个工位：humanizer 给口播稿去 AI 腔，三级渲染核查守住成稿质量。"
           "仓库里只有脚本，产物一律不进 git。")

# ── P5 ppt skill 家底：数字墙 ────────────────────────────────────────
s = P.slide_numbers(prs, 5, "Skill ppt", "17 种页面范式，装下一整本版式手册", [
    ("17", "页面范式", "cover..closing"),
    ("11", "入场动画", "COM verified"),
    ("3", "主题预设", "warm/tech/forest"),
    ("2", "上线 skill", "ppt+humanizer"),
    ("26", "commits", "in 3 days"),
    ("0", "手改 pptx 次数", "all by scripts"),
])
P.notes(s, "ppt skill 的家底：17 种页面范式从封面到尾页全覆盖；11 种入场动画带级联节奏，"
           "全部 COM 实测验证；3 套主题预设，这份 deck 用的就是 forest。"
           "口播稿直接进演讲者备注，auto_show 按稿估时自动换页，整份 deck 自动播完，录屏就是视频草稿。"
           "最后一格是纪律：手改 pptx 的次数为零，一切改动走脚本。")

# ── P6 ppt skill 细节：morph 真补间 + 三级核查 ──────────────────────
s = P.slide_dense(prs, 6, "Skill ppt", "数据长出来是真补间，质量靠三级核查", [
    ("① 程序初筛", ["verify.py 读 PDF 文本块 bbox",
                    "页级溢出 + 占位符扫描",
                    "WCAG 对比度小字 ≥4.5:1"]),
    ("② 模型盲看", ["无生成上下文的子代理",
                    "逐页查溢出、乱码、对齐、对比度",
                    "发现问题改脚本重跑"]),
    ("③ 人工终审", ["机械问题清零后入场",
                    "只看成稿，不做机械活"]),
], main_lines=[
    ("morph 真补间", 40, P.CORAL_DEEP, True),
    ("数据图表从零状态长到终态，逐帧插值", 19, P.INK, True),
    ("柱、条、线、环四种图全支持，写入后读回 EntryEffect 3954 验证", 13, P.INK_SOFT, False),
    ("PowerPoint 2019+ 生效；WPS 自动降级 fade", 11, P.MUTED, False),
])
P.notes(s, "两个细节看工程质量。第一，数据动画用 morph 转场做真补间：柱、条、线、环四种图"
           "从零状态长到终态，逐帧插值，不是擦入式假动作；写入后还会读回 EntryEffect 验证。"
           "第二，质量靠三级核查：程序初筛读 PDF 真实坐标，报溢出、占位符和对比度；"
           "模型盲看用无上下文的子代理逐页查四项；人工只看成稿。")

# ── P7 humanizer ─────────────────────────────────────────────────────
s = P.slide_table(prs, 7, "Skill humanizer", "稿子先去 AI 腔，再进演讲者备注",
                  ["维度", "humanizer v5.0.0"], [
    ["体系", "blader 英文体系 × 中文三毒 + L1-L4 工程自检"],
    ["硬禁令", "破折号中英双禁；赋能、闭环类黑话零容忍"],
    ["工位", "口播稿先过它去味，再进 notes() 演讲者备注"],
    ["用途", "口播与 TTS 文案，deck-to-video 的声音质检"],
    ["状态", "已上线，2026-08-24 收录并升到 v5.0.0 融合版"],
], col_ws=[0.14, 0.86])
P.notes(s, "humanizer 解决文字的 AI 腔。v5.0.0 把 blader 英文体系和中文工程体系两套方法融在一起，"
           "硬规矩包括破折号中英双禁、黑话零容忍。它在流水线里的工位很具体："
           "口播稿先过它去味，再进演讲者备注；将来 deck-to-video 做 TTS 成片，它就是声音质检。")

# ── P8 演进时间轴 ────────────────────────────────────────────────────
s = P.slide_timeline(prs, 8, "Evolution", "三天 26 个 commit，一天一版能力", [
    ("day 1", "初始提交\n内容工作台 + ppt 骨架"),
    ("day 1", "动画体系\n11 种入场 + 级联节奏"),
    ("day 1", "v3 + v4 大版\n口播管线、四范式、三主题"),
    ("day 1", "morph 真补间\ngrowth 柱条线环"),
    ("day 2", "humanizer\nv5.0.0 双体系融合"),
    ("day 3", "文案工程\n取材三层 + 杂志风章节"),
], hi=5)
P.notes(s, "演进节奏：三天 26 个 commit。第一天最猛，从工作台骨架到动画体系，"
           "再上 v3、v4 两个大版本和 morph 真补间；第二天收录 humanizer 并升到 v5.0.0；"
           "第三天补上文案工程，取材三层和杂志风章节页。一天一版能力，"
           "靠的就是一切改动都走脚本，改完即跑核查。")

# ── P9 路线图 ────────────────────────────────────────────────────────
s = P.slide_cards(prs, 9, "Roadmap", "下一站：把 deck 变成成片", [
    ("vibe-motion", "逐页动效编排\n节奏、转场、镜头语言\n状态：规划中"),
    ("deck-to-video", "deck 逐页渲染\nRemotion 合成，直接出成片\n状态：规划中"),
    ("Assets", "品牌资源库扩充\n色板、字体 token、版式范式\n状态：持续"),
], cols=3)
P.notes(s, "路线图很清楚：vibe-motion 做逐页动效编排，管节奏、转场和镜头语言；"
           "deck-to-video 用 Remotion 把 deck 直接合成成片。到那时，README 进、视频出，"
           "流水线全程脚本化。Assets 品牌资源库会随项目继续长。")

# ── P10 尾页 ─────────────────────────────────────────────────────────
s = P.slide_closing(prs, META, [
    "github.com/TimeCraker/vibe-studio",
    "asterforge.top · MIT License",
    "© 2026 TimeCraker",
], slogan=[("把内容产能写成代码", 40, P.PAPER, True),
           ("asterforge.top", 18, P.CREAM, False)])  # 副行 CORAL 落 INK 底仅 3.4:1，换 CREAM
P.notes(s, "vibe-studio，把内容产能写成代码。仓库在 github.com/TimeCraker/vibe-studio，"
           "MIT 开源，克隆后建一次 junction 就能用，欢迎围观。")

# ── 动画 + 自动放映 + 落盘 ──────────────────────────────────────────
n_fx = anim.auto_deck()
P.auto_show(prs)  # 按口播稿估时自动换页，整 deck 自动播完
prs.save(OUT)
print(f"OK saved {os.path.normpath(OUT)} ({len(prs.slides)} slides, {n_fx} fx planned)")

anim.apply(OUT)  # COM 写入动画并读回自验证

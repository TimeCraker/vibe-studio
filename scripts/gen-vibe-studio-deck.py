# -*- coding: utf-8 -*-
"""vibe-studio 项目介绍 deck（10 页 · forest 主题 · 文案 v3.1：受众三问+叙事大纲版）
素材出处：README.md / CLAUDE.md / skills/*/SKILL.md / git log（30 commits, 08-22..08-28）
复跑：python scripts/gen-vibe-studio-deck.py（禁手改 pptx，改文案改本脚本）
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 仓库根
sys.path.insert(0, os.path.join(ROOT, "skills", "ppt", "templates"))  # 直接用 skill 正本

import primitives as P
from animate import Anim

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output",
                   "vibe-studio-deck.pptx")

P.use_theme("forest")
prs = P.new_deck()
anim = Anim(prs)

META = {
    "title": "vibe-studio",
    "subtitle": "把内容手艺写成代码：README 进，视频出",
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
P.notes(s, "这是 vibe-studio，我的开源内容车间。它让做 PPT、做视频这门手艺变成代码。"
           "你现在看到的这一页，就是仓库里一个脚本画出来的，一行都没有手改。")

# ── P2 开篇三答 ──────────────────────────────────────────────────────
s = P.slide_cards(prs, 2, "Positioning", "三个问题，先答完再往下讲", [
    ("这是什么", "一个开源仓库，GitHub 上能 clone\n装的不是产品，是做内容的手艺：\n画 PPT 的代码库、改文案的规则、\n攒下来的版式和色板"),
    ("给谁用", "独立开发者\n项目要自己吆喝，介绍材料、\n宣传视频都得自己来\n这里把这些活变成可复跑的脚本"),
    ("解决什么", "PPT 是手工活：客户让改个数字，\n你重排一小时，改到第 5 版\n和第 1 版比改了啥没人说得清\nAI 写的稿有机器味；README 到视频没有顺手的路"),
], cols=3)
P.notes(s, "开始前先回答三个问题。这是什么？一个开源仓库，装的是做内容的手艺，不是业务代码。"
           "给谁用？像我一样的独立开发者，项目要自己吆喝，内容得自己产。"
           "解决什么？三件事。第一，PPT 是手工活：客户让改个数字，你重排一小时，"
           "改到第五版，跟第一版比改了什么，没人说得清。第二，AI 写的稿有股机器味，"
           "发出去之前得逐句改成人话。第三，项目写完了，介绍它的 PPT、视频还得从零手工做，"
           "中间没有顺手的路。")

# ── P3 流水线全景 ────────────────────────────────────────────────────
s = P.slide_chain(prs, 3, "Pipeline", "一条流水线，从项目说明通到视频成片", [
    ("项目 README", "原材料"),
    ("介绍 deck", "已上线"),
    ("逐页动效", "规划中"),
    ("视频成片", "规划中"),
], hi=1, sub_title="流水线上的配套工位", subs=[
    ("ppt", "画 deck 的版式库"),
    ("humanizer", "稿子去 AI 腔"),
    ("三级核查", "替人盯质量"),
    ("git", "脚本进版本库"),
])
_tint(s, {f"sub{i}d" for i in range(4)}, P.INK_SOFT)  # subs 卡 mono 注释在 CREAM 卡底上
P.notes(s, "整体长这样：左边进 README，右边出视频，中间三站。"
           "今天通到第二站：介绍 deck 的生成。证据就在你眼前，这份 deck 本身就是第二站的产出，"
           "画它的代码在仓库里，任何人改几行重跑，就能得到自己的版本。"
           "旁边四个工位：ppt 是画 deck 的版式库，humanizer 管稿子的味道，"
           "三级核查替人盯质量，脚本全部进 git。")

# ── P4 方法：手拖 vs 代码（给机制，不给结论） ────────────────────────
s = P.slide_versus(prs, 4, "Philosophy", "为什么非要写成代码：手拖的 deck 改不动",
                   ("手拖模板", [
                       "每个文本框的位置是上次手工调好的平衡，动一处，周围全破",
                       "pptx 内部是二进制，git 看不懂，两版对比全是乱码",
                       "坐标靠手感，做到第 20 页，字号早就飘了",
                   ]),
                   ("写成代码", [
                       "坐标是表达式算的（第 i 张卡片在 0.55 + i×3.13 英寸处），数据变了自动重算",
                       "改数据就是改几行字，重跑一遍出新 deck",
                       "脚本是纯文本，git 对比就几行红绿：谁改的、改了什么，全在提交记录里",
                   ]))
P.notes(s, "为什么非要写成代码？先看手拖的机制：每个文本框的位置，是你上次手工调好的平衡，"
           "客户让改一个数字，你动一处，周围全破，重排的是你一小时。"
           "pptx 内部还是二进制，git 看不懂，两版对比全是乱码。"
           "写成代码之后：每页的坐标是表达式算出来的，第 i 张卡片就放在 0.55 加 i 乘 3.13 英寸的位置，"
           "数据变了，所有坐标自动重算，平衡由数学维持，不是由你的耐心维持。"
           "脚本是纯文本，两版对比就几行红绿，谁改的、为什么改，提交记录里写得明明白白。")

# ── P5 实际用一遍：五步 walkthrough ──────────────────────────────────
s = P.slide_dense(prs, 5, "Workflow", "用一遍：说一句话，拿走一份 deck", [
    ("① 取材", ["读你项目的 README 和文档", "文案稿先给你过目"]),
    ("② 定版", ["色板、字号、网格开工前定死"]),
    ("③ 生成", ["写一个 Python 脚本，一个函数画一页"]),
    ("④ 核查", ["自动转 PDF", "程序 + 盲看 AI 两轮"]),
    ("⑤ 交付", ["pptx + 可复跑脚本，进 git"]),
], main_lines=[
    ("照着说明书干活", 40, P.CORAL_DEEP, True),
    ("核心资产是一份百来行的流程说明书", 19, P.INK, True),
    ("AI 按它走五步，人只在两个关口出现", 13, P.INK_SOFT, False),
    ("审文案、看终稿，这两件事机器替不了", 11, P.MUTED, False),
])
P.notes(s, "很多人问，我不会 Python 怎么用？答案是你不用会。"
           "clone 下来，在 Claude Code 里说一句「给我的项目做个 PPT」，"
           "剩下的是 AI 照着仓库里的说明书干活：第一步取材，读你项目的真资料，"
           "写好的文案稿先给你过目；第二步把色板、字号、网格定死；"
           "第三步写一个 Python 脚本，一个函数画一页；"
           "第四步自动转 PDF，程序和不知情的 AI 先查两轮；"
           "第五步交付，你拿到 pptx 和一份能重跑的脚本。"
           "人只出现两次：审文案，看终稿。")

# ── P6 三级核查：每道关给存在理由 ────────────────────────────────────
s = P.slide_chain(prs, 6, "Quality", "质量不靠自觉：三道关，两道是机器", [
    ("程序初筛", "读 PDF 真实坐标"),
    ("模型盲看", "不知情的 AI 逐页查"),
    ("人工终审", "只看成稿"),
], hi=2, sub_title="关口背后", subs=[
    ("查什么", "溢出、乱码、对齐、对比度"),
    ("复述测试", "答不出 deck 在讲什么就打回"),
    ("原则", "机器不清零，人不进场"),
    ("这份 deck", "刚按这三道过了一遍"),
])
_tint(s, {f"sub{i}d" for i in range(4)}, P.INK_SOFT)
P.notes(s, "质量怎么保证？三道关，每道有存在的理由。"
           "程序初筛：转成 PDF 之后，每个字的位置和颜色都是能读出来的数，"
           "溢出、对比度不够，就是算术题，算术交给程序，一秒一页。"
           "模型盲看：给一个不知情的 AI 看渲染图，不知情是关键，知情的会替设计找借口；"
           "它还得回答这份 deck 在讲什么，答不上来，说明开篇就没把话说明白，文案打回重写。"
           "人工终审：前两道把机械问题清零，人的眼睛只花在机器干不了的事上。"
           "这份 deck 自己刚这么过了一遍。")

# ── P7 humanizer：病-药对照 ──────────────────────────────────────────
s = P.slide_table(prs, 7, "Skill humanizer", "AI 写的稿有股机器味，这页是解药",
                  ["通病", "药方"], [
    ["套话黑话连篇", "见一个杀一个，删干净再说"],
    ["破折号当万能胶", "中文英文一律禁用"],
    ["端着说话", "说人话，数字优先于形容词"],
    ["上来就抠字数", "第一遍写足讲透，第二遍才打磨"],
    ["形容词堆砌", "每个说法都要有出处"],
    ["念着像口号", "只读文字要像在讲，不像列清单"],
], col_ws=[0.36, 0.64])
P.notes(s, "另一件烦事，AI 写的稿有股机器味。这毛病有来历：它写东西爱挑最安全的说法，"
           "套话最安全；爱用破折号装转折；没对象没目的，就端着说话。"
           "仓库里第二个 skill 专治这个，规矩对着来：套话黑话见一个杀一个，"
           "破折号中英双禁，说人话，数字优先于形容词。"
           "这份 deck 的文案就是先完整写一遍，再删掉一半的废话做出来的。")

# ── P8 演进时间轴 ────────────────────────────────────────────────────
s = P.slide_timeline(prs, 8, "Evolution", "一周 30 个 commit，从空仓库到这份 deck", [
    ("08-22", "建仓\n工作台 + ppt 骨架"),
    ("08-24", "humanizer\n收录即融合 v5.0.0"),
    ("08-28", "三级核查\n初筛 + 盲看纪律"),
    ("08-28", "动画体系\n11 种入场 + morph 真补间"),
    ("08-28", "文案工程\n取材标准 + 杂志风章节"),
    ("08-28", "这份 deck\n自举产出，规则再升级"),
], hi=5)
P.notes(s, "这些能力只用了一周攒出来：30 个 commit，从空仓库到你眼前这份 deck。"
           "第一天建仓，第三天收 humanizer，最后一天最密：三级核查、动画体系、"
           "文案工程，还有这份 deck 自己。"
           "为什么能这个速度？因为一切都是脚本：改完就重跑，核查自动兜底，没有人肉返工，"
           "错误不过夜。")

# ── P9 路线图 ────────────────────────────────────────────────────────
s = P.slide_cards(prs, 9, "Roadmap", "下一站：把 deck 变成成片", [
    ("vibe-motion", "逐页动效编排\n节奏、转场、镜头语言\n规划中"),
    ("deck-to-video", "deck 逐页渲染合成出片\nRemotion：用 React 写视频的开源工具\n规划中"),
    ("Assets", "色板、版式继续攒\n每做一份 deck 攒下一套\n持续"),
], cols=3)
P.notes(s, "流水线还剩两站。vibe-motion 管逐页动效，管节奏和镜头；"
           "deck-to-video 把 deck 逐页渲染，用 Remotion 合成直接出成片。"
           "到那天，README 进，视频出，中间不需要人碰。")

# ── P10 尾页 ─────────────────────────────────────────────────────────
s = P.slide_closing(prs, META, [
    "github.com/TimeCraker/vibe-studio",
    "MIT License · asterforge.top",
    "© 2026 TimeCraker",
], slogan=[("把内容手艺写成代码", 40, P.PAPER, True),
           ("README 进，视频出", 18, P.CREAM, False)])  # 副行 CORAL 落 INK 底仅 3.4:1，换 CREAM
P.notes(s, "vibe-studio，把内容手艺写成代码。仓库开源，MIT 协议，"
           "clone 下来建一次链接就能用。谢谢。")

# ── 动画 + 自动放映 + 落盘 ──────────────────────────────────────────
n_fx = anim.auto_deck()
P.auto_show(prs)  # 按口播稿估时自动换页，整 deck 自动播完
prs.save(OUT)
print(f"OK saved {os.path.normpath(OUT)} ({len(prs.slides)} slides, {n_fx} fx planned)")

anim.apply(OUT)  # COM 写入动画并读回自验证

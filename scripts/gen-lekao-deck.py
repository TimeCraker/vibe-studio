# -*- coding: utf-8 -*-
"""Lekao Agent 产品介绍 deck（11 页 · lekao 官方色板 · 杂志风双章节）
素材出处：lekao 仓库 README/BRD/CHANGELOG/源码 + lekao.asterforge.top 实截（2026-08-28）
受众：K12 培训机构助教/学管/班主任（非技术背景）
复跑：python scripts/gen-lekao-deck.py（禁手改 pptx，改文案改本脚本）
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # vibe-studio 仓库根
sys.path.insert(0, os.path.join(ROOT, "skills", "ppt", "templates"))  # 直接用 skill 正本

import primitives as P
from animate import Anim

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output",
                   "lekao-deck.pptx")

# ── Step 2 设计系统：lekao 官方 token（lekao/src/app/globals.css）7+1 封闭 ──
P.THEMES["lekao"] = dict(
    CORAL="3157F6",       # --accent 钴蓝 · 唯一主动作色
    CORAL_DEEP="1E3A8A",  # --accent-ink 钴蓝深
    CREAM="F8F6F1",       # --canvas 纸白主底
    INK="111722",         # --ink 冷蓝黑
    INK_SOFT="475569",    # --ink-muted slate-600
    MUTED="64748B",       # --ink-subtle slate-500（on canvas ~4.75:1）
    LINE="E2E8F0",        # --hairline slate-200
)
P.use_theme("lekao")
P.PAPER = "FFFEFB"        # --paper 卡片白

prs = P.new_deck()
anim = Anim(prs)

META = {
    "title": "Lekao Agent",
    "subtitle": "错题本，不再一道道粘贴",
    "kicker": "AI teaching workbench",
    "tagline": "课堂小结、作业反馈、周末错题表，上传讲义图片直接生成",
    "domain": "lekao.asterforge.top",
    "version": "FREE",
    "date": "2026-08",
    "author": "TimeCraker",
}


def _font(slide, names, fname):
    """局部改字体：大数字走衬线（复刻站点 Fraunces 观感），kicker 走等宽。"""
    for sp in slide.shapes:
        if sp.name in names and sp.has_text_frame:
            for p_ in sp.text_frame.paragraphs:
                for r_ in p_.runs:
                    r_.font.name = fname


# ── P1 封面 ──────────────────────────────────────────────────────────
s = P.slide_cover(prs, META)
_font(s, {"kicker"}, "Consolas")
P.notes(s, "各位老师好。先问一个问题：每次课结束后，抄错题、写小结、写反馈，"
           "要花你多久？如果答案是一两个小时，接下来几分钟介绍的这个东西，"
           "就是把你这小时拿回来的。")

# ── P2 三答 ──────────────────────────────────────────────────────────
s = P.slide_cards(prs, 2, "About", "先说清楚三件事", [
    ("给谁用", "K12 培训机构的助教、学管、班主任\n小学到高中全学段\n九个学科都在范围内"),
    ("这是什么", "一个在线工作台，浏览器打开就用\n不用装软件，不用学操作\n手机上有安卓 App"),
    ("解决什么", "课后三类重复文字活：\n誊抄错题、写课堂小结、写作业反馈\n不难，但费时间，还不能不做"),
], cols=3)
P.notes(s, "先说清楚三件事。给谁用：培训机构的助教、学管、班主任，小学到高中都行。"
           "这是什么：一个网页，浏览器打开就能用，手机上也有 App。"
           "解决什么：课后那三类文字活：誊错题、写小结、写反馈。"
           "这些活的特点是：不难，但费时间，还不能不做。")

# ── P3 章节页 #01（杂志风） ──────────────────────────────────────────
s = P.slide_section(prs, 1, "它能干什么", points=[
    "三个功能，各接走一类文字活",
    "错题集：最省时间的一个",
    "输出格式，按机构规矩来",
], total=2, domain="lekao.asterforge.top")
P.notes(s, "第一部分，看它能干什么。")

# ── P4 三大功能 ──────────────────────────────────────────────────────
s = P.slide_cards(prs, 4, "Features", "三个功能，各接走一类文字活", [
    ("错题集生成", "Excel 名单 + 拖入题目图片\n自动排全班 Word 错题文档\n永久免费"),
    ("课堂小结", "拍讲义上传，AI 认出学科章节知识点\n固定格式出 10 条建议 + 一段小结\n一键复制"),
    ("作业/堂测反馈", "拍讲义，逐题出 20 条订正建议\n加一段总体小结\n家长能直接看懂"),
], cols=3)
P.notes(s, "三个功能。第一个，错题集：把 Excel 名单和题目图片拖进去，"
           "几分钟出一份全班的 Word 错题文档，不用再一道道粘贴。"
           "第二个，课堂小结：拍讲义上传，AI 自己认出学科、章节、知识点，"
           "按固定格式给你 10 条建议加一段小结。"
           "第三个，作业反馈：也是拍讲义，出 20 条逐题的订正建议和一段总体小结，"
           "写的方式是家长看得懂的。")

# ── P5 错题集深挖（真实站点截图） ────────────────────────────────────
s = P.slide_media(prs, 5, "Mistake Book", "一个班 30 人、每人 3 道错题，几分钟出全班错题本",
                  os.path.join(ROOT, "assets", "lekao-screens", "lekao-landing-features.png"),
                  None, sidebar=[
    ("Excel 填名单", "模板给好，全班学生一次导入"),
    ("图片拖进去", "题目照片自动配到每个学生"),
    ("Word 直接打印", "自动排版，几分钟出全班文档"),
], footnote="截图来自 lekao.asterforge.top 官网 · 错题集功能永久免费，不花 T-Coin")
P.notes(s, "重点讲讲错题集，因为它最省时间。一个班 30 人，每人 3 道错题，"
           "手动誊抄粘贴是一晚上的活；这里上传 Excel 名单、把题目图片拖进去，"
           "几分钟出一份排好版的 Word，直接打印发下去。"
           "这项功能不花钱，永久免费。屏幕上这个界面就是官网的真实样子。")

# ── P6 格式对路 ──────────────────────────────────────────────────────
s = P.slide_table(prs, 6, "Formats", "和直接问 AI 聊天的不同：格式按机构规矩来",
                  ["输出", "格式"], [
    ["课堂小结", "10 条建议 + 一段小结（数量是硬约束，不多不少）"],
    ["作业/堂测反馈", "20 条逐题反馈 + 总体小结"],
    ["周末反馈表", "按学生姓名逐条生成，直接发家长群"],
    ["字数", "四挡：标准 / 1.5 倍 / 2 倍 / 3 倍"],
    ["模板", "自定义开头称呼、语气、落款签名"],
    ["学科", "九科全覆盖，小学到高中"],
], col_ws=[0.28, 0.72])
P.notes(s, "有老师会说，我也用 AI，为什么不开个聊天窗口直接问？差别在格式。"
           "直接问，格式随缘；这里按机构真实规矩定死：小结必须正好 10 条建议加一段小结，"
           "作业反馈必须 20 条逐题的，周末表按姓名一条条来。"
           "字数四挡可调，称呼、语气、落款可以存成自己的模板。"
           "生成完一键复制，贴进 Excel、发进家长群，不用再改。")

# ── P7 章节页 #02（杂志风） ──────────────────────────────────────────
s = P.slide_section(prs, 2, "怎么用，怎么放心", points=[
    "四步流程，第三步故意留给人",
    "学生的讲义图片，不存库",
    "不付费、不充值，签到就够用",
], total=2, domain="lekao.asterforge.top")
P.notes(s, "第二部分，怎么用，以及怎么放心。")

# ── P8 四步流程 ──────────────────────────────────────────────────────
s = P.slide_chain(prs, 8, "Workflow", "四步走，第三步故意留给人", [
    ("上传资料", "Excel / Word / 图片\n拖入即传"),
    ("AI 识别", "自动认出学科、章节\n错题结构"),
    ("人工校对", "关键字段过目\n按需微调"),
    ("导出成品", "Word / 一键复制\n直接使用"),
], hi=2)
P.notes(s, "用法四步：上传，AI 识别，人工校对，导出。"
           "特别说第三步：我们故意留了人工校对这一步，AI 认完学科和知识点，"
           "你过目一眼，不对的当场改，改完再导出。"
           "给学生的东西，最后一眼得是人看的。")

# ── P9 隐私 ──────────────────────────────────────────────────────────
s = P.slide_dense(prs, 9, "Privacy", "学生的讲义图片，不存库", [
    ("图片去向", ["仅生成那一刻上传 AI 服务", "数据库不保存原图"]),
    ("历史在哪", ["记录存你自己浏览器", "随时可以一键清空"]),
    ("扣费规矩", ["AI 失败自动退款", "成功才扣 1 币"]),
    ("手机可用", ["安卓 App 已上线", "拍照直接上传"]),
], main_lines=[
    ("不落库", 40, P.CORAL_DEEP, True),
    ("讲义图片只在生成时直传 AI 服务", 19, P.INK, True),
    ("生成历史存在你自己的浏览器里", 13, P.INK_SOFT, False),
    ("数据库里没有学生图片，这是设计决定，不是设置项", 11, P.MUTED, False),
])
P.notes(s, "老师最关心的隐私问题。学生的讲义图片，只在生成的那一刻传给 AI 服务，"
           "数据库里不存原图；生成历史存在你自己电脑的浏览器里，随时可以清空。"
           "扣费也有规矩：AI 生成失败自动退款，只有成功才扣。"
           "手机上有 App，拍了照直接传。")

# ── P10 免费模式 ─────────────────────────────────────────────────────
s = P.slide_numbers(prs, 10, "Free", "不付费、不充值，签到就够用", [
    ("2-8", "每日签到得币", "连续 7 天递增"),
    ("1", "一次 AI 生成", "T-Coin"),
    ("0", "错题集", "永久免费"),
    ("100%", "失败自动退款", "成功才扣"),
], cols=4)
_font(s, {f"num{i}v" for i in range(4)}, "Georgia")  # 大数字衬线（复刻站点 Fraunces）
P.notes(s, "最后，钱的事。这个工具不付费、不充值、没有会员。"
           "每天签到领币，连续签到七天，从 2 币领到 8 币；"
           "一次生成花 1 币，失败自动退回。"
           "算下来每天白送几十次生成，正常用用不完。"
           "错题集那个功能，一分钱不要，永久免费。")

# ── P11 尾页 ─────────────────────────────────────────────────────────
s = P.slide_closing(prs, META, [
    "lekao.asterforge.top · 免费开始",
    "安卓 App 已上线 · 鄂ICP备2026015662号",
    "© 2026 Lekao Agent",
], slogan=[("错题本，不再一道道粘贴", 40, P.PAPER, True),
           ("今天注册，明天就用上", 18, P.CREAM, False)])
P.notes(s, "网址在屏幕上，浏览器打开，注册就能用，"
           "今天就可以把明天的错题本先做出来试试。谢谢。")

# ── 动画 + 自动放映 + 落盘 ──────────────────────────────────────────
n_fx = anim.auto_deck()
P.auto_show(prs)  # 按口播稿估时自动换页，整 deck 自动播完
prs.save(OUT)
print(f"OK saved {os.path.normpath(OUT)} ({len(prs.slides)} slides, {n_fx} fx planned)")

anim.apply(OUT)  # COM 写入动画并读回自验证

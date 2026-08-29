# -*- coding: utf-8 -*-
"""AsterForge 个人产品图景与未来规划 deck（19 页 · 铜色系 7+1 · 双章节 · 动画全编排）
素材出处：my_workspace 各仓库 README/AGENTS + asterforge-deploy R56 手册 +
asterforge.top / lekao / AsterNova 线上实截（2026-08-29，shots/ 目录）
受众三问：给潜在客户与合作方看（非技术背景为主）；他们可能用过某个单品但不知道全貌；
看完能复述三句——①他一个人做了五款在线产品且都上线 ②一台自己的服务器撑起全部
③未来一年只做三件事：收款、流量、内容。
主线：独立开发者的优势不是人力，是把整条流水线握在一个人手里。
复跑：python scripts/gen-asterforge-landscape.py（禁手改 pptx，改文案改本脚本）
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "skills", "ppt", "templates"))  # 直接用 skill 正本

import primitives as P
from animate import Anim

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output",
                   "asterforge-product-landscape.pptx")
SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "asterforge-landscape", "shots")

# ── Step 2 设计系统：AsterForge 铜色系（主站品牌色 cc785c 加深保对比）7+1 封闭 ──
P.THEMES["asterforge"] = dict(
    CORAL="A4581F",       # 铜 · 唯一主动作色（对纸白 4.6:1，对暗底 3.1:1 双达标）
    CORAL_DEEP="6E3411",  # 铜深 · 大数字
    CREAM="F5F0E9",       # 暖纸白主底
    INK="231D16",         # 暖黑
    INK_SOFT="5B5142",    # 次级正文
    MUTED="6E6454",       # 弱化注释（对纸白/纸底均 ≥4.5:1）
    LINE="DFD7CA",        # hairline
)
P.use_theme("asterforge")
P.PAPER = "FFFFFF"

prs = P.new_deck()
anim = Anim(prs)
META = dict(
    kicker="ASTERFORGE PRODUCT LANDSCAPE",
    title="一个人的产品图景",
    subtitle="5 款在线产品 · 未来 12 个月规划",
    tagline="设计、开发、部署、运营，整条流水线握在一个人手里。",
    domain="asterforge.top",
    date="2026-08",
    author="TimeCraker",
)

# ── P1 封面 ─────────────────────────────────────────────────────────
s = P.slide_cover(prs, META)
P.notes(s, "开场一句话：我是 TimeCraker，独立开发者。今天用十几分钟把我手里的产品"
           "全貌讲清楚——有哪些已经上线、靠什么撑着、接下来一年做什么。")

# ── P2 章节 01 ──────────────────────────────────────────────────────
s = P.slide_section(prs, 1, "现状：全部已上线，一个人在跑", [
    "四条产品线，加一条基建底座",
    "全部部署在腾讯云单机，17 个服务常驻",
    "今天看到的截图都是生产环境实拍，不是设计稿",
], total=2, domain="ASTERFORGE PRODUCT LANDSCAPE · 2026-08")
P.notes(s, "第一部分讲现状。先给全景，再逐条产品线过。强调一句：页面里的截图都是"
           "线上环境直接截的，观众等会儿可以自己打开网址验证。")

# ── P3 四条产品线总览 ───────────────────────────────────────────────
s = P.slide_cards(prs, 3, "Overview", "四条产品线，各管一件事", [
    ("商业主力", "ResumeAIX\nAI 简历平台，功能已冻结\n下一步接正式支付"),
    ("场景产品", "LeKao + 小饭桌\n助教工作台与社区点餐\n都已上线，真实用户在用"),
    ("技术旗舰", "AsterNova\n60Hz 服务器权威的联机游戏\n2000+ 玩家在线跑"),
    ("基建底座", "部署手册 + 主站 + 内容工厂\n一台服务器、一套手册\n支撑上面所有产品"),
], cols=4)
P.notes(s, "全景图。这四条线不是并列的项目列表，是有分工的：商业主力负责收入，"
           "场景产品负责真实用户，技术旗舰负责能力证明，基建底座让一个人能同时"
           "维护这么多东西。接下来按这个顺序逐条讲。")

# ── P4 数字墙 ───────────────────────────────────────────────────────
s = P.slide_numbers(prs, 4, "Numbers", "先看数字：这些都不是概念", [
    ("5", "在线产品", "主站 LIVE 口径"),
    ("17", "常驻服务", "R56 巡检清单"),
    ("2000+", "AsterNova 玩家", "RTT < 30ms"),
    ("5 分钟", "生成一份简历", "上传到 PDF"),
    ("1-2 小时", "助教每课节省", "LeKao 口径"),
    ("74", "小饭桌测试用例", "vitest"),
], cols=3)
P.notes(s, "每个数字都有出处：五个在线产品是主站 LIVE 口径；十七个服务来自八月"
           "二十三号的部署巡检；两千加玩家是 AsterNova 页面实时数据；五分钟、"
           "一到两小时分别是简历和助教场景的实测口径；七十四条是小饭桌的"
           "自动化测试。产品讲完，这些数字会逐个对上。")

# ── P5 ResumeAIX 流水线 ─────────────────────────────────────────────
s = P.slide_chain(prs, 5, "ResumeAIX", "ResumeAIX：旧简历进，成品 PDF 出", [
    ("上传", "PDF / DOCX / TXT\n图片或对话描述"),
    ("AI 解析", "结构化提取\n经历与项目"),
    ("STAR 重写", "按行为面试法\n重写每条经历"),
    ("匹配评分", "JD 岗位匹配\nATS 优化"),
    ("渲染 PDF", "Puppeteer 出稿\n所见即所得"),
], hi=4,
   sub_title="技术栈",
   subs=[("前端", "Next.js 16 · React 19"),
         ("服务", "Fastify 5"),
         ("数据", "Prisma 6 · PostgreSQL"),
         ("队列", "Redis 7"),
         ("渲染", "Puppeteer · Docker")])
P.notes(s, "商业主力 ResumeAIX，面向国内求职者。用户上传旧简历，或者直接对话描述"
           "经历，AI 流水线走五步：解析、重写、匹配、评分、渲染，五分钟出一份"
           "专业 PDF。右边是技术栈，Docker 化部署，工程上是完整的。")

# ── P6 ResumeAIX 现状 ───────────────────────────────────────────────
s = P.slide_dense(prs, 6, "Status", "功能冻结，只差收款", [
    ("为什么冻结", ["功能面已铺满求职主流程", "集中修 Bug，不再加新功能"]),
    ("下一步", ["接入正式支付，跑通订阅收费", "这是从产品到生意的最后一格"]),
    ("已经在做的生意", ["定制开发持续接单", "首份服务协议已签：硬件远程控制 + 实时语音"]),
], main_lines=[
    ("最后一格", 40, P.CORAL_DEEP, True),
    ("产品已经做完，等它开始赚钱", 19, P.INK, True),
    ("功能冻结不是停工，是把力气从做功能挪到收钱上", 13, P.INK_SOFT, False),
    ("定制开发订单同时在进行，商业化两条腿走路", 11, P.MUTED, False),
])
P.notes(s, "ResumeAIX 的现状一句话：功能冻结，只差收款。为什么冻结？功能面已经"
           "铺满求职主流程，再加是浪费；集中修 Bug、接正式支付。除了产品本身，"
           "定制开发已经在签合同赚钱了，首份协议是硬件远程控制加实时语音系统。")

# ── P7 LeKao ────────────────────────────────────────────────────────
s = P.slide_media(prs, 7, "Lekao", "LeKao：助教每课省 1–2 小时",
                  os.path.join(SHOTS, "lekao.png"),
                  [],
                  caption="lekao.asterforge.top · 2026-08 实截",
                  sidebar=[
                      ("课堂小结", "上传讲义图片，AI 按机构要求的格式写十条反馈加一段小结"),
                      ("错题本 Word", "全班题目图片拖进去，五分钟生成文档，永久免费"),
                      ("免费模式", "签到领 T-Coin，一次生成一币，失败自动退款"),
                      ("双模型", "Qwen3-VL 读图认知识点，DeepSeek 出标准文本"),
                  ])
P.notes(s, "第一条场景产品 LeKao，给 K12 培训机构助教用。助教每次课后要抄错题、"
           "写小结、写反馈，一两小时没了；LeKao 把这些变成传图片点生成。错题"
           "本功能永久免费，靠签到领币支撑，不收费不充值——这条线要的是用户和"
           "口碑，不是钱。")

# ── P8 小饭桌 ───────────────────────────────────────────────────────
s = P.slide_dense(prs, 8, "Xiaofanzhuo", "小饭桌：先让社区小生意跑起来", [
    ("上线质量", ["74 条 vitest 用例", "P0 到 P2 三个阶段全部验收"]),
    ("体量", ["standalone 常驻约 110MB", "SQLite WAL，单文件好备份"]),
    ("商家防护", ["手机号加设备令牌拉黑", "设备维度天级限频"]),
    ("进行中", ["微信真机复验收尾", "22 条验收标准逐项勾检"]),
], main_lines=[
    ("先跑起来", 40, P.CORAL_DEEP, True),
    ("顾客点链接点餐，商家口令登录管菜单", 19, P.INK, True),
    ("收款走微信私信加订单快照核对，刻意不做在线支付", 13, P.INK_SOFT, False),
    ("2026-08-23 上线，零成本方案，验证最小商业闭环", 11, P.MUTED, False),
])
P.notes(s, "第二条场景产品小饭桌，服务社区家庭厨房。顾客点个链接就能点餐，商家"
           "用口令登录管理菜单和订单。刻意不做在线支付——收款走微信私信加订单"
           "快照核对，先把商家的成本降到零。八月二十三号上线，测试和防护都是"
           "按正经标准做的：七十四条用例、拉黑机制、限频。")

# ── P9 AsterNova ────────────────────────────────────────────────────
s = P.slide_media(prs, 9, "AsterNova", "AsterNova：打击感做进服务器里",
                  os.path.join(SHOTS, "game.png"),
                  [],
                  caption="asterforge.top/projects/game · LIVE · 2000+ 玩家",
                  sidebar=[
                      ("60Hz 权威裁决", "Go 后端固定步长跑全部物理，客户端零预测、零作弊面"),
                      ("一套协议三端", "同一份 game.proto 驱动 Web、Godot、Unity"),
                      ("卡肉手感", "普攻 0.08 秒、拼刀 0.15 秒 Hit-Stop，配衰减式震屏"),
                      ("线上在跑", "RTT 低于 30ms，cn-hangzhou 机房，状态 LIVE"),
                  ])
P.notes(s, "技术旗舰 AsterNova，实时联机动作游戏。它不直接赚钱，值钱在能力证明："
           "服务器权威架构、三端同协议、网络同步，这些是企业级订单里最难得部分。"
           "页面底部是实时状态：两千加玩家、延迟三十毫秒以内、LIVE。顺带一提，"
           "打击感是调出来的——命中零点零八秒的顿帧加震屏。")

# ── P10 基建数字 ────────────────────────────────────────────────────
s = P.slide_numbers(prs, 10, "Infra", "一台服务器，撑起全部产品", [
    ("17", "systemd 服务", "腾讯云单机 · cgroup v2"),
    ("9", "SSL 证书", "nginx 反代 · 自动续签"),
    ("1", "台生产服务器", "阿里云双机已并入单机"),
    ("2026-07", "双机并入单机", "阿里云下线，成本减半"),
    ("R56", "部署手册版本", "nginx / systemd 配置入库"),
    ("0", "人工续签操作", "证书续签全托管"),
], cols=3)
P.notes(s, "这些产品跑在哪？一台腾讯云。十七个常驻服务、九张自动续签的证书，"
           "八月完成巡检入库。七月把阿里云双机并成了单机，成本砍半，靠的是"
           "文档化——下一页讲怎么做到的。")

# ── P11 基建三件套 ──────────────────────────────────────────────────
s = P.slide_cards(prs, 11, "Toolkit", "基建不是成本，是复利", [
    ("asterforge-deploy", "生产环境唯一权威手册\n备份、迁移、排查全文档化\n重装系统几小时重建"),
    ("my-portfolio 主站", "asterforge.top 对外门面\n项目叙事加接单入口\n管理后台热更新"),
    ("vibe-studio 内容工厂", "代码画 PPT 与去 AI 腔\n今天这份 deck 即产线出品\n后续直出视频成片"),
], cols=3)
P.notes(s, "支撑这一切的是三件套。部署手册把生产环境全部写成文档，服务器炸了也"
           "能按手册几小时重建；主站是对外门面加接单入口；内容工厂把做内容的"
           "过程也工具化——今天这份 deck 就是它生成的，包括各位现在看到的动画。")

# ── P12 线上实证（三截图） ──────────────────────────────────────────
s12 = P.add_slide(prs)
P.page_chrome(s12, 12, "Proof")
P.text(s12, P.Inches(P.MARGIN), P.Inches(0.95), P.Inches(12.2), P.Inches(0.7),
       "线上实证：网址就能打开", 30, P.INK, True).name = "title"
img_w, img_h, gap = 3.94, 2.46, 0.2
for i, (fn, name, url) in enumerate([
        ("home.png", "AsterForge 主站", "asterforge.top"),
        ("lekao.png", "LeKao 助教工作台", "lekao.asterforge.top"),
        ("game.png", "AsterNova 竞技场", "asterforge.top/projects/game")]):
    x = P.MARGIN + i * (img_w + gap)
    pic, cap = P.picture(s12, P.Inches(x), P.Inches(1.95), P.Inches(img_w),
                         P.Inches(img_h), os.path.join(SHOTS, fn),
                         caption=f"{name} · {url}")
    pic.name, cap.name = f"shot{i}box", f"shot{i}t"
P.text(s12, P.Inches(P.MARGIN), P.Inches(6.55), P.Inches(12.2), P.Inches(0.3),
       "小饭桌（xiaofanzhuo.asterforge.top）已上线并完成 HTTPS，商家暂未上架菜品，截图略。",
       9, P.MUTED, font=P.FONT_MONO).name = "prooffn"
P.notes(s12, "证据页。主站、LeKao、AsterNova，三个网址现在就能打开，截图是今天"
             "从生产环境截的。小饭桌也已上线，只是商家还没上架菜品，所以没放图。"
             "对所有观众：不用信我说的，打开网址自己看。")

# ── P13 生产力飞轮 ──────────────────────────────────────────────────
s = P.slide_chain(prs, 13, "Flywheel", "每做一个项目，下一个就更快", [
    ("项目实战", "每个项目都会留下\n重复出现的方法"),
    ("写成 Skill", "ppt 17 种页面范式\nhumanizer 去 AI 腔"),
    ("复用到下项", "deck、文案、部署\n直接调用模板"),
    ("开源出去", "dsh-claude-import\n配置一键迁移"),
], hi=1,
   sub_title="已上线的产线工具",
   subs=[("代码画 PPT", "skills/ppt · 本 deck 出品方"),
         ("去 AI 腔 v5", "skills/humanizer"),
         ("Claude 配置迁移", "github · dsh-claude-import")])
P.notes(s, "一个人为什么能同时跑这么多条线？方法在这页。每个项目做完，把重复的"
           "劳动写成工具：画 PPT 的 skill、去 AI 腔的 skill、配置迁移的开源工具。"
           "下一个项目直接调用。别人交付项目就结束了，我交付项目还多出一条产线。")

# ── P14 章节 02 ─────────────────────────────────────────────────────
s = P.slide_section(prs, 2, "未来：只做三件事", [
    "变现：把冻结的产品收尾，开始收款",
    "增长：免费聚用户，流量产品按规格推进",
    "杠杆：内容产线直出视频，开源养品牌",
], total=2, domain="ASTERFORGE PRODUCT LANDSCAPE · 2026-08")
P.notes(s, "第二部分讲未来。不摊大饼，只做三件事：收款、流量、内容杠杆。"
           "三件事互相撑着：收款给现金流，流量给用户，内容让一个人维护得过来。")

# ── P15 演进时间轴 ──────────────────────────────────────────────────
s = P.slide_timeline(prs, 15, "History", "从实验到上线，走了三步", [
    ("实验期", "Genesis v2、一言道生\nself-hosted TTS"),
    ("能力期", "AsterNova 联机架构\n签下首份硬件定制协议"),
    ("产品期", "ResumeAIX 立项\n主站与 LeKao 上线"),
    ("成线期", "小饭桌上线\n17 服务单机成体系"),
], hi=3)
P.notes(s, "回头看重心怎么迁的。早期做实验，Genesis、小程序、TTS，大部分归档了——"
           "归档不是失败，是把歧路从地图上划掉。后来两年把最难的实时架构做扎实，"
           "再后来转向做产品。今年八月，小饭桌上线，所有东西连成了体系。")

# ── P16 金句 ────────────────────────────────────────────────────────
s = P.slide_quote(prs, "归档一个项目，不是失败，是把歧路从地图上划掉。",
                  "TimeCraker · 写在 genesis-v2 与 smart-product-publisher 归档之后")
P.notes(s, "这页只讲一句话。看时间轴会觉得做了很多又砍了很多；留在这句上："
           "归档不是失败，是排除。现在剩下的每条线，都是排除过歧路之后的答案。")

# ── P17 未来三件事 ──────────────────────────────────────────────────
s = P.slide_cards(prs, 17, "Next", "未来一年，只做三件事", [
    ("收款", "ResumeAIX 接正式支付\n定制开发持续接单\n首份协议已在交付"),
    ("流量", "小饭桌模式复制给更多商家\nLeKao 免费聚助教口碑\n主站投票让用户点菜"),
    ("内容杠杆", "vibe-motion 动效编排上线\ndeck-to-video 直出成片\n开源工具养个人品牌"),
], cols=3)
P.notes(s, "未来规划就三件事。收款：ResumeAIX 支付上线，定制接单继续——这是现金流。"
           "流量：小饭桌复制、LeKao 聚口碑、主站投票让用户参与选题。内容杠杆："
           "动效和视频产线上线后，一份内容能变成 deck 也能变成视频。")

# ── P18 路线图 ──────────────────────────────────────────────────────
s = P.slide_timeline(prs, 18, "Roadmap", "未来 12 个月，按季度交付", [
    ("2026 Q4", "ResumeAIX 支付上线\n小饭桌真机验收收尾"),
    ("2027 Q1", "LeKao 口碑运营\nvibe-motion 发布"),
    ("2027 Q2", "deck-to-video 出首片\n不增长的线，归档"),
], hi=0)
P.notes(s, "路线按季度给交付物。四季度：支付上线、小饭桌收尾。一季度：LeKao 运营、"
           "动效 skill 发布。二季度：视频产线出第一条成片，同时做一次强制复盘——"
           "不增长的产品归档，把人挪到增长的线上。一次只推进一个在研项目，"
           "这条纪律不变。")

# ── P19 尾页 ────────────────────────────────────────────────────────
s = P.slide_closing(prs, META, [
    "asterforge.top · github.com/TimeCraker",
    "timecraker@foxmail.com",
    "© 2026 TimeCraker / AsterForge",
], slogan=[("一个人，一条完整的产品流水线。", 36, P.PAPER, True),
           ("下一步，让它自己产生现金流。", 16, P.CREAM, False)])
P.notes(s, "收尾回到开场那句话：独立开发者的优势不是人力，是系统。"
           "所有产品都在线上，网址在屏幕上，欢迎随时打开验证。谢谢。")

# ── 动画 + 转场 + 落盘 ──────────────────────────────────────────────
n_fx = anim.auto_deck()
anim.stagger(P.shape_groups(s12, "shot"), "float_up", step=0.15)   # P12 三截图级联
P.set_transition(prs, "fade")
prs.save(OUT)
print(f"OK saved {os.path.normpath(OUT)} ({len(prs.slides)} slides, {n_fx} fx planned)")
anim.apply(OUT)  # COM 写入动画并读回自验证

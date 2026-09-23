# -*- coding: utf-8 -*-
"""三份投递向简历：母版方案 D + 分方向配色 / 纹样 / 侧重点。"""
from pathlib import Path

HERE = Path(__file__).resolve().parent

TK_MARK = """
          <svg class="tk-mark" viewBox="0 0 512 512" aria-hidden="true">
            <rect width="512" height="512" rx="96" fill="var(--bone)"/>
            <rect x="18" y="18" width="476" height="476" rx="78" fill="none" stroke="var(--gold)" stroke-width="9"/>
            <g transform="translate(38 38) scale(0.85)">
              <path fill="var(--ink)" d="M70 88h274l-43 60h-61v228l-54 84V148h-78L70 88Z"/>
              <path fill="var(--ink)" d="M355 88h87l-38 60h-91l42-60Z"/>
              <path fill="var(--ink)" d="M332 184h101l-38 60h-51l-72 102h108l53 70H240l-32-34 77-145 47-53Z"/>
              <path fill="#F5F1E8" d="m344 88 11 0-42 60h-12l43-60Zm-38 60h13L251 244l-53 184-12 18 54-214 66-84Z"/>
              <path fill="#D06448" d="m321 132 10-12-68 104-51 176-11 17 48-190 72-95Z"/>
            </g>
          </svg>
"""

ART_MARK = """
        <svg class="art-mark" viewBox="0 0 512 512" aria-hidden="true">
          <path fill="var(--bone)" d="M70 88h274l-43 60h-61v228l-54 84V148h-78L70 88Z"/>
          <path fill="var(--bone)" d="M355 88h87l-38 60h-91l42-60Z"/>
          <path fill="var(--bone)" d="M332 184h101l-38 60h-51l-72 102h108l53 70H240l-32-34 77-145 47-53Z"/>
          <path fill="var(--peach)" d="m321 132 10-12-68 104-51 176-11 17 48-190 72-95Z"/>
        </svg>
"""

# DualSense-inspired line pad. No ABXY, no logo.
GAMEPAD_INNER = """
        <path class="pad-body" d="M48 54 C34 54 24 66 24 82 C24 106 42 124 66 124 H174 C198 124 216 106 216 82 C216 66 206 54 192 54 C184 40 158 32 140 32 H100 C82 32 56 40 48 54 Z" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.95"/>
        <path d="M70 26 h36 a3 3 0 0 1 3 3 v6 h-42 v-6 a3 3 0 0 1 3-3 Z" stroke="var(--gold)" stroke-width="0.75" fill="none" opacity="0.8"/>
        <path d="M134 26 h36 a3 3 0 0 1 3 3 v6 h-42 v-6 a3 3 0 0 1 3-3 Z" stroke="var(--gold)" stroke-width="0.75" fill="none" opacity="0.8"/>
        <circle cx="74" cy="80" r="16.5" stroke="var(--peach)" stroke-width="0.8" opacity="0.85"/>
        <path d="M74 68 v8 M74 84 v8 M62 80 h8 M78 80 h8" stroke="var(--coral-deep)" stroke-width="1.2" opacity="0.9"/>
        <rect x="71.2" y="76.2" width="5.6" height="5.6" transform="rotate(45 74 79)" stroke="var(--gold)" stroke-width="0.55" fill="none" opacity="0.75"/>
        <circle cx="166" cy="68" r="5.2" stroke="var(--peach)" stroke-width="0.9" opacity="0.9"/>
        <circle cx="178" cy="80" r="5.2" stroke="var(--peach)" stroke-width="0.9" opacity="0.9"/>
        <circle cx="166" cy="92" r="5.2" stroke="var(--peach)" stroke-width="0.9" opacity="0.9"/>
        <circle cx="154" cy="80" r="5.2" stroke="var(--peach)" stroke-width="0.9" opacity="0.9"/>
        <rect x="102" y="58" width="16" height="22" rx="3" stroke="var(--gold)" stroke-width="0.7" opacity="0.75"/>
        <rect x="122" y="58" width="16" height="22" rx="3" stroke="var(--gold)" stroke-width="0.7" opacity="0.75"/>
        <circle cx="96" cy="104" r="8.5" stroke="currentColor" stroke-width="0.75" opacity="0.55"/>
        <circle cx="96" cy="104" r="3.2" fill="var(--gold)" opacity="0.5"/>
        <circle cx="144" cy="104" r="8.5" stroke="currentColor" stroke-width="0.75" opacity="0.55"/>
        <circle cx="144" cy="104" r="3.2" fill="var(--gold)" opacity="0.5"/>
        <circle cx="120" cy="112" r="2.2" fill="var(--coral-deep)" opacity="0.6"/>
        <path d="M48 54 C40 62 36 72 36 82" stroke="var(--peach)" stroke-width="0.5" opacity="0.45"/>
        <path d="M192 54 C200 62 204 72 204 82" stroke="var(--peach)" stroke-width="0.5" opacity="0.45"/>
"""

CASDOOR = (
    "Casdoor：合入一处生产防护。dev 模式前端不可达时，避免反向代理打挂 K8s 探针。"
    " dsh-claude-import：把 Claude Code 配置幂等导入 DeepSeek Harness。"
)


def wrap(title: str, extra_css: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>{title}</title>
  <link rel="stylesheet" href="base.css" />
  <style>
{extra_css}
  </style>
</head>
<body>
{body}
</body>
</html>
"""


def skills(groups: list[tuple[str, str]]) -> str:
    rows = "\n".join(
        f"          <dt>{k}</dt>\n          <dd>{v}</dd>" for k, v in groups
    )
    return f"""
      <section class="rail-block">
        <h2>技能</h2>
        <dl class="skills">
{rows}
        </dl>
      </section>
"""


def mill_frame() -> str:
    return """
          <defs>
            <pattern id="mill" width="584" height="8" patternUnits="userSpaceOnUse">
              <path d="M0 0.5 H584" stroke="var(--bone)" stroke-width="0.55"/>
            </pattern>
          </defs>
          <rect width="584" height="136" fill="url(#mill)" opacity="0.055"/>
          <path d="M10 8 H574 V126 H62 L10 88 Z" stroke="var(--bone)" stroke-width="1.1" opacity="0.28"/>
          <path d="M16 14 H568 V120 H68 L16 86 Z" stroke="var(--gold)" stroke-width="0.7" opacity="0.4"/>
          <g fill="var(--peach)" stroke="var(--bone)" stroke-width="0.7">
            <circle cx="568" cy="14" r="3.1" opacity="0.55"/>
            <circle cx="568" cy="122" r="3.1" opacity="0.5"/>
            <circle cx="70" cy="122" r="2.7" opacity="0.45"/>
            <circle cx="16" cy="84" r="2.7" opacity="0.4"/>
          </g>
          <g fill="var(--gold-deep)">
            <circle cx="568" cy="14" r="0.9" opacity="0.55"/>
            <circle cx="568" cy="122" r="0.9" opacity="0.5"/>
            <circle cx="70" cy="122" r="0.8" opacity="0.45"/>
            <circle cx="16" cy="84" r="0.8" opacity="0.4"/>
          </g>
"""


def art_bl(kind: str) -> str:
    if kind == "game":
        return f"""
      <svg class="art art-bl" viewBox="0 0 256 224" fill="none" aria-hidden="true">
        <g transform="translate(10,108) rotate(-6 120 75) scale(0.96)" color="var(--coral)">
          {GAMEPAD_INNER}
        </g>
        <circle cx="128" cy="206" r="22" stroke="var(--gold)" stroke-width="0.5" opacity="0.28"/>
        <circle cx="128" cy="206" r="12" stroke="var(--peach)" stroke-width="0.45" opacity="0.3"/>
        <path d="M128 196 v6 M128 210 v6 M118 206 h6 M132 206 h6" stroke="var(--coral-deep)" stroke-width="0.55" opacity="0.35"/>
        <rect x="124.4" y="202.4" width="7.2" height="7.2" transform="rotate(45 128 206)" stroke="var(--coral)" stroke-width="0.55" fill="none" opacity="0.4"/>
      </svg>
"""
    if kind == "tools":
        return """
      <svg class="art art-bl" viewBox="0 0 256 224" fill="none" aria-hidden="true">
        <rect x="78" y="86" width="92" height="118" rx="12" stroke="var(--coral)" stroke-width="1.05" opacity="0.5"/>
        <rect x="86" y="98" width="76" height="92" rx="4" stroke="var(--gold)" stroke-width="0.7" opacity="0.45"/>
        <rect x="108" y="90" width="32" height="5" rx="2.5" stroke="var(--peach)" stroke-width="0.55" opacity="0.5"/>
        <rect x="112" y="196" width="24" height="3.2" rx="1.6" stroke="var(--gold)" stroke-width="0.5" opacity="0.45"/>
        <rect x="126" y="104" width="28" height="10" rx="5" stroke="var(--peach)" stroke-width="0.7" opacity="0.7"/>
        <circle cx="132" cy="109" r="2.1" fill="var(--gold)" opacity="0.55"/>
        <path d="M140 106.2 h8 M140 109 h8 M140 111.8 h6" stroke="var(--coral)" stroke-width="0.55" opacity="0.55"/>
        <rect x="94" y="120" width="60" height="22" rx="3" stroke="var(--coral)" stroke-width="0.65" opacity="0.45"/>
        <rect x="94" y="148" width="60" height="22" rx="3" stroke="var(--gold)" stroke-width="0.65" opacity="0.45"/>
        <path d="M102 128 h28 M102 134 h18" stroke="var(--peach)" stroke-width="0.7" opacity="0.4"/>
        <path d="M102 156 h28 M102 162 h18" stroke="var(--peach)" stroke-width="0.7" opacity="0.4"/>
        <circle cx="108" cy="184" r="2" fill="var(--coral)" opacity="0.4"/>
        <circle cx="124" cy="184" r="2" fill="var(--gold)" opacity="0.45"/>
        <circle cx="140" cy="184" r="2" fill="var(--coral)" opacity="0.4"/>
        <g transform="translate(18,150)" stroke="var(--coral-deep)" fill="none" opacity="0.42">
          <rect x="0" y="0" width="22" height="22" stroke-width="1"/>
          <rect x="4" y="4" width="14" height="14" stroke-width="0.8"/>
          <rect x="8" y="8" width="6" height="6" stroke-width="0.7"/>
        </g>
        <path d="M42 118 h38 v18 h-10" stroke="var(--gold)" stroke-width="0.55" opacity="0.32"/>
        <path d="M28 96 h42 v14 a6 6 0 0 1-6 6 H34 a6 6 0 0 1-6-6 Z" stroke="var(--peach)" stroke-width="0.7" opacity="0.48"/>
        <path d="M28 116 l6 -6" stroke="var(--peach)" stroke-width="0.7" opacity="0.48"/>
        <path d="M36 102 h22 M36 107 h14" stroke="var(--coral)" stroke-width="0.55" opacity="0.35"/>
      </svg>
"""
    return """
      <svg class="art art-bl" viewBox="0 0 256 224" fill="none" aria-hidden="true">
        <g opacity="0.28" stroke="var(--gold)" stroke-width="0.45">
          <path d="M0 132 H108"/>
          <path d="M0 142 H92"/>
          <path d="M0 152 H78"/>
          <path d="M0 162 H64"/>
          <path d="M0 172 H52"/>
          <path d="M0 182 H40"/>
          <path d="M0 192 H28"/>
        </g>
        <path d="M8 224 V118 H96" stroke="var(--coral)" stroke-width="0.95" opacity="0.42"/>
        <path d="M14 224 V128 H86" stroke="var(--gold)" stroke-width="0.55" opacity="0.38"/>
        <path d="M20 224 V138 H76" stroke="var(--peach)" stroke-width="0.4" opacity="0.45"/>
        <path d="M8 118 V108" stroke="var(--coral-deep)" stroke-width="0.9" opacity="0.4"/>
        <path d="M96 118 H108" stroke="var(--coral-deep)" stroke-width="0.9" opacity="0.4"/>
        <rect x="86.4" y="108.4" width="9.2" height="9.2" transform="rotate(45 91 113)" stroke="var(--coral)" stroke-width="0.7" fill="none" opacity="0.42"/>
        <circle cx="14" cy="208" r="2.3" stroke="var(--coral-deep)" stroke-width="0.7" fill="var(--gold)" fill-opacity="0.4" opacity="0.6"/>
        <circle cx="14" cy="208" r="0.75" fill="var(--gold-deep)" opacity="0.55"/>
        <circle cx="86" cy="128" r="2" stroke="var(--coral)" stroke-width="0.6" fill="none" opacity="0.45"/>
        <circle cx="86" cy="128" r="0.65" fill="var(--gold)" opacity="0.45"/>
        <path d="M26 108 h18" stroke="var(--coral-deep)" stroke-width="0.95" opacity="0.36"/>
        <path d="M26 115 h11" stroke="var(--gold)" stroke-width="0.7" opacity="0.38"/>
        <path d="M26 122 h15" stroke="var(--coral)" stroke-width="0.55" opacity="0.3"/>
      </svg>
"""


def art_plate(kind: str) -> str:
    extra = ""
    if kind == "game":
        extra = """
          <path d="M28 22 h12 v12" stroke="var(--peach)" stroke-width="0.8" opacity="0.4"/>
          <path d="M556 22 h-12 v12" stroke="var(--gold)" stroke-width="0.8" opacity="0.4"/>
          <path d="M556 114 h-12 v-12" stroke="var(--peach)" stroke-width="0.8" opacity="0.35"/>
          <circle cx="86" cy="96" r="16" stroke="var(--peach)" stroke-width="0.55" opacity="0.32"/>
          <circle cx="86" cy="96" r="8" stroke="var(--bone)" stroke-width="0.45" opacity="0.28"/>
          <path d="M86 86 v6 M86 100 v6 M76 96 h6 M90 96 h6" stroke="var(--peach)" stroke-width="0.7" opacity="0.45"/>
          <rect x="82.4" y="92.4" width="7.2" height="7.2" transform="rotate(45 86 96)" stroke="var(--gold)" stroke-width="0.55" fill="none" opacity="0.4"/>
"""
    elif kind == "tools":
        extra = """
          <rect x="268" y="28" width="52" height="18" rx="9" stroke="var(--peach)" stroke-width="0.85" opacity="0.55"/>
          <circle cx="280" cy="37" r="3.2" fill="var(--gold)" opacity="0.5"/>
          <path d="M292 32.5 h18 M292 37 h18 M292 41.5 h12" stroke="var(--bone)" stroke-width="0.7" opacity="0.45"/>
          <rect x="332" y="24" width="64" height="36" rx="4" stroke="var(--peach)" stroke-width="0.7" opacity="0.42"/>
          <rect x="406" y="24" width="56" height="36" rx="4" stroke="var(--gold)" stroke-width="0.7" opacity="0.42"/>
          <path d="M320 37 H332" stroke="var(--gold)" stroke-width="0.7" opacity="0.4"/>
          <path d="M396 42 H406" stroke="var(--gold)" stroke-width="0.7" opacity="0.4"/>
          <path d="M342 34 h28 M342 42 h18" stroke="var(--bone)" stroke-width="0.65" opacity="0.35"/>
          <path d="M416 34 h24 M416 42 h16" stroke="var(--bone)" stroke-width="0.65" opacity="0.35"/>
"""
    return f"""
        <svg class="art-on" viewBox="0 0 584 136" fill="none" aria-hidden="true" preserveAspectRatio="none">
          {mill_frame()}
          {extra}
        </svg>
"""


def plate_extra(kind: str) -> str:
    if kind == "game":
        return f"""
        <svg class="art-pad" viewBox="0 0 240 150" fill="none" aria-hidden="true" style="color:var(--bone)">
          {GAMEPAD_INNER}
        </svg>
"""
    return ""


SHARED_LAYOUT = """
    .page { display: grid; grid-template-columns: 64mm 1fr; }
    .rail { padding: 12mm 6.4mm 8mm 11mm; }
    .main { padding: 0 0 7.5mm 0; }
    .art-bl { left: 0; bottom: 0; width: 64mm; height: 56mm; }
    .plate {
      position: relative;
      overflow: hidden;
      height: 34mm;
      background: var(--coral);
      color: var(--bone);
      padding: 6.4mm 9.4mm 6mm 8.4mm;
      clip-path: polygon(0 0, 100% 0, 100% 100%, 14mm 100%, 0 70%);
    }
    .plate-role {
      position: relative;
      z-index: 2;
      font-size: 16.5pt;
      font-weight: 600;
      letter-spacing: 0.14em;
      line-height: 1.3;
    }
    .plate-rule {
      position: relative;
      z-index: 2;
      width: 20mm;
      height: 0.55mm;
      margin-top: 3mm;
      background: linear-gradient(90deg, var(--gold), var(--peach));
    }
    .plate .art-on {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .plate .art-mark {
      position: absolute;
      right: 6mm;
      top: 4mm;
      width: 22mm;
      height: 22mm;
      z-index: 1;
      opacity: 0.2;
    }
    .plate .art-pad {
      position: absolute;
      right: -6mm;
      bottom: -2mm;
      width: 54mm;
      height: 34mm;
      z-index: 1;
      opacity: 0.4;
      pointer-events: none;
    }
    .plate-stamp {
      position: absolute;
      left: 22mm;
      bottom: 3.2mm;
      width: 48mm;
      height: 4.2mm;
      z-index: 2;
      pointer-events: none;
    }
    .stack { padding: 5.6mm 9.2mm 0 8.2mm; }
"""

AI_THEME = """
    :root {
      --coral: #cc785c;
      --coral-deep: #9c4f37;
      --clay: #b45a3c;
      --gold: #c4a07a;
      --gold-deep: #9a734c;
      --peach: #e8c8b4;
      --bone: #fff8f3;
      --cream: #faf6f0;
      --paper: #fffcf8;
      --ink: #1c1917;
      --soft: #57534e;
      --mute: #78716c;
      --line: #e7e0d8;
    }
"""

GAME_THEME = """
    :root {
      --coral: #2A3140;
      --coral-deep: #B85A38;
      --clay: #3A4456;
      --gold: #C9A06A;
      --gold-deep: #8D7048;
      --peach: #E0C4A8;
      --bone: #F3EDE4;
      --cream: #EDE8E0;
      --paper: #F6F1E8;
      --ink: #1A1C22;
      --soft: #4E4B46;
      --mute: #6F6A64;
      --line: #DDD6CC;
    }
"""

TOOLS_THEME = """
    :root {
      --coral: #3E5348;
      --coral-deep: #2C3D36;
      --clay: #4A6356;
      --gold: #B8894A;
      --gold-deep: #8A6A3C;
      --peach: #DCCBB0;
      --bone: #F4F0E8;
      --cream: #F1EFE8;
      --paper: #F8F6F1;
      --ink: #1C1E1B;
      --soft: #4D524E;
      --mute: #6E746F;
      --line: #D9D6CE;
    }
"""


def page(kind: str, role_html: str, skills_html: str, main_html: str) -> str:
    return f"""
  <article class="page">
    <aside class="rail">
      <div class="glyph glyph-rail" aria-hidden="true">桓</div>
      {art_bl(kind)}
      <div class="identity">
        <div class="name">张桓睿</div>
        <div class="brand-row">
          {TK_MARK}
          <div class="handle">TIMECRAKER</div>
        </div>
        <div class="name-rule"></div>
      </div>
      <section class="rail-block">
        <h2>教育</h2>
        <div class="edu-name">湖北大学</div>
        <div class="edu-major">计算机科学与技术 · 本科</div>
        <div class="edu-date">2023.09 至 2027.06 · 武汉</div>
      </section>
      <section class="rail-block">
        <h2>联系</h2>
        <ul class="contact">
          <li>17764186883</li>
          <li>timecraker@foxmail.com</li>
          <li><a href="https://asterforge.top">asterforge.top</a></li>
          <li><a href="https://github.com/TimeCraker">github.com/TimeCraker</a></li>
        </ul>
      </section>
      {skills_html}
    </aside>
    <div class="main">
      <div class="plate">
        {art_plate(kind)}
        {plate_extra(kind)}
        {ART_MARK}
        <svg class="plate-stamp" viewBox="0 0 240 18" aria-hidden="true">
          <text x="0" y="13" fill="var(--coral)" stroke="var(--bone)" stroke-width="0.7" font-family="Noto Sans SC, sans-serif" font-size="11" font-weight="500" letter-spacing="3.4">TIMECRAKER</text>
        </svg>
        <div class="plate-role">{role_html}</div>
        <div class="plate-rule"></div>
      </div>
      <div class="stack">
{main_html}
      </div>
      <div class="glyph glyph-colophon" aria-hidden="true">睿</div>
    </div>
  </article>
"""


AI_MAIN = f"""
      <section class="sec">
        <h2>实习经历</h2>
        <div class="head">
          <h3>湖北小象智汇科技有限公司</h3>
          <span class="when">2026.05 起</span>
        </div>
        <p class="sub">AI应用全栈开发实习生 · 团队副主力 · TypeScript / NestJS / React / PostgreSQL</p>
        <div class="work">
          <h4>小象英语课堂教学系统</h4>
          <p class="meta">学生 PAD + 教师大屏 + 教研后台 · 单课 10-20 人，最多 3 堂并行，每生一 PAD</p>
          <ul>
            <li>主导<strong>学生端课堂运行时</strong>：入场登记、快照对齐、环节热插拔。断线后按快照接入当前环节，不回放历史。之后的教学环节都接在这套框架上。</li>
            <li>独立交付主题阅读、语篇应用（答题纸拍照、OCR 按空识别、自动判分），以及任务型阅读、学情评价。修过 OCR 用候选词改拼写导致的误判。</li>
            <li>教研后台做了组织架构、课程 SKU 与排课。参与单词密钥、人机对话等课堂交互。三端 Nginx + PM2 部署到腾讯云。</li>
          </ul>
        </div>
        <div class="work">
          <h4>培训班管理系统</h4>
          <p class="meta">管理端 Web + 员工 / 家长微信小程序 · 报名、缴费、分班、排课、消课</p>
          <ul>
            <li>后端支撑域：通知、家长短信登录、学生档案、课程商品。报名与试课赠送（服务端事务 + 管理端页面）接到待分班。</li>
            <li>管理端教务页按冻结 OpenAPI 对接。收款与支付上线排障（openid、全款规则、小程序 appId 分流）。域名、证书、Nginx 与 PM2 双进程部署。</li>
          </ul>
        </div>
      </section>
      <section class="sec">
        <h2>个人项目</h2>
        <div class="work">
          <div class="head">
            <h3>ResumeAIX · AI 简历生成</h3>
            <span class="when">独立产品 · 已上线</span>
          </div>
          <p class="meta">Next.js / Fastify / Prisma · PostgreSQL / Redis / BullMQ</p>
          <p class="links"><a href="https://resume.asterforge.top">resume.asterforge.top</a></p>
          <ul>
            <li>上线解析、STAR 重写、JD 匹配、ATS 评分、12 套模板导出。解析走队列，PDF 由独立服务用无头 Chrome 打印。</li>
            <li>对话改稿（对话 / 计划 / Agent）。Web、AI、导出拆成多服务。T-Coin 计费。</li>
          </ul>
        </div>
        <div class="work">
          <div class="head">
            <h3>ccweb · Claude Code 本地控制台</h3>
            <span class="when">独立开源</span>
          </div>
          <p class="links">
            <a href="https://github.com/TimeCraker/ccweb">github.com/TimeCraker/ccweb</a>
            &nbsp;&nbsp;/&nbsp;&nbsp; npm ccweb-console
          </p>
          <ul>
            <li>基于官方 Agent SDK 拉起真 Claude Code 进程。浏览器里看工具 diff、审批和高危确认。TTFT 等指标取自 SDK，不估算。</li>
          </ul>
        </div>
        <div class="work">
          <div class="head">
            <h3>AsterNova · 2D 多人实时竞技</h3>
            <span class="when">独立全栈 · 已上线</span>
          </div>
          <p class="meta">Go + WebSocket + Protobuf · Next.js / Godot(Wasm) / Unity</p>
          <p class="links">
            <a href="https://game.asterforge.top">game.asterforge.top</a>
            &nbsp;&nbsp;/&nbsp;&nbsp;
            <a href="https://github.com/TimeCraker/games">github.com/TimeCraker/games</a>
          </p>
          <ul>
            <li>服务端权威：客户端只上报输入。Godot / Unity 编成 Wasm 嵌进 Next.js。公网压测 P95 &lt;80ms。</li>
          </ul>
        </div>
        <div class="work">
          <h4>开源</h4>
          <ul>
            <li>{CASDOOR}</li>
          </ul>
        </div>
      </section>
"""

GAME_MAIN = f"""
      <section class="sec">
        <h2>实习经历</h2>
        <div class="head">
          <h3>湖北小象智汇科技有限公司</h3>
          <span class="when">2026.05 起</span>
        </div>
        <p class="sub">全栈开发实习生 · 主导学生端运行时 · TypeScript / React / NestJS / Socket.IO</p>
        <div class="work">
          <h4>小象英语课堂教学系统</h4>
          <p class="meta">学生 PAD 客户端 + 教师大屏 + 教研后台 · 单课 10-20 人，最多 3 堂并行</p>
          <ul>
            <li>主导<strong>学生端课堂运行时</strong>：入场登记、快照对齐、环节热插拔。断线后按快照接入当前环节，不回放历史。后续教学环节都接在这套框架上。</li>
            <li>课堂游戏化交互：单词密钥、碎片发放、人机对话重答。独立交付主题阅读、语篇应用（答题纸拍照、OCR 按空识别、自动判分）。</li>
            <li>三端 Nginx + PM2 部署到腾讯云。教研后台做了组织架构、课程 SKU 与排课。</li>
          </ul>
        </div>
        <div class="work">
          <h4>培训班管理系统</h4>
          <p class="meta">管理端 Web + 员工 / 家长微信小程序 · 报名、缴费、分班、排课、消课</p>
          <ul>
            <li>后端支撑域与报名闭环接到待分班。管理端按冻结 OpenAPI 对接。</li>
            <li>收款与支付上线排障（openid、全款规则、小程序 appId 分流）。域名、证书、Nginx 与 PM2 双进程部署。</li>
          </ul>
        </div>
      </section>
      <section class="sec">
        <h2>个人项目</h2>
        <div class="work">
          <div class="head">
            <h3>AsterNova · 2D 多人实时竞技</h3>
            <span class="when">独立全栈 · 已上线</span>
          </div>
          <p class="meta">Godot 4 / Unity · Wasm · Go + WebSocket + Protobuf · Next.js 宿主</p>
          <p class="links">
            <a href="https://game.asterforge.top">game.asterforge.top</a>
            &nbsp;&nbsp;/&nbsp;&nbsp;
            <a href="https://github.com/TimeCraker/games">github.com/TimeCraker/games</a>
          </p>
          <ul>
            <li>服务端权威：客户端只上报输入。Godot 自研轻量 Protobuf 解码；Unity / Godot 编成 Wasm 嵌进 Next.js，JS Bridge 做 Token 与沙盒通信。</li>
            <li>快照插值减轻弱网拉扯；Hit-Stop 0.08s / 0.15s，配合相机震动。Go 拆接入、匹配、战斗，Channel 背压避免高频广播阻塞。公网压测 P95 &lt;80ms。</li>
          </ul>
        </div>
        <div class="work">
          <div class="head">
            <h3>ResumeAIX · AI 简历生成</h3>
            <span class="when">独立产品 · 已上线</span>
          </div>
          <p class="meta">Next.js / Fastify / Prisma · PostgreSQL / Redis / BullMQ</p>
          <p class="links"><a href="https://resume.asterforge.top">resume.asterforge.top</a></p>
          <ul>
            <li>从 0 上线解析、STAR 重写、多模板导出。Web / AI / Export 拆成多服务并完成生产部署。</li>
          </ul>
        </div>
        <div class="work">
          <div class="head">
            <h3>ccweb · Claude Code 本地控制台</h3>
            <span class="when">独立开源</span>
          </div>
          <p class="links">
            <a href="https://github.com/TimeCraker/ccweb">github.com/TimeCraker/ccweb</a>
            &nbsp;&nbsp;/&nbsp;&nbsp; npm ccweb-console
          </p>
          <ul>
            <li>基于官方 Agent SDK 拉起真 Claude Code 进程。浏览器里看工具 diff、审批和高危确认。</li>
          </ul>
        </div>
        <div class="work">
          <h4>开源</h4>
          <ul>
            <li>{CASDOOR}</li>
          </ul>
        </div>
      </section>
"""

TOOLS_MAIN = f"""
      <section class="sec">
        <h2>实习经历</h2>
        <div class="head">
          <h3>湖北小象智汇科技有限公司</h3>
          <span class="when">2026.05 起</span>
        </div>
        <p class="sub">全栈开发实习生 · 团队副主力 · TypeScript / NestJS / React / UniApp / PostgreSQL</p>
        <div class="work">
          <h4>培训班管理系统</h4>
          <p class="meta">管理端 Web + 员工 / 家长微信小程序 · 报名、缴费、分班、排课、消课</p>
          <ul>
            <li>后端支撑域：通知、家长短信登录、学生档案、课程商品。报名与试课赠送（服务端事务 + 管理端页面）接到待分班。</li>
            <li>管理端教务页按冻结 OpenAPI 对接。收款与支付上线排障（openid、全款规则、小程序 appId 分流）。公众号通知按类目模板真接，openid 用 unionId 解析，避免和小程序串号。</li>
            <li>域名、证书、Nginx 分流与 PM2 双进程部署到腾讯云。</li>
          </ul>
        </div>
        <div class="work">
          <h4>小象英语课堂教学系统</h4>
          <p class="meta">学生 PAD + 教师大屏 + 教研后台 · 单课 10-20 人，最多 3 堂并行，每生一 PAD</p>
          <ul>
            <li>主导学生端课堂运行时：入场登记、快照对齐、环节热插拔。断线后按快照接入当前环节。独立交付主题阅读、语篇应用（答题纸拍照、OCR 按空识别、自动判分），以及任务型阅读、学情评价。</li>
            <li>教研后台做了组织架构、课程 SKU 与排课。三端 Nginx + PM2 部署到腾讯云。</li>
          </ul>
        </div>
      </section>
      <section class="sec">
        <h2>个人项目</h2>
        <div class="work">
          <div class="head">
            <h3>ResumeAIX · AI 简历生成</h3>
            <span class="when">独立产品 · 已上线</span>
          </div>
          <p class="meta">Next.js / Fastify / Prisma · PostgreSQL / Redis / BullMQ</p>
          <p class="links"><a href="https://resume.asterforge.top">resume.asterforge.top</a></p>
          <ul>
            <li>上线解析、STAR 重写、JD 匹配、ATS 评分、12 套模板导出。解析走队列，PDF 由独立服务用无头 Chrome 打印。</li>
            <li>对话改稿（对话 / 计划 / Agent）。Web、AI、导出拆成多服务。T-Coin 计费。</li>
          </ul>
        </div>
        <div class="work">
          <div class="head">
            <h3>ccweb · Claude Code 本地控制台</h3>
            <span class="when">独立开源</span>
          </div>
          <p class="links">
            <a href="https://github.com/TimeCraker/ccweb">github.com/TimeCraker/ccweb</a>
            &nbsp;&nbsp;/&nbsp;&nbsp; npm ccweb-console
          </p>
          <ul>
            <li>基于官方 Agent SDK 拉起真 Claude Code 进程。浏览器里看工具 diff、审批和高危确认。TTFT 等指标取自 SDK，不估算。</li>
          </ul>
        </div>
        <div class="work">
          <div class="head">
            <h3>AsterNova · 2D 多人实时竞技</h3>
            <span class="when">独立全栈 · 已上线</span>
          </div>
          <p class="meta">Go + WebSocket + Protobuf · Next.js / Godot(Wasm) / Unity</p>
          <p class="links">
            <a href="https://game.asterforge.top">game.asterforge.top</a>
            &nbsp;&nbsp;/&nbsp;&nbsp;
            <a href="https://github.com/TimeCraker/games">github.com/TimeCraker/games</a>
          </p>
          <ul>
            <li>Go + WebSocket 权威同步，Godot / Unity Wasm 嵌进 Next.js。公网压测 P95 &lt;80ms。Docker / 云主机部署。</li>
          </ul>
        </div>
        <div class="work">
          <h4>开源</h4>
          <ul>
            <li>{CASDOOR}</li>
          </ul>
        </div>
      </section>
"""


def main() -> None:
    variants = [
        (
            "ai-agent.html",
            "张桓睿 · AI应用全栈开发",
            AI_THEME + SHARED_LAYOUT,
            page(
                "ai",
                "AI应用全栈开发<br />大模型应用开发",
                skills(
                    [
                        ("Agent", "Agent SDK · 工具审批 · 对话改稿 · BullMQ 队列"),
                        ("前端", "TypeScript · React · Next.js · Vite"),
                        ("后端", "NestJS · Go · PostgreSQL · Redis · BullMQ"),
                        ("实时", "Socket.IO · 快照"),
                        ("工程", "pnpm workspace · Docker · Nginx · PM2"),
                    ]
                ),
                AI_MAIN,
            ),
        ),
        (
            "game-client.html",
            "张桓睿 · 游戏客户端开发",
            GAME_THEME + SHARED_LAYOUT,
            page(
                "game",
                "游戏客户端开发<br />Godot · Unity · 实时同步",
                skills(
                    [
                        ("客户端", "Godot 4 · Unity · Wasm"),
                        ("同步", "Protobuf · 快照插值 · 预测"),
                        ("手感", "Hit-Stop · 相机震动 · JS Bridge"),
                        ("协同", "Go · 60Hz 权威 · Channel 背压"),
                        ("工程", "Docker · Next.js · TypeScript"),
                    ]
                ),
                GAME_MAIN,
            ),
        ),
        (
            "fullstack-miniprogram.html",
            "张桓睿 · 全栈 / 小程序",
            TOOLS_THEME + SHARED_LAYOUT,
            page(
                "tools",
                "全栈开发工程师<br />管理端 · 微信小程序",
                skills(
                    [
                        ("前端", "TypeScript · React · Next.js · Ant Design"),
                        ("小程序", "UniApp · 微信登录 / 支付"),
                        ("后端", "NestJS · PostgreSQL · Redis · OpenAPI"),
                        ("实时", "Socket.IO · 快照"),
                        ("工程", "Docker · Nginx · PM2"),
                    ]
                ),
                TOOLS_MAIN,
            ),
        ),
    ]
    for name, title, css, body in variants:
        path = HERE / name
        path.write_text(wrap(title, css, body), encoding="utf-8")
        print("wrote", path.name, path.stat().st_size)


if __name__ == "__main__":
    main()

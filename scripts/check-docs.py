#!/usr/bin/env python3
"""check-docs.py -- meta-doc drift check (exit 1 = drift found).

Checks:
  1. README skills table <-> skills/ directory alignment (both directions)
  2. Path references in meta docs resolve (products/ = local-only warn; archived docs skipped)
  3. PAT entries in assets/patterns.md have required fields; index rows match
  3.5 component-catalog scene-kit heading count == table rows
  3.6 Backticked PascalCase symbols in README / product-map resolve to a real export
  4. README install loop / structure tree / prose count all cover every skill
  5. .claude/skills junctions exist per skill (local machine only, warn)

GBK console safe: ASCII-only output.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

META_DOCS = ["README.md", "CLAUDE.md", "workflows/explainer-video.md",
             "assets/patterns.md", "assets/component-catalog.md", "assets/README.md"]
META_DOCS += sorted(glob.glob("docs/*.md")) + sorted(glob.glob("skills/*/SKILL.md"))
# 项目与产品的 README 也带大量跨区引用（复跑命令、产物路径），过去完全不在检查范围
META_DOCS += sorted(glob.glob("projects/*/README.md")) + sorted(glob.glob("products/*/README.md"))

# 存档文档（被后站吸收合并的 spec）里的引用本就不该再被生产，跳过其路径检查，
# 否则那几条 WARN 永远消不掉，只会训练人忽略 WARN。用文首一行 `> 状态：已存档` 标记。
ARCHIVED_RE = re.compile(r"状态[:：]\s*已存档")
ARCHIVED_HINT = "（存档：被吸收合并，未独立施工）"

errors, warns = [], []
archived_docs = set()

# --- 1. README skills table <-> skills/ dir ---
readme = open("README.md", encoding="utf-8").read()
table_skills = set(re.findall(r"\]\(skills/([a-z\-]+)/\)", readme))
disk_skills = {d for d in os.listdir("skills") if os.path.isdir(os.path.join("skills", d))}
for s in sorted(disk_skills - table_skills):
    errors.append(f"skill on disk but missing from README table: skills/{s}/")
for s in sorted(table_skills - disk_skills):
    errors.append(f"README table references nonexistent skill: skills/{s}/")

# --- 2. cross-doc path references (repo-root zones only) ---
# Only refs starting with a root zone prefix are cross-doc coupling; relative
# fragments inside a doc (e.g. src/cues.ts in a SKILL.md) are intra-doc and skipped.
STRICT = ("skills/", "assets/", "docs/", "workflows/", "scripts/")
SOFT = ("projects/", "products/")  # evolving workspace / local-only products -> warn
ref_re = re.compile(r"`((?:skills|assets|docs|workflows|scripts|projects|products)/[A-Za-z0-9_\-./*]+)`")
for doc in META_DOCS:
    if not os.path.isfile(doc):
        errors.append(f"meta doc listed but missing on disk: {doc}")
        continue
    text = open(doc, encoding="utf-8").read()
    # 只认文首那一行状态标记。全文件搜会误伤：CLAUDE.md 里写着这条约定本身的示例，
    # 整篇就会被当成存档文档跳过检查（踩过一次）。
    if ARCHIVED_RE.search("\n".join(text.splitlines()[:12])):
        archived_docs.add(doc)
        continue
    for raw in sorted(set(ref_re.findall(text))):
        if "*" in raw:
            if not glob.glob(raw):
                msg = f"{doc}: glob path matches nothing: {raw}"
                (warns if raw.startswith(SOFT) else errors).append(msg)
            continue
        if not os.path.exists(raw):
            msg = f"{doc}: referenced path does not exist: {raw}"
            if raw.startswith(SOFT):
                warns.append(msg + (" (product not rendered yet / fresh clone)" if raw.startswith("products/") else " (spec may reference future file)"))
            else:
                errors.append(msg)

# --- 3. PAT entries ---
pat_doc = "assets/patterns.md"
if os.path.isfile(pat_doc):
    t = open(pat_doc, encoding="utf-8").read()
    sections = re.findall(r"^## (PAT-\d+)", t, re.M)
    index_rows = re.findall(r"^\| (PAT-\d+) \|", t, re.M)
    if len(set(sections)) != len(sections):
        errors.append("patterns.md: duplicate PAT section numbers")
    if set(index_rows) != set(sections):
        errors.append(f"patterns.md: index rows {len(set(index_rows))} != sections {len(set(sections))}")
    body = re.split(r"^## (PAT-\d+)", t, flags=re.M)
    for i in range(1, len(body), 2):
        pat_id, pat_body = body[i], body[i + 1]
        for field in ("**适用**", "**版式**", "**组件**", "**坑**", "**参考帧**"):
            if field not in pat_body:
                errors.append(f"patterns.md: {pat_id} missing field {field}")
        for m in re.findall(r"`(assets/patterns-frames/[^`]+)`", pat_body):
            if not os.path.exists(m):
                errors.append(f"patterns.md: {pat_id} frame missing: {m}")

# --- 3.5 component-catalog 标题计数 <-> 表体行数 ---
# 家底登记簿的标题写死了一个组件数，加组件时最容易只加行不改标题（实测标题曾长期停在
# 「13 + MG 武器 4」而表体已有 23 行）。让标题和表体互为约束，谁改了另一个就报错。
cat_doc = "assets/component-catalog.md"
if os.path.isfile(cat_doc):
    ct = open(cat_doc, encoding="utf-8").read()
    m_head = re.search(r"^## scene-kit（[^）]*?(\d+)\s*个组件", ct, re.M)
    if not m_head:
        errors.append("component-catalog.md: scene-kit heading missing the 'N components' count")
    else:
        sec = ct[m_head.end():]
        sec = re.split(r"^## ", sec, flags=re.M)[0]
        n_rows = len(re.findall(r"(?m)^\| `", sec))
        if int(m_head.group(1)) != n_rows:
            errors.append(f"component-catalog.md: heading says {m_head.group(1)} components, table has {n_rows} rows")

# --- 3.6 入口文档里的反引号符号必须解析到真实的组件/组合 ---
# README 与 product-map 是「产品入口」的权威文档。它们用反引号写的 PascalCase 名字
# （CoverV3 / DeckVideoV2 / FootageOverlay …）等于在向读者承诺「这东西存在」。
# 曾经长期失效：CoverV3 只存在于 projects/lekao-intro/，skill 模板里没有，
# 新项目按文档走是死路；而第 2 项只认 skills/ 前缀的路径引用，抓不到裸符号。
# 范围刻意只限这两份入口文档：全仓扫会有大量误报（上游 API、非 src/ 的导出等）。
ENTRY_DOCS = ["README.md", "docs/product-map.md"]
UPSTREAM_SYMBOLS = {"TransitionSeries", "WebSocket", "React", "Remotion", "AbsoluteFill"}
symbols = set()
for f in sorted(glob.glob("skills/**/src/**/*.ts*", recursive=True)
                + glob.glob("projects/**/src/**/*.ts*", recursive=True)):
    st = open(f, encoding="utf-8", errors="ignore").read()
    symbols |= set(re.findall(r"export (?:const|function|class|type|interface) ([A-Za-z0-9_]+)", st))
    symbols |= set(re.findall(r"id:\s*[\"']([A-Za-z0-9_]+)[\"']", st))
    symbols |= set(re.findall(r"id=[\"']([A-Za-z0-9_]+)[\"']", st))
for doc in ENTRY_DOCS:
    if not os.path.isfile(doc):
        continue
    dt = open(doc, encoding="utf-8").read()
    for name in sorted(set(re.findall(r"`([A-Z][A-Za-z0-9]{2,})`", dt))):
        if name in symbols or name in UPSTREAM_SYMBOLS:
            continue
        errors.append(f"{doc}: symbol `{name}` resolves to no component/composition export")

# --- 4. README install loop + structure tree + prose count must cover every skill ---
# 失败模式：新 skill 只加了技能表一行，散文里的数量词、结构树、junction 安装循环全忘了。
# 历史上漏过 ppt-deck 改名 ppt、收录 humanizer，2026-10-01 收录 publish 又漏了一次。
# 第 1 项只认 markdown 链接，围栏代码块与散文不在它的检查范围，所以单列这一项。
CN_NUM = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}

m_install = re.search(r"foreach \(\$s in ([^)]*)\)", readme)
if not m_install:
    errors.append("README: junction install loop (foreach ...) not found")
else:
    listed = set(re.findall(r"'([a-z][a-z\-]*)'", m_install.group(1)))
    for s in sorted(disk_skills - listed):
        errors.append(f"README install loop missing skill: {s}")
    for s in sorted(listed - disk_skills):
        errors.append(f"README install loop lists nonexistent skill: {s}")

m_tree = re.search(r"```\n(vibe-studio/.*?)```", readme, re.S)
if not m_tree:
    errors.append("README: structure tree fenced block not found")
else:
    tree_skills, in_skills = set(), False
    for line in m_tree.group(1).splitlines():
        if re.match(r"^[├└]── ", line):
            in_skills = bool(re.match(r"^[├└]── skills/", line))
            continue
        if in_skills:
            m = re.match(r"^│\s+[├└]── ([a-z][a-z\-]*)/", line)
            if m:
                tree_skills.add(m.group(1))
    for s in sorted(disk_skills - tree_skills):
        errors.append(f"README structure tree missing skill: skills/{s}/")
    for s in sorted(tree_skills - disk_skills):
        errors.append(f"README structure tree lists nonexistent skill: {s}")

for m in re.finditer(r"([一二三四五六七八九十]+)个 skill", readme):
    n = CN_NUM.get(m.group(1))
    if n is not None and n != len(disk_skills):
        errors.append(f"README prose says {n} skills but skills/ has {len(disk_skills)}")

# --- 5. junctions (local only) ---
for s in sorted(disk_skills):
    if not os.path.isdir(os.path.join(".claude", "skills", s)):
        warns.append(f"junction missing (run README setup): .claude/skills/{s}")

for w in warns:
    print(f"WARN  {w}")
for e in errors:
    print(f"FAIL  {e}")
arch = f", {len(archived_docs)} archived skipped" if archived_docs else ""
print(f"--- check-docs: {len(errors)} fail, {len(warns)} warn{arch}")
sys.exit(1 if errors else 0)

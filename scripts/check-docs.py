#!/usr/bin/env python3
"""check-docs.py -- meta-doc drift check (exit 1 = drift found).

Checks:
  1. README skills table <-> skills/ directory alignment (both directions)
  2. Path references in meta docs resolve (products/ = local-only warn)
  3. PAT entries in assets/patterns.md have required fields; index rows match
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

errors, warns = [], []

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
        errors.append(f"README prose says 「{m.group(1)}个 skill」 but skills/ has {len(disk_skills)}")

# --- 5. junctions (local only) ---
for s in sorted(disk_skills):
    if not os.path.isdir(os.path.join(".claude", "skills", s)):
        warns.append(f"junction missing (run README setup): .claude/skills/{s}")

for w in warns:
    print(f"WARN  {w}")
for e in errors:
    print(f"FAIL  {e}")
print(f"--- check-docs: {len(errors)} fail, {len(warns)} warn")
sys.exit(1 if errors else 0)

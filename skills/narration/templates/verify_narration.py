# -*- coding: utf-8 -*-
"""
verify_narration.py — narration segment script checker (red/green gate).

Usage: python verify_narration.py <script.json> [--cps 4.5] [--budget-seconds 22]
Output: one line per segment [OK]/[WARN]/[FAIL] (English only), then summary lines.
Exit:  0 = no FAIL, 1 = at least one FAIL, 2 = file not readable.

Checks:
  1. structure       FAIL  parseable JSON; meta.lang/budgetSeconds present;
                           segments non-empty; each segment has id/text/ref
  2. subtitle length FAIL  kind=subtitle segment <= 20 chars after stripping
  3. budget          FAIL  total seconds exceeds budgetSeconds by > 10%
                           (under budget = breathing room, by design, not a fault)
  4. em-dash ban     FAIL  raw text contains em/en dash
  5. AI-flavor words WARN  default wordlist + meta.bannedWords hits
  6. modifier density WARN over 12 hits per 1000 chars

Char count strips whitespace and punctuation first (spec section 2); seconds
are derived = chars / cps, rounded to 1 decimal. Authors never write counts.
"""
import argparse
import json
import re
import sys

sys.stdout.reconfigure(errors="replace")  # GBK 控制台下中文 text 打成 ? 也不崩

# spec §2 给死的剥离集：空白 + 中英标点
STRIP_RE = re.compile(r"[\s，。！？；：、\u201c\u201d\u2018\u2019（）《》…—,.!?;:'\"()]")
DASH_RE = re.compile(r"——|—|–")
AI_PHRASES = ["首先", "其次", "最后", "总而言之", "值得注意的是", "众所周知",
              "综上所述", "极大地", "有效地"]  # 「不仅…而且」单独按双词共现判
MODIFIERS = ["非常", "十分", "特别", "超级", "真的", "其实", "基本", "大概"]
SUBTITLE_MAX_CHARS = 20
BUDGET_TOLERANCE = 0.10
MODIFIER_LIMIT = 12.0  # 每千字
DEFAULT_CPS = 4.5


def strip_count(text):
    return len(STRIP_RE.sub("", text))


def main():
    ap = argparse.ArgumentParser(
        description="narration segment script checker: structure, subtitle length, "
                    "budget, em-dash ban, AI-flavor words, modifier density")
    ap.add_argument("script", help="path to segment script JSON")
    ap.add_argument("--cps", type=float, default=None,
                    help="chars per second, overrides meta (default 4.5)")
    ap.add_argument("--budget-seconds", type=float, default=None,
                    help="total speech budget in seconds, overrides meta")
    args = ap.parse_args()

    try:
        with open(args.script, encoding="utf-8") as f:
            data = json.load(f)
    except OSError as e:
        print(f"[FAIL] cannot read file: {e}")
        sys.exit(2)
    except json.JSONDecodeError as e:
        print(f"[FAIL] structure: invalid JSON ({e})")
        sys.exit(1)

    fails = warns = 0
    if not isinstance(data, dict) or not isinstance(data.get("meta"), dict):
        print("[FAIL] structure: missing meta object")
        fails += 1
        meta = {}
    else:
        meta = data["meta"]
    if "lang" not in meta:
        print("[FAIL] structure: meta.lang missing")
        fails += 1
    if "budgetSeconds" not in meta:
        print("[FAIL] structure: meta.budgetSeconds missing")
        fails += 1

    cps = args.cps if args.cps is not None else meta.get("charsPerSecond", DEFAULT_CPS)
    budget = (args.budget_seconds if args.budget_seconds is not None
              else meta.get("budgetSeconds"))
    banned = meta.get("bannedWords", []) or []

    segments = data.get("segments") if isinstance(data, dict) else None
    if not isinstance(segments, list) or not segments:
        print("[FAIL] structure: segments must be a non-empty list")
        fails += 1
        segments = []

    total_chars = 0
    total_sec = 0.0
    modifier_hits = 0
    for seg in segments:
        if (not isinstance(seg, dict) or "id" not in seg or "text" not in seg
                or "ref" not in seg or not str(seg["text"]).strip()
                or not str(seg["ref"]).strip()):
            sid = seg.get("id", "?") if isinstance(seg, dict) else "?"
            print(f"[FAIL] id={sid} structure: id/text/ref required, text/ref non-empty")
            fails += 1
            continue
        sid = seg["id"]
        kind = seg.get("kind", "subtitle")
        text = seg["text"]
        if kind not in ("subtitle", "voiceover"):
            print(f"[FAIL] id={sid} structure: unknown kind {kind!r}")
            fails += 1
            continue

        chars = strip_count(text)
        sec = round(chars / cps, 1)
        total_chars += chars
        total_sec += sec
        modifier_hits += sum(text.count(w) for w in MODIFIERS)

        level, reasons = "OK", []
        if kind == "subtitle" and chars > SUBTITLE_MAX_CHARS:
            level = "FAIL"
            reasons.append(f"oversize {chars}>{SUBTITLE_MAX_CHARS}")
        if DASH_RE.search(text):
            level = "FAIL"
            reasons.append("em-dash banned")
        hit = [w for w in AI_PHRASES if w in text]
        hit += [w for w in banned if w and w in text]
        if "不仅" in text and "而且" in text:
            hit.append("不仅…而且")
        if hit:
            reasons.append("banned word: " + ",".join(hit))
            if level != "FAIL":
                level = "WARN"

        line = f"[{level}] id={sid} kind={kind} chars={chars} sec={sec:.1f} text={text}"
        if reasons:
            line += " | " + "; ".join(reasons)
        print(line)
        if level == "FAIL":
            fails += 1
        elif level == "WARN":
            warns += 1

    # 时长对账：预算是上限（给画面留呼吸），只罚超出，低于预算不罚
    total_sec = round(total_sec, 1)
    if budget is not None:
        over = total_sec - budget
        pct = over / budget * 100 if budget else 0.0
        if over > 0 and over / budget > BUDGET_TOLERANCE:
            print(f"[FAIL] budget: total {total_sec:.1f}s exceeds budget "
                  f"{budget:.1f}s by {pct:.1f}% (limit 10%)")
            fails += 1
        else:
            side = "over" if over >= 0 else "under"
            print(f"budget: total {total_sec:.1f}s vs budget {budget:.1f}s "
                  f"({abs(pct):.1f}% {side}, OK)")

    # 修饰密度：全局按千字计
    density = modifier_hits / total_chars * 1000 if total_chars else 0.0
    if density > MODIFIER_LIMIT:
        print(f"[WARN] modifiers: {modifier_hits} hits, {density:.1f}/1000 chars "
              f"(limit {MODIFIER_LIMIT:.0f})")
        warns += 1
    else:
        print(f"modifiers: {modifier_hits} hits, {density:.1f}/1000 chars, OK")

    budget_txt = f"{budget:.1f}s" if budget is not None else "n/a"
    print(f"SUMMARY: fail={fails} warn={warns} | total {total_sec:.1f}s vs budget {budget_txt}")
    print("RESULT: " + ("FAIL" if fails else "PASS"))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()

"""transcribe.py -- transcribe audio/video into SubtitleCue JSON + SRT via faster-whisper.

Usage:
    .venv/Scripts/python.exe transcribe.py <input.mp4|wav> [--model large-v3-turbo] [--lang zh] [--outdir <dir>]

Output: <stem>.cues.json + <stem>.srt next to the input (or --outdir).
Cue schema matches video-motion SubtitleCue: {start, end, text}, seconds with 3 decimals.
"""
import os
# 默认官方直连（2026-08-29 实测通；hf-mirror 当时对 GET/HEAD 一律 308 回官方源导致下载必炸）。
# 下载失败时可设 HF_ENDPOINT 换源，如 https://hf-mirror.com
os.environ.setdefault("HF_ENDPOINT", "https://huggingface.co")

import argparse
import json
import re
import sys
from pathlib import Path

PUNCT = "。!?;,、"
MAX_CHARS = 20


def clean_text(text, lang):
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    if lang == "zh":
        text = text.replace(" ", "")
    return text


def split_long(text, limit=MAX_CHARS):
    """Split text > limit chars at punctuation; each piece <= limit chars."""
    if len(text) <= limit:
        return [text]
    pieces = []
    rest = text
    while rest:
        if len(rest) <= limit:
            pieces.append(rest)
            break
        window = rest[:limit]
        cut = -1
        for i, ch in enumerate(window):
            if ch in PUNCT:
                cut = i
        if cut >= 0:
            pieces.append(rest[:cut + 1])
            rest = rest[cut + 1:]
        else:
            pieces.append(rest[:limit])
            rest = rest[limit:]
    empty = re.compile(r"[\s%s]" % re.escape(PUNCT))
    return [p for p in pieces if empty.sub("", p)]


def allocate_times(pieces, start, end):
    """Interpolate segment duration across pieces linearly by char count."""
    total = sum(len(p) for p in pieces)
    dur = end - start
    cues = []
    acc = 0
    for p in pieces:
        s = start + dur * (acc / total)
        acc += len(p)
        e = start + dur * (acc / total)
        cues.append((round(s, 3), round(e, 3), p))
    return cues


def fmt_srt_ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return "%02d:%02d:%02d,%03d" % (h, m, s, ms)


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio/video into subtitle cues (faster-whisper).")
    parser.add_argument("input", help="input audio/video file (mp4/wav/flac/...)")
    parser.add_argument("--model", default="large-v3-turbo",
                        help="whisper model size (default: large-v3-turbo)")
    parser.add_argument("--lang", default="zh", help="language code (default: zh)")
    parser.add_argument("--outdir", default=None,
                        help="output directory (default: input file directory)")
    args = parser.parse_args()

    inp = Path(args.input)
    if not inp.is_file():
        print("ERROR: input file not found: %s" % inp)
        sys.exit(1)
    outdir = Path(args.outdir) if args.outdir else inp.parent
    outdir.mkdir(parents=True, exist_ok=True)

    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(args.model, device="cpu", compute_type="int8")
        segments, info = model.transcribe(str(inp), language=args.lang,
                                          vad_filter=True, beam_size=5)

        cues = []
        n_segments = 0
        for seg in segments:
            n_segments += 1
            text = clean_text(seg.text, args.lang)
            if not text:
                continue
            cues.extend(allocate_times(split_long(text), seg.start, seg.end))

        data = {"subtitles": [
            {"start": s, "end": e, "text": t} for (s, e, t) in cues
        ]}
        cues_path = outdir / (inp.stem + ".cues.json")
        with open(cues_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        blocks = ["%d\n%s --> %s\n%s" % (i, fmt_srt_ts(s), fmt_srt_ts(e), t)
                  for i, (s, e, t) in enumerate(cues, 1)]
        srt_path = outdir / (inp.stem + ".srt")
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write("\n\n".join(blocks) + ("\n" if blocks else ""))

        print("segments=%d cues=%d total_audio=%.1fs model=%s lang=%s out=%s" % (
            n_segments, len(cues), info.duration, args.model, args.lang, outdir))
        sys.exit(0)
    except SystemExit:
        raise
    except Exception as exc:
        print("ERROR: transcription failed: %s" % exc)
        sys.exit(1)


if __name__ == "__main__":
    main()

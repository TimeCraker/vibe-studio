#!/usr/bin/env python3
"""Render a waveform + spectrogram contact sheet for a WAV so the score can be
checked visually (beat placement, section energy, clipping, dead air).

    python tools/audio_report.py --wav audio/music.wav --out qa/music-report.png
"""
from __future__ import annotations

import argparse
import json
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent


def read_wav(path: Path):
    with wave.open(str(path), 'rb') as w:
        sr = w.getframerate()
        n = w.getnframes()
        ch = w.getnchannels()
        raw = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    if ch == 2:
        raw = raw.reshape(-1, 2)
        return sr, raw[:, 0], raw[:, 1]
    return sr, raw, raw


def spectrogram(mono: np.ndarray, sr: int, n_fft: int = 2048, hop: int = 512):
    win = np.hanning(n_fft)
    frames = max(1, (len(mono) - n_fft) // hop)
    idx = np.arange(n_fft)[None, :] + hop * np.arange(frames)[:, None]
    seg = mono[idx] * win
    S = np.abs(np.fft.rfft(seg, axis=1)).T  # [freq, time]
    S = 20 * np.log10(np.maximum(S, 1e-6))
    return S


def verify(mono: np.ndarray, sr: int, sections: dict):
    """Objective checks: are the kicks on the beat grid, and is the harmony
    actually following the Am7-F-C-G loop?"""
    beat = 60.0 / float(sections['bpm'])
    end = float(sections['end'])

    # --- kick onsets vs beat grid ---
    from math import gcd
    n = len(mono)
    # band-pass the kick region with an FFT mask
    X = np.fft.rfft(mono)
    f = np.fft.rfftfreq(n, 1.0 / sr)
    bp = (f / 90.0) / np.sqrt(1 + (f / 90.0) ** 4) * 1.0 / np.sqrt(1 + (45.0 / np.maximum(f, 1e-6)) ** 4)
    low = np.fft.irfft(X * bp, n)
    win = int(0.02 * sr)
    c = np.concatenate(([0.0], np.cumsum(low**2)))
    idx = np.arange(n)
    lo_i = np.maximum(0, idx - win)
    env = np.sqrt(np.maximum(c[idx + 1] - c[lo_i], 0) / (idx + 1 - lo_i))
    d = np.diff(env)
    thr = d.std() * 2.2
    onsets = []
    last = -1
    for i in range(1, len(d)):
        if d[i] > thr and d[i] >= d[i - 1] and d[i] > d[i + 1] if i + 1 < len(d) else False:
            t = i / sr
            if t < 4.8 or t > end - 0.2:
                continue
            if t - last < 0.18:
                continue
            onsets.append(t)
            last = t
    if onsets:
        offs = []
        for t in onsets:
            k = round(t / beat)
            offs.append((t - k * beat) * 1000.0)
        offs = np.array(offs)
        on_grid = float(np.mean(np.abs(offs) < 35)) * 100
        print(f"kick onsets      {len(onsets)}   median offset {np.median(offs):+6.1f} ms   "
              f"within +-35ms of a beat: {on_grid:.0f}%")

    # --- chroma vs chord loop ---
    chords = [
        ("Am7", [57, 60, 64, 67], 45, [57, 64, 67, 72]),
        ("F",   [53, 57, 60, 64], 41, [57, 60, 64, 69]),
        ("C",   [52, 55, 60, 64], 36, [60, 64, 67, 72]),
        ("G",   [55, 59, 62, 67], 43, [55, 62, 67, 71]),
    ]
    bar = beat * 4
    nfft = 16384
    win_h = np.hanning(nfft)
    freqs = np.fft.rfftfreq(nfft, 1.0 / sr)
    pc = np.zeros(12)
    agree = 0
    total = 0
    for b in range(int(end / bar)):
        st = b * bar + 0.35
        i = int(st * sr)
        seg = mono[i : i + nfft]
        if len(seg) < nfft:
            continue
        S = np.abs(np.fft.rfft(seg * win_h))
        keep = (freqs > 90) & (freqs < 2500)
        S, fr = S[keep], freqs[keep]
        # fold into pitch classes
        pcs = np.round(12 * np.log2(fr / 440.0) + 69).astype(int) % 12
        v = np.zeros(12)
        for k in range(12):
            v[k] = S[pcs == k].sum()
        v /= v.sum() + 1e-9
        if b == 0:
            pc = v
        want = set(m % 12 for m in chords[b % 4][1])
        got = set(np.argsort(v)[-4:].tolist())
        agree += len(want & got)
        total += len(want)
    print(f"chord tones       guessed from chroma: {agree}/{total} of the expected "
          f"Am7-F-C-G tones are in the top-4 energy bins ({100*agree/max(total,1):.0f}%)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--wav', default=str(ROOT / 'audio' / 'music.wav'))
    ap.add_argument('--out', default=str(ROOT / 'qa' / 'music-report.png'))
    ap.add_argument('--sections', default=str(ROOT / 'edit' / 'sections.json'))
    ap.add_argument('--verify-only', action='store_true')
    a = ap.parse_args()

    sr, L, R = read_wav(Path(a.wav))
    mono = (L + R) / 2
    dur = len(mono) / sr
    sections = json.loads(Path(a.sections).read_text(encoding='utf-8'))

    verify(mono, sr, sections)
    if a.verify_only:
        return

    W, H = 1800, 620
    img = Image.new('RGB', (W, H), (16, 18, 26))
    d = ImageDraw.Draw(img)

    # ---- waveform ----
    wv_h = 190
    step = max(1, len(mono) // W)
    for x in range(W):
        seg = mono[x * step : (x + 1) * step]
        if len(seg) == 0:
            continue
        lo, hi = float(seg.min()), float(seg.max())
        y0 = 20 + wv_h / 2 * (1 - hi)
        y1 = 20 + wv_h / 2 * (1 - lo)
        d.line([(x, y0), (x, max(y1, y0 + 0.6))], fill=(96, 220, 180))
    d.line([(0, 20 + wv_h / 2), (W, 20 + wv_h / 2)], fill=(60, 70, 90))

    # ---- spectrogram ----
    S = spectrogram(mono, sr)
    S = S[: S.shape[0] // 1, :]
    fmax = 12000
    keep = int(S.shape[0] * fmax / (sr / 2))
    S = S[:keep, :]
    S = S - S.max()
    S = np.clip((S + 62) / 62, 0, 1) ** 0.8
    binx = max(1, S.shape[1] // W)
    S = S[:, : binx * W].reshape(S.shape[0], -1, binx).mean(axis=2)
    spec_h = 340
    bins = np.linspace(0, S.shape[0] - 1, spec_h).astype(int)
    spec = S[bins, :]
    rgb = np.zeros((spec_h, W, 3), dtype=np.uint8)
    rgb[..., 0] = (spec * 250).astype(np.uint8)
    rgb[..., 1] = (spec**1.6 * 230).astype(np.uint8)
    rgb[..., 2] = (np.clip(spec * 1.6 - 0.25, 0, 1) * 255).astype(np.uint8)
    img.paste(Image.fromarray(rgb[::-1]), (0, wv_h + 40))

    # ---- section markers ----
    def x_of(t):
        return int(t / dur * W)

    for s in sections['sections']:
        x = x_of(float(s['start']))
        d.line([(x, 0), (x, H)], fill=(255, 150, 60), width=2)
        d.text((x + 5, 4), f"{s['id']}  {s['start']}s", fill=(255, 190, 120))
    xe = x_of(float(sections['end']))
    d.line([(xe, 0), (xe, H)], fill=(255, 90, 90), width=2)
    d.text((xe + 4, 20), f"end {sections['end']}s", fill=(255, 140, 140))

    # ---- beat grid (every 4 beats) ----
    beat = 60.0 / float(sections['bpm'])
    b = 0
    while b * beat < dur:
        if b % 4 == 0:
            x = x_of(b * beat)
            d.line([(x, wv_h + 30), (x, wv_h + 40)], fill=(120, 140, 180))
        b += 1

    d.text((6, wv_h + 22), 'spectrogram 0-12kHz', fill=(150, 165, 200))
    d.text((6, H - 18), f"{Path(a.wav).name}  {dur:.2f}s  {sr}Hz  peak {20*np.log10(max(np.abs(L).max(), np.abs(R).max())):.2f} dBFS  RMS {20*np.log10(np.sqrt((mono**2).mean())):.1f} dBFS", fill=(150, 165, 200))

    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    print(out)


if __name__ == '__main__':
    main()
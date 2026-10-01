#!/usr/bin/env python3
"""Procedural background score for the pelican video.

Why synthesised instead of licensed music: every accent can be scheduled at an
exact sample, so the drop, the risers and the impacts land precisely on the
edit's section boundaries (edit/sections.json). No licensing questions, no
network, fully reproducible.

    python tools/make_music.py                 # -> audio/music.wav (48k stereo)
    python tools/make_music.py --check         # print level report per section

Style: mid-tempo electronic / lo-fi tech review groove, A minor, 100 BPM.
"""
from __future__ import annotations

import argparse
import json
import math
import struct
import wave
from pathlib import Path

import numpy as np

SR = 48000
RNG = np.random.default_rng(20261001)

# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #


def midi(m: float) -> float:
    return 440.0 * 2.0 ** ((m - 69.0) / 12.0)


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(round(dur * SR)), dtype=np.float64) / SR


def env_ad(n: int, attack: float, decay: float, curve: float = 2.0) -> np.ndarray:
    """Attack/decay envelope, both in seconds."""
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-5), 0.0, 1.0)
    d = np.exp(-np.clip((t - attack) / max(decay, 1e-5), 0.0, None) * curve)
    return a * d


def fft_filter(x: np.ndarray, mask_fn) -> np.ndarray:
    n = len(x)
    if n == 0:
        return x
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    return np.fft.irfft(X * mask_fn(f), n)


def lowpass_mask(cut: float, order: int = 2):
    def m(f):
        return 1.0 / np.sqrt(1.0 + (f / max(cut, 1.0)) ** (2 * order))
    return m


def highpass_mask(cut: float, order: int = 2):
    def m(f):
        r = np.maximum(f, 1e-6) / max(cut, 1e-6)
        return r**order / np.sqrt(1.0 + r ** (2 * order))
    return m


def bandpass_mask(lo: float, hi: float):
    return lambda f: lowpass_mask(hi)(f) * highpass_mask(lo)(f)


def chunked_filter(x: np.ndarray, mask_fn, n: int = 8192) -> np.ndarray:
    """Overlap-add filtering where the mask may vary over the signal.

    mask_fn(freqs, progress01) -> gain array
    """
    hop = n // 2
    win = np.hanning(n)
    out = np.zeros(len(x) + n, dtype=np.float64)
    chunks = max(1, int(math.ceil(len(x) / hop)))
    freqs = np.fft.rfftfreq(n, 1.0 / SR)
    for k in range(chunks):
        i = k * hop
        seg = x[i : i + n]
        if len(seg) < n:
            seg = np.pad(seg, (0, n - len(seg)))
        X = np.fft.rfft(seg * win)
        X *= mask_fn(freqs, k / max(1, chunks - 1))
        out[i : i + n] += np.fft.irfft(X, n)
    return out[: len(x)]


def fft_convolve(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    n = len(x) + len(ir) - 1
    nfft = 1 << (n - 1).bit_length()
    X = np.fft.rfft(x, nfft)
    H = np.fft.rfft(ir, nfft)
    return np.fft.irfft(X * H, nfft)[:n]


def make_ir(decay: float = 1.5, damp: float = 4200.0, predelay: float = 0.012) -> np.ndarray:
    n = int(decay * SR)
    t = np.arange(n) / SR
    noise = RNG.standard_normal(n)
    ir = noise * np.exp(-t / (decay * 0.34))
    ir = fft_filter(ir, lowpass_mask(damp))
    ir[: int(predelay * SR)] = 0.0
    # unit ENERGY, not unit peak: a convolution with a unit-energy IR preserves
    # the signal's RMS, so the wet/dry ratio below means what it says
    ir /= np.sqrt(np.sum(ir**2)) + 1e-12
    return ir


# --------------------------------------------------------------------------- #
# instruments  (all mono; stereo placement happens in the mixer)
# --------------------------------------------------------------------------- #


def kick(dur: float = 0.52) -> np.ndarray:
    t = t_axis(dur)
    f = 46.0 + 122.0 * np.exp(-t / 0.022)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR)
    click = np.exp(-t / 0.004) * RNG.standard_normal(len(t)) * 0.5
    amp = np.exp(-t / 0.115) * np.clip(t / 0.002, 0, 1)
    return (body * amp + click * np.exp(-t / 0.02) * 0.35) * 0.95


def snare(dur: float = 0.26) -> np.ndarray:
    t = t_axis(dur)
    tone = np.sin(2 * np.pi * 196 * t) * np.exp(-t / 0.045)
    body = RNG.standard_normal(len(t)) * np.exp(-t / 0.075)
    body = fft_filter(body, bandpass_mask(1100.0, 9000.0))
    return (tone * 0.5 + body * 0.85) * np.clip(t / 0.0015, 0, 1) * 0.62


def clap(dur: float = 0.3) -> np.ndarray:
    out = np.zeros(int(dur * SR))
    for i, off in enumerate((0.0, 0.009, 0.019, 0.031)):
        g = 0.75 - i * 0.12
        seg = RNG.standard_normal(int(0.09 * SR)) * np.exp(-np.arange(int(0.09 * SR)) / SR / 0.028)
        seg = fft_filter(seg, bandpass_mask(1400.0, 7500.0)) * g
        j = int(off * SR)
        out[j : j + len(seg)] += seg
    return out * 0.5


def hat(dur: float = 0.055, gain: float = 0.3, tone: float = 8000.0) -> np.ndarray:
    n = int(dur * SR)
    nz = RNG.standard_normal(n) * np.exp(-np.arange(n) / SR / (dur * 0.28))
    nz = fft_filter(nz, highpass_mask(tone, order=3))
    return nz * gain


def openhat(dur: float = 0.34) -> np.ndarray:
    n = int(dur * SR)
    nz = RNG.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.115)
    nz = fft_filter(nz, highpass_mask(6200.0, order=3))
    return nz * 0.3


def bass(freq: float, dur: float, cut: float = 460.0, drive: float = 1.7) -> np.ndarray:
    t = t_axis(dur)
    ph = 2 * np.pi * freq * t
    saw = 2.0 * ((freq * t) % 1.0) - 1.0
    sub = np.sin(ph)
    x = np.tanh((saw * 0.55 + sub * 0.75) * drive)
    x = fft_filter(x, lowpass_mask(cut))
    return x * np.clip(t / 0.004, 0, 1) * np.exp(-t / (dur * 0.55))


def pluck(freq: float, dur: float = 0.5, bright: float = 3200.0) -> np.ndarray:
    t = t_axis(dur)
    x = np.zeros(len(t))
    for h, g in ((1, 1.0), (2, 0.34), (3, 0.16), (4.03, 0.09)):
        x += g * np.sin(2 * np.pi * freq * h * t + h * 0.7)
    x *= np.exp(-t / (dur * 0.30))
    x = fft_filter(x, lowpass_mask(bright))
    return x * 0.42


def pad_chord(freqs, dur: float, cut_from: float = 500.0, cut_to: float = 2300.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for i, f in enumerate(freqs):
        for det, g in ((-0.06, 0.5), (0.0, 0.65), (0.07, 0.5)):
            ff = f * (1.0 + det / 100.0)
            x += g * (2.0 * ((ff * t) % 1.0) - 1.0) * (1.0 if i % 2 == 0 else 0.82)
    x = chunked_filter(x, lambda fr, p: lowpass_mask(cut_from + (cut_to - cut_from) * p)(fr))
    # 4 tones x 3 detunes stack up: normalise so the pad sits *under* the rhythm section
    x /= max(1, len(freqs)) * 2.4
    atk = np.clip(t / 0.55, 0, 1) ** 1.4
    rel = np.clip((dur - t) / 0.7, 0, 1)
    return x * atk * rel * 0.5


def riser(dur: float, lo: float = 300.0, hi: float = 9000.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR

    def mask(f, p):
        c = lo + (hi - lo) * (p**1.6)
        return bandpass_mask(max(c * 0.55, 60.0), c * 1.6)(f) * (0.25 + 0.75 * p)
    nz = RNG.standard_normal(n)
    x = chunked_filter(nz, mask)
    x *= np.clip(t / dur, 0, 1) ** 1.2
    # add a rising tone for pitch clarity
    f0 = 220.0 * 2 ** (2.4 * np.clip(t / dur, 0, 1))
    x += 0.16 * np.sin(2 * np.pi * np.cumsum(f0) / SR) * np.clip(t / dur, 0, 1) ** 2
    return x * 0.3


def impact(dur: float = 1.5) -> np.ndarray:
    t = t_axis(dur)
    f = 140.0 * np.exp(-t / 0.09) + 38.0
    low = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.42)
    nz = RNG.standard_normal(len(t)) * np.exp(-t / 0.16)
    nz = fft_filter(nz, lowpass_mask(5200.0))
    return (low * 0.95 + nz * 0.32) * 0.8


def bell(freq: float = 2360.0, dur: float = 1.1, gain: float = 0.3) -> np.ndarray:
    t = t_axis(dur)
    x = np.zeros(len(t))
    for h, g, d in ((1.0, 1.0, 0.55), (2.02, 0.5, 0.34), (2.98, 0.3, 0.22), (4.72, 0.16, 0.14)):
        x += g * np.sin(2 * np.pi * freq * h * t) * np.exp(-t / d)
    return x * gain


def whoosh(dur: float = 0.85) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR

    def mask(f, p):
        c = 700.0 * 2 ** (3.0 * p)
        band = bandpass_mask(c * 0.5, c * 2.2)(f)
        return band * math.sin(math.pi * p) ** 0.7
    x = chunked_filter(RNG.standard_normal(n), mask)
    return x * 0.34


# --------------------------------------------------------------------------- #
# score
# --------------------------------------------------------------------------- #

# A minor, one chord per bar, 4-bar loop.
CHORDS = [
    ("Am7", [57, 60, 64, 67], 45, [57, 64, 67, 72]),
    ("F",   [53, 57, 60, 64], 41, [57, 60, 64, 69]),
    ("C",   [52, 55, 60, 64], 36, [60, 64, 67, 72]),
    ("G",   [55, 59, 62, 67], 43, [55, 62, 67, 71]),
]


class Mixer:
    def __init__(self, dur: float):
        self.n = int(round(dur * SR)) + SR  # +1s tail
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def add(self, sig: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.0):
        i = int(round(at * SR))
        if i >= self.n:
            return
        seg = sig[: self.n - i]
        # constant-power pan
        th = (np.clip(pan, -1, 1) + 1) * math.pi / 4
        self.L[i : i + len(seg)] += seg * gain * math.cos(th)
        self.R[i : i + len(seg)] += seg * gain * math.sin(th)

    def add_stereo(self, a: np.ndarray, b: np.ndarray, at: float, gain: float = 1.0):
        i = int(round(at * SR))
        seg_a, seg_b = a[: self.n - i], b[: self.n - i]
        self.L[i : i + len(seg_a)] += seg_a * gain
        self.R[i : i + len(seg_b)] += seg_b * gain


def build(sections: dict) -> Mixer:
    end = float(sections["end"])
    bpm = float(sections["bpm"])
    beat = 60.0 / bpm
    bar = beat * 4.0
    bounds = [float(s["start"]) for s in sections["sections"]]
    names = [s["id"] for s in sections["sections"]]

    mx = Mixer(end)
    ir = make_ir()

    def bar_time(b: int) -> float:
        return b * bar

    n_bars = int(round(end / bar))

    def section_of(bar_index: int) -> str:
        t = bar_time(bar_index)
        cur = names[0]
        for b, nm in zip(bounds, names):
            if t >= b - 1e-6:
                cur = nm
        return cur

    chord_of = lambda b: CHORDS[b % 4]

    # ---------------- sustained pad across the whole piece ---------------- #
    pad_up_to = {}
    b = 0
    while b < n_bars:
        nm = section_of(b)
        st = bar_time(b)
        # group equal-section bars into one pad chunk for smooth filter motion
        run = 1
        while b + run < n_bars and section_of(b + run) == nm:
            run += 1
        dur = run * bar + 0.9
        if nm == "hook":
            c_from, c_to, g = 380.0, 900.0, 0.85
        elif nm == "analysis":
            c_from, c_to, g = 700.0, 1900.0, 0.95
        else:
            c_from, c_to, g = 620.0, 2600.0, 1.0
        for k in range(run):
            _, tones, _, _ = chord_of(b + k)
            # one sustained chord per bar, long enough to overlap slightly so the
            # progression glides instead of clicking
            seg = pad_chord([midi(m) for m in tones], bar * 1.12, c_from, c_to)
            mx.add(seg, st + k * bar, gain=g * 0.9, pan=-0.18)
        b += run

    # ---------------- drum / bass / arp arrangement ---------------- #
    for bi in range(n_bars):
        nm = section_of(bi)
        t0 = bar_time(bi)
        _, tones, bass_root, lead = chord_of(bi)
        bt = midi(bass_root)

        if nm == "hook":
            if bi == 1:
                # heartbeat pulse under the title, then one riser into the drop
                mx.add(kick(0.5), t0 + beat * 1.5, 0.5)
                mx.add(kick(0.5), t0 + beat * 3.0, 0.42)
                mx.add(riser(bar * 1.0), t0, 0.95)

        elif nm in ("reveal-a", "reveal-b", "verdict"):
            heavy = nm == "verdict"
            # kick: four-on-the-floor, drop the last kick of the bar in section A
            for q in range(4):
                if nm == "reveal-a" and bi % 4 == 3 and q == 3:
                    continue
                mx.add(kick(0.55), t0 + q * beat, 0.9 if q in (0, 2) else 0.74)
            # snare/clap on 2 and 4
            for q in (1, 3):
                mx.add(clap() if bi % 2 else snare(), t0 + q * beat, 0.52)
            # hats: 8ths with accents, open hat at the end of every 2nd bar
            for q in range(8):
                pos = t0 + q * beat * 0.5
                acc = 1.0 if q % 2 == 0 else 0.62
                if nm == "reveal-b" and q % 2 == 1 and bi % 2 == 1:
                    continue
                mx.add(hat(0.05, 0.26 * acc), pos, 1.0, pan=0.16 * ((-1) ** q))
            if bi % 2 == 1:
                mx.add(openhat(), t0 + beat * 3.5, 0.85, pan=0.2)
            # bass: syncopated 8ths
            pattern = [1.0, 0.0, 0.72, 0.0, 0.86, 0.72, 0.0, 0.62]
            if heavy:
                pattern = [1.0, 0.72, 0.0, 0.86, 0.72, 0.0, 0.86, 0.62]
            for q, g in enumerate(pattern):
                if g <= 0:
                    continue
                oct_up = (q == 5 and bi % 4 == 1)
                f = bt * (2.0 if oct_up else 1.0)
                mx.add(bass(f, beat * 0.46, cut=420.0 + 90 * g), t0 + q * beat * 0.5, 0.42 * g)
            # arp / pluck
            if nm != "reveal-a" or bi >= 4:
                seq = [0, 2, 1, 3, 2, 3, 1, 2, 0, 2, 3, 1, 2, 1, 3, 2]
                for q in range(16):
                    deg = seq[q]
                    octv = 12 if (q in (6, 14)) else 0
                    f = midi(lead[deg % 4] + octv)
                    g = 0.30 if q % 4 == 0 else 0.20
                    if nm == "reveal-b" and q % 8 == 3:
                        continue
                    mx.add(pluck(f, 0.42, bright=3600.0), t0 + q * beat * 0.25,
                           g, pan=0.34 * math.sin(q * 1.7))
            if nm == "reveal-b" and bi % 4 == 0:
                # chord stab on the downbeat
                for m in lead:
                    mx.add(pluck(midi(m), 0.7, bright=2600.0), t0, 0.16, pan=-0.1)

        elif nm == "analysis":
            # sparse, inquisitive: kick + hat, marimba-ish pluck motif, no snare
            mx.add(kick(0.5), t0, 0.72)
            mx.add(kick(0.5), t0 + beat * 2.5, 0.6)
            for q in range(8):
                mx.add(hat(0.05, 0.2 if q % 2 == 0 else 0.13), t0 + q * beat * 0.5, 1.0, pan=0.2 * ((-1) ** q))
            motif = [0, 2, 3, 2, 3, 1, 2, 0, 0, 2, 3, 2, 1, 2, 3, 1]
            for q in range(16):
                if q % 4 == 3 and bi % 2 == 0:
                    continue
                f = midi(lead[motif[q] % 4] + (12 if q >= 8 else 0))
                mx.add(pluck(f, 0.6, bright=2200.0), t0 + q * beat * 0.25, 0.24, pan=0.28 * math.cos(q * 2.1))
            if bi == 14:
                mx.add(riser(bar), t0, 0.8)

        # section impacts sit exactly on the cut
        for st, nm2 in zip(bounds, names):
            if abs(t0 - st) < 1e-6 and bi > 0:
                mx.add(impact(1.6 if nm2 != "analysis" else 1.1), st, 0.72 if nm2 != "analysis" else 0.5)

    # transition whooshes end right on the cut
    for st, nm in zip(bounds, names):
        if st <= 0:
            continue
        mx.add(whoosh(0.9), st - 0.86, 0.5 if nm != "verdict" else 0.62)

    # bell accents that pair with the app's own bell button in the footage
    for st in (9.6, 26.4, 45.6):
        mx.add(bell(2360.0, 1.2, 0.16), st, 1.0, pan=0.35)
        mx.add(bell(3140.0, 1.0, 0.10), st + 0.14, 1.0, pan=-0.3)

    # final sting + tail
    mx.add(bell(midi(81), 2.2, 0.2), end - 0.31, 1.0, pan=0.1)
    mx.add(bell(midi(69), 2.6, 0.18), end - 0.31, 1.0, pan=-0.2)

    # ---------------- sidechain ducking keyed off the kick ---------------- #
    duck = np.ones(mx.n)
    for bi in range(n_bars):
        nm = section_of(bi)
        if nm == "hook":
            beats = [(1.5, 0.5), (3.0, 0.42)] if bi == 1 else []
        elif nm == "analysis":
            beats = [(0.0, 0.72), (2.5, 0.6)]
        else:
            beats = [(float(q), 0.9 if q in (0, 2) else 0.74) for q in range(4)]
        for q, g in beats:
            i = int(round((bar_time(bi) + q * beat) * SR))
            ln = int(0.30 * SR)
            if i >= mx.n:
                continue
            seg = 1.0 - (0.42 * g) * np.exp(-np.arange(min(ln, mx.n - i)) / SR / 0.085)
            duck[i : i + len(seg)] = np.minimum(duck[i : i + len(seg)], seg)

    mx.L *= duck
    mx.R *= duck

    # ---------------- reverb send ---------------- #
    # print the dry mix level so gain staging can be judged before mastering
    dry_peak = max(float(np.max(np.abs(mx.L))), float(np.max(np.abs(mx.R))))
    dry_rms = float(np.sqrt(np.mean((mx.L + mx.R) ** 2 / 4)))
    print(f"  dry mix: peak {20*math.log10(max(dry_peak,1e-9)):.2f} dBFS  "
          f"rms {20*math.log10(max(dry_rms,1e-9)):.2f} dBFS  "
          f"crest {20*math.log10(max(dry_peak,1e-9)/max(dry_rms,1e-9)):.1f} dB")

    wet_l = fft_convolve(mx.L, ir)
    wet_r = fft_convolve(mx.R, ir * 0.97)
    n = mx.n
    return Mixer.from_arrays(mx.L + 0.16 * wet_l[:n], mx.R + 0.16 * wet_r[:n], n)


def _from_arrays(L, R, n):
    m = Mixer.__new__(Mixer)
    m.L, m.R, m.n = L[:n], R[:n], n
    return m


Mixer.from_arrays = staticmethod(_from_arrays)


# --------------------------------------------------------------------------- #
# master
# --------------------------------------------------------------------------- #


def env_rms(x: np.ndarray, win_ms: float = 45.0) -> np.ndarray:
    """Exact sliding-window RMS via prefix sums. Always non-negative, so it can
    safely drive a gain computer (an FFT-filtered envelope rings negative and
    blows the gain up)."""
    w = max(1, int(win_ms * SR / 1000.0))
    c = np.concatenate(([0.0], np.cumsum(x.astype(np.float64) ** 2)))
    idx = np.arange(len(x))
    lo = np.maximum(0, idx - w // 2)
    hi = np.minimum(len(x), idx + w // 2 + 1)
    return np.sqrt(np.maximum(c[hi] - c[lo], 0.0) / np.maximum(hi - lo, 1))


def soft_clip(x: np.ndarray, knee: float = 0.72) -> np.ndarray:
    """Transparent below the knee; rounds only the peaks."""
    ax = np.abs(x)
    over = ax > knee
    if not over.any():
        return x
    out = x.copy()
    out[over] = np.sign(x[over]) * (knee + (1 - knee) * np.tanh((ax[over] - knee) / (1 - knee)))
    return out


def master(mx: Mixer, end: float) -> tuple[np.ndarray, np.ndarray]:
    L, R = mx.L.copy(), mx.R.copy()

    for ch in (L, R):
        ch -= ch.mean()

    def stats(tag, a, b):
        pk = max(np.max(np.abs(a)), np.max(np.abs(b))) + 1e-9
        rs = float(np.sqrt(np.mean((a + b) ** 2 / 4))) + 1e-9
        print(f"  {tag:<8} peak {20*math.log10(pk):6.2f} dBFS   rms {20*math.log10(rs):6.2f} dBFS   crest {20*math.log10(pk/rs):5.1f} dB")

    stats("dry", L, R)

    # glue: slow, low-ratio, transients survive
    env = env_rms(L + R, 45.0)
    gain = 1.0 / (1.0 + 1.6 * env)
    L *= gain
    R *= gain
    stats("glued", L, R)

    # push into the limiter knee so the body comes up without squashing the mix
    pk = max(np.max(np.abs(L)), np.max(np.abs(R))) + 1e-9
    makeup = 1.9 / pk
    L *= makeup
    R *= makeup
    stats("pushed", L, R)

    L = soft_clip(L)
    R = soft_clip(R)
    stats("limited", L, R)

    # trim into the piece, fade the top, let the tail ring out
    total = len(L)
    tail = np.ones(total)
    fade_in = int(0.25 * SR)
    tail[:fade_in] = np.linspace(0, 1, fade_in)
    fade_start = int(round(end * SR))
    fade_n = total - fade_start
    if fade_n > 0:
        tail[fade_start:] *= np.linspace(1.0, 0.0, fade_n) ** 1.5
    L *= tail
    R *= tail

    pk = max(np.max(np.abs(L)), np.max(np.abs(R))) + 1e-9
    target = 10 ** (-1.2 / 20.0)
    L, R = L * (target / pk), R * (target / pk)
    stats("master", L, R)
    return L, R


def write_wav(path: Path, L: np.ndarray, R: np.ndarray):
    path.parent.mkdir(parents=True, exist_ok=True)
    n = min(len(L), len(R))
    inter = np.empty(n * 2, dtype=np.int16)
    inter[0::2] = np.clip(L[:n], -1, 1) * 32767
    inter[1::2] = np.clip(R[:n], -1, 1) * 32767
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(inter.tobytes())


def report(path: Path, L: np.ndarray, R: np.ndarray, sections: dict):
    def dbfs(x):
        return 20 * math.log10(max(float(np.sqrt(np.mean(x**2))), 1e-9))
    print(f'{"section":<12}{"start":>7}{"rms dBFS":>11}')
    bounds = [(s["id"], float(s["start"])) for s in sections["sections"]] + [("END", float(sections["end"]))]
    mono = (L + R) / 2
    for i in range(len(bounds) - 1):
        nm, st = bounds[i]
        en = bounds[i + 1][1]
        seg = mono[int(st * SR) : int(en * SR)]
        print(f"{nm:<12}{st:>7.1f}{dbfs(seg):>11.1f}")
    print(f"\npeak  {20*math.log10(max(np.max(np.abs(L)), np.max(np.abs(R)))):.2f} dBFS")
    print(f"len   {len(L)/SR:.2f} s")
    print(f"file  {path}")


def main():
    ap = argparse.ArgumentParser(description='Programmatic score for a project (numpy only).')
    ap.add_argument('--project', default='.',
                    help='project root used for the default --sections/--out paths')
    ap.add_argument('--sections', default=None, help='default <project>/edit/sections.json')
    ap.add_argument('--out', default=None, help='default <project>/audio/music.wav')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()

    proj = Path(a.project).resolve()
    sections_path = Path(a.sections) if a.sections else proj / 'edit' / 'sections.json'
    out = Path(a.out) if a.out else proj / 'audio' / 'music.wav'

    sections = json.loads(sections_path.read_text(encoding='utf-8'))
    mx = build(sections)
    L, R = master(mx, float(sections["end"]))
    write_wav(out, L, R)
    report(out, L, R, sections)


if __name__ == '__main__':
    main()
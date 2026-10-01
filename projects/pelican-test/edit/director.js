/**
 * Director: renders the finished video one frame at a time, purely from the
 * frame index. No Date, no Math.random, no wall clock — frame N always looks the
 * same, which is what makes the capture deterministic and re-renderable.
 *
 * Layering: <canvas> carries the footage (with camera moves) and the grade;
 * a DOM layer on top carries typography, captions and annotations.
 */

const DW = 1920;
const DH = 1080;
const SRC_W = 3840; // capture size of every source clip
const SRC_H = 2160;
/** units that are typography cards rather than footage */
const CARD_KINDS = ['hook', 'statement', 'verdict', 'outro'];

// --------------------------------------------------------------------------- //
// design tokens
// --------------------------------------------------------------------------- //
const C = {
  ink: '#05080F',
  navy0: '#070C18',
  navy1: '#0C1426',
  navy2: '#16223C',
  text: '#F4F7FC',
  muted: 'rgba(244,247,252,0.62)',
  dim: 'rgba(244,247,252,0.42)',
  line: 'rgba(255,255,255,0.14)',
  amber: '#FFB020',
  sky: '#38BDF8',
};
const FAM = {
  black: "'Noto Sans SC Black','Noto Sans SC',sans-serif",
  bold: "'Noto Sans SC',sans-serif",
  med: "'Noto Sans SC Medium','Noto Sans SC',sans-serif",
  light: "'Noto Sans SC Light','Noto Sans SC',sans-serif",
  mono: "'Cascadia Code','Consolas',monospace",
  latin: "'Segoe UI Variable Display','Segoe UI',sans-serif",
};

// --------------------------------------------------------------------------- //
// small maths helpers — all pure
// --------------------------------------------------------------------------- //
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, p) => a + (b - a) * p;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeIn = (x) => x * x * x;
const pickEase = (n) => (n === 'linear' ? (x) => x : n === 'out' ? easeOut : easeInOut);
/** deterministic pseudo-random in [0,1) — never Math.random inside the render */
const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** stagger helper: returns {p, o, y} for an element entering at `start+delay` */
function ent(t, start, dur = 0.5, delay = 0) {
  const p = clamp((t - start - delay) / dur);
  const e = easeOutQuint(p);
  return { p, o: e, y: (1 - e) * 30 };
}

// --------------------------------------------------------------------------- //
// canvas + fixture layers
// --------------------------------------------------------------------------- //
const canvas = document.getElementById('bed');
// Supersampling: the page is laid out in 1920x1080 CSS pixels, but the canvas
// backing store (and the browser's rasterisation) can run at 2x for a sharper
// downscale. All drawing code below stays in 1920x1080 coordinates.
const DSF = Math.max(1, Math.min(4, window.__DSF || 1));
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = DW * DSF;
canvas.height = DH * DSF;
ctx.scale(DSF, DSF);
const overlay = document.getElementById('overlay');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const vignette = (() => {
  const c = document.createElement('canvas');
  c.width = DW; c.height = DH;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(DW / 2, DH * 0.48, DH * 0.30, DW / 2, DH * 0.52, DH * 0.98);
  rg.addColorStop(0, 'rgba(0,0,0,0)');
  rg.addColorStop(0.62, 'rgba(0,0,0,0.10)');
  rg.addColorStop(1, 'rgba(0,0,0,0.42)');
  g.fillStyle = rg;
  g.fillRect(0, 0, DW, DH);
  return c;
})();

const grainTiles = (() => {
  const tiles = [];
  for (let k = 0; k < 4; k++) {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 270;
    const g = c.getContext('2d');
    const img = g.createImageData(c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const s = (k * 7919 + i) % 100003;
      const v = 110 + ((s * 2654435761) % 90);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    tiles.push(c);
  }
  return tiles;
})();

// --------------------------------------------------------------------------- //
// image cache: we only ever need the frames this one frame shows
// --------------------------------------------------------------------------- //
const SHOTS = {};                 // id -> {frames}
const CACHE = new Map();          // key -> ImageBitmap
const ORDER = [];
const MAX_CACHED = 8;
let frameNo = 0;
let missing = [];

async function loadShotInfo() {
  const res = await fetch('../frames/index.json');
  const idx = await res.json();
  for (const s of idx.shots) SHOTS[s.id] = s;
}

async function ensure(keys) {
  for (const key of keys) {
    if (CACHE.has(key)) continue;
    const [shot, idx] = key.split('#');
    const url = `../frames/${shot}/f${String(Number(idx)).padStart(5, '0')}.png`;
    const res = await fetch(url);
    if (!res.ok) { missing.push(url); continue; }
    const bmp = await createImageBitmap(await res.blob(), { colorSpaceConversion: 'none' });
    CACHE.set(key, bmp);
    ORDER.push(key);
    while (ORDER.length > MAX_CACHED) {
      const k = ORDER.shift();
      const old = CACHE.get(k);
      if (old) { old.close(); CACHE.delete(k); }
    }
  }
}

// --------------------------------------------------------------------------- //
// source frame lookup
// --------------------------------------------------------------------------- //
function srcKey(item, t, anchorA) {
  const info = SHOTS[item.shot];
  const n = info ? info.frames : 100000;
  const local = (t - (anchorA ?? item.a)) * (item.speed ?? 1);
  const f = Math.round((item.src + local) * FPS);
  return `${item.shot}#${clamp(f, 0, n - 1)}`;
}

/** the source rectangle that a view+camera currently shows, after cover-fit */
function windowMap(view, dst, camv) {
  const vw0 = view.w * SRC_W;
  const vh0 = view.h * SRC_H;
  const vw = vw0 / camv.z;
  const vh = vh0 / camv.z;
  const cx = view.cx * SRC_W + camv.x * vw0;
  const cy = view.cy * SRC_H + camv.y * vh0;
  const sx = cx - vw / 2;
  const sy = cy - vh / 2;

  const dstAspect = dst.w / dst.h;
  const srcAspect = vw / vh;
  let cw = vw;
  let ch = vh;
  let ox = sx;
  let oy = sy;
  if (srcAspect > dstAspect) { cw = vh * dstAspect; ox = sx + (vw - cw) / 2; }
  else { ch = vw / dstAspect; oy = sy + (vh - ch) / 2; }
  ox = clamp(ox, 0, SRC_W - cw);
  oy = clamp(oy, 0, SRC_H - ch);
  return { ox, oy, cw, ch };
}

/** cover-fit a normalised source window into a destination rect */
function drawWindow(bmp, view, dst, camv) {
  const m = windowMap(view, dst, camv);
  ctx.drawImage(bmp, m.ox, m.oy, m.cw, m.ch, dst.x, dst.y, dst.w, dst.h);
  return m;
}

/** map a normalised SOURCE point to output pixels through the same transform,
 *  so an annotation stays glued to the feature it points at */
function project(nx, ny, m, dst) {
  return {
    x: dst.x + ((nx * SRC_W - m.ox) / m.cw) * dst.w,
    y: dst.y + ((ny * SRC_H - m.oy) / m.ch) * dst.h,
  };
}

/** camera for this frame, already eased into scalars */
function easedCam(unit, t) {
  const p = clamp((t - unit.a) / (unit.b - unit.a));
  const e = pickEase(unit.cam?.ease ?? 'inOut')(p);
  const c = unit.cam ?? {};
  const f = (k, d) => lerp((c[k] ?? [d, d])[0], (c[k] ?? [d, d])[1], e);
  return { z: f('z', 1), x: f('x', 0), y: f('y', 0) };
}

// --------------------------------------------------------------------------- //
// backdrop
// --------------------------------------------------------------------------- //
function drawDark(t, seed = 0) {
  const g = ctx.createLinearGradient(0, 0, DW * 0.35, DH);
  g.addColorStop(0, C.navy1);
  g.addColorStop(0.55, C.navy0);
  g.addColorStop(1, C.ink);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, DW, DH);

  // slow breathing glow so a held card is never a dead frame
  const br = 0.5 + 0.5 * Math.sin(t * 0.55 + seed);
  const rg = ctx.createRadialGradient(DW * 0.76, DH * 0.22, 40, DW * 0.76, DH * 0.22, 1000);
  rg.addColorStop(0, `rgba(56,189,248,${0.10 + 0.05 * br})`);
  rg.addColorStop(0.45, `rgba(255,176,32,${0.045 + 0.025 * br})`);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, DW, DH);
}

function drawScrim(pos) {
  const top = pos === 'high' ? 0.62 : 0.68;
  const peak = pos === 'high' ? 0.58 : 0.76;
  const g = ctx.createLinearGradient(0, DH * top, 0, DH);
  g.addColorStop(0, 'rgba(4,7,14,0)');
  g.addColorStop(0.55, `rgba(4,7,14,${peak * 0.55})`);
  g.addColorStop(1, `rgba(4,7,14,${peak})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, DH * top, DW, DH * (1 - top));
}

function drawGrade(t) {
  ctx.drawImage(vignette, 0, 0);
  const tile = grainTiles[Math.floor(t * FPS) % grainTiles.length];
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(tile, 0, 0, DW, DH);
  ctx.restore();
}

// --------------------------------------------------------------------------- //
// unit lookup
// --------------------------------------------------------------------------- //
function unitAt(t) {
  for (const u of UNITS) if (t >= u.a && t < u.b) return u;
  return UNITS[UNITS.length - 1];
}

// --------------------------------------------------------------------------- //
// overlay HTML
// --------------------------------------------------------------------------- //
const chip = (txt, extra = '') =>
  `<span class="chip" style="${extra}">${txt}</span>`;

/** the right-hand rail on card units: real facts instead of empty space */
function renderSide(unit, t) {
  const s = unit.side;
  if (!s) return '';
  const E = (d) => ent(t, unit.a, 0.6, d);
  const out = [];
  if (s.stat) {
    const e = E(0.52);
    out.push(`<div class="stat" style="opacity:${e.o};transform:translateY(${e.y}px)">
      <div class="sv">${s.stat[0]}</div>
      ${s.stat[1] ? `<div class="sl">${s.stat[1]}</div>` : ''}</div>`);
  }
  (s.rows ?? []).forEach(([k, v], i) => {
    const e = E(0.50 + i * 0.17);
    out.push(`<div class="row" style="opacity:${e.o};transform:translateY(${e.y}px)">
      <div class="rk">${k}</div><div class="rv">${v}</div></div>`);
  });
  return `<div class="side">${out.join('')}</div>`;
}

/** footer hairline + end labels, the magazine furniture on card units */
function renderFootrail(unit, t) {
  const e = ent(t, unit.a, 0.7, 0.9);
  const right = unit.eyebrow ? String(unit.eyebrow).split('·').pop().trim() : '';
  return `<div class="footrail" style="opacity:${e.o}">
    <span>PELICAN TEST · ANTIGRAVITY</span><span>${right}</span></div>`;
}

const FULL = { x: 0, y: 0, w: DW, h: DH };

function renderClip(unit, t) {
  const local = t - unit.a;
  const pieces = [];
  if (unit.chapter) {
    const e = ent(t, unit.a, 0.5, 0.05);
    pieces.push(`<div class="tl" style="opacity:${e.o};transform:translateY(${-e.y * 0.5}px)">${chip(unit.chapter)}</div>`);
  }
  if (unit.meta) {
    const e = ent(t, unit.a, 0.5, 0.14);
    pieces.push(`<div class="tr" style="opacity:${e.o};transform:translateY(${-e.y * 0.5}px)">${chip(unit.meta, 'font-family:' + FAM.mono)}</div>`);
  }
  if (unit.notes?.length) {
    // annotations are anchored in SOURCE space and projected through the view,
    // so they stay on the feature no matter how the shot is cropped or pushed
    const m = windowMap(VIEWS[unit.view], FULL, easedCam(unit, t));
    for (const n of unit.notes) {
      const p = clamp((local - n.at) / 0.45);
      if (p <= 0) continue;
      const e = easeOutQuint(p);
      const pt = project(n.x, n.y, m, FULL);
      if (pt.x < -60 || pt.x > DW + 60 || pt.y < -60 || pt.y > DH + 60) continue;
      const rev = n.dir === 'left';
      const shift = rev ? 'translate(calc(-100% + 11px), -50%)' : 'translate(-11px, -50%)';
      pieces.push(`<div class="note" style="left:${pt.x.toFixed(1)}px;top:${pt.y.toFixed(1)}px;flex-direction:${rev ? 'row-reverse' : 'row'};transform:${shift};opacity:${e}">
        <span class="dot"></span>
        <span class="ln" style="width:${Math.round(54 * e)}px"></span>
        <span class="lb" style="opacity:${e}">${n.text}</span>
      </div>`);
    }
  }
  return pieces.join('');
}

function renderSplit(unit, t) {
  const e = ent(t, unit.a, 0.5, 0.05);
  const lbl = (side, x) => {
    const s = ent(t, unit.a, 0.5, 0.22 + (side === 'right' ? 0.1 : 0));
    return `<div class="splitlabel" style="left:${x}px;opacity:${s.o};transform:translateY(${s.y}px)">
      <b>${side === 'left' ? unit.left.label : unit.right.label}</b>
      <i>${side === 'left' ? unit.left.sub : unit.right.sub}</i>
    </div>`;
  };
  return `<div class="tl" style="opacity:${e.o}">${chip(unit.chapter)}</div>
    ${lbl('left', 108)}${lbl('right', DW / 2 + 36)}
    <div class="splitdivider" style="opacity:${e.o}"></div>`;
}

function renderHook(unit, t) {
  const out = [];
  const E = (d) => ent(t, unit.a, 0.6, d);
  const eb = E(0.10);
  out.push(`<div class="eyebrow" style="opacity:${eb.o};transform:translateY(${eb.y}px)">${unit.eyebrow}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.30 + i * 0.13);
    out.push(`<div class="h1" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const es = E(0.62);
  out.push(`<div class="latin" style="opacity:${es.o};transform:translateY(${es.y}px)">${unit.sub}</div>`);
  const rule = E(0.74);
  out.push(`<div class="rule" style="width:${Math.round(190 * easeOutQuint(rule.p))}px;opacity:${rule.o}"></div>`);
  unit.body.forEach((line, i) => {
    const e = E(0.92 + i * 0.14);
    out.push(`<div class="lead" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const f = E(1.5);
  out.push(`<div class="foot" style="opacity:${f.o};transform:translateY(${f.y}px)">${unit.footnote}</div>`);
  return `<div class="stack hook">${out.join('')}</div>${renderSide(unit, t)}${renderFootrail(unit, t)}`;
}

function renderStatement(unit, t) {
  const out = [];
  const E = (d) => ent(t, unit.a, 0.6, d);
  const eb = E(0.10);
  out.push(`<div class="eyebrow" style="opacity:${eb.o};transform:translateY(${eb.y}px)">${unit.eyebrow}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.32 + i * 0.14);
    out.push(`<div class="h2" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.72 + i * 0.14);
    out.push(`<div class="lead" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  (unit.facts ?? []).forEach(([k, v], i) => {
    const e = E(0.62 + i * 0.22);
    out.push(`<div class="fact" style="opacity:${e.o};transform:translateY(${e.y}px)">
      <span class="fk">${k}</span><span class="fv">${v}</span></div>`);
  });
  return `<div class="stack statement">${out.join('')}</div>${renderSide(unit, t)}${renderFootrail(unit, t)}`;
}

function renderVerdict(unit, t) {
  const out = [];
  const E = (d) => ent(t, unit.a, 0.6, d);
  const eb = E(0.08);
  out.push(`<div class="eyebrow" style="opacity:${eb.o};transform:translateY(${eb.y}px)">${unit.eyebrow}</div>`);
  const k = E(0.24);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.kicker}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.42 + i * 0.20);
    out.push(`<div class="h1 ${i === 1 ? 'hot' : ''}" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  (unit.body ?? []).forEach((line, i) => {
    const e = E(1.05 + i * 0.16);
    out.push(`<div class="lead" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  return `<div class="stack verdict">${out.join('')}</div>${renderSide(unit, t)}${renderFootrail(unit, t)}`;
}

function renderOutro(unit, t) {
  const out = [];
  const E = (d) => ent(t, unit.a, 0.6, d);
  const r = E(0.05);
  out.push(`<div class="rule" style="width:${Math.round(150 * easeOutQuint(r.p))}px;opacity:${r.o}"></div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.22 + i * 0.14);
    out.push(`<div class="h1" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.56 + i * 0.16);
    out.push(`<div class="lead" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const h = E(0.95);
  out.push(`<div class="handle" style="opacity:${h.o};transform:translateY(${h.y}px)">${unit.handle}</div>`);
  return `<div class="stack outro">${out.join('')}</div>${renderSide(unit, t)}`;
}

function captionHTML(t, unit) {
  const cue = CUES.find((c) => t >= c.a && t < c.b);
  if (!cue) return '';
  const pin = clamp((t - cue.a) / 0.24);
  const pout = clamp((cue.b - t) / 0.18);
  const o = Math.min(easeOut(pin), pout);
  const y = (1 - easeOut(pin)) * 15 - (1 - pout) * 9;
  const pos = unit.captionPos === 'high' || CARD_KINDS.includes(unit?.kind) ? 'high' : 'low';
  return `<div class="cap ${pos}" style="opacity:${o};transform:translateY(${y}px)">${cue.text}</div>`;
}

// --------------------------------------------------------------------------- //
// prepare + render
// --------------------------------------------------------------------------- //
function neededKeys(unit, t) {
  if (unit.kind === 'clip') return [srcKey(unit, t)];
  if (unit.kind === 'split') return [srcKey(unit.left, t, unit.a), srcKey(unit.right, t, unit.a)];
  return [];
}

function drawFrame(i) {
  const t = i / FPS;
  frameNo = i;
  const unit = unitAt(t);
  const local = clamp((t - unit.a) / (unit.b - unit.a));

  // ---- picture ----
  if (unit.kind === 'clip') {
    const bmp = CACHE.get(srcKey(unit, t));
    if (bmp) drawWindow(bmp, VIEWS[unit.view], { x: 0, y: 0, w: DW, h: DH }, easedCam(unit, t));
    else drawDark(t);
  } else if (unit.kind === 'split') {
    const half = DW / 2;
    const cv = easedCam(unit, t);
    for (const [side, dst] of [[unit.left, { x: 0, y: 0, w: half, h: DH }], [unit.right, { x: half, y: 0, w: half, h: DH }]]) {
      const bmp = CACHE.get(srcKey(side, t, unit.a));
      if (bmp) drawWindow(bmp, VIEWS[side.view], dst, cv);
      else drawDark(t);
    }
    // keep the seam readable
    ctx.fillStyle = 'rgba(4,7,14,0.85)';
    ctx.fillRect(half - 2, 0, 4, DH);
  } else {
    drawDark(t, unit.id.length);
  }

  // ---- grade + caption scrim ----
  if (unit.kind === 'clip') drawScrim(unit.captionPos ?? 'low');
  else if (unit.kind === 'split') drawScrim('low');
  drawGrade(t);

  // ---- end fade ----
  if (t > VIDEO_END - 1.0) {
    ctx.fillStyle = `rgba(0,0,0,${clamp((t - (VIDEO_END - 1.0)) / 1.0)})`;
    ctx.fillRect(0, 0, DW, DH);
  }

  // ---- typography ----
  let html = '';
  switch (unit.kind) {
    case 'clip': html = renderClip(unit, t); break;
    case 'split': html = renderSplit(unit, t); break;
    case 'hook': html = renderHook(unit, t); break;
    case 'statement': html = renderStatement(unit, t); break;
    case 'verdict': html = renderVerdict(unit, t); break;
    case 'outro': html = renderOutro(unit, t); break;
    default: html = '';
  }
  overlay.innerHTML = html + captionHTML(t, unit);
}

window.__frame = async (i) => {
  const t = i / FPS;
  const unit = unitAt(t);
  await ensure(neededKeys(unit, t));
  drawFrame(i);
  return { i, unit: unit.id, missing: missing.length };
};

window.__boot = async () => {
  await loadShotInfo();
  // cross-check the cut against the section grid the music was written to
  let drift = null;
  try {
    const sec = await (await fetch('sections.json')).json();
    drift = sec.sections
      .map((s) => (UNITS.find((x) => Math.abs(x.a - s.start) < 1e-6) ? null : `${s.id}@${s.start} has no unit`))
      .filter(Boolean);
  } catch (e) {
    drift = ['sections.json unavailable: ' + e.message];
  }
  return {
    shots: Object.keys(SHOTS),
    units: UNITS.length,
    cues: CUES.length,
    frames: Math.round(VIDEO_END * FPS),
    sectionDrift: drift,
  };
};

window.__debug = () => ({ missing: missing.slice(0, 20), missingCount: missing.length, cached: [...CACHE.keys()] });

// --------------------------------------------------------------------------- //
// cover / thumbnail: one hero frame with the title lockup
// --------------------------------------------------------------------------- //
window.__cover = async (opts = {}) => {
  const shot = opts.shot ?? 'a-sunset';
  const src = Number(opts.src ?? 1.20);
  const view = opts.view ? (VIEWS[opts.view] ? VIEWS[opts.view] : opts.view) : VIEWS.aScene;
  const key = `${shot}#${Math.round(src * FPS)}`;
  await ensure([key]);
  const bmp = CACHE.get(key);

  ctx.save();
  ctx.setTransform(DSF, 0, 0, DSF, 0, 0);
  if (bmp) drawWindow(bmp, view, { x: 0, y: 0, w: DW, h: DH }, { z: Number(opts.zoom ?? 1.06), x: 0, y: 0 });
  else drawDark(0);
  ctx.restore();

  // readable left side without flattening the picture
  const g = ctx.createLinearGradient(0, 0, DW * 0.84, 0);
  g.addColorStop(0, 'rgba(4,7,14,0.95)');
  g.addColorStop(0.32, 'rgba(4,7,14,0.82)');
  g.addColorStop(0.60, 'rgba(4,7,14,0.34)');
  g.addColorStop(0.86, 'rgba(4,7,14,0.04)');
  g.addColorStop(1, 'rgba(4,7,14,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, DW, DH);
  const gv = ctx.createLinearGradient(0, DH, 0, DH * 0.55);
  gv.addColorStop(0, 'rgba(4,7,14,0.72)');
  gv.addColorStop(1, 'rgba(4,7,14,0)');
  ctx.fillStyle = gv;
  ctx.fillRect(0, DH * 0.55, DW, DH * 0.45);
  drawGrade(1.0);

  overlay.innerHTML = `
    <div class="coverlock">
      <div class="eyebrow">ANTIGRAVITY · GEMINI 3.8 · 鹈鹕测试</div>
      <div class="covertitle">骑自行车的<br>鹈鹕</div>
      <div class="coverrule"></div>
      <div class="coverkick">同一个题目 · 两版一次成型</div>
      <div class="coverhot">合理怀疑：已路由到 Gemini 4.0</div>
    </div>
    <div class="coverfoot"><span>@TimeCraker</span><span>纯 SVG 矢量动画 · 无贴图</span></div>`;
  return { ok: true, shot, src, missing: missing.length };
};
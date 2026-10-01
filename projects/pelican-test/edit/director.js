/**
 * Director: renders the finished video one frame at a time, purely from the
 * frame index. No Date, no Math.random, no wall clock — frame N always looks the
 * same, which is what makes the capture deterministic and re-renderable.
 *
 * Layering: <canvas> carries the paper, the plates and their grade; a DOM layer
 * on top carries typography and printed callouts.
 *
 * Visual system: printed field guide. Warm paper, serif display type, solid
 * caption band (never a translucent pill), dot-leader spec tables, flat
 * callouts with no glow. The verdict page inverts to ink.
 */

const DW = 1920;
const DH = 1080;
const SRC_W = 3840; // capture size of every source clip
const SRC_H = 2160;
/** units that are typography pages rather than footage plates */
const CARD_KINDS = ['hook', 'statement', 'verdict', 'outro'];

// --------------------------------------------------------------------------- //
// layout grid (all in 1920x1080 output pixels)
// --------------------------------------------------------------------------- //
const L = {
  margin: 72,
  headRule: 64,
  // the footage plate: full width, 2.162:1 — crops away the app chrome and the
  // dead road, and leaves a solid paper band underneath for the caption
  plate: { x: 0, y: 64, w: 1920, h: 888 },
  band: { y: 952, h: 128 },
  // comparison plates
  splitL: { x: 72, y: 150, w: 852, h: 620 },
  splitR: { x: 996, y: 150, w: 852, h: 620 },
  // contact-sheet strip on the input card: three 16:9 thumbnails of the output
  thumbs: { x: 72, y: 566, w: 576, h: 324, gap: 24 },
};
const FULL = { x: 0, y: 0, w: DW, h: DH };

// --------------------------------------------------------------------------- //
// small maths helpers — all pure
// --------------------------------------------------------------------------- //
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, p) => a + (b - a) * p;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const pickEase = (n) => (n === 'linear' ? (x) => x : n === 'out' ? easeOut : easeInOut);
/** deterministic pseudo-random in [0,1) — never Math.random inside the render */
const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** stagger helper: {p, o, y} for an element entering at `start + delay` */
function ent(t, start, dur = 0.5, delay = 0) {
  const p = clamp((t - start - delay) / dur);
  const e = easeOutQuint(p);
  return { p, o: e, y: (1 - e) * 22 };
}

// --------------------------------------------------------------------------- //
// canvas + baked fixtures
// --------------------------------------------------------------------------- //
const canvas = document.getElementById('bed');
const viewport = document.getElementById('viewport');
// Supersampling: laid out in 1920x1080 CSS px, canvas backing store can run at 2x.
const DSF = Math.max(1, Math.min(4, window.__DSF || 1));
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = DW * DSF;
canvas.height = DH * DSF;
ctx.scale(DSF, DSF);
const overlay = document.getElementById('overlay');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

/** Bake the paper once: flat stock + a whisper of mottle + a soft edge falloff.
 *  Baked at half resolution and upscaled when drawn — the mottle becomes soft
 *  paper tooth (which is what real stock looks like) and, crucially, the frame
 *  is far cheaper for the PNG encoder than full-resolution noise. */
const PAPER_SCALE = 0.5;
function bakePaper(base, mottle, edgeAlpha) {
  const w = Math.round(DW * PAPER_SCALE);
  const h = Math.round(DH * PAPER_SCALE);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      // mostly fine grain with a hint of larger variation: reads as paper tooth,
      // not as smudging
      const a = rnd(x * 0.37 + y * 11.3 + 5.0);
      const b = rnd(Math.floor(x / 3) * 2.11 + Math.floor(y / 3) * 7.7 + 1.0);
      const n = (a * 0.78 + b * 0.22 - 0.5) * mottle;
      d[i] = clamp(d[i] + n, 0, 255);
      d[i + 1] = clamp(d[i + 1] + n * 0.96, 0, 255);
      d[i + 2] = clamp(d[i + 2] + n * 0.88, 0, 255);
    }
  }
  g.putImageData(img, 0, 0);
  if (edgeAlpha > 0) {
    const rg = g.createRadialGradient(w / 2, h * 0.46, h * 0.34, w / 2, h * 0.52, h * 1.06);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, `rgba(60,44,24,${edgeAlpha})`);
    g.fillStyle = rg;
    g.fillRect(0, 0, w, h);
  }
  return c;
}
const paperLight = bakePaper('#F4EFE6', 5.0, 0.05);
const paperDark = bakePaper('#17140F', 3.5, 0.0);

// --------------------------------------------------------------------------- //
// image cache: we only ever need the frames this one frame shows
// --------------------------------------------------------------------------- //
const SHOTS = {};                 // id -> {frames}
const CACHE = new Map();          // key -> ImageBitmap
const ORDER = [];
const MAX_CACHED = 8;
let missing = [];

async function loadShotInfo() {
  const idx = await (await fetch('../frames/index.json')).json();
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
// source frame lookup + projection
// --------------------------------------------------------------------------- //
function srcKey(item, t, anchorA) {
  const info = SHOTS[item.shot];
  const n = info ? info.frames : 100000;
  const local = (t - (anchorA ?? item.a)) * (item.speed ?? 1);
  return `${item.shot}#${clamp(Math.round((item.src + local) * FPS), 0, n - 1)}`;
}

/** the source rectangle a view+camera currently shows, after cover-fit */
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

function drawPlate(bmp, view, dst, camv) {
  const m = windowMap(view, dst, camv);
  ctx.drawImage(bmp, m.ox, m.oy, m.cw, m.ch, dst.x, dst.y, dst.w, dst.h);
  return m;
}

/** map a normalised SOURCE point through the same transform, so an annotation
 *  stays glued to the feature it points at */
function project(nx, ny, m, dst) {
  return {
    x: dst.x + ((nx * SRC_W - m.ox) / m.cw) * dst.w,
    y: dst.y + ((ny * SRC_H - m.oy) / m.ch) * dst.h,
  };
}

function easedCam(unit, t) {
  const p = clamp((t - unit.a) / (unit.b - unit.a));
  const e = pickEase(unit.cam?.ease ?? 'inOut')(p);
  const c = unit.cam ?? {};
  const f = (k, d) => lerp((c[k] ?? [d, d])[0], (c[k] ?? [d, d])[1], e);
  return { z: f('z', 1), x: f('x', 0), y: f('y', 0) };
}

// --------------------------------------------------------------------------- //
// unit lookup
// --------------------------------------------------------------------------- //
function unitAt(t) {
  for (const u of UNITS) if (t >= u.a && t < u.b) return u;
  return UNITS[UNITS.length - 1];
}

// --------------------------------------------------------------------------- //
// overlay markup
// --------------------------------------------------------------------------- //
function headHTML() {
  // the running head carries provenance on every single frame — this is a
  // showcase of what the platform generated, so the platform never leaves screen
  return `<div class="head">
      <span><b>ANTIGRAVITY 生成实录</b> · PELICAN ON A BICYCLE</span>
      <span>GEMINI 3.8 FLASH · 轻量档</span>
    </div><div class="headrule"></div>`;
}

/** thumbnail geometry for the input card's contact sheet */
function thumbRect(i, n) {
  const t = L.thumbs;
  return { x: t.x + i * (t.w + t.gap), y: t.y, w: t.w, h: t.h };
}
function thumbKey(th) { return `${th.shot}#${Math.round(th.src * FPS)}`; }

function bandHTML(unit, t) {
  const cue = CUES.find((c) => t >= c.a && t < c.b);
  const p = cue ? clamp((t - cue.a) / 0.22) : 0;
  const o = cue ? Math.min(easeOut(p), clamp((cue.b - t) / 0.16)) : 0;
  const y = cue ? (1 - easeOut(p)) * 12 : 0;
  return `<div class="band">
      <div class="bandrule"></div>
      <div class="band-inner">
        <div class="band-top">
          <span class="band-kicker">${unit.label ?? ''}</span>
          <span>${unit.meta ?? ''}</span>
        </div>
        ${cue ? `<div class="cap" style="opacity:${o};transform:translateY(${y}px)">${cue.text}</div>` : ''}
      </div>
    </div>`;
}

/** flat printed callout: solid square dot, hairline leader, paper label */
function notesHTML(unit, t, dst, camv) {
  if (!unit.notes?.length) return '';
  const m = windowMap(VIEWS[unit.view], dst, camv);
  const out = [];
  for (const n of unit.notes) {
    const p = clamp((t - unit.a - n.at) / 0.4);
    if (p <= 0) continue;
    const e = easeOutQuint(p);
    const pt = project(n.x, n.y, m, dst);
    if (pt.x < -80 || pt.x > DW + 80 || pt.y < -80 || pt.y > DH + 80) continue;
    const rev = n.dir === 'left';
    const shift = rev ? 'translate(calc(-100% + 7px), -50%)' : 'translate(-7px, -50%)';
    out.push(`<div class="note" style="left:${pt.x.toFixed(1)}px;top:${pt.y.toFixed(1)}px;flex-direction:${rev ? 'row-reverse' : 'row'};transform:${shift};opacity:${e}">
      <span class="note-dot"></span>
      <span class="note-line" style="width:${Math.round(46 * e)}px"></span>
      <span class="note-label">${n.text}</span>
    </div>`);
  }
  return out.join('');
}

function splitHTML(unit, t) {
  const E = (d) => ent(t, unit.a, 0.5, d);
  const label = (side, plate, delay) => {
    const e = E(delay);
    const s = side === 'left' ? unit.left : unit.right;
    return `<div class="plate-label" style="left:${plate.x}px;top:${plate.y + plate.h + 26}px;opacity:${e.o};transform:translateY(${e.y}px)">
      <b>${s.label}</b><i>${s.sub}</i>
    </div>`;
  };
  const div = E(0.1);
  return `${label('left', L.splitL, 0.16)}${label('right', L.splitR, 0.24)}
    <div class="vrule" style="left:${DW / 2}px;top:${L.splitL.y + 16}px;height:${L.splitL.h - 32}px;opacity:${div.o}"></div>`;
}

// --------------------------------------------------------------------------- //
// page templates
// --------------------------------------------------------------------------- //
function trow(k, v, cls = '') {
  return `<div class="trow"><span class="tk">${k}</span><span class="tdots"></span><span class="tv ${cls}">${v}</span></div>`;
}

function renderHook(unit, t) {
  const E = (d) => ent(t, unit.a, 0.55, d);
  const out = [];
  const k = E(0.14);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.kicker}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.26 + i * 0.12);
    const fs = unit.titleSize ? `font-size:${unit.titleSize}px;` : '';
    out.push(`<div class="display xl" style="${fs}opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const r = E(0.5);
  out.push(`<div class="rule" style="opacity:${r.o};transform:scaleX(${easeOutQuint(r.p)});transform-origin:left center;width:190px"></div>`);
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.68 + i * 0.12);
    out.push(`<div class="prose" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const f = E(0.9);
  out.push(`<div class="foot" style="opacity:${f.o};transform:translateY(${f.y}px);max-width:760px">${unit.footnote}</div>`);
  if (unit.agenda) {
    const a = E(1.05);
    out.push(`<div class="agenda" style="opacity:${a.o};transform:translateY(${a.y}px)">
      <div class="agenda-t">${unit.agenda.title}</div>
      ${unit.agenda.items.map((v, i) => `<div class="agenda-r"><span class="agenda-n">0${i + 1}</span><span class="agenda-v">${v}</span></div>`).join('')}
    </div>`);
  }
  const rows = (unit.side?.rows ?? []).map(([k2, v], i) => {
    const e = E(0.6 + i * 0.13);
    return `<div style="opacity:${e.o};transform:translateY(${e.y}px)">${trow(k2, v)}</div>`;
  }).join('');
  return `<div class="page cols">
      <div class="main">${out.join('')}</div>
      <div class="rail"><div class="table">${rows}</div></div>
    </div>`;
}

/** Footer zone of a card: pull quote + handle. Rendered at the OVERLAY root
 *  (not inside .page) so their fixed y positions are frame coordinates and can
 *  never be pushed into the caption band by content above. */
function bottomHTML(unit, t) {
  const out = [];
  if (unit.pull) {
    const e = ent(t, unit.a, 0.5, unit.kind === 'outro' ? 0.6 : 0.62);
    out.push(`<div class="pull" style="opacity:${e.o};transform:translateY(${e.y}px)">${unit.pull}</div>`);
  }
  if (unit.handle) {
    const e = ent(t, unit.a, 0.5, 0.74);
    out.push(`<div class="handlebar" style="opacity:${e.o};transform:translateY(${e.y}px)">${unit.handle}</div>`);
  }
  return out.join('');
}

/** captions for the contact-sheet thumbnails. Rendered at the OVERLAY root, not
 *  inside .page — .page is itself absolutely positioned 118px down, so a frame
 *  coordinate used inside it would land 118px too low. */
function thumbsHTML(unit, t) {
  if (!unit.thumbs) return '';
  return unit.thumbs.map((th, i) => {
    const r = thumbRect(i, unit.thumbs.length);
    const e = ent(t, unit.a, 0.5, 0.82 + i * 0.1);
    return `<div class="thumblabel" style="left:${r.x}px;top:${r.y + r.h + 16}px;opacity:${e.o}">${th.label}</div>`;
  }).join('');
}

function renderStatement(unit, t) {
  const E = (d) => ent(t, unit.a, 0.55, d);
  const out = [];
  const k = E(0.14);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.eyebrow}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.26 + i * 0.13);
    const fs = unit.titleSize ? `font-size:${unit.titleSize}px;` : '';
    out.push(`<div class="display" style="${fs}opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const r = E(0.52);
  out.push(`<div class="rule" style="opacity:${r.o};transform:scaleX(${easeOutQuint(r.p)});transform-origin:left center"></div>`);
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.66 + i * 0.12);
    out.push(`<div class="prose" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  // checklist / manifest lives in the main column at full width so nothing wraps
  if (unit.facts) {
    const num = unit.factGlyph === 'num';
    out.push(`<div class="facts">${unit.facts.map(([k2, v], i) => {
      const e = E(0.72 + i * 0.16);
      const glyph = num ? `0${i + 1}` : '✓';
      return `<div style="opacity:${e.o};transform:translateY(${e.y}px)"><div class="check${num ? ' num' : ''}"><i>${glyph}</i><span class="check-k">${k2}</span><span class="check-v">${v}</span></div></div>`;
    }).join('')}</div>`);
  }
  let rail = '';
  if (unit.side?.stat) {
    const e = E(0.6);
    rail = `<div style="opacity:${e.o};transform:translateY(${e.y}px)"><div class="stat">${unit.side.stat[0]}</div><div class="stat-l">${unit.side.stat[1] ?? ''}</div></div>`;
  } else {
    rail = `<div class="table">${(unit.side?.rows ?? []).map(([k2, v], i) => {
      const e = E(0.6 + i * 0.15);
      return `<div style="opacity:${e.o};transform:translateY(${e.y}px)">${trow(k2, v)}</div>`;
    }).join('')}</div>`;
  }
  return `<div class="page cols">
      <div class="main">${out.join('')}</div>
      <div class="rail${unit.side?.stat ? ' narrow' : ''}">${rail}</div>
    </div>`;
}

function renderVerdict(unit, t) {
  const E = (d) => ent(t, unit.a, 0.55, d);
  const out = [];
  const k = E(0.12);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.eyebrow}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.26 + i * 0.18);
    const fs = unit.titleSize ? `font-size:${unit.titleSize}px;` : '';
    out.push(`<div class="display${i === 1 ? ' sm' : ''}" style="${fs}opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const r = E(0.62);
  out.push(`<div class="rule" style="opacity:${r.o};transform:scaleX(${easeOutQuint(r.p)});transform-origin:left center"></div>`);
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.8 + i * 0.14);
    out.push(`<div class="prose" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const rows = (unit.side?.rows ?? []).map(([k2, v], i) => {
    const e = E(0.7 + i * 0.13);
    return `<div style="opacity:${e.o};transform:translateY(${e.y}px)">${trow(k2, v)}</div>`;
  }).join('');
  return `<div class="page cols">
      <div class="main">${out.join('')}</div>
      <div class="rail${unit.railNarrow ? ' narrow' : ''}"><div class="table">${rows}</div></div>
    </div>`;
}

function renderOutro(unit, t) {
  const E = (d) => ent(t, unit.a, 0.5, d);
  const out = [];
  const k = E(0.06);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.eyebrow ?? ''}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.14 + i * 0.1);
    out.push(`<div class="display xl" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const r = E(0.3);
  out.push(`<div class="rule" style="opacity:${r.o};transform:scaleX(${easeOutQuint(r.p)});transform-origin:left center"></div>`);
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.4 + i * 0.12);
    out.push(`<div class="prose" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const stat = unit.side?.stat
    ? `<div style="opacity:${E(0.26).o}"><div class="stat">${unit.side.stat[0]}</div><div class="stat-l">${unit.side.stat[1] ?? ''}</div></div>`
    : '';
  return `<div class="page cols">
      <div class="main">${out.join('')}</div>
      <div class="rail narrow">${stat}</div>
    </div>`;
}

// --------------------------------------------------------------------------- //
// draw
// --------------------------------------------------------------------------- //
function neededKeys(unit, t) {
  if (unit.kind === 'clip') return [srcKey(unit, t)];
  if (unit.kind === 'split') return [srcKey(unit.left, t, unit.a), srcKey(unit.right, t, unit.a)];
  if (unit.thumbs) return unit.thumbs.map(thumbKey);
  return [];
}

function drawFrame(i) {
  const t = i / FPS;
  const unit = unitAt(t);
  const dark = !!unit.dark;
  viewport.classList.toggle('is-dark', dark);

  const cv = easedCam(unit, t);

  // ---- paper ----
  ctx.drawImage(dark ? paperDark : paperLight, 0, 0, DW, DH);

  // ---- plates ----
  let mainMap = null;
  if (unit.kind === 'clip') {
    const bmp = CACHE.get(srcKey(unit, t));
    if (bmp) mainMap = drawPlate(bmp, VIEWS[unit.view], L.plate, cv);
  } else if (unit.kind === 'split') {
    const bl = CACHE.get(srcKey(unit.left, t, unit.a));
    const br = CACHE.get(srcKey(unit.right, t, unit.a));
    if (bl) drawPlate(bl, VIEWS[unit.left.view], L.splitL, cv);
    if (br) drawPlate(br, VIEWS[unit.right.view], L.splitR, cv);
    // hairline frames keep the plates reading as printed figures
    ctx.strokeStyle = dark ? 'rgba(242,236,225,0.30)' : 'rgba(23,20,15,0.30)';
    ctx.lineWidth = 1;
    for (const p of [L.splitL, L.splitR]) ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  }

  // ---- contact sheet on the input card ----
  if (unit.thumbs) {
    ctx.strokeStyle = dark ? 'rgba(242,236,225,0.30)' : 'rgba(23,20,15,0.30)';
    ctx.lineWidth = 1;
    unit.thumbs.forEach((th, i) => {
      const r = thumbRect(i, unit.thumbs.length);
      const bmp = CACHE.get(thumbKey(th));
      if (bmp) drawPlate(bmp, VIEWS[th.view], r, { z: 1, x: 0, y: 0 });
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    });
  }

  // ---- end fade ----
  if (t > VIDEO_END - 1.0) {
    ctx.fillStyle = `rgba(23,20,15,${clamp((t - (VIDEO_END - 1.0)) / 1.0)})`;
    ctx.fillRect(0, 0, DW, DH);
  }

  // ---- typography ----
  let body = '';
  switch (unit.kind) {
    case 'clip': body = notesHTML(unit, t, L.plate, cv); break;
    case 'split': body = splitHTML(unit, t); break;
    case 'hook': body = renderHook(unit, t); break;
    case 'statement': body = renderStatement(unit, t); break;
    case 'verdict': body = renderVerdict(unit, t); break;
    case 'outro': body = renderOutro(unit, t); break;
    default: body = '';
  }
  overlay.innerHTML = headHTML() + body + bottomHTML(unit, t) + thumbsHTML(unit, t) + bandHTML(unit, t);
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
    shots: Object.keys(SHOTS), units: UNITS.length, cues: CUES.length,
    frames: Math.round(VIDEO_END * FPS), sectionDrift: drift,
  };
};

window.__debug = () => ({ missing: missing.slice(0, 20), missingCount: missing.length, cached: [...CACHE.keys()] });

// --------------------------------------------------------------------------- //
// cover / thumbnail
// --------------------------------------------------------------------------- //
window.__cover = async (opts = {}) => {
  const shot = opts.shot ?? 'a-sunset';
  const src = Number(opts.src ?? 1.30);
  const view = opts.view ? (VIEWS[opts.view] ? VIEWS[opts.view] : opts.view) : VIEWS.aScene;
  const key = `${shot}#${Math.round(src * FPS)}`;
  await ensure([key]);
  const bmp = CACHE.get(key);

  viewport.classList.remove('is-dark');
  ctx.drawImage(paperLight, 0, 0, DW, DH);

  // plate on the right, lockup on the paper at the left: a printed cover
  const plate = { x: 748, y: 96, w: 1172, h: 889 };
  if (bmp) {
    drawPlate(bmp, view, plate, { z: Number(opts.zoom ?? 1.06), x: 0, y: 0 });
    ctx.strokeStyle = 'rgba(23,20,15,0.34)';
    ctx.lineWidth = 1;
    ctx.strokeRect(plate.x + 0.5, plate.y + 0.5, plate.w - 1, plate.h - 1);
  }

  overlay.innerHTML = `
    <div class="head">
      <span><b>ANTIGRAVITY 生成实录</b> · PELICAN ON A BICYCLE</span>
      <span>GEMINI 3.8 FLASH · 轻量档</span>
    </div><div class="headrule"></div>
    <div class="coverlock">
      <div class="kicker">ANTIGRAVITY 生成实录 · GEMINI 3.8 FLASH</div>
      <div class="covertitle">骑自行车的<br>鹈鹕</div>
      <div class="coverrule"></div>
      <div class="coverkick">一句话的提示词 · 两版都能点</div>
      <div class="coverhot">我怀疑它已是 Gemini 4.0 的水平</div>
    </div>
    <div class="covermeta"><span>@TimeCraker</span><span>纯 SVG 矢量动画 · 无一张位图</span></div>`;
  return { ok: true, shot, src, missing: missing.length };
};
/**
 * Director: renders the finished video one frame at a time, purely from the
 * frame index. No Date, no Math.random, no wall clock — frame N always looks
 * the same, which is what makes the render deterministic and re-runnable.
 *
 * Layering: <canvas> carries the paper, the plates, their grade and the reveal
 * masks; a DOM layer on top carries typography and printed callouts.
 *
 * Visual system: printed field guide, palette aligned to the SOURCE page
 * (paper #F6F5ED / ink-green #344942 / rust #AE583E) so the generated artifact
 * and its showcase share one printed language. The verdict page inverts to a
 * deep ink-green — the only light/dark turn in the film.
 *
 * Motion grammar (docs/2026-08-30-motion-grammar.md): staged entrances,
 * continuous micro-events (dot-leaders drawing in, stat counting up, notes
 * growing), per-unit camera verbs (push / pull / pan), plate reveal verbs
 * (wipe / iris, alternating so adjacent cuts never share a verb), no
 * cross-dissolve, fade only at the ring-out.
 */

const DW = 1920;
const DH = 1080;

// --------------------------------------------------------------------------- //
// layout grid (1920x1080 output px)
// --------------------------------------------------------------------------- //
const L = {
  plate: { x: 0, y: 64, w: 1920, h: 888 },   // 2.162:1 printed plate
  band: { y: 952, h: 128 },
  splitL: { x: 72, y: 150, w: 852, h: 620 },
  splitR: { x: 996, y: 150, w: 852, h: 620 },
  snap: { x: 1248, y: 560, w: 600, h: 338 }, // Codex 生成实录截图（右栏规格表下方，底边 898 不压字幕带）
};

// --------------------------------------------------------------------------- //
// pure maths helpers
// --------------------------------------------------------------------------- //
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, p) => a + (b - a) * p;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const pickEase = (n) => (n === 'linear' ? (x) => x : n === 'out' ? easeOut : easeInOut);
const rnd = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function ent(t, start, dur = 0.5, delay = 0) {
  const p = clamp((t - start - delay) / dur);
  const e = easeOutQuint(p);
  return { p, o: e, y: (1 - e) * 22 };
}

// --------------------------------------------------------------------------- //
// canvas + baked paper
// --------------------------------------------------------------------------- //
const canvas = document.getElementById('bed');
const viewport = document.getElementById('viewport');
const DSF = Math.max(1, Math.min(4, window.__DSF || 1));
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = DW * DSF;
canvas.height = DH * DSF;
ctx.scale(DSF, DSF);
const overlay = document.getElementById('overlay');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

/** 纸张按半分辨率烘焙再放大：更像纸、PNG 体积与编码量都显著下降（上集实测）。 */
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
    rg.addColorStop(1, `rgba(38,54,46,${edgeAlpha})`);
    g.fillStyle = rg;
    g.fillRect(0, 0, w, h);
  }
  return c;
}
const paperLight = bakePaper('#F6F5ED', 5.0, 0.05);
const paperDark = bakePaper('#1C2420', 3.5, 0.0);

/** 揭幕动词用的离屏画布（全幅，复用）。 */
const off = document.createElement('canvas');
off.width = DW * DSF;
off.height = DH * DSF;
const octx = off.getContext('2d');
octx.scale(DSF, DSF);

// --------------------------------------------------------------------------- //
// image cache: source frames + the Codex screenshot asset
// --------------------------------------------------------------------------- //
const SHOTS = {};        // id -> clip info (frames, width, height, dsf)
const CACHE = new Map(); // key -> ImageBitmap
const ORDER = [];
const MAX_CACHED = 12;
let missing = [];
let snapBmp = null;      // capture/assets/codex-session.png

const srcPx = (shotId) => {
  const s = SHOTS[shotId];
  return s ? { w: s.width * s.dsf, h: s.height * s.dsf } : { w: 3840, h: 2360 };
};

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
// source frame lookup + projection（每个镜头有自己的源尺寸）
// --------------------------------------------------------------------------- //
function srcKey(item, t, anchorA) {
  const info = SHOTS[item.shot];
  const n = info ? info.frames : 100000;
  const local = (t - (anchorA ?? item.a)) * (item.speed ?? 1);
  return `${item.shot}#${clamp(Math.round((item.src + local) * FPS), 0, n - 1)}`;
}

/** the source rectangle a view+camera currently shows, after cover-fit */
function windowMap(view, dst, camv, srcW, srcH) {
  const vw0 = view.w * srcW;
  const vh0 = view.h * srcH;
  const vw = vw0 / camv.z;
  const vh = vh0 / camv.z;
  const cx = view.cx * srcW + camv.x * vw0;
  const cy = view.cy * srcH + camv.y * vh0;
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
  ox = clamp(ox, 0, srcW - cw);
  oy = clamp(oy, 0, srcH - ch);
  return { ox, oy, cw, ch };
}

/** 图版双层质感（F1）：投影 + 细边。先画带影底块，再贴图，最后 hairline。 */
function plateBase(dst) {
  ctx.save();
  ctx.shadowColor = 'rgba(28, 36, 32, 0.20)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#DFDFCF';
  ctx.fillRect(dst.x, dst.y, dst.w, dst.h);
  ctx.restore();
}
function plateEdge(dst, dark) {
  ctx.strokeStyle = dark ? 'rgba(239, 240, 228, 0.30)' : 'rgba(28, 36, 32, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(dst.x + 0.5, dst.y + 0.5, dst.w - 1, dst.h - 1);
}

function drawPlate(bmp, view, dst, camv, shotId) {
  const { w: srcW, h: srcH } = srcPx(shotId);
  const m = windowMap(view, dst, camv, srcW, srcH);
  plateBase(dst);
  ctx.drawImage(bmp, m.ox, m.oy, m.cw, m.ch, dst.x, dst.y, dst.w, dst.h);
  plateEdge(dst, false);
  return m;
}

/** 揭幕动词：wipe-l / wipe-r / iris。p = 0..1，1 为完全揭示。相邻剪辑点不共用动词。 */
function drawPlateRevealed(bmp, view, dst, camv, shotId, kind, p) {
  if (p >= 1) return drawPlate(bmp, view, dst, camv, shotId);
  const { w: srcW, h: srcH } = srcPx(shotId);
  const m = windowMap(view, dst, camv, srcW, srcH);

  octx.clearRect(0, 0, DW, DH);
  octx.save();
  octx.shadowColor = 'rgba(28, 36, 32, 0.20)';
  octx.shadowBlur = 26;
  octx.shadowOffsetY = 10;
  octx.fillStyle = '#DFDFCF';
  octx.fillRect(dst.x, dst.y, dst.w, dst.h);
  octx.restore();
  octx.drawImage(bmp, m.ox, m.oy, m.cw, m.ch, dst.x, dst.y, dst.w, dst.h);
  octx.save();
  octx.globalCompositeOperation = 'destination-in';
  octx.fillStyle = '#000';
  if (kind === 'iris') {
    const r = p * Math.hypot(dst.w, dst.h) * 0.62;
    octx.beginPath();
    octx.arc(dst.x + dst.w / 2, dst.y + dst.h / 2, Math.max(1, r), 0, Math.PI * 2);
    octx.fill();
  } else {
    const w = dst.w * p;
    octx.fillRect(dst.x, dst.y, w, dst.h);
  }
  octx.restore();
  ctx.drawImage(off, 0, 0, DW * DSF, DH * DSF, 0, 0, DW, DH);

  // 揭示前沿：一根锈红细线，画出「印刷装订」的仪式感
  ctx.strokeStyle = 'rgba(174, 88, 62, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (kind === 'iris') {
    const r = p * Math.hypot(dst.w, dst.h) * 0.62;
    ctx.arc(dst.x + dst.w / 2, dst.y + dst.h / 2, Math.max(1, r), 0, Math.PI * 2);
  } else {
    const x = dst.x + dst.w * p;
    ctx.moveTo(x, dst.y);
    ctx.lineTo(x, dst.y + dst.h);
  }
  ctx.stroke();
  return m;
}

/** map a normalised SOURCE point through the same transform, so an annotation
 *  stays glued to the feature it points at */
function project(nx, ny, m, dst) {
  return {
    x: dst.x + ((nx * m.sw - m.ox) / m.cw) * dst.w,
    y: dst.y + ((ny * m.sh - m.oy) / m.ch) * dst.h,
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
// 印刷件例 v2：对版十字线 + 分区色键线 + 图版编号 + 书脊 + 印章
// --------------------------------------------------------------------------- //
const KEY = { sand: '#E4D9B5', sea: '#A6CBC1', sage: '#A8C2AC' };
const KEY_ROT = ['sand', 'sea', 'sage'];
function keyColor(unit) {
  const m = /SEC 0(\d)/.exec(unit.chapter ?? '');
  return KEY[KEY_ROT[(Number(m?.[1] ?? 1) - 1) % 3]];
}
/** 图版四角对版十字线 + 顶部色键线（印刷装订语汇，确定性绘制） */
function platePrint(dst, unit, dark) {
  const key = keyColor(unit);
  ctx.fillStyle = key;
  ctx.fillRect(dst.x, dst.y, dst.w, 4);
  ctx.strokeStyle = dark ? 'rgba(239,240,228,0.4)' : 'rgba(52,73,66,0.4)';
  ctx.lineWidth = 1;
  for (const [cx, cy] of [
    [dst.x + 20, dst.y + 20], [dst.x + dst.w - 20, dst.y + 20],
    [dst.x + 20, dst.y + dst.h - 20], [dst.x + dst.w - 20, dst.y + dst.h - 20],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy);
    ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7);
    ctx.stroke();
  }
}

// --------------------------------------------------------------------------- //
// overlay markup
// --------------------------------------------------------------------------- //
function headHTML(t) {
  const draw = clamp(t / 0.6);
  return `<div class="head">
      <span><b>CODEX 生成实录</b> · PELICAN RIDE</span>
      <span>GPT-6.1 SOL · 思考等级 高</span>
    </div><div class="headrule" style="transform:scaleX(${easeOut(draw)})"></div>`;
}

function folioHTML(unit, t) {
  if (!unit.chapter) return '';
  const e = ent(t, unit.a, 0.4, 0.1);
  const isCard = unit.kind === 'hook' || unit.kind === 'statement' || unit.kind === 'verdict' || unit.kind === 'outro';
  const spine = isCard
    ? `<div class="spine" style="opacity:${(e.o * 0.9).toFixed(2)}">鹈鹕测试 · PELICAN RIDE · CODEX 实测</div>`
    : '';
  const fig = unit.fig
    ? `<div class="figlabel" style="opacity:${e.o}"><i>${unit.fig}</i><b>PELICAN RIDE · CODEX</b></div>`
    : '';
  return `<div class="folio" style="opacity:${e.o}">${unit.chapter}</div>` + spine + fig;
}

function bandHTML(unit, t) {
  const cue = CUES.find((c) => t >= c.a && c.b > t);
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
  const { w: srcW, h: srcH } = srcPx(unit.shot);
  const m = windowMap(VIEWS[unit.view], dst, camv, srcW, srcH);
  m.sw = srcW; m.sh = srcH;
  const out = [];
  for (const n of unit.notes) {
    const p = clamp((t - unit.a - n.at) / 0.4);
    if (p <= 0) continue;
    const e = easeOutQuint(p);
    const pt = project(n.x, n.y, m, dst);
    if (pt.x < -80 || pt.x > DW + 80 || pt.y < -80 || pt.y > DH + 80) continue;
    const rev = n.dir === 'left';
    const shift = rev ? 'translate(calc(-100% + 7px), -50%)' : 'translate(-7px, -50%)';
    const pulse = 1 + 0.4 * (1 - easeOut(clamp(p * 2.5)));
    out.push(`<div class="note" style="left:${pt.x.toFixed(1)}px;top:${pt.y.toFixed(1)}px;flex-direction:${rev ? 'row-reverse' : 'row'};transform:${shift};opacity:${e}">
      <span class="note-dot" style="transform:scale(${pulse.toFixed(3)})"></span>
      <span class="note-line" style="width:${Math.round(46 * e)}px"></span>
      <span class="note-label">${n.text}</span>
    </div>`);
  }
  return out.join('');
}

function splitHTML(unit, t) {
  const E = (d) => ent(t, unit.a, 0.5, d);
  const label = (plate, side, delay) => {
    const e = E(delay);
    const s = unit[side];
    return `<div class="plate-label" style="left:${plate.x}px;top:${plate.y + plate.h + 26}px;opacity:${e.o};transform:translateY(${e.y}px)">
      <b>${s.label}</b><i>${s.sub}</i>
    </div>`;
  };
  const div = E(0.1);
  return `${label(L.splitL, 'left', 0.16)}${label(L.splitR, 'right', 0.24)}
    <div class="vrule" style="left:${DW / 2}px;top:${L.splitL.y + 16}px;height:${L.splitL.h - 32}px;opacity:${div.o}"></div>`;
}

// --------------------------------------------------------------------------- //
// page templates
// --------------------------------------------------------------------------- //
function trow(k, v, cls = '', e = null) {
  const dots = e
    ? `style="transform:scaleX(${easeOut(e.p).toFixed(3)})"`
    : '';
  return `<div class="trow"><span class="tk">${k}</span><span class="tdots" ${dots}></span><span class="tv ${cls}">${v}</span></div>`;
}

/** 提示词卡（hook）：标题 + 引用卡 + 规格表 + Codex 实录截图（Ken Burns 在 canvas 上） */
function renderHook(unit, t) {
  const E = (d) => ent(t, unit.a, 0.55, d);
  const out = [];
  const k = E(0.14);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.kicker}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.26 + i * 0.12);
    const fs = unit.titleSize ? `font-size:${unit.titleSize}px;` : '';
    out.push(`<div class="display" style="${fs}opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const r = E(0.5);
  out.push(`<div class="rule" style="opacity:${r.o};transform:scaleX(${easeOutQuint(r.p)});transform-origin:left center;width:190px"></div>`);
  if (unit.quote) {
    const q = E(0.62);
    out.push(`<div class="quote" style="opacity:${q.o};transform:translateY(${q.y}px)">${unit.quote}</div>`);
    if (unit.stamp) {
      const s = E(0.85);
      out.push(`<div class="stamp" style="left:930px;top:236px;opacity:${(s.o * 0.94).toFixed(2)}">${unit.stamp}</div>`);
    }
  }
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.68 + i * 0.12);
    out.push(`<div class="prose" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const f = E(0.9);
  out.push(`<div class="foot" style="opacity:${f.o};transform:translateY(${f.y}px);max-width:760px">${unit.footnote ?? ''}</div>`);
  if (unit.agenda) {
    const a = E(1.05);
    out.push(`<div class="agenda" style="opacity:${a.o};transform:translateY(${a.y}px)">
      <div class="agenda-t">${unit.agenda.title}</div>
      ${unit.agenda.items.map((v, i) => `<div class="agenda-r"><span class="agenda-n">0${i + 1}</span><span class="agenda-v">${v}</span></div>`).join('')}
    </div>`);
  }
  const rows = (unit.side?.rows ?? []).map(([k2, v], i) => {
    const e = E(0.6 + i * 0.13);
    const hot = /Sol|高/.test(v) && k2 === '模型' ? ' class="tv hot"' : '';
    return `<div style="opacity:${e.o};transform:translateY(${e.y}px)">${trow(k2, v, hot ? 'hot' : '', e)}</div>`;
  }).join('');
  return `<div class="page cols">
      <div class="main">${out.join('')}</div>
      <div class="rail"><div class="table">${rows}</div></div>
    </div>`;
}

/** 生成清单（statement）：标题 + 编号 facts + 大数字（确定性 count-up） */
function renderStatement(unit, t) {
  const E = (d) => ent(t, unit.a, 0.55, d);
  const out = [];
  const k = E(0.10);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.eyebrow}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.2 + i * 0.13);
    const fs = unit.titleSize ? `font-size:${unit.titleSize}px;` : '';
    out.push(`<div class="display" style="${fs}opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const r = E(0.42);
  out.push(`<div class="rule" style="opacity:${r.o};transform:scaleX(${easeOutQuint(r.p)});transform-origin:left center"></div>`);
  if (unit.facts) {
    const num = unit.factGlyph === 'num';
    out.push(`<div class="facts">${unit.facts.map(([k2, v], i) => {
      const e = E(0.5 + i * 0.15);
      const glyph = num ? `0${i + 1}` : '✓';
      return `<div style="opacity:${e.o};transform:translateY(${e.y}px)"><div class="check${num ? ' num' : ''}"><i>${glyph}</i><span class="check-k">${k2}</span><span class="check-v">${v}</span></div></div>`;
    }).join('')}</div>`);
  }
  let rail = '';
  if (unit.side?.stat) {
    const e = E(0.45);
    const raw = String(unit.side.stat[0]);
    const shown = /^\d+$/.test(raw)
      ? String(Math.round(Number(raw) * easeOut(clamp((t - unit.a - 0.55) / 0.9))))
      : raw;
    rail = `<div style="opacity:${e.o};transform:translateY(${e.y}px)"><div class="stat">${shown}</div><div class="stat-l">${unit.side.stat[1] ?? ''}</div></div>`;
  }
  return `<div class="page cols">
      <div class="main">${out.join('')}</div>
      <div class="rail${unit.side?.stat ? ' narrow' : ''}">${rail}</div>
    </div>`;
}

/** 结论页（墨底，全片唯一明暗转折） */
function renderVerdict(unit, t) {
  const E = (d) => ent(t, unit.a, 0.5, d); // 短页：进场整体前移
  const out = [];
  const k = E(0.08);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.eyebrow}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.16 + i * 0.12);
    const fs = unit.titleSize ? `font-size:${unit.titleSize}px;` : '';
    out.push(`<div class="display" style="${fs}opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const r = E(0.40);
  out.push(`<div class="rule" style="opacity:${r.o};transform:scaleX(${easeOutQuint(r.p)});transform-origin:left center"></div>`);
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.5 + i * 0.12);
    out.push(`<div class="prose" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const rows = (unit.side?.rows ?? []).map(([k2, v], i) => {
    const e = E(0.45 + i * 0.11);
    return `<div style="opacity:${e.o};transform:translateY(${e.y}px)">${trow(k2, v, '', e)}</div>`;
  }).join('');
  return `<div class="page cols">
      <div class="main">${out.join('')}</div>
      <div class="rail${unit.railNarrow ? ' narrow' : ''}"><div class="table">${rows}</div></div>
    </div>`;
}

function renderOutro(unit, t) {
  const E = (d) => ent(t, unit.a, 0.45, d); // 2s 短页：再前移
  const out = [];
  const k = E(0.05);
  out.push(`<div class="kicker" style="opacity:${k.o};transform:translateY(${k.y}px)">${unit.eyebrow ?? ''}</div>`);
  unit.title.forEach((line, i) => {
    const e = E(0.12 + i * 0.1);
    out.push(`<div class="display xl" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const r = E(0.26);
  out.push(`<div class="rule" style="opacity:${r.o};transform:scaleX(${easeOutQuint(r.p)});transform-origin:left center"></div>`);
  (unit.body ?? []).forEach((line, i) => {
    const e = E(0.34 + i * 0.1);
    out.push(`<div class="prose" style="opacity:${e.o};transform:translateY(${e.y}px)">${line}</div>`);
  });
  const stat = unit.side?.stat
    ? `<div style="opacity:${E(0.22).o}"><div class="stat">${unit.side.stat[0]}</div><div class="stat-l">${unit.side.stat[1] ?? ''}</div></div>`
    : '';
  return `<div class="page cols">
      <div class="main">${out.join('')}</div>
      <div class="rail narrow">${stat}</div>
    </div>`;
}

/** 页末引文与署名：overlay 根节点绝对定位（不进 .page，防溢出压字幕带） */
function bottomHTML(unit, t) {
  const out = [];
  if (unit.pull) {
    const e = ent(t, unit.a, 0.5, unit.kind === 'outro' ? 0.4 : 0.5);
    const body = unit.seal ? `<span class="seal">${unit.pull}</span>` : unit.pull;
    out.push(`<div class="pull" style="opacity:${e.o};transform:translateY(${e.y}px)">${body}</div>`);
  }
  if (unit.handle) {
    const e = ent(t, unit.a, 0.5, 0.55);
    out.push(`<div class="handlebar" style="opacity:${e.o};transform:translateY(${e.y}px)">${unit.handle}</div>`);
  }
  return out.join('');
}

/** Codex 截图标签（截图本体在 canvas 上画） */
function snapHTML(unit, t) {
  if (!unit.snap) return '';
  const e = ent(t, unit.a, 0.5, 0.95);
  return `<div class="snaplabel" style="left:${L.snap.x}px;top:${L.snap.y + L.snap.h + 16}px;opacity:${e.o}">${unit.snap.label}</div>`;
}

// --------------------------------------------------------------------------- //
// Codex 截图：Ken Burns（确定性，双端缓动），带投影与 hairline
// --------------------------------------------------------------------------- //
function drawSnap(unit, t) {
  if (!unit.snap || !snapBmp) return;
  const e = ent(t, unit.a, 0.55, 0.78);
  if (e.o <= 0.01) return;
  const dst = L.snap;
  const crop = unit.snap.crop;
  // cover-fit：裁切窗纵横比与 dst 不一致时，窗内居中裁满，不拉伸
  const fullW = snapBmp.width * crop.w;
  const fullH = snapBmp.height * crop.h;
  const dstAspect = dst.w / dst.h;
  let vw = fullW;
  let vh = fullH;
  if (fullW / fullH > dstAspect) vw = fullH * dstAspect;
  else vh = fullW / dstAspect;
  const p = easeInOut(clamp((t - unit.a) / (unit.b - unit.a)));
  const kb = unit.snap.kb ?? {};
  const z = lerp((kb.z ?? [1, 1])[0], (kb.z ?? [1, 1])[1], p);
  const kx = lerp((kb.x ?? [0, 0])[0], (kb.x ?? [0, 0])[1], p);
  const ky = lerp((kb.y ?? [0, 0])[0], (kb.y ?? [0, 0])[1], p);
  vw /= z;
  vh /= z;
  const sx = snapBmp.width * crop.x;
  const sy = snapBmp.height * crop.y;
  const ox = clamp(sx + kx * fullW + (fullW - vw) / 2, 0, snapBmp.width - vw);
  const oy = clamp(sy + ky * fullH + (fullH - vh) / 2, 0, snapBmp.height - vh);

  ctx.save();
  ctx.globalAlpha = e.o;
  ctx.translate(0, e.y);
  ctx.shadowColor = 'rgba(28, 36, 32, 0.22)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#DFDFCF';
  ctx.fillRect(dst.x, dst.y, dst.w, dst.h);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = e.o;
  ctx.drawImage(snapBmp, ox, oy, vw, vh, dst.x, dst.y, dst.w, dst.h);
  ctx.strokeStyle = 'rgba(28, 36, 32, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(dst.x + 0.5, dst.y + 0.5, dst.w - 1, dst.h - 1);
  ctx.restore();
}

// --------------------------------------------------------------------------- //
// draw
// --------------------------------------------------------------------------- //
function neededKeys(unit, t) {
  if (unit.kind === 'clip') return [srcKey(unit, t)];
  if (unit.kind === 'split') return [srcKey(unit.left, t, unit.a), srcKey(unit.right, t, unit.a)];
  return [];
}

function drawFrame(i) {
  const t = i / FPS;
  const unit = unitAt(t);
  const dark = !!unit.dark;
  viewport.classList.toggle('is-dark', dark);

  const cv = easedCam(unit, t);

  ctx.drawImage(dark ? paperDark : paperLight, 0, 0, DW, DH);

  let revealP = 1;
  if (unit.reveal) revealP = easeOutQuint(clamp((t - unit.a) / 0.55));

  if (unit.kind === 'clip') {
    const bmp = CACHE.get(srcKey(unit, t));
    if (bmp) {
      drawPlateRevealed(bmp, VIEWS[unit.view], L.plate, cv, unit.shot, unit.reveal ?? null, revealP);
      platePrint(L.plate, unit, dark);
    }
  } else if (unit.kind === 'split') {
    const bl = CACHE.get(srcKey(unit.left, t, unit.a));
    const br = CACHE.get(srcKey(unit.right, t, unit.a));
    if (bl) drawPlateRevealed(bl, VIEWS[unit.left.view], L.splitL, cv, unit.left.shot, 'wipe-l', revealP);
    if (br) drawPlateRevealed(br, VIEWS[unit.right.view], L.splitR, cv, unit.right.shot, 'wipe-r', revealP);
    if (bl || br) { platePrint(L.splitL, unit, dark); platePrint(L.splitR, unit, dark); }
  }
  if (unit.snap) drawSnap(unit, t);

  if (t > VIDEO_END - 1.0) {
    ctx.fillStyle = `rgba(28, 36, 32, ${clamp((t - (VIDEO_END - 1.0)) / 1.0)})`;
    ctx.fillRect(0, 0, DW, DH);
  }

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
  overlay.innerHTML = headHTML(t) + folioHTML(unit, t) + body + bottomHTML(unit, t) + snapHTML(unit, t) + bandHTML(unit, t);
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
  try {
    const res = await fetch('../' + (UNITS.find((u) => u.snap)?.snap.img ?? 'capture/assets/codex-session.png'));
    if (res.ok) snapBmp = await createImageBitmap(await res.blob(), { colorSpaceConversion: 'none' });
  } catch (e) { missing.push('codex-session.png: ' + e.message); }
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
    snap: snapBmp ? 'ok' : 'missing',
  };
};

window.__debug = () => ({ missing: missing.slice(0, 20), missingCount: missing.length, cached: [...CACHE.keys()] });

// --------------------------------------------------------------------------- //
// cover / thumbnail
//
// 封面全家福（上集工单留的待办：一次出齐三端封面）：
//   wide = 1920x1080（B 站直用；关键内容收中心 1440，4:3 裁切安全）
//   v43  = 同 wide 构图 → 事后居中裁 1440x1080（抖音横）
//   v34  = 竖版海报：文字收中心 810x1080 → 事后裁并放大 1080x1440（抖音竖 / 小红书）
// --------------------------------------------------------------------------- //
window.__cover = async (opts = {}) => {
  const shot = opts.shot ?? 'scene-main';
  const src = Number(opts.src ?? 6.6);
  const view = opts.view && VIEWS[opts.view] ? VIEWS[opts.view] : (opts.view ?? { cx: 0.467, cy: 0.5, w: 0.62, h: 0.62 });
  const key = `${shot}#${Math.round(src * FPS)}`;
  await ensure([key]);
  const bmp = CACHE.get(key);

  viewport.classList.remove('is-dark');
  ctx.drawImage(paperLight, 0, 0, DW, DH);
  if (bmp) {
    const dst = { x: 0, y: 0, w: DW, h: DH };
    const { w: srcW, h: srcH } = srcPx(shot);
    const m = windowMap(view, dst, { z: Number(opts.zoom ?? 1.05), x: 0, y: 0 }, srcW, srcH);
    ctx.drawImage(bmp, m.ox, m.oy, m.cw, m.ch, dst.x, dst.y, dst.w, dst.h);
  }

  // 底部压暗，让居中标题在任意一帧上都立得住
  const g = ctx.createLinearGradient(0, DH * 0.40, 0, DH);
  g.addColorStop(0, 'rgba(16, 22, 19, 0)');
  g.addColorStop(0.40, 'rgba(16, 22, 19, 0.62)');
  g.addColorStop(0.74, 'rgba(16, 22, 19, 0.92)');
  g.addColorStop(1, 'rgba(16, 22, 19, 0.97)');
  ctx.fillStyle = g;
  ctx.fillRect(0, DH * 0.40, DW, DH * 0.60);

  const narrow = opts.mode === 'v34';
  const title = String(opts.title ?? '').replace('|', '\n');
  overlay.innerHTML = `
    <div class="cover-center${narrow ? ' narrow' : ''}">
      <div class="cover-kicker">${opts.kicker ?? ''}</div>
      <div class="cover-title">${title}</div>
      <div class="cover-rule"></div>
      <div class="cover-hot">${opts.hot ?? ''}</div>
    </div>`;
  return { ok: true, shot, src, mode: opts.mode ?? 'wide', missing: missing.length };
};

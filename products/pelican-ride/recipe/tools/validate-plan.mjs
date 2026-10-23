// Validate the cut before spending time rendering it.
//
//   node tools/validate-plan.mjs
//
// Checks: unit coverage and contiguity, alignment with the music's section grid,
// every source read stays inside the captured clip (and inside the chunk-safe
// ranges), views stay in frame, and every subtitle is readable and lands inside a
// single shot.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const src = readFileSync(join(ROOT, 'edit', 'timeline.js'), 'utf8');
const plan = new Function(`${src}; return { FPS, VIDEO_END, VIEWS, UNITS, CUES };`)();
const { FPS, VIDEO_END, VIEWS, UNITS, CUES } = plan;

const sections = JSON.parse(readFileSync(join(ROOT, 'edit', 'sections.json'), 'utf8'));
const framesIndexPath = join(ROOT, 'frames', 'index.json');
const haveCapture = existsSync(framesIndexPath);
const shots = haveCapture ? JSON.parse(readFileSync(framesIndexPath, 'utf8')).shots : [];
const byId = Object.fromEntries(shots.map((s) => [s.id, s]));

const errors = [];
const warnings = [];
const notes = [];

// ---- 1. coverage -------------------------------------------------------- //
let cursor = 0;
for (const u of UNITS) {
  if (Math.abs(u.a - cursor) > 1e-6) {
    if (u.a > cursor + 1e-6) errors.push(`gap: ${cursor.toFixed(2)}s -> ${u.a.toFixed(2)}s before unit ${u.id}`);
    else errors.push(`overlap at unit ${u.id} (${u.a} < ${cursor})`);
  }
  if (u.b <= u.a) errors.push(`unit ${u.id} has non-positive duration`);
  cursor = u.b;
}
if (Math.abs(cursor - VIDEO_END) > 1e-6) errors.push(`units end at ${cursor}s but VIDEO_END is ${VIDEO_END}s`);

// ---- 2. section grid ---------------------------------------------------- //
for (const s of sections.sections) {
  const u = UNITS.find((x) => Math.abs(x.a - s.start) < 1e-6);
  if (!u) errors.push(`section "${s.id}" starts at ${s.start}s but no unit starts there`);
  else notes.push(`section ${s.id} @${s.start}s -> unit ${u.id}`);
}

// ---- 3. views in frame -------------------------------------------------- //
for (const [name, v] of Object.entries(VIEWS)) {
  if (v.cx - v.w / 2 < -1e-6 || v.cx + v.w / 2 > 1 + 1e-6) errors.push(`view ${name} leaves the frame horizontally`);
  if (v.cy - v.h / 2 < -1e-6 || v.cy + v.h / 2 > 1 + 1e-6) errors.push(`view ${name} leaves the frame vertically`);
  if (v.w > 1 || v.h > 1) errors.push(`view ${name} is larger than the source`);
  if (Math.abs(v.w - v.h) > 1e-6) warnings.push(`view ${name} is not 16:9 (w=${v.w} h=${v.h}) — will be cover-cropped`);
}

// ---- 4. source reads stay inside the captures --------------------------- //
const inRange = (shotId, a, b) => {
  const s = byId[shotId];
  if (!s) return `shot "${shotId}" was never captured`;
  const maxT = (s.frames - 1) / FPS;
  if (a < -1e-6) return `reads ${shotId} at ${a.toFixed(2)}s, before the clip starts`;
  if (b > maxT + 1e-6) return `reads ${shotId} up to ${b.toFixed(2)}s but the clip ends at ${maxT.toFixed(2)}s`;
  // merge touching windows: a guarded gap is what matters, not the chunk bookkeeping
  const usable = (s.usableRanges ?? [[0, maxT]])
    .slice()
    .sort((x, y) => x[0] - y[0])
    .reduce((acc, r) => {
      const last = acc[acc.length - 1];
      if (last && r[0] - last[1] < 1 / FPS) last[1] = Math.max(last[1], r[1]);
      else acc.push([r[0], r[1]]);
      return acc;
    }, []);
  for (const [ua, ub] of usable) {
    if (a >= ua - 1e-6 && b <= ub + 1e-6) return null;
  }
  return `reads ${shotId} ${a.toFixed(2)}-${b.toFixed(2)}s, which crosses a chunk boundary guarded range ${JSON.stringify(usable)}`;
};

const used = new Map();
const checkSource = (item, unit, label) => {
  const span = (unit.b - unit.a) * (item.speed ?? 1);
  const a = item.src;
  const b = item.src + span + 1 / FPS;
  const err = inRange(item.shot, a, b);
  if (err) errors.push(`${unit.id}${label}: ${err}`);
  used.set(item.shot, (used.get(item.shot) ?? 0) + (unit.b - unit.a));
};

for (const u of UNITS) {
  if (u.kind === 'clip') {
    checkSource(u, u, '');
    if (!VIEWS[u.view]) errors.push(`${u.id}: unknown view "${u.view}"`);
  } else if (u.kind === 'split') {
    checkSource(u.left, u, '.left');
    checkSource(u.right, u, '.right');
    for (const side of ['left', 'right']) if (!VIEWS[u[side].view]) errors.push(`${u.id}.${side}: unknown view "${u[side].view}"`);
  }
  // annotations must point at something the shot actually shows
  for (const n of u.notes ?? []) {
    const v = VIEWS[u.view];
    if (!v) continue;
    const dx = Math.abs(n.x - v.cx) / (v.w / 2);
    const dy = Math.abs(n.y - v.cy) / (v.h / 2);
    if (dx > 1 || dy > 1) {
      errors.push(`${u.id}: annotation "${n.text}" is anchored at ${n.x},${n.y} which view ${u.view} does not show (dx=${dx.toFixed(2)} dy=${dy.toFixed(2)} of half-view)`);
    } else if (dx > 0.86 || dy > 0.86) {
      warnings.push(`${u.id}: annotation "${n.text}" sits near the edge of view ${u.view}`);
    }
  }
}

// ---- 5. subtitles ------------------------------------------------------- //
const CPS = 7.0; // comfortable Chinese reading speed, characters per second
const sorted = [...CUES].sort((x, y) => x.a - y.a);
for (let i = 0; i < sorted.length; i++) {
  const c = sorted[i];
  if (c.a < 0 || c.b > VIDEO_END + 1e-6) errors.push(`cue "${c.text}" is outside the video`);
  if (c.b <= c.a) errors.push(`cue "${c.text}" has non-positive duration`);
  const need = c.text.length / CPS;
  const have = c.b - c.a;
  if (need > have + 1e-6) warnings.push(`cue "${c.text}" needs ${need.toFixed(2)}s at ${CPS} cps but has ${have.toFixed(2)}s`);
  const ua = UNITS.find((u) => c.a >= u.a && c.a < u.b);
  const ub = UNITS.find((u) => c.b - 1e-6 >= u.a && c.b - 1e-6 < u.b);
  if (ua && ub && ua.id !== ub.id) warnings.push(`cue "${c.text}" straddles the cut ${ua.id} -> ${ub.id}`);
  if (i + 1 < sorted.length && sorted[i + 1].a < c.b - 1e-6) errors.push(`cue "${c.text}" overlaps "${sorted[i + 1].text}"`);
}
const gap = VIDEO_END - sorted[sorted.length - 1].b;
if (gap > 1.2) warnings.push(`${gap.toFixed(2)}s at the end has no subtitle`);

// ---- 6. no sentence appears twice on screen at once ---------------------- //
// The house rule (motion grammar F4): when the picture already says something in
// large type, the subtitle must yield rather than repeat it.
const scrub = (s) => String(s).replace(/[\s·，。、：:;；/|—\-–—()（）「」【】"'"']/g, '');
function longestCommonRun(a, b) {
  const A = scrub(a);
  const B = scrub(b);
  let best = 0;
  const dp = new Array(B.length + 1).fill(0);
  for (let i = 1; i <= A.length; i++) {
    let prev = 0;
    for (let j = 1; j <= B.length; j++) {
      const tmp = dp[j];
      dp[j] = A[i - 1] === B[j - 1] ? prev + 1 : 0;
      if (dp[j] > best) best = dp[j];
      prev = tmp;
    }
  }
  return best;
}
function screenStrings(u) {
  const out = [u.label, u.chapter, u.meta, u.eyebrow, u.sub, u.footnote, u.kicker, u.handle, u.pull, ...(u.title ?? []), ...(u.body ?? [])];
  if (u.agenda) out.push(u.agenda.title, ...u.agenda.items);
  for (const th of u.thumbs ?? []) out.push(th.label);
  for (const n of u.notes ?? []) out.push(n.text);
  for (const f of u.facts ?? []) out.push(f[0], f[1]);
  for (const r of u.side?.rows ?? []) out.push(r[0], r[1]);
  for (const s of u.side?.stat ?? []) out.push(s);
  for (const k of ['left', 'right']) {
    if (u[k]) out.push(u[k].label, u[k].sub);
  }
  return out.filter(Boolean);
}
const MIN_RUN = 4; // consecutive characters that count as "the same sentence"
for (const c of sorted) {
  const u = UNITS.find((x) => c.a >= x.a && c.a < x.b);
  if (!u) continue;
  for (const s of screenStrings(u)) {
    const run = longestCommonRun(c.text, s);
    if (run >= MIN_RUN) {
      warnings.push(`cue "${c.text}" repeats ${run} characters of on-screen text "${s}" (unit ${u.id})`);
    }
  }
}

// ---- report ------------------------------------------------------------- //
console.log(`plan: ${UNITS.length} units, ${CUES.length} cues, ${VIDEO_END}s @ ${FPS}fps = ${Math.round(VIDEO_END * FPS)} frames`);
if (haveCapture) {
  console.log('\nsource usage (unique seconds of each clip actually used):');
  for (const s of shots) {
    const u = used.get(s.id) ?? 0;
    const pct = ((u / (s.frames / FPS)) * 100).toFixed(0);
    console.log(`  ${s.id.padEnd(9)} ${s.frames.toString().padStart(4)} frames  used ${u.toFixed(1).padStart(5)}s (${pct}%)`);
  }
  const unused = shots.filter((s) => !used.has(s.id)).map((s) => s.id);
  if (unused.length) warnings.push(`captured but unused: ${unused.join(', ')}`);
} else {
  warnings.push('frames/index.json not found — capture may not be finished; source ranges were not verified');
}
if (warnings.length) {
  console.log('\nwarnings:');
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log('\nERRORS:');
  for (const e of errors) console.log(`  x ${e}`);
  process.exit(1);
}
console.log('\nOK  plan is consistent');
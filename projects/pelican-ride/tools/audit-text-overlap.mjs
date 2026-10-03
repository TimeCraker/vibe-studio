// Show the overlap between every subtitle and the on-screen text of its unit, so
// the de-duplication threshold in validate-plan.mjs is chosen from data rather
// than guessed.
//
//   node tools/audit-text-overlap.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(ROOT, 'edit', 'timeline.js'), 'utf8');
const { UNITS, CUES } = new Function(`${src}; return { UNITS, CUES };`)();

const scrub = (s) => String(s).replace(/[\s·，。、：:;；/|—\-–—()（）「」【】"'"']/g, '');
function lcs(a, b) {
  const A = scrub(a), B = scrub(b);
  let best = 0, bi = 0, bj = 0;
  const dp = new Array(B.length + 1).fill(0);
  for (let i = 1; i <= A.length; i++) {
    let prev = 0;
    for (let j = 1; j <= B.length; j++) {
      const tmp = dp[j];
      dp[j] = A[i - 1] === B[j - 1] ? prev + 1 : 0;
      if (dp[j] > best) { best = dp[j]; bi = i; bj = j; }
      prev = tmp;
    }
  }
  return { run: best, text: A.slice(bi - best, bi) };
}

function screenStrings(u) {
  const out = [['chapter', u.chapter], ['meta', u.meta], ['eyebrow', u.eyebrow], ['sub', u.sub],
    ['footnote', u.footnote], ['kicker', u.kicker], ['handle', u.handle]];
  (u.title ?? []).forEach((t) => out.push(['title', t]));
  (u.body ?? []).forEach((t) => out.push(['body', t]));
  (u.notes ?? []).forEach((n) => out.push(['note', n.text]));
  (u.facts ?? []).forEach((f) => out.push(['fact', f[0] + ' ' + f[1]]));
  (u.side?.rows ?? []).forEach((r) => out.push(['side', r[0] + ' ' + r[1]]));
  (u.side?.stat ?? []).forEach((s) => out.push(['stat', s]));
  for (const k of ['left', 'right']) if (u[k]) out.push([k, u[k].label + ' ' + u[k].sub]);
  return out.filter(([, v]) => v);
}

const rows = [];
for (const c of CUES) {
  const u = UNITS.find((x) => c.a >= x.a && c.a < x.b);
  if (!u) continue;
  for (const [where, s] of screenStrings(u)) {
    const { run, text } = lcs(c.text, s);
    if (run >= 2) rows.push({ cue: c.text, where, onScreen: s, run, shared: text, unit: u.id });
  }
}
rows.sort((a, b) => b.run - a.run);
console.log('overlaps between subtitle and on-screen text (>= 2 consecutive chars):\n');
console.log(`${'run'.padStart(3)}  ${'unit'.padEnd(14)}${'where'.padEnd(9)}shared        subtitle`);
for (const r of rows) {
  console.log(`${String(r.run).padStart(3)}  ${r.unit.padEnd(14)}${r.where.padEnd(9)}${r.shared.padEnd(14)}${r.cue}`);
}
const hist = {};
for (const r of rows) hist[r.run] = (hist[r.run] ?? 0) + 1;
console.log('\nhistogram:', JSON.stringify(hist));
console.log(`worst run: ${rows.length ? rows[0].run : 0}`);
console.log('\nAnything at run >= 4 is effectively the same phrase said twice.');
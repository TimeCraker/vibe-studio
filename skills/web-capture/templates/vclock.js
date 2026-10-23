// Injected before any page script runs. Replaces wall clock, timers and Math.random
// with virtual, deterministic equivalents so the animation can be advanced
// frame-by-frame and captured as an exact frame sequence.
//
// Determinism guarantees:
//   * performance.now() / Date.now() read from a virtual clock
//   * setTimeout / setInterval are virtual timers fired during the frame flush
//   * Math.random is seeded per frame. Stateful pages additionally need replay
//     from frame zero (capture-clip default), or an explicit pure seek adapter.
// CSS/WAAPI, media playback, workers, network and crypto RNG are outside this clock.
(() => {
  const state = { t: 0 };
  const rafQueue = [];
  let rafSeq = 0;
  const cancelledRaf = new Set();
  let timerSeq = 0;
  let timers = [];

  // ---- deterministic PRNG (mulberry32) -------------------------------------
  let seed = 0x9e3779b9;
  function reseed(ms) {
    // Fold the frame time into a 32-bit seed so frame N always draws the same numbers.
    const q = Math.round(ms * 1000);
    seed = (0x9e3779b9 ^ (q >>> 0) ^ Math.imul(q, 0x85ebca6b)) >>> 0;
  }
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // ---- virtual clock -------------------------------------------------------
  try { Object.defineProperty(performance, 'now', { value: () => state.t, writable: true, configurable: true }); }
  catch { performance.now = () => state.t; }
  try { Object.defineProperty(performance, 'timeOrigin', { value: 0, configurable: true }); } catch { /* ignore */ }

  const REAL_EPOCH = 1767225600000; // 2026-01-01T00:00:00Z
  const RealDate = Date;
  class VirtualDate extends RealDate {
    constructor(...args) { if (args.length === 0) super(REAL_EPOCH + state.t); else super(...args); }
    static now() { return REAL_EPOCH + state.t; }
  }
  window.Date = VirtualDate;

  // ---- virtual rAF ---------------------------------------------------------
  window.requestAnimationFrame = (cb) => { const id = ++rafSeq; rafQueue.push({ id, cb }); return id; };
  window.cancelAnimationFrame = (id) => { cancelledRaf.add(id); const i = rafQueue.findIndex((q) => q.id === id); if (i >= 0) rafQueue.splice(i, 1); };

  // ---- virtual timers ------------------------------------------------------
  const realSetTimeout = window.setTimeout.bind(window);
  window.setTimeout = (cb, ms = 0, ...args) => {
    const id = ++timerSeq;
    timers.push({ id, due: state.t + Math.max(0, Number(ms) || 0), cb, args, interval: null });
    return id;
  };
  window.setInterval = (cb, ms = 0, ...args) => {
    const id = ++timerSeq;
    const period = Math.max(1, Number(ms) || 1);
    timers.push({ id, due: state.t + period, cb, args, interval: period });
    return id;
  };
  window.clearTimeout = (id) => { timers = timers.filter((t) => t.id !== id); };
  window.clearInterval = window.clearTimeout;

  // Keep a real escape hatch for the harness itself (not used by page code).
  window.__realSetTimeout = realSetTimeout;

  const MAX_PASSES = 12;
  function runDueTimers(now) {
    let firedAny = false;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      const due = timers.filter((t) => t.due <= now).sort((a, b) => a.due - b.due || a.id - b.id);
      if (!due.length) return firedAny;
      firedAny = true;
      for (const t of due) {
        if (!timers.some((x) => x.id === t.id)) continue;
        if (t.interval) t.due += t.interval;
        else timers = timers.filter((x) => x.id !== t.id);
        if (typeof t.cb !== 'function') throw new Error('vclock requires function timer callbacks');
        t.cb(...t.args);
      }
    }
    return firedAny;
  }

  function runFrames(now) {
    // Take one snapshot. Callbacks scheduled by this batch belong to NEXT frame.
    const batch = rafQueue.splice(0, rafQueue.length);
    for (const { id, cb } of batch) {
      if (cancelledRaf.delete(id)) continue;
      cb(now);
    }
  }

  function flush(now) {
    if (!Number.isFinite(now) || now < state.t) throw new Error('vclock time must be finite and monotonic; reload to replay');
    state.t = now;
    reseed(now);
    runDueTimers(now);
    runFrames(now);
    // Timers scheduled by rAF work for this same frame.
    runDueTimers(now);
  }

  window.__vclock = {
    reset() { state.t = 0; rafQueue.length = 0; cancelledRaf.clear(); timers = []; timerSeq = 0; rafSeq = 0; reseed(0); },
    /** Set action scheduling time without executing another rAF batch. */
    setTime(ms) { if (!Number.isFinite(ms) || ms < state.t) throw new Error('vclock time must be monotonic'); state.t = ms; reseed(ms); },
    now() { return state.t; },
    /** Advance to an absolute virtual time (ms) and run exactly one frame. */
    stepTo(ms) { flush(ms); },
    stepBy(dtMs) { flush(state.t + dtMs); },
    /** Run one frame at the current time without advancing. */
    tick() { flush(state.t); },
    pendingRaf() { return rafQueue.length; },
    pendingTimers() { return timers.length; },
  };
})();

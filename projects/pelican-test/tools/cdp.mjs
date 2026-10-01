// Minimal zero-dependency Chrome DevTools Protocol client.
// Node >= 22 provides global WebSocket + fetch, so no npm install is required.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.sessionId = null;
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(`${msg.error.message} ${JSON.stringify(msg.error.data ?? '')}`));
        else resolve(msg.result);
        return;
      }
      if (msg.method) {
        const fn = this.handlers.get(msg.method);
        if (fn) fn(msg.params, msg.sessionId);
      }
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', () => resolve(), { once: true });
      ws.addEventListener('error', (e) => reject(new Error(`ws connect failed: ${e.message ?? e.type}`)), { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}, sessionId = this.sessionId) {
    const id = ++this.seq;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  on(method, fn) { this.handlers.set(method, fn); }

  /** Evaluate an expression in the page, returning the JSON value. Throws on page exception. */
  async eval(expression, { awaitPromise = false } = {}) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise,
    });
    if (r.exceptionDetails) {
      throw new Error(`page exception: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    }
    return r.result.value;
  }

  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

export async function launchChrome({
  port = 9333,
  chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  userDataDir,
  extraArgs = [],
  noFlush = false,
  onStderr,
} = {}) {
  const dir = userDataDir ?? mkdtempSync(join(tmpdir(), 'cdp-profile-'));
  const args = [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-sync',
    '--hide-scrollbars',
    '--mute-audio',
    '--force-color-profile=srgb',
    '--disable-lcd-text',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--allow-file-access-from-files',
    ...(noFlush ? [] : ['--run-all-compositor-stages-before-draw']),
    '--force-device-scale-factor=1',
    ...extraArgs,
    'about:blank',
  ];
  const proc = spawn(chromePath, args, { stdio: ['ignore', 'ignore', onStderr ? 'pipe' : 'ignore'] });
  if (onStderr) proc.stderr.on('data', (d) => onStderr(String(d)));

  let version = null;
  for (let i = 0; i < 200; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) { version = await res.json(); break; }
    } catch { /* not up yet */ }
    await sleep(100);
  }
  if (!version) {
    proc.kill();
    throw new Error('Chrome did not expose a DevTools endpoint in time');
  }

  const cdp = await Cdp.connect(version.webSocketDebuggerUrl);
  return {
    cdp,
    proc,
    version,
    port,
    kill() { cdp.close(); try { proc.kill(); } catch { /* ignore */ } },
  };
}

/** Create a page target, attach a flat session, and enable the domains we use. */
export async function openPage(cdp, { width, height, deviceScaleFactor = 1 }) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  cdp.sessionId = sessionId;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor, mobile: false,
  });
  return { targetId, sessionId };
}

/** Register a script that runs before any page script, on every navigation. */
export async function addInitScript(cdp, source) {
  const r = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source });
  return r.identifier;
}

/** Navigate and resolve once the page reports it finished loading. */
export function navigate(cdp, url, { timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cdp.handlers.delete('Page.loadEventFired'); reject(new Error(`navigation timeout: ${url}`)); }, timeout);
    cdp.on('Page.loadEventFired', () => {
      clearTimeout(timer);
      cdp.handlers.delete('Page.loadEventFired');
      resolve();
    });
    cdp.send('Page.navigate', { url }).catch((e) => { clearTimeout(timer); reject(e); });
  });
}

export async function capturePng(cdp, { optimizeForSpeed = false, clip } = {}) {
  const params = { format: 'png', fromSurface: true, captureBeyondViewport: false };
  if (optimizeForSpeed) params.optimizeForSpeed = true;
  if (clip) params.clip = clip;
  const { data } = await cdp.send('Page.captureScreenshot', params);
  return Buffer.from(data, 'base64');
}

export { sleep };
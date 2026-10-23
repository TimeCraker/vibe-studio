// Publish-local CDP lifecycle; boolean awaitPromise keeps the existing API.
export class Cdp {
  constructor(ws, { timeoutMs = 30000 } = {}) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.sessionId = null;
    this.timeoutMs = timeoutMs;
    this.closed = false;
    const disconnect = (reason) => {
      this.closed = true;
      for (const { reject, timer } of this.pending.values()) { clearTimeout(timer); reject(new Error(reason)); }
      this.pending.clear();
      this.handlers.get('disconnected')?.({ reason });
    };
    ws.addEventListener('close', () => disconnect('CDP disconnected'));
    ws.addEventListener('error', () => disconnect('CDP socket error'));
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject, timer } = this.pending.get(msg.id);
        clearTimeout(timer);
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

  static async connect(url, options = {}) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { ws.close(); reject(new Error('CDP connection timeout')); }, options.timeoutMs ?? 30000);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener('error', (e) => { clearTimeout(timer); reject(new Error(`ws connect failed: ${e.message ?? e.type}`)); }, { once: true });
      ws.addEventListener('close', () => { clearTimeout(timer); reject(new Error('CDP closed before connection')); }, { once: true });
    });
    return new Cdp(ws, options);
  }

  send(method, params = {}, sessionId = this.sessionId) {
    if (this.closed) return Promise.reject(new Error('CDP is closed'));
    const id = ++this.seq;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try { this.ws.send(JSON.stringify(payload)); }
      catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
    });
  }

  on(method, fn) { this.handlers.set(method, fn); }

  /** Evaluate an expression in the page, returning the JSON value. Throws on page exception. */
  async eval(expression, awaitPromise = false) {
    const r = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise,
    });
    if (r.exceptionDetails) {
      throw new Error(`page exception: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    }
    return r.result.value;
  }

  close() {
    this.closed = true;
    for (const { reject, timer } of this.pending.values()) { clearTimeout(timer); reject(new Error('CDP closed')); }
    this.pending.clear();
    try { this.ws.close(); } catch { /* ignore */ }
  }
}


// probe-publish-btn.js — 找「立即投稿」的真实元素与可点击性
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('member.bilibili.com'));
  await page.bringToFront();
  const info = await page.evaluate(() => {
    const els = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.innerText || '').trim() === '立即投稿');
    return els.map(e => {
      const r = e.getBoundingClientRect();
      const parents = [];
      let p = e.parentElement;
      for (let i = 0; i < 3 && p; i++) { parents.push(p.tagName + '.' + (p.className || '').toString().slice(0, 40)); p = p.parentElement; }
      return { tag: e.tagName, cls: (e.className || '').toString().slice(0, 60), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, parents };
    });
  });
  console.log(JSON.stringify(info, null, 1));
  const frames = page.frames().map(f => f.url().slice(0, 80));
  console.log('frames:', JSON.stringify(frames, null, 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });

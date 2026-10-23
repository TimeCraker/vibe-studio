// dy-probe.js — 探明抖音上传页真实 DOM（带超时与重试）
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find(p => p.url().includes('creator.douyin.com'));
  if (!page) { console.log(JSON.stringify({ err: 'no douyin page', pages: ctx.pages().map(p => p.url().slice(0, 60)) })); process.exit(1); }
  await page.bringToFront();
  if (!page.url().includes('content/upload')) {
    await page.goto('https://creator.douyin.com/creator-micro/content/upload', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);
  }
  console.log('url:', page.url().slice(0, 90));
  const info = await page.evaluate(() => ({
    title: document.title,
    fileInputs: [...document.querySelectorAll('input[type=file]')].map((i, n) => ({ n, accept: (i.accept || '').slice(0, 40) })),
    buttons: [...document.querySelectorAll('button')].map(b => (b.innerText || '').trim()).filter(Boolean).slice(0, 10),
    textInputs: [...document.querySelectorAll('input:not([type=file])')].map(i => ({ ph: i.placeholder, cls: (i.className || '').slice(0, 40) })).slice(0, 8),
    editors: [...document.querySelectorAll('[contenteditable="true"]')].map(e => ({ cls: (e.className || '').slice(0, 60), ph: e.getAttribute('data-placeholder') || '' })),
    bodyHead: document.body.innerText.replace(/\s+/g, ' ').slice(0, 180),
  }));
  console.log('INFO:' + JSON.stringify(info));
}
const timeout = setTimeout(() => { console.error('GLOBAL-TIMEOUT 40s'); process.exit(2); }, 40000);
main().then(() => { clearTimeout(timeout); process.exit(0); }).catch(e => { clearTimeout(timeout); console.error('ERR', e.message.slice(0, 200)); process.exit(1); });

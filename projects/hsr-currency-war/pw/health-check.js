// health-check.js — 5 秒超时探测投稿页 tab 是否卡死
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('member.bilibili.com'));
  if (!page) { console.log('NO PAGE'); process.exit(0); }
  console.log('url:', page.url().slice(0, 90));
  try {
    const r = await Promise.race([
      page.evaluate(() => 1 + 1),
      new Promise((_, rej) => setTimeout(() => rej(new Error('evaluate 5s 超时')), 5000)),
    ]);
    console.log('evaluate OK:', r);
  } catch (e) { console.log('HUNG:', e.message); process.exit(2); }
})().catch(e => { console.error('ERR', e.message.slice(0, 120)); process.exit(1); });

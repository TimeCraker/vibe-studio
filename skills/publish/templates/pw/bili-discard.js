// bili-discard.js — 丢弃投稿页恢复出的旧草稿（上次未提交的本地草稿条），回到干净上传区并截图确认
const { loadPlaywright, qaPath, race } = require('./util');

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => p.url().includes('member.bilibili.com'));
  if (!page) throw new Error('没找到投稿页');
  page.setDefaultTimeout(10000);

  await race(page.locator('text=不用了').first().click({ timeout: 8000 }), 12000, 'click 不用了');
  await page.waitForTimeout(1500);
  const gone = await race(page.evaluate(() => !/未提交的视频/.test(document.body.innerText)), 8000, 'verify discard');
  console.log('旧草稿已丢弃:', gone);
  await page.screenshot({ path: qaPath('pw-bili-discarded.png'), fullPage: false });
  console.log('DONE');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });

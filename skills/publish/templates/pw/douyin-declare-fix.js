// douyin-declare-fix.js — 修复抖音「对作品内容添加声明」弹窗：选中 内容由AI生成 → 确定 → 验证关闭。
const { loadPlaywright, qaPath, race } = require('./util');

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => p.url().includes('creator.douyin.com'));
  if (!page) throw new Error('没找到抖音页面');
  page.setDefaultTimeout(15000);

  // 弹窗可能在也可能不在：先探测
  const modalVisible = await race(page.evaluate(() => /请选择声明类型/.test(document.body.innerText)), 8000, 'probe modal');
  console.log('声明弹窗可见:', modalVisible);
  if (modalVisible) {
    // 点「内容由AI生成」所在行（行内任意位置，radio 会联动）
    const row = page.locator('div', { hasText: /^内容由AI生成/ }).last();
    await row.click({ timeout: 8000 });
    await page.waitForTimeout(800);
    // 确认选中：radio 变化不好读，直接点「确定」
    await page.locator('button', { hasText: '确定' }).first().click({ timeout: 8000 });
    await page.waitForTimeout(1200);
  }

  const ok = await race(page.evaluate(() => {
    const modalOpen = /请选择声明类型/.test(document.body.innerText);
    const declared = /内容由AI生成/.test(document.body.innerText);
    return { modalOpen, declared };
  }), 8000, 'verify declare');
  console.log('验证:', JSON.stringify(ok));
  if (ok.modalOpen) { console.log('!! 弹窗还开着，再跑一次本脚本'); process.exit(2); }
  if (!ok.declared) { console.log('!! 页面上没找到「内容由AI生成」字样，人工确认一下'); process.exit(3); }
  console.log('DONE — 声明已生效');
  await page.screenshot({ path: qaPath('pw-douyin-fixed.png'), fullPage: false });
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });

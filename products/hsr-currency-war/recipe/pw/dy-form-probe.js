// dy-form-probe.js — 探明抖音发布表单字段
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('creator.douyin.com'));
  await page.bringToFront();
  const info = await page.evaluate(() => ({
    titleInputs: [...document.querySelectorAll('input')].filter(i => (i.placeholder || '').includes('标题')).map(i => ({ ph: i.placeholder, cls: (i.className || '').slice(0, 40) })),
    editors: [...document.querySelectorAll('[contenteditable="true"]')].map(e => ({ cls: (e.className || '').slice(0, 70), ph: e.getAttribute('data-placeholder') || '' })),
    declareHint: /内容由AI生成/.test(document.body.innerText),
    buttons: [...document.querySelectorAll('button')].map(b => (b.innerText || '').trim()).filter(Boolean).slice(0, 12),
    coverHint: /上传封面|封面/.test(document.body.innerText),
  }));
  console.log('INFO:' + JSON.stringify(info, null, 1));
}
const timeout = setTimeout(() => { console.error('GLOBAL-TIMEOUT 30s'); process.exit(2); }, 30000);
main().then(() => { clearTimeout(timeout); process.exit(0); }).catch(e => { clearTimeout(timeout); console.error('ERR', e.message.slice(0, 150)); process.exit(1); });

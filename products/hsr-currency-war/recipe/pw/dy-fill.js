// dy-fill.js — 抖音发布表单：标题 + 正文 + 话题 + 声明 + 自查 + 发布
const { chromium } = require('playwright');
const fs = require('fs');

const ARGS = process.argv.slice(2);
const DO_PUBLISH = !ARGS.includes('--dry');
const spec = JSON.parse(fs.readFileSync(ARGS.find(a => !a.startsWith('--')) ?? '../douyin-form.json', 'utf8'));
const NAMES = ((ARGS.find(a => a.startsWith('--names=')) ?? '--names=AI剪辑,崩坏星穹铁道,货币战争,银狼,昔涟').replace('--names=', '')).split(',').map(s => s.trim()).filter(Boolean);

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('creator.douyin.com'));
  if (!page) throw new Error('没找到抖音页');
  await page.bringToFront();
  if (!page.url().includes('/content/post/video')) throw new Error('不在发布表单页: ' + page.url());

  // 1) 标题
  const title = page.locator('input[placeholder*="填写作品标题"]').first();
  await title.click();
  await title.fill(spec.title);
  console.log('标题 =', spec.title);

  // 2) 正文（editor-kit：聚焦后逐段输入）
  const editor = page.locator('.zone-container.editor-kit-container').first();
  await editor.click();
  for (let i = 0; i < spec.description.length; i++) {
    if (i > 0) await page.keyboard.press('Enter');
    await page.keyboard.insertText(spec.description[i]);
    await page.waitForTimeout(300);
  }
  console.log('正文已输入', spec.description.length, '段');

  // 3) 话题：走联想弹层点第一项；联想不到就删掉，不留假话题
  for (const name of NAMES) {
    await editor.click();
    await page.waitForTimeout(200);
    await page.keyboard.insertText('#' + name);
    let picked = null;
    for (let i = 0; i < 16 && !picked; i++) {
      await page.waitForTimeout(180);
      picked = await page.evaluate(() => {
        const m = document.querySelector('.mention-suggest-mount-dom');
        if (!m) return null;
        const items = [...m.querySelectorAll('*')].filter(e => {
          const r = e.getBoundingClientRect();
          return r.width > 100 && r.height > 25 && r.height < 60 && (e.innerText || '').trim().startsWith('#');
        });
        return items[0] ? { txt: (items[0].innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24) } : null;
      });
    }
    if (picked) {
      await page.evaluate(() => {
        const m = document.querySelector('.mention-suggest-mount-dom');
        const items = [...m.querySelectorAll('*')].filter(e => {
          const r = e.getBoundingClientRect();
          return r.width > 100 && r.height > 25 && r.height < 60 && (e.innerText || '').trim().startsWith('#');
        });
        items[0]?.click();
      });
      await page.waitForTimeout(600);
      const gone = await page.evaluate(() => !document.querySelector('.mention-suggest-mount-dom'));
      console.log(`话题 #${name}: ${picked.txt} (ok=${gone})`);
    } else {
      for (let i = 0; i < name.length + 1; i++) await page.keyboard.press('Backspace');
      console.log(`话题 #${name}: 联想失败，已删除`);
    }
  }

  // 4) 自主声明：内容由AI生成
  const declareOut = await page.evaluate(() => {
    const row = [...document.querySelectorAll('*')].find(e => {
      const r = e.getBoundingClientRect();
      return r.width > 300 && (e.innerText || '').trim().startsWith('自主声明') && e.querySelector('[class*="selectBox"]');
    });
    const box = row?.querySelector('[class*="selectBox"]');
    if (!box) return '找不到自主声明行';
    box.click();
    return 'ok';
  });
  if (declareOut === 'ok') {
    await page.waitForTimeout(1500);
    const picked = await page.evaluate(() => {
      const row = [...document.querySelectorAll('*')].find(e => {
        const r = e.getBoundingClientRect();
        return r.width > 500 && r.height > 30 && r.height < 60 && (e.innerText || '').trim() === '内容由AI生成';
      });
      if (!row) return null;
      row.click();
      return 'ok';
    });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button')].find(e => (e.innerText || '').trim() === '确定' && e.getBoundingClientRect().width > 0);
      el?.click();
    });
    await page.waitForTimeout(1200);
    console.log('声明 picked =', picked, '→ 内容由AI生成');
  } else {
    console.log('声明:', declareOut, '（跳过）');
  }

  // 5) 自查截图
  await page.screenshot({ path: '../qa/dy-pre-publish.png', fullPage: true });
  const check = await page.evaluate(() => {
    const title = document.querySelector('input[placeholder*="标题"]');
    const ed = document.querySelector('.zone-container.editor-kit-container');
    return { titleLen: (title?.value || '').length, bodyLen: (ed?.innerText || '').length };
  });
  console.log('自查:', JSON.stringify(check));

  // 6) 发布
  if (!DO_PUBLISH) { console.log('--dry：不发布'); return; }
  const btn = page.locator('button:visible', { hasText: '发布' }).first();
  await btn.click({ timeout: 10000 });
  console.log('已点击 发布，等待结果…');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '../qa/dy-post-publish.png', fullPage: true });
  const after = page.url();
  const bodyHead = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 220);
  console.log('url after:', after.slice(0, 90));
  console.log('body head:', bodyHead);
  console.log('DONE');
}

main().catch(e => { console.error('ERR', e.message.slice(0, 250)); process.exit(1); });

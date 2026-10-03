// douyin-fill.js — 抖音投稿页：上传成片 + 标题/正文/话题/AI 声明 + 自查截图。
// 端口 9223（`douyin.mjs launch` 开的窗口，人已扫码登录）。
// 不点「发布」——那是人的动作。选择器沿用 hsr-currency-war 实测版。
//
//   node pw/douyin-fill.js [--dry] [--video <mp4>] [--names A,B,C]
const { arg, hasFlag, loadPlaywright, loadSpec, setFiles, dumpForm, typeParagraphs, selfCheck } = require('./util');

const DRY = hasFlag('dry');
const spec = loadSpec('douyin-form.json');
const VIDEO = arg('video', '');
const NAMES = (arg('names', 'AI,GPT,Codex,人工智能,程序员')).split(',').map((s) => s.trim()).filter(Boolean);

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find((p) => p.url().includes('creator.douyin.com'));
  if (!page) throw new Error('没找到抖音窗口（先跑 node ../../skills/publish/templates/douyin.mjs launch 扫码）');
  await page.bringToFront();
  if (!page.url().includes('content/upload')) {
    await page.goto('https://creator.douyin.com/creator-micro/content/upload', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
  }

  if (VIDEO) {
    await setFiles(page, ctx, [VIDEO], /上传中|%|重新上传|上传完成/);
    await page.waitForSelector('input[placeholder*="标题"]', { timeout: 300000 });
    await page.waitForTimeout(3000);
  }
  if (!page.url().includes('/content/post/video')) console.log('提示：当前不在发布表单页（' + page.url().slice(0, 90) + '），继续尝试');

  if (DRY) { await dumpForm(page, 'douyin'); return; }

  // 1) 标题
  const title = page.locator('input[placeholder*="标题"]').first();
  await title.click();
  await title.fill(spec.title);
  console.log('标题 =', spec.title);

  // 2) 正文（editor-kit：聚焦后逐段输入）
  const editor = page.locator('.zone-container.editor-kit-container').first();
  await typeParagraphs(page, editor, spec.description);
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
        const items = [...m.querySelectorAll('*')].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 100 && r.height > 25 && r.height < 60 && (e.innerText || '').trim().startsWith('#');
        });
        return items[0] ? { txt: (items[0].innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24) } : null;
      });
    }
    if (picked) {
      await page.evaluate(() => {
        const m = document.querySelector('.mention-suggest-mount-dom');
        const items = [...m.querySelectorAll('*')].filter((e) => {
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
    const row = [...document.querySelectorAll('*')].find((e) => {
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
      const row = [...document.querySelectorAll('*')].find((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 500 && r.height > 30 && r.height < 60 && (e.innerText || '').trim() === '内容由AI生成';
      });
      if (!row) return null;
      row.click();
      return 'ok';
    });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('button')].find((e) => (e.innerText || '').trim() === '确定' && e.getBoundingClientRect().width > 0);
      el?.click();
    });
    await page.waitForTimeout(1200);
    console.log('声明 picked =', picked, '→ 内容由AI生成');
  } else {
    console.log('声明:', declareOut, '（跳过）');
  }

  await selfCheck(page, 'douyin');
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});

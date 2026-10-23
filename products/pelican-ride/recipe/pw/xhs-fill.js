// xhs-fill.js — 小红书发布页：上传成片 + 标题/正文/话题 + 原创与 AI 合成声明 + 自查截图。
// 端口 9224（`xhs.mjs launch` 开的窗口，人已扫码；登录卡右上角可切二维码）。
// 不点「发布」——那是人的动作。
//
//   node pw/xhs-fill.js [--dry] [--video <mp4>] [--topics 鹈鹕,AI绘画]
const { arg, hasFlag, loadPlaywright, loadSpec, setFiles, dumpForm, typeParagraphs, selfCheck } = require('./util');

const DRY = hasFlag('dry');
const spec = loadSpec('xhs-form.json');
const VIDEO = arg('video', '');
const TOPICS = (arg('topics', '鹈鹕,AI绘画,Codex,GPT')).split(',').map((s) => s.trim()).filter(Boolean);

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find((p) => p.url().includes('creator.xiaohongshu'));
  if (!page) throw new Error('没找到小红书窗口（先跑 node ../../skills/publish/templates/xhs.mjs launch 扫码）');
  await page.bringToFront();
  if (!page.url().includes('/publish/publish')) {
    await page.goto('https://creator.xiaohongshu.com/publish/publish?source=official', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
  }

  if (VIDEO) {
    await setFiles(page, ctx, [VIDEO], /上传中|%|重新上传|上传成功/);
    await page.waitForTimeout(6000); // 等推荐封面条出现（别急着编辑正文，会弄没 AI 推荐话题条）
  }

  if (DRY) { await dumpForm(page, 'xhs'); return; }

  // 1) 标题
  const title = page.locator('input[placeholder*="标题"], input[placeholder*="标题"]').first();
  await title.click();
  await title.fill(spec.title);
  console.log('标题 =', spec.title);

  // 2) 正文（TipTap：只聚焦，不碰选区；清空走 Ctrl+A + Backspace 真实按键）
  const editor = page.locator('#post-textarea [contenteditable="true"], .edit-area [contenteditable="true"], [contenteditable="true"]').first();
  await editor.click();
  await typeParagraphs(page, editor, spec.description);
  console.log('正文已输入', spec.description.length, '段');

  // 3) 话题：# 按钮打开 → 情境联想（按视频内容给有限集合），找不到就删，不硬凑
  for (const name of TOPICS) {
    try {
      await page.locator('button, [class*="topic"]', { hasText: '#' }).first().click({ timeout: 4000 });
      await page.waitForTimeout(500);
      const box = page.locator('input[placeholder*="搜索"], input[placeholder*="话题"]').first();
      await box.click();
      await box.fill(name);
      await page.waitForTimeout(1200);
      const item = page.locator('[class*="mention"] li, [class*="topic"] li, li', { hasText: name }).first();
      if (await item.count()) {
        await item.click();
        console.log(`话题 #${name}: ok`);
      } else {
        for (let i = 0; i < name.length + 1; i++) await page.keyboard.press('Backspace');
        console.log(`话题 #${name}: 联想失败，已删除`);
      }
      await page.waitForTimeout(400);
    } catch (e) {
      console.log(`话题 #${name}: 失败（${e.message.slice(0, 60)}）`);
    }
  }

  // 4) 原创声明（开关 → 二段确认）+ 「添加内容类型声明」→ 笔记含AI合成内容
  try {
    await page.locator('[class*="original"], div', { hasText: '声明原创' }).first().click({ timeout: 4000 });
    await page.waitForTimeout(800);
    const agree = page.locator('input[type=checkbox], .checkbox', { hasText: '' }).first();
    const bb = await agree.boundingBox().catch(() => null);
    if (bb) { await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); } // 0 高隐藏 input 按坐标点
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: '声明原创' }).first().click({ timeout: 4000 });
    await page.waitForTimeout(800);
    await page.locator('select, [class*="select"]').first().click({ timeout: 4000 }).catch(() => {});
    await page.locator('li, option, [class*="option"]', { hasText: '笔记含AI合成内容' }).first().click({ timeout: 5000 });
    console.log('声明 = 笔记含AI合成内容');
  } catch (e) {
    console.log('原创/AI 声明自动流程失败（人工兜底）：', e.message.slice(0, 80));
    await dumpForm(page, 'xhs-declare');
  }

  await selfCheck(page, 'xhs');
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});

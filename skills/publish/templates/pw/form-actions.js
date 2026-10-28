// Fragile form operations shared by real drivers and local browser regressions.
// No login, cookie access or final publish click.
const {basename} = require('path');
const normalize = s => String(s).replace(/[\u200b\ufeff]/g, '').replace(/\r/g, '').trim();
async function paragraphs(editor) {
  return editor.evaluate(e => e.innerText.split(/\n/)).then(values => values.map(normalize).filter(Boolean));
}
async function assertDescription(editor, expected, topics = []) {
  const actual = await paragraphs(editor), wanted = expected.map(normalize);
  if (actual.length < wanted.length || wanted.some((p, i) => p !== actual[i])) throw Error('Description readback mismatch (including source URLs/music credit); repair before handoff');
  const tail = actual.slice(wanted.length).join(' ').replace(/\s/g, '');
  if (tail !== topics.map(s => `#${s}`).join('')) throw Error('Unexpected or misplaced topic/text in description');
  return {paragraphs: wanted.length, urlsIntact: true};
}
async function endOfEditor(page, editor) {
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+End');
  const atEnd = await editor.evaluate(e => {
    const s = getSelection(); if (!s?.rangeCount || !e.contains(s.anchorNode)) return false;
    const r = s.getRangeAt(0).cloneRange(); r.selectNodeContents(e); r.setStart(s.anchorNode, s.anchorOffset);
    return r.toString().trim() === '';
  });
  if (!atEnd) throw Error('Could not place caret at end of description; topic insertion stopped');
}
async function appendTopics(page, editor, expected, names, platform, restore) {
  await assertDescription(editor, expected);
  if (!names.length) return {topicsApplied: [], topicsPending: []};
  try {
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      await endOfEditor(page, editor);
      await page.keyboard.press(i === 0 ? 'Enter' : 'Space');
      await page.keyboard.insertText(`#${name}`);
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const choices = platform === 'douyin'
        ? '.mention-suggest-mount-dom [role="option"], .mention-suggest-mount-dom li, .mention-suggest-mount-dom [class*="item"]'
        : '[role="listbox"] [role="option"], [class*="mention"] li, [class*="topic"] li';
      const option = page.locator(choices).filter({hasText: new RegExp(`^#?${escaped}(?:\\s|$)`)}).first();
      await option.waitFor({state:'visible',timeout:2500});
      // Exact name only: never accept the first unrelated recommendation.
      const label = normalize(await option.innerText()).split(/\s/)[0].replace(/^#/, '');
      if (label !== name) throw Error('Unrelated topic recommendation');
      await option.click({timeout:2500});
    }
    await assertDescription(editor, expected, names);
    return {topicsApplied:names,topicsPending:[]};
  } catch (error) {
    // Optional topics must not damage a single source URL or attribution line.
    await restore();
    await assertDescription(editor, expected);
    return {topicsApplied:[],topicsPending:names,reason:error.message};
  }
}
async function declarationRow(page, label) {
  let row = page.getByText(label,{exact:true}).first().locator('..');
  for (let i=0;i<3;i++) {
    if (await row.locator('[class*="selectBox"], [role="combobox"], select').count()) return row;
    row=row.locator('..');
  }
  throw Error(`Cannot locate declaration row: ${label}`);
}
async function selectDouyinDeclaration(page, want) {
  const row=await declarationRow(page,'自主声明');
  const choice=page.locator('label.semi-radio, [role="radio"]').filter({hasText:want}).first();
  if (!await choice.isVisible().catch(()=>false)) {
    if (normalize(await row.innerText()).includes(want)) return true;
    await row.locator('[class*="selectBox"], [role="combobox"], select').first().click();
  }
  await choice.click({timeout:5000});
  const selected=await choice.evaluate(e => e.getAttribute('aria-checked')==='true' || !!e.querySelector('input[type="radio"]:checked'));
  if(!selected) throw Error('AI declaration radio was not selected');
  const confirm=page.getByRole('button',{name:'确定',exact:true}).last();
  if(!await confirm.isEnabled()) throw Error('AI declaration confirm is disabled');
  await confirm.click();
  await choice.waitFor({state:'hidden',timeout:5000});
  if(!normalize(await row.innerText()).includes(want)) throw Error('AI declaration readback mismatch');
  return true;
}
async function selectXhsDeclaration(page,want) {
  // AI-content disclosure does not require claiming ownership of cited material.
  const label=page.getByText('添加内容类型声明',{exact:true}).first();
  let row=label.locator('..');
  const native=row.locator('select');
  if(await native.count()) await native.selectOption({label:want});
  else {
    if(normalize(await row.innerText()).includes(want)) return true;
    await label.click();
    await page.locator('[role="option"], li, [class*="option"]').filter({hasText:new RegExp(`^${want}$`)}).first().click({timeout:5000});
  }
  const selected=await row.evaluate((e,want)=>e.innerText.includes(want)||[...e.querySelectorAll('select')].some(s=>s.selectedOptions[0]?.textContent===want),want);
  if(!selected) throw Error('XHS AI declaration readback mismatch');
  return true;
}
async function uploadBiliVideo(page,video) {
  const selectors=['.bcc-upload-wrapper .upload-area','button:has-text("上传视频")','.upload-area','div.upload-btn:not(.no-events)'];
  for(const selector of selectors) {
    const target=page.locator(selector).first();
    if(!await target.isVisible().catch(()=>false)) continue;
    const [chooser]=await Promise.all([page.waitForEvent('filechooser',{timeout:10000}),target.click({timeout:5000})]);
    await chooser.setFiles(video); return;
  }
  throw Error('No actionable Bilibili upload area; inspect the real page instead of retrying another draft');
}
async function assertExistingVideo(page,video) {
  if(!(await page.locator('body').innerText()).includes(basename(video))) throw Error('An existing upload/form is open but video identity is unconfirmed; preserve it and inspect instead of uploading again');
}
module.exports={paragraphs,assertDescription,endOfEditor,appendTopics,selectDouyinDeclaration,selectXhsDeclaration,uploadBiliVideo,assertExistingVideo};

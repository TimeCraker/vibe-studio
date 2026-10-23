// 图版模式：隐藏版式镶边，场景铺满画面（特写采集用），速度 1×。
// 2400x1300 视口下 .scene 恰好 100vw x 100vh 铺满。
(() => {
  const st = document.createElement('style');
  st.id = 'plate-capture';
  st.textContent = [
    '.page{max-width:none !important;padding:0 !important;margin:0 !important}',
    'header,.intro,.controls,footer{display:none !important}',
    '.scene-shell{border:none !important;border-radius:0 !important;overflow:visible !important}',
    '.scene{width:100vw !important;height:auto !important;display:block}',
    '.caption,.scene-note{display:none !important}'
  ].join('');
  document.documentElement.appendChild(st);
  const s = document.getElementById('speed');
  if (s) { s.value = '1'; s.dispatchEvent(new Event('input', { bubbles: true })); }
})();

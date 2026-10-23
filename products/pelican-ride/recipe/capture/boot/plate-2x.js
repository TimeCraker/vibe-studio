// 图版模式 + 速度 2×（快节奏踩踏特写用）。
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
  if (s) { s.value = '2'; s.dispatchEvent(new Event('input', { bubbles: true })); }
})();

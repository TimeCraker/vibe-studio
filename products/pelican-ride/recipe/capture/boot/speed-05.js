// 骑行速度 → 0.5×。走真实控件：设值 + input 事件，不碰 IIFE 内部 state。
(() => {
  const s = document.getElementById('speed');
  if (s) { s.value = '0.5'; s.dispatchEvent(new Event('input', { bubbles: true })); }
})();

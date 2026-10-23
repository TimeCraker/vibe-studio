// Version A · night. Two clicks: day -> sunset -> night.
(() => {
  const s = document.getElementById('speed-range');
  if (s) { s.value = '1'; s.dispatchEvent(new Event('input', { bubbles: true })); }
  const t = document.getElementById('btn-theme-toggle');
  t.click(); t.click();
})();
// Version A · sunset. themes = ['day','sunset','night'], toggle cycles forward.
(() => {
  const s = document.getElementById('speed-range');
  if (s) { s.value = '1'; s.dispatchEvent(new Event('input', { bubbles: true })); }
  document.getElementById('btn-theme-toggle').click(); // day -> sunset
})();
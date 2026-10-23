// Version A · day · cruise 1.0x. Version A is already playing on load.
(() => {
  const s = document.getElementById('speed-range');
  if (s) { s.value = '1'; s.dispatchEvent(new Event('input', { bubbles: true })); }
})();
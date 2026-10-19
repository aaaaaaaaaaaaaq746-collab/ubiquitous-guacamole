(() => {
  const key = 'vscode-theme';
  const pref = localStorage.getItem(key) || 'dark';
  const dark = pref === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  window.__vscodeTheme = pref;
  window.addEventListener('DOMContentLoaded', () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#181818' : '#f3f3f3';
  });
})();

// Runs inline in <head> before first paint, so the page never renders in the wrong theme.
// Kept as a string because it is injected as a raw <script>, not bundled.
export const themeScript = `(function () {
  try {
    var raw = localStorage.getItem('theme');
    var stored = raw === 'dark' || raw === 'light' ? raw : null;
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  } catch (e) {}
})();`;

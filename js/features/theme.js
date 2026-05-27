/* ============================================================
   OPTIMUSCLE — Theme System (Dark / Light / Auto)
   ============================================================ */

const THEME_KEY = 'optimuscle_theme';
const VALID_THEMES = ['dark', 'light', 'auto'];

/**
 * Applique un thème à l'app.
 * @param {'dark'|'light'|'auto'} theme
 */
export function applyTheme(theme) {
  if (!VALID_THEMES.includes(theme)) theme = 'auto';
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}

  // Update theme-color meta selon le thème actuel
  updateThemeColor(theme);

  // Update UI buttons
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function updateThemeColor(theme) {
  let color = '#050505'; // dark default
  if (theme === 'light') color = '#f5f5f7';
  else if (theme === 'auto') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      color = '#f5f5f7';
    }
  }
  let meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

/**
 * Récupère le thème actuel depuis localStorage.
 */
export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (VALID_THEMES.includes(stored)) return stored;
  } catch (e) {}
  return 'auto';
}

/**
 * Init au boot.
 */
export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);

  // Écouter les changements système (pour le mode auto)
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'auto') {
        updateThemeColor('auto');
      }
    });
  }
}

/**
 * Bind les boutons de switch theme.
 */
export function bindThemeButtons() {
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);
    });
  });
}

/* ============================================================
   OPTIMUSCLE — Theme System (Dark / Light / Auto)
   Apple Liquid Glass 3-way Switcher
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

  // Update UI buttons (sidebar theme options)
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Update Apple Liquid Glass Switcher
  updateLiquidSwitcher(theme);
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
 * Bind les boutons de switch theme (sidebar).
 */
export function bindThemeButtons() {
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);
    });
  });
}

/**
 * Bind Apple Liquid Glass Switcher events.
 */
export function bindLiquidSwitcher() {
  const switcher = document.getElementById('liquid-switcher');
  if (!switcher) return;

  const options = switcher.querySelectorAll('.liquid-switcher-option');

  options.forEach(option => {
    option.addEventListener('click', () => {
      const value = option.dataset.option;
      if (!VALID_THEMES.includes(value)) return;

      // Add switching animation class
      switcher.classList.add('switching');
      setTimeout(() => switcher.classList.remove('switching'), 400);

      applyTheme(value);
    });
  });
}

/**
 * Update Apple Liquid Glass Switcher UI to match current theme.
 */
function updateLiquidSwitcher(theme) {
  const switcher = document.getElementById('liquid-switcher');
  if (!switcher) return;

  // Update data-value for CSS highlight positioning
  switcher.dataset.value = theme;

  // Update active class on options
  const options = switcher.querySelectorAll('.liquid-switcher-option');
  options.forEach(option => {
    const isActive = option.dataset.option === theme;
    option.classList.toggle('active', isActive);

    // Update radio input
    const input = option.querySelector('input');
    if (input) input.checked = isActive;
  });
}

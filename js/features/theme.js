/* ============================================================
   OPTIMUSCLE — Theme System (Dark / Light)
   Day/Night sliding toggle
   ============================================================ */

const THEME_KEY = 'optimuscle_theme';
const VALID_THEMES = ['dark', 'light'];

/**
 * Applique un thème à l'app.
 * @param {'dark'|'light'} theme
 */
export function applyTheme(theme) {
  if (!VALID_THEMES.includes(theme)) theme = 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}

  // Update theme-color meta selon le thème actuel
  updateThemeColor(theme);

  // Update UI buttons (sidebar theme options)
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Update Day/Night Toggle
  updateDayNightToggle(theme);
}

function updateThemeColor(theme) {
  let color = '#050505'; // dark default
  if (theme === 'light') color = '#f5f5f7';
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
  return 'dark';
}

/**
 * Init au boot.
 */
export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
}

/**
 * Bind les boutons de switch theme (sidebar legacy).
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
 * Bind Day/Night Toggle events.
 */
export function bindDayNightToggle() {
  const toggle = document.getElementById('daynight-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const current = toggle.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';

    // Add bounce animation
    toggle.classList.add('switching');
    setTimeout(() => toggle.classList.remove('switching'), 500);

    applyTheme(next);
  });
}

/**
 * Update Day/Night Toggle UI to match current theme.
 */
function updateDayNightToggle(theme) {
  const toggle = document.getElementById('daynight-toggle');
  if (!toggle) return;

  toggle.dataset.theme = theme;
}

/* ============================================================
   OPTIMUSCLE — Icons SVG Custom (alternative aux emojis basiques)
   ============================================================
   Style : Phosphor / Lucide / Heroicons inspirés
   Tous en stroke + premium feel
============================================================ */

const ICONS = {
  // ===== ONBOARDING : OBJECTIFS =====
  muscle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <rect x="4" y="9" width="3" height="6" rx="1"/>
    <rect x="17" y="9" width="3" height="6" rx="1"/>
    <path d="M7 12h2v-2h6v2h2"/>
    <path d="M9 10v4"/>
    <path d="M15 10v4"/>
  </svg>`,

  fire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>`,

  run: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="13" cy="4" r="2"/>
    <path d="M4 22l5-7 4 3-2-7-4 3-3-3"/>
    <path d="M14 17l3 3 3-3-3-6-3 3"/>
  </svg>`,

  leaf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c1.4 5.36-1 12.85-4.2 14.34A6.9 6.9 0 0 1 11 20"/>
    <path d="M2 21c.69-2.5 2.49-5 4-7 1.5-2 3-2.5 5-2.5"/>
  </svg>`,

  // ===== ONBOARDING : NIVEAUX =====
  seedling: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 17.5v-4.5a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v4.5"/>
    <path d="M12 22v-10"/>
    <path d="M9 22h6"/>
  </svg>`,

  lightning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>`,

  flame_solid: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2c-1 4-4 4-4 8 0 1.5.7 3 2 4-2-1-4-3-4-7C6 3 9 1 12 2zM12 2c1 4 4 4 4 8 0 1.5-.7 3-2 4 2-1 4-3 4-7 0-4-3-6-6-5z"/>
    <path d="M12 22a7 7 0 0 1-7-7c0-3 2-5 3-6 0 2 1 3 2 4 0-3 2-5 4-8 1 3 5 5 5 10a7 7 0 0 1-7 7z"/>
  </svg>`,

  // ===== ONBOARDING : LIEUX =====
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12l9-9 9 9"/>
    <path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10"/>
  </svg>`,

  dumbbell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <rect x="4" y="9" width="3" height="6" rx="1"/>
    <rect x="17" y="9" width="3" height="6" rx="1"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
  </svg>`,

  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="9" y1="9" x2="9" y2="9.01"/>
    <line x1="15" y1="9" x2="15" y2="9.01"/>
    <line x1="9" y1="15" x2="9" y2="15.01"/>
    <line x1="15" y1="15" x2="15" y2="15.01"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
  </svg>`,

  // ===== ONBOARDING : FRÉQUENCE (chiffres stylés) =====
  num3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9 8h6l-3 4h0a3 3 0 1 1-3 4"/>
  </svg>`,

  num4: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M14 8v8M9 8v4h6"/>
  </svg>`,

  num5: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M14.5 8h-5v3.5h2.5a2.5 2.5 0 0 1 0 5h-2.5"/>
  </svg>`,

  num6: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M14 8h-2a3 3 0 0 0-3 3v3a2.5 2.5 0 0 0 5 0v-.5a2.5 2.5 0 0 0-5 0"/>
  </svg>`,

  // ===== ONBOARDING : DURÉE =====
  bolt: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>`,

  stopwatch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="14" r="8"/>
    <path d="M12 10v4l3 2"/>
    <path d="M9 2h6"/>
    <path d="M12 4v2"/>
  </svg>`,

  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>`,

  // ===== BADGES =====
  badge_target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>`,

  star: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`,

  star_double: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="9 2 11 7 16 7 12 11 13 16 9 13 5 16 6 11 2 7 7 7 9 2"/>
    <polygon points="17 13 18 16 22 16 19 18 20 22 17 20 14 22 15 18 12 16 16 16 17 13"/>
  </svg>`,

  diamond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 3h12l4 6-10 12L2 9z"/>
    <path d="M11 3l-2 6 4 0-2-6"/>
    <path d="M2 9h20"/>
  </svg>`,

  crown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 8l4 8h12l4-8-5 4-5-7-5 7-5-4z"/>
    <path d="M6 16h12"/>
  </svg>`,

  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9a6 6 0 0 0 12 0V3H6z"/>
    <path d="M6 3H4a2 2 0 0 0 0 4h2"/>
    <path d="M18 3h2a2 2 0 0 1 0 4h-2"/>
    <path d="M10 21v-3a2 2 0 0 1 4 0v3"/>
    <path d="M8 21h8"/>
  </svg>`,

  medal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 2l3 6h4l3-6"/>
    <circle cx="12" cy="16" r="6"/>
    <circle cx="12" cy="16" r="2"/>
  </svg>`,

  rocket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>`,

  // ===== FEATURES LANDING =====
  brain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/>
  </svg>`,

  play: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round">
    <polygon points="6 3 20 12 6 21 6 3"/>
  </svg>`,

  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="3" y1="20" x2="21" y2="20"/>
  </svg>`,

  trophy_full: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M5 4v4a7 7 0 0 0 6 6.92V18H8v2h8v-2h-3v-3.08A7 7 0 0 0 19 8V4H5zm12 4a5 5 0 0 1-10 0V6h10v2zM3 6h2v2a3 3 0 0 1-2-2zm16 0h2a3 3 0 0 1-2 2V6z"/>
  </svg>`,

  shield_check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>`,

  // ===== SETTINGS / NAVIGATION =====
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>`,

  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,

  volume: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>`,

  vibrate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="2" width="8" height="20" rx="1"/>
    <line x1="3" y1="9" x2="3" y2="15"/>
    <line x1="21" y1="9" x2="21" y2="15"/>
  </svg>`,

  // ===== HEADERS / GENERAL =====
  fire_streak: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2c0 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.5-2-1-3 1 2 4 4 4 8a8 8 0 0 1-16 0c0-3 2-5 3-7 0 2 1 3 2 3 0-3 2-7 5-10z"/>
  </svg>`,

  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`,

  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`,

  auto_theme: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>`,
};

/**
 * Récupère le SVG d'une icône.
 * @param {string} name - clé de l'icône
 * @param {object} options - { size, className }
 * @returns {string} HTML SVG
 */
export function getIcon(name, options = {}) {
  const svg = ICONS[name];
  if (!svg) return '';
  const size = options.size || 24;
  const className = options.className || 'icon';
  return svg.replace('<svg ', `<svg width="${size}" height="${size}" class="${className}" `);
}

/**
 * Crée un élément SVG (pour insertion safe dans le DOM).
 */
export function createIconEl(name, options = {}) {
  const wrap = document.createElement('span');
  wrap.className = 'icon-wrap ' + (options.className || '');
  wrap.innerHTML = getIcon(name, options);
  return wrap;
}

export { ICONS };

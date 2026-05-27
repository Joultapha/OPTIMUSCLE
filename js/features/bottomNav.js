/* ============================================================
   OPTIMUSCLE — Bottom Navigation Bar (Feature)
   ============================================================
   5 tabs : Accueil, Training, Nutrition, Défis, Profil
   Remplace les tabs comme navigation principale.
   La sidebar reste pour : settings, historique, badges, coach, logout.
============================================================ */

import { setSubPage } from '../core/appState.js';
import { haptic } from '../utils/animations.js';
import { createEl } from '../utils/sanitize.js';

let initialized = false;

const TABS = [
  {
    id: 'home',
    label: 'Accueil',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10"/></svg>',
  },
  {
    id: 'training',
    label: 'Training',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2"/><path d="M20 12h2"/><rect x="4" y="9" width="3" height="6" rx="1"/><rect x="17" y="9" width="3" height="6" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 2a4 4 0 0 0-4 4c0 2 1 4 4 6 3-2 4-4 4-6a4 4 0 0 0-4-4z"/></svg>',
  },
  {
    id: 'challenges',
    label: 'Défis',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 0 12 0V3H6z"/><path d="M6 3H4a2 2 0 0 0 0 4h2"/><path d="M18 3h2a2 2 0 0 1 0 4h-2"/><path d="M10 21v-3a2 2 0 0 1 4 0v3"/><path d="M8 21h8"/></svg>',
  },
  {
    id: 'profile',
    label: 'Profil',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>',
  },
];

export function initBottomNav() {
  if (initialized) return;
  initialized = true;

  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  // Créer les items de nav
  TABS.forEach(tab => {
    const btn = createEl('button', {
      className: 'bottom-nav-item' + (tab.id === 'home' ? ' active' : ''),
      attrs: { type: 'button', 'data-tab': tab.id },
    });
    btn.innerHTML = tab.icon;
    btn.appendChild(createEl('span', { className: 'bottom-nav-label', text: tab.label }));
    btn.addEventListener('click', () => handleTabClick(tab.id));
    nav.appendChild(btn);
  });
}

function handleTabClick(tabId) {
  haptic('light');

  // Mettre à jour l'UI du bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  // Navigation
  if (tabId === 'home') {
    setSubPage('home');
    import('./ui.js').then(mod => mod.renderHome());
  } else if (tabId === 'training') {
    // Aller à la page d'accueil avec focus sur "ta semaine"
    setSubPage('home');
    import('./ui.js').then(mod => mod.renderHome());
  } else if (tabId === 'nutrition') {
    window.dispatchEvent(new CustomEvent('opt:nav', { detail: { page: 'nutrition' } }));
  } else if (tabId === 'challenges') {
    window.dispatchEvent(new CustomEvent('opt:nav', { detail: { page: 'challenges' } }));
  } else if (tabId === 'profile') {
    setSubPage('profile');
    import('./ui.js').then(mod => mod.renderProfile());
  }
}

/**
 * Met à jour l'onglet actif du bottom nav.
 */
export function setActiveBottomTab(tabId) {
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });
}

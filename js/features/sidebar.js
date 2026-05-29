/* ============================================================
   OPTIMUSCLE — Sidebar Menu
   ============================================================ */

import { getCurrentUser } from '../core/state.js';
import { setSubPage } from '../core/appState.js';
import { sanitizeUrl, createEl, clearEl } from '../utils/sanitize.js';
import { confirmLogout } from './auth.js';

let initialized = false;

export function openSidebar() {
  document.body.classList.add('sidebar-open');
  updateSidebarUser();
}

export function closeSidebar() {
  document.body.classList.remove('sidebar-open');
}

export function toggleSidebar() {
  if (document.body.classList.contains('sidebar-open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

export function initSidebar() {
  if (initialized) return;
  initialized = true;

  // Toggle button (dans le header)
  const menuBtn = document.getElementById('menu-toggle');
  if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);

  // Close button (dans la sidebar)
  const closeBtn = document.getElementById('sidebar-close');
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

  // Backdrop (clic à côté = ferme)
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  // Items de navigation
  document.querySelectorAll('.sidebar-item[data-action]').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      handleSidebarAction(action);
    });
  });

  // Échap pour fermer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) {
      closeSidebar();
    }
  });
}

function handleSidebarAction(action) {
  closeSidebar();
  switch (action) {
    case 'home':
    case 'history':
    case 'badges':
    case 'profile':
      setSubPage(action);
      // Render le contenu
      import('./ui.js').then(mod => {
        const handlers = {
          home: mod.renderHome,
          history: mod.renderHistory,
          badges: mod.renderBadges,
          profile: mod.renderProfile,
        };
        if (handlers[action]) handlers[action]();
      });
      break;
    case 'challenges':
      window.dispatchEvent(new CustomEvent('opt:nav', { detail: { page: 'challenges' } }));
      break;
    case 'nutrition':
      // Ouvrir page nutrition (gestion via app.js)
      window.dispatchEvent(new CustomEvent('opt:nav', { detail: { page: 'nutrition' } }));
      break;
    case 'coach':
      import('./coach.js').then(mod => mod.openCoachModal());
      break;
    case 'premium':
      window.dispatchEvent(new CustomEvent('opt:nav', { detail: { page: 'premium' } }));
      break;
    case 'settings':
      import('./ui.js').then(mod => mod.openSettings());
      break;
    case 'logout':
      confirmLogout();
      break;
  }
}

function updateSidebarUser() {
  const user = getCurrentUser();
  if (!user) return;

  // Avatar
  const avatarEl = document.getElementById('sidebar-user-avatar');
  if (avatarEl) {
    clearEl(avatarEl);
    const photoUrl = sanitizeUrl(user.photoURL);
    if (photoUrl) {
      const img = createEl('img', {
        attrs: { src: photoUrl, alt: 'Avatar' }
      });
      img.addEventListener('error', () => {
        clearEl(avatarEl);
        const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
        avatarEl.textContent = initial;
      });
      avatarEl.appendChild(img);
    } else {
      const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
      avatarEl.textContent = initial;
    }
  }

  // Nom
  const nameEl = document.getElementById('sidebar-user-name');
  if (nameEl) {
    nameEl.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'Athlète');
  }

  // Email
  const emailEl = document.getElementById('sidebar-user-email');
  if (emailEl) {
    emailEl.textContent = user.email || '';
  }
}

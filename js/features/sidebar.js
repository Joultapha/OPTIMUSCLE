/* ============================================================
   OPTIMUSCLE — Sidebar Menu
   ============================================================ */

import { getCurrentUser } from '../core/state.js';
import { setSubPage } from '../core/appState.js';
import { sanitizeUrl, createEl, clearEl } from '../utils/sanitize.js';
import { confirmLogout } from './auth.js';
import { isPremium, PLANS } from '../saas/subscription.js';

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
    case 'settings':
      import('./ui.js').then(mod => mod.openSettings());
      break;
    case 'premium':
      openPremiumModal();
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

  // Update Premium button visibility based on subscription
  const premiumBtn = document.querySelector('.sidebar-premium-btn');
  if (premiumBtn) {
    const userData = { subscription: { status: 'active', plan: 'free' } };
    // Check if premium — hide button if already premium
    try {
      const { getUserData } = await import('../core/state.js');
      const ud = getUserData();
      if (isPremium(ud)) {
        premiumBtn.style.display = 'none';
      } else {
        premiumBtn.style.display = 'flex';
      }
    } catch(e) {
      premiumBtn.style.display = 'flex';
    }
  }
}

/**
 * Open Premium subscription modal with Paddle integration
 */
function openPremiumModal() {
  let overlay = document.getElementById('premium-modal-overlay');
  if (!overlay) {
    overlay = createEl('div', {
      className: 'modal-overlay',
      attrs: { id: 'premium-modal-overlay' },
    });
    document.body.appendChild(overlay);
  }
  clearEl(overlay);

  const modal = createEl('div', { className: 'modal', attrs: { style: 'max-width: 400px; text-align: center;' } });

  // Header
  modal.appendChild(createEl('div', {
    className: 'badge-unlock-anim',
    html: '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(212,168,67,0.15)"/></svg>',
  }));

  modal.appendChild(createEl('h3', {
    attrs: { style: 'background: var(--grad-premium); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-size: 24px; margin: 12px 0 4px;' },
    text: 'OPTIMUSCLE PREMIUM',
  }));

  modal.appendChild(createEl('p', {
    attrs: { style: 'color: var(--text-dim); font-size: 14px; margin-bottom: 20px;' },
    text: 'Débloque tout le potentiel de ton entraînement',
  }));

  // Features list
  const features = [
    { icon: '⚡', text: 'Programmes illimités (6+ séances/sem)' },
    { icon: '🎯', text: 'Coach IA 24/7 — réponses personnalisées' },
    { icon: '📊', text: 'Historique complet (365 jours)' },
    { icon: '🎬', text: 'Démos vidéo HD' },
    { icon: '📄', text: 'Export PDF de tes programmes' },
    { icon: '🚫', text: 'Sans publicité' },
  ];

  features.forEach(f => {
    const row = createEl('div', {
      attrs: { style: 'display: flex; align-items: center; gap: 10px; padding: 8px 0; text-align: left; font-size: 14px;' },
    });
    row.appendChild(createEl('span', { attrs: { style: 'font-size: 18px; width: 24px; text-align: center;' }, text: f.icon }));
    row.appendChild(createEl('span', { text: f.text }));
    modal.appendChild(row);
  });

  // Plans
  const plansDiv = createEl('div', { attrs: { style: 'margin-top: 20px; display: flex; flex-direction: column; gap: 10px;' } });

  // Monthly plan
  const monthlyBtn = createEl('button', {
    className: 'btn btn-primary',
    attrs: { type: 'button', style: 'width: 100%; justify-content: center;' },
    html: `<span style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:16px;font-weight:700;">Premium Mensuel</span><span style="font-size:13px;opacity:0.8;">4,99€/mois</span></span>`,
    on: { click: () => handlePaddleCheckout('premium_monthly') },
  });
  plansDiv.appendChild(monthlyBtn);

  // Yearly plan
  const yearlyBtn = createEl('button', {
    className: 'btn btn-ghost',
    attrs: { type: 'button', style: 'width: 100%; justify-content: center; border-color: var(--gold) !important; color: var(--gold) !important;' },
    html: `<span style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:16px;font-weight:700;">Premium Annuel <span style="font-size:11px;background:var(--grad-premium);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">-33%</span></span><span style="font-size:13px;opacity:0.8;">39,99€/an (3,33€/mois)</span></span>`,
    on: { click: () => handlePaddleCheckout('premium_yearly') },
  });
  plansDiv.appendChild(yearlyBtn);

  modal.appendChild(plansDiv);

  // Paddle badge
  modal.appendChild(createEl('div', {
    attrs: { style: 'margin-top: 16px; font-size: 12px; color: var(--text-dimmer); display: flex; align-items: center; justify-content: center; gap: 6px;' },
    html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Paiement sécurisé par Paddle',
  }));

  // Close button
  modal.appendChild(createEl('button', {
    className: 'btn btn-ghost',
    attrs: { type: 'button', style: 'margin-top: 12px; width: 100%;' },
    text: 'Fermer',
    on: { click: () => overlay.classList.remove('show') },
  }));

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('show');
  }, { once: true });
  requestAnimationFrame(() => overlay.classList.add('show'));
}

/**
 * Handle Paddle checkout for a given plan.
 * Uses Paddle.js SDK if available, otherwise falls back to Paddle checkout URL.
 */
function handlePaddleCheckout(planId) {
  const plan = PLANS[planId];
  if (!plan) return;

  // Try Paddle.js SDK if loaded
  if (window.Paddle && window.Paddle.Checkout) {
    try {
      window.Paddle.Checkout.open({
        product: plan.paddleId || plan.stripeId,
        successCallback: () => {
          import('../utils/notifications.js').then(mod => mod.showToast('Bienvenue en Premium ! 🎉'));
          overlay.classList.remove('show');
        },
        closeCallback: () => {
          // User closed checkout
        },
      });
      return;
    } catch(e) {
      console.warn('[Premium] Paddle Checkout failed:', e);
    }
  }

  // Fallback: redirect to pricing page
  window.location.href = '/legal/pricing.html';
}

/* ============================================================
   OPTIMUSCLE — Sidebar Menu
   ============================================================ */

import { getCurrentUser, getUserData } from '../core/state.js';
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
    // Check if premium — hide button if already premium
    const ud = getUserData();
    if (isPremium(ud)) {
      premiumBtn.style.display = 'none';
    } else {
      premiumBtn.style.display = 'flex';
    }
  }
}

/**
 * Open Premium subscription modal with Paddle integration
 * Shows 2 well-distinct plans: Purple Monthly + Gold Annual
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

  const modal = createEl('div', { className: 'modal', attrs: { style: 'max-width: 420px; text-align: center; padding: 28px 24px;' } });

  // Header
  modal.appendChild(createEl('div', {
    className: 'badge-unlock-anim',
    html: '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(212,168,67,0.15)"/></svg>',
  }));

  modal.appendChild(createEl('h3', {
    attrs: { style: 'background: var(--grad-premium); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-size: 22px; margin: 12px 0 4px; font-family: var(--font-display); letter-spacing: 2px;' },
    text: 'OPTIMUSCLE PREMIUM',
  }));

  modal.appendChild(createEl('p', {
    attrs: { style: 'color: var(--text-dim); font-size: 13px; margin-bottom: 20px;' },
    text: 'Débloque tout le potentiel de ton entraînement',
  }));

  // ====== PLAN CARDS — bien distincts ======
  const plansContainer = createEl('div', { attrs: { style: 'display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;' } });

  // --- MONTHLY PLAN CARD (Purple) ---
  const monthlyCard = createEl('div', {
    attrs: { style: 'background: linear-gradient(135deg, rgba(123,44,191,0.20) 0%, rgba(123,44,191,0.08) 100%); border: 1px solid rgba(157,78,221,0.35); border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s ease; position: relative; overflow: hidden;' },
    on: {
      click: () => handlePaddleCheckout('premium_monthly'),
      mouseenter: (e) => { e.currentTarget.style.borderColor = 'rgba(157,78,221,0.6)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(123,44,191,0.20)'; },
      mouseleave: (e) => { e.currentTarget.style.borderColor = 'rgba(157,78,221,0.35)'; e.currentTarget.style.boxShadow = 'none'; },
    },
  });
  // Top shine
  monthlyCard.appendChild(createEl('div', {
    attrs: { style: 'position: absolute; top: 0; left: 15%; right: 15%; height: 1px; background: linear-gradient(90deg, transparent, rgba(157,78,221,0.5), transparent);' },
  }));
  monthlyCard.appendChild(createEl('div', {
    attrs: { style: 'font-size: 13px; font-weight: 700; letter-spacing: 1.5px; color: rgba(199,125,255,0.90); margin-bottom: 8px; font-family: var(--font-display);' },
    text: 'PREMIUM MENSUEL',
  }));
  monthlyCard.appendChild(createEl('div', {
    attrs: { style: 'font-size: 28px; font-weight: 800; color: white; line-height: 1;' },
    text: '4,99€/MOIS',
  }));
  monthlyCard.appendChild(createEl('div', {
    attrs: { style: 'font-size: 11px; color: var(--text-dim); margin-top: 6px;' },
    text: 'Sans engagement · Annule quand tu veux',
  }));
  plansContainer.appendChild(monthlyCard);

  // --- ANNUAL PLAN CARD (Gold) ---
  const yearlyCard = createEl('div', {
    attrs: { style: 'background: linear-gradient(135deg, rgba(212,168,67,0.06) 0%, rgba(13,13,18,0.92) 100%); border: 1px solid rgba(212,168,67,0.35); border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s ease; position: relative; overflow: hidden;' },
    on: {
      click: () => handlePaddleCheckout('premium_yearly'),
      mouseenter: (e) => { e.currentTarget.style.borderColor = 'rgba(212,168,67,0.6)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,168,67,0.15)'; },
      mouseleave: (e) => { e.currentTarget.style.borderColor = 'rgba(212,168,67,0.35)'; e.currentTarget.style.boxShadow = 'none'; },
    },
  });
  // Top shine
  yearlyCard.appendChild(createEl('div', {
    attrs: { style: 'position: absolute; top: 0; left: 15%; right: 15%; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,168,67,0.5), transparent);' },
  }));
  // Badge économie
  const annualHeader = createEl('div', { attrs: { style: 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;' } });
  annualHeader.appendChild(createEl('div', {
    attrs: { style: 'font-size: 13px; font-weight: 700; letter-spacing: 1.5px; color: var(--gold); font-family: var(--font-display);' },
    text: 'PREMIUM ANNUEL',
  }));
  annualHeader.appendChild(createEl('span', {
    attrs: { style: 'background: var(--grad-premium); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;' },
    text: '-33%',
  }));
  yearlyCard.appendChild(annualHeader);
  yearlyCard.appendChild(createEl('div', {
    attrs: { style: 'font-size: 28px; font-weight: 800; color: var(--gold); line-height: 1;' },
    text: '39,99€/AN',
  }));
  yearlyCard.appendChild(createEl('div', {
    attrs: { style: 'font-size: 12px; color: var(--text-dim); margin-top: 4px;' },
    text: '3,33€/mois · Économise 20€/an',
  }));
  plansContainer.appendChild(yearlyCard);

  modal.appendChild(plansContainer);

  // Features list (compact)
  const featuresGrid = createEl('div', { attrs: { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; text-align: left; margin-bottom: 16px; font-size: 12px; color: var(--text-soft);' } });
  const featureItems = [
    '⚡ Programmes illimités',
    '🎯 Coach IA 24/7',
    '📊 Historique 365j',
    '🎬 Démos vidéo HD',
    '📄 Export PDF',
    '🚫 Sans pub',
  ];
  featureItems.forEach(f => {
    featuresGrid.appendChild(createEl('span', { text: f }));
  });
  modal.appendChild(featuresGrid);

  // Paddle badge
  modal.appendChild(createEl('div', {
    attrs: { style: 'font-size: 11px; color: var(--text-dimmer); display: flex; align-items: center; justify-content: center; gap: 6px;' },
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
          import('../utils/notifications.js').then(mod => mod.showToast('Bienvenue en Premium !'));
          const overlayEl = document.getElementById('premium-modal-overlay');
          if (overlayEl) overlayEl.classList.remove('show');
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

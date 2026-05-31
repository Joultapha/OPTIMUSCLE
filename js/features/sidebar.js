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
 * Shows 3 well-distinct plan cards side by side: Gratuit, Premium, Elite
 * Matches the landing page pricing grid style
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

  const modal = createEl('div', { className: 'modal premium-modal', attrs: { style: 'max-width: 720px; text-align: center; padding: 28px 20px;' } });

  // Header
  modal.appendChild(createEl('div', {
    className: 'badge-unlock-anim',
    html: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(212,168,67,0.15)"/></svg>',
  }));

  modal.appendChild(createEl('h3', {
    attrs: { style: 'background: var(--grad-premium); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; font-size: 20px; margin: 10px 0 4px; font-family: var(--font-display); letter-spacing: 2px;' },
    text: 'CHOISIS TON PLAN',
  }));

  modal.appendChild(createEl('p', {
    attrs: { style: 'color: var(--text-dim); font-size: 12px; margin-bottom: 20px;' },
    text: 'Commence gratuitement. Passe Premium quand tu es prêt.',
  }));

  // ====== 3 PLAN CARDS — côte à côte ======
  const grid = createEl('div', { className: 'premium-modal-grid' });

  // --- FREE CARD (muted, limited) ---
  const freeCard = createEl('div', { className: 'premium-modal-card premium-modal-card-free' });
  // Icon
  freeCard.appendChild(createEl('div', {
    className: 'premium-modal-icon premium-modal-icon-free',
    html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  }));
  freeCard.appendChild(createEl('div', { className: 'premium-modal-name premium-modal-name-free', text: 'Gratuit' }));
  freeCard.appendChild(createEl('div', { className: 'premium-modal-tagline', text: 'Pour découvrir' }));
  freeCard.appendChild(createEl('div', { className: 'premium-modal-price premium-modal-price-free', html: '0€<span>/mois</span>' }));
  freeCard.appendChild(createEl('div', { className: 'premium-modal-divider' }));
  // Features
  const freeFeatures = createEl('ul', { className: 'premium-modal-features' });
  [
    { text: '2 séances / sem. max', included: true },
    { text: '1 programme basique', included: true },
    { text: 'Historique 7 jours', included: true },
    { text: '3 badges de base', included: true },
    { text: 'Coach IA', included: false },
    { text: 'Export PDF', included: false },
    { text: 'Sans pub', included: false },
  ].forEach(f => {
    freeFeatures.appendChild(createEl('li', {
      className: f.included ? 'premium-modal-included' : 'premium-modal-locked',
      html: (f.included
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>')
        + ' <span>' + f.text + '</span>',
    }));
  });
  freeCard.appendChild(freeFeatures);
  // Current plan badge
  freeCard.appendChild(createEl('div', { className: 'premium-modal-current-badge', text: 'Plan actuel' }));
  grid.appendChild(freeCard);

  // --- PREMIUM CARD (purple, highlighted) ---
  const premiumCard = createEl('div', { className: 'premium-modal-card premium-modal-card-premium' });
  // Badge
  premiumCard.appendChild(createEl('div', { className: 'premium-modal-badge', text: 'POPULAIRE' }));
  // Icon
  premiumCard.appendChild(createEl('div', {
    className: 'premium-modal-icon premium-modal-icon-premium',
    html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  }));
  premiumCard.appendChild(createEl('div', { className: 'premium-modal-name premium-modal-name-premium', text: 'Premium' }));
  premiumCard.appendChild(createEl('div', { className: 'premium-modal-tagline', text: 'Pour les sérieux' }));
  premiumCard.appendChild(createEl('div', { className: 'premium-modal-price premium-modal-price-premium', html: '4,99€<span>/mois</span>' }));
  premiumCard.appendChild(createEl('div', { className: 'premium-modal-annual', html: 'ou 39,99€/an — <strong>-33%</strong>' }));
  premiumCard.appendChild(createEl('div', { className: 'premium-modal-divider' }));
  // Features
  const premFeatures = createEl('ul', { className: 'premium-modal-features' });
  [
    'Séances <strong>illimitées</strong>',
    'Programmes <strong>personnalisés</strong>',
    'Historique <strong>365 jours</strong>',
    'Coach IA <strong>24/7</strong>',
    'Démos vidéo <strong>HD</strong>',
    'Export PDF',
    'Sans publicité',
  ].forEach(f => {
    premFeatures.appendChild(createEl('li', {
      className: 'premium-modal-included',
      html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> <span>' + f + '</span>',
    }));
  });
  premiumCard.appendChild(premFeatures);
  // CTA button
  premiumCard.appendChild(createEl('button', {
    className: 'premium-modal-btn premium-modal-btn-premium',
    attrs: { type: 'button' },
    text: 'Passer Premium',
    on: { click: () => handlePaddleCheckout('premium_monthly') },
  }));
  grid.appendChild(premiumCard);

  // --- ELITE CARD (gold, best deal) ---
  const eliteCard = createEl('div', { className: 'premium-modal-card premium-modal-card-elite' });
  // Badge
  eliteCard.appendChild(createEl('div', { className: 'premium-modal-badge premium-modal-badge-elite', text: 'MEILLEURE OFFRE' }));
  // Icon
  eliteCard.appendChild(createEl('div', {
    className: 'premium-modal-icon premium-modal-icon-elite',
    html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  }));
  eliteCard.appendChild(createEl('div', { className: 'premium-modal-name premium-modal-name-elite', text: 'Elite' }));
  eliteCard.appendChild(createEl('div', { className: 'premium-modal-tagline', text: 'Pour les ambitieux' }));
  eliteCard.appendChild(createEl('div', { className: 'premium-modal-price premium-modal-price-elite', html: '3,33€<span>/mois</span>' }));
  eliteCard.appendChild(createEl('div', { className: 'premium-modal-annual', html: '39,99€/an — <strong>économise 20€</strong>' }));
  eliteCard.appendChild(createEl('div', { className: 'premium-modal-divider' }));
  // Features
  const eliteFeatures = createEl('ul', { className: 'premium-modal-features' });
  [
    '<strong>Tout Premium +</strong>',
    'Coach IA <strong>avancé</strong>',
    'Programmes <strong>exclusifs</strong>',
    'Statistiques <strong>avancées</strong>',
    'Badge <strong>Elite</strong> exclusif',
    'Accès <strong>anticipé</strong>',
    'Support <strong>prioritaire</strong>',
  ].forEach(f => {
    eliteFeatures.appendChild(createEl('li', {
      className: 'premium-modal-included',
      html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> <span>' + f + '</span>',
    }));
  });
  eliteCard.appendChild(eliteFeatures);
  // CTA button
  eliteCard.appendChild(createEl('button', {
    className: 'premium-modal-btn premium-modal-btn-elite',
    attrs: { type: 'button' },
    text: 'Passer Elite',
    on: { click: () => handlePaddleCheckout('premium_yearly') },
  }));
  grid.appendChild(eliteCard);

  modal.appendChild(grid);

  // Paddle badge
  modal.appendChild(createEl('div', {
    attrs: { style: 'font-size: 11px; color: var(--text-dimmer); display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 16px;' },
    html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Paiement sécurisé par Paddle',
  }));

  // Close button
  modal.appendChild(createEl('button', {
    className: 'btn btn-ghost',
    attrs: { type: 'button', style: 'margin-top: 10px; width: 100%;' },
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

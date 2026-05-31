/* ============================================================
   OPTIMUSCLE V20 — Bottom Navigation Bar (Liquid Glass)
   ============================================================
   - Fluid sliding pill with stretch/squash (Web Animations API)
   - Pure CSS glassmorphism — NO SVG displacement filter
   - Crisp, well-defined borders
   - Robust initialization with retry mechanism
   ============================================================ */

import { setSubPage } from '../core/appState.js';
import { createEl } from '../utils/sanitize.js';

let initialized = false;
let currentTab = 'home';
let pillEl = null;
let currentIndex = 0;

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

/**
 * Initialize the bottom navigation bar.
 * Robust: retries up to 5 times with delay if DOM not ready.
 */
let retryCount = 0;
const MAX_RETRIES = 5;

export function initBottomNav() {
  if (initialized) return;

  const nav = document.getElementById('bottom-nav');
  if (!nav) {
    retryCount++;
    if (retryCount < MAX_RETRIES) {
      console.warn(`[BottomNav] #bottom-nav not found, retry ${retryCount}/${MAX_RETRIES}...`);
      setTimeout(() => initBottomNav(), 300);
    } else {
      console.error('[BottomNav] #bottom-nav not found after max retries');
    }
    return;
  }

  initialized = true;
  console.log('[BottomNav] Initializing...');

  // Create inner container
  const inner = createEl('div', { className: 'bottom-nav-inner' });

  // Create the liquid glass pill/droplet
  const pill = createEl('div', { className: 'bottom-nav-pill' });
  pillEl = pill;

  // Create nav items
  TABS.forEach((tab, index) => {
    const btn = createEl('button', {
      className: 'bottom-nav-item' + (tab.id === 'home' ? ' active' : ''),
      attrs: { type: 'button', 'data-tab': tab.id, 'data-index': String(index) },
    });
    btn.innerHTML = tab.icon;
    btn.appendChild(createEl('span', { className: 'bottom-nav-label', text: tab.label }));
    btn.addEventListener('click', () => handleTabClick(tab.id));
    inner.appendChild(btn);
  });

  inner.appendChild(pill);
  nav.appendChild(inner);

  // Position pill on initial active tab (no animation)
  requestAnimationFrame(() => {
    movePill(0, false);
  });

  console.log('[BottomNav] Initialized successfully with', TABS.length, 'tabs');
}

// SVG filter injection removed — pure CSS glassmorphism now (v20)
// The feDisplacementMap filter was causing blurry/undefined borders on the pill.

/**
 * Animate the liquid droplet pill to the target tab index.
 * Uses Web Animations API for fluid stretch/squash effect.
 */
function movePill(targetIndex, animate = true) {
  if (!pillEl) return;

  const fromIndex = currentIndex;

  if (!animate) {
    pillEl.style.transition = 'none';
    pillEl.style.transform = `translateX(${targetIndex * 100}%)`;
    void pillEl.offsetWidth; // force reflow
    pillEl.style.transition = '';
    currentIndex = targetIndex;
    return;
  }

  const startX = fromIndex * 100;
  const endX = targetIndex * 100;
  const distance = Math.abs(targetIndex - fromIndex);
  const direction = targetIndex > fromIndex ? 1 : -1;
  const overshoot = Math.min(distance * 2, 5);

  const keyframes = [
    {
      transform: `translateX(${startX}%) scaleX(1) scaleY(1)`,
      offset: 0
    },
    {
      transform: `translateX(${startX + direction * 3}%) scaleX(${1 + distance * 0.02}) scaleY(${1 - distance * 0.015})`,
      offset: 0.15
    },
    {
      transform: `translateX(${(startX + endX) / 2}%) scaleX(${1 + distance * 0.04}) scaleY(${1 - distance * 0.02})`,
      offset: 0.45
    },
    {
      transform: `translateX(${endX - direction * overshoot}%) scaleX(1.01) scaleY(0.99)`,
      offset: 0.75
    },
    {
      transform: `translateX(${endX + direction * 1}%) scaleX(0.98) scaleY(1.02)`,
      offset: 0.88
    },
    {
      transform: `translateX(${endX}%) scaleX(1) scaleY(1)`,
      offset: 1
    }
  ];

  const anim = pillEl.animate(keyframes, {
    duration: 400 + distance * 30,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fill: 'forwards'
  });

  anim.onfinish = () => {
    pillEl.style.transform = `translateX(${endX}%)`;
    anim.cancel();
  };

  currentIndex = targetIndex;
}

function handleTabClick(tabId) {
  // Haptic feedback (safe - won't break if unavailable)
  try {
    if (navigator.vibrate) navigator.vibrate(8);
  } catch(e) {}

  const index = TABS.findIndex(t => t.id === tabId);
  if (index === -1) return;

  if (tabId === currentTab) return;
  currentTab = tabId;

  // Update active state on buttons
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  // Move droplet
  movePill(index, true);

  // Navigation — set subpage + render content
  switch (tabId) {
    case 'home':
      setSubPage('home');
      import('./ui.js').then(mod => { if (mod.renderHome) mod.renderHome(); });
      break;

    case 'training':
      setSubPage('training');
      import('./ui.js').then(mod => { if (mod.renderHome) mod.renderHome(); });
      break;

    case 'nutrition':
      setSubPage('nutrition');
      import('./nutrition.js').then(mod => { if (mod.renderNutrition) mod.renderNutrition(); });
      break;

    case 'challenges':
      setSubPage('challenges');
      import('./challenges.js').then(mod => { if (mod.renderChallenges) mod.renderChallenges(); });
      break;

    case 'profile':
      setSubPage('profile');
      import('./ui.js').then(mod => { if (mod.renderProfile) mod.renderProfile(); });
      break;
  }
}

export function setActiveBottomTab(tabId) {
  const index = TABS.findIndex(t => t.id === tabId);
  if (index === -1) return;

  currentTab = tabId;

  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });

  movePill(index, true);
}

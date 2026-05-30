/* ============================================================
   OPTIMUSCLE V17 — Bottom Navigation Bar (Apple Liquid Glass)
   ============================================================
   5 tabs : Accueil, Training, Nutrition, Défis, Profil
   - Liquid glass water droplet indicator
   - Fluid sliding animation between tabs
   - SVG displacement filter for liquid distortion
   - Spring physics for droplet wobble
   ============================================================ */

import { setSubPage } from '../core/appState.js';
import { haptic } from '../utils/animations.js';
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

/* ===== SVG FILTERS for liquid glass distortion ===== */
const SVG_FILTERS = `
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;">
  <defs>
    <!-- Liquid glass displacement — subtle distortion -->
    <filter id="liquid-glass" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.012 0.015"
        numOctaves="3"
        seed="42"
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="3"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>

    <!-- Active droplet glow filter -->
    <filter id="droplet-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
      <feColorMatrix in="blur" type="matrix"
        values="0 0 0 0 0.48
                0 0 0 0 0.17
                0 0 0 0 0.75
                0 0 0 0.3 0" result="colorBlur"/>
      <feMerge>
        <feMergeNode in="colorBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>`;

export function initBottomNav() {
  if (initialized) return;
  initialized = true;

  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  // Inject SVG filters into the nav
  const filterWrap = createEl('div', { className: 'bottom-nav-filters' });
  filterWrap.innerHTML = SVG_FILTERS;
  nav.appendChild(filterWrap);

  // Create inner container
  const inner = createEl('div', { className: 'bottom-nav-inner' });

  // Create the liquid glass pill/droplet
  const pill = createEl('div', { className: 'bottom-nav-pill' });
  pill.style.filter = 'url(#droplet-glow)';
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

  // Position pill on initial active tab
  requestAnimationFrame(() => {
    movePill(0, false);
  });
}

/**
 * Animate the liquid droplet pill to the target tab index.
 * Uses a spring-physics-inspired animation with stretch effect.
 *
 * @param {number} targetIndex - target tab index (0-4)
 * @param {boolean} animate - whether to animate
 */
function movePill(targetIndex, animate = true) {
  if (!pillEl) return;

  const fromIndex = currentIndex;

  if (!animate) {
    // Instant positioning — no animation
    pillEl.style.transition = 'none';
    pillEl.style.transform = `translateX(${targetIndex * 100}%)`;
    // Force reflow then restore transition
    void pillEl.offsetWidth;
    pillEl.style.transition = '';
    currentIndex = targetIndex;
    return;
  }

  // Calculate distance for stretch effect
  const distance = Math.abs(targetIndex - fromIndex);
  const direction = targetIndex > fromIndex ? 1 : -1;

  // Add liquid stretch class for the direction-aware animation
  pillEl.classList.remove('animating');

  // Use Web Animations API for precise spring physics
  const startX = fromIndex * 100;
  const endX = targetIndex * 100;
  const midX = startX + (endX - startX) * 0.5;

  // Overshoot amount based on distance
  const overshoot = Math.min(distance * 3, 8);

  const keyframes = [
    {
      transform: `translateX(${startX}%) scaleX(1) scaleY(1)`,
      borderRadius: '18px',
      offset: 0
    },
    {
      transform: `translateX(${startX + direction * 5}%) scaleX(${1 + distance * 0.03}) scaleY(${1 - distance * 0.02})`,
      borderRadius: '20px 14px 14px 20px',
      offset: 0.15
    },
    {
      transform: `translateX(${midX}%) scaleX(${1 + distance * 0.06}) scaleY(${1 - distance * 0.03})`,
      borderRadius: '14px',
      offset: 0.45
    },
    {
      transform: `translateX(${endX - direction * overshoot}%) scaleX(1.02) scaleY(0.98)`,
      borderRadius: '14px 20px 20px 14px',
      offset: 0.75
    },
    {
      transform: `translateX(${endX + direction * 2}%) scaleX(0.97) scaleY(1.03)`,
      borderRadius: '18px',
      offset: 0.88
    },
    {
      transform: `translateX(${endX}%) scaleX(1.01) scaleY(0.99)`,
      borderRadius: '18px',
      offset: 0.94
    },
    {
      transform: `translateX(${endX}%) scaleX(1) scaleY(1)`,
      borderRadius: '18px',
      offset: 1
    }
  ];

  const animation = pillEl.animate(keyframes, {
    duration: 450 + distance * 40,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fill: 'forwards'
  });

  // After animation ends, set final position with CSS transform
  animation.onfinish = () => {
    pillEl.style.transform = `translateX(${endX}%)`;
    animation.cancel(); // Remove the animation, CSS transform takes over
  };

  currentIndex = targetIndex;
}

function handleTabClick(tabId) {
  haptic('light');

  const index = TABS.findIndex(t => t.id === tabId);
  if (index === -1) return;

  // Skip if already active
  if (tabId === currentTab) return;
  currentTab = tabId;

  // Update active state with a slight delay for visual fluidity
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    if (item.dataset.tab === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Move liquid droplet with animation
  movePill(index, true);

  // Navigation
  if (tabId === 'home') {
    setSubPage('home');
    import('./ui.js').then(mod => mod.renderHome());
  } else if (tabId === 'training') {
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
 * Update the active tab in the bottom nav.
 * Called externally when navigation happens from other UI.
 */
export function setActiveBottomTab(tabId) {
  const index = TABS.findIndex(t => t.id === tabId);
  if (index === -1) return;

  currentTab = tabId;
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });
  movePill(index, true);
}

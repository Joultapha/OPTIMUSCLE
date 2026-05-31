/* ============================================================
   OPTIMUSCLE — Entry point (utilise appState UNIQUEMENT)
   ============================================================
   Cette version ne touche PLUS jamais au DOM des pages directement.
   Toute décision de rendu passe par appState.render()
*/

// ⚠️ Firebase imports are now DYNAMIC to prevent black screen if CDN is unreachable
// Static imports would kill the entire module if the CDN URL is 404

import { firebaseConfig, APP_NAME, APP_VERSION } from './core/config.js';
import {
  getState,
  setCurrentUser,
  resetState,
  initDatabase,
  loadUserData,
  loadUserMeta,
  setUserData,
  save,
  saveImmediate,
} from './core/state.js';
import { checkWeekReset } from './core/program.js';

// ⭐ SOURCE UNIQUE DE VÉRITÉ pour le rendu
import {
  setLoading,
  setAuthenticated,
  setOnboardingCompleted,
  setSubPage,
  setHasSeenLanding,
  updateAppState,
  getCurrentView,
  render,
} from './core/appState.js';
import { initTheme, bindThemeButtons, applyTheme } from './features/theme.js';
import { initSidebar } from './features/sidebar.js';
import { initCoach, openCoachModal } from './features/coach.js';
import { initNutrition, renderNutrition } from './features/nutrition.js';
import { initChallenges, renderChallenges } from './features/challenges.js';
import { initBottomNav } from './features/bottomNav.js';

import {
  initAuth,
  setupAuthListener,
  toggleAuthMode,
  loginGoogle,
  handleEmailAuth,
  confirmLogout,
  showLoginLoading,
  handlePasswordReset,
  handleDeleteAccount,
} from './features/auth.js';
import { initOnboarding, resetOnboardingUI } from './features/onboarding.js';
import {
  renderHome,
  switchTab,
  goHome,
  updateAvatar,
  openSettings,
  closeSettings,
  saveSettings,
  closeBadgeModal,
  closeExInfo,
  completeWorkout,
} from './features/ui.js';
import {
  toggleTimer,
  addTimerTime,
  closeTimer,
} from './core/timer.js';
import {
  toggleReminders,
  scheduleReminder,
  showToast,
} from './utils/notifications.js';
import { cleanupOldEntries } from './utils/storage.js';
import { initScrollAnimations } from './utils/animations.js';

// ============================================================
// 0. INIT THEME (avant tout pour éviter flash)
// ============================================================
initTheme();

// ============================================================
// 1. APP START → loading screen uniquement
// ============================================================
setLoading(true);
render('app-start');

// ⭐ Flag pour ignorer le premier fire null de Firebase (race condition)
let authResolved = false;
let authResolveTimer = null;

// Fallback: if app doesn't load in 15s, show error (but do NOT force landing page)
setTimeout(() => {
  const ls = document.getElementById('app-loading-screen');
  const status = document.getElementById('loading-status');
  if (ls && ls.style.display !== 'none') {
    if (status) status.textContent = 'Chargement lent... Vérifie ta connexion.';
    console.warn('[APP] Loading timeout — Firebase may be slow');
    // ⚠️ Do NOT force landing page here — let appState handle routing
    // Only hide loading screen if Firebase truly never responded
    if (!authResolved) {
      authResolved = true;
      ls.style.display = 'none';
      // Show the appropriate view based on hasSeenLanding
      const hasSeen = localStorage.getItem('hasSeenLanding') === '1';
      updateAppState({ loading: false, isAuthenticated: false, hasSeenLanding: hasSeen });
    }
  }
}, 15000);

// ============================================================
// 2. INIT FIREBASE (dynamic imports — resilient to CDN failures)
// ============================================================
let firebaseApp, auth, db;
let firebaseAvailable = false;

try {
  // Dynamic import: if CDN is down or version doesn't exist,
  // only this try/catch fails — the rest of the app still works
  const [appModule, dbModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js"),
  ]);

  firebaseApp = appModule.initializeApp(firebaseConfig);
  db = dbModule.getDatabase(firebaseApp);
  initDatabase(db, dbModule.ref, dbModule.set, dbModule.get);

  // Init auth via auth.js (which uses its own dynamic import)
  auth = await initAuth(firebaseApp);
  firebaseAvailable = true;

} catch (e) {
  console.error('[APP] Firebase init failed (dynamic import):', e);
  const status = document.getElementById('loading-status');
  if (status) status.textContent = 'Connexion impossible. Mode hors-ligne...';
  // Still allow app to function in offline mode — show landing page
  const loadingScreen = document.getElementById('app-loading-screen');
  if (loadingScreen) loadingScreen.style.display = 'none';
  updateAppState({ loading: false, isAuthenticated: false });
  // Do NOT throw — allow the app to continue in offline/landing mode
}

cleanupOldEntries();

// ⭐ NE PAS cacher le loading screen ici — attendre que l'auth soit résolu
// Le loading screen sera caché par le auth listener ou le fallback

console.log(`${APP_NAME} v${APP_VERSION} initialized`);

// ============================================================
// 3. INIT MODULES
// ============================================================
initOnboarding();
bindGlobalEvents();

// ============================================================
// 4. GLOBAL ERROR HANDLER
// ============================================================
window.addEventListener('error', (event) => {
  console.error('[GLOBAL ERROR]', event.error || event.message);
  showToast('Une erreur est survenue. Réessaie.');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]', event.reason);
  showToast('Erreur réseau. Vérifie ta connexion.');
});

// ============================================================
// 5. AUTH STATE LISTENER = SEULE source de décision de flow
// ============================================================
if (firebaseAvailable) {
try {
setupAuthListener(async (user) => {
  console.log('[AUTH] User changed:', user ? user.email : 'null', '| authResolved:', authResolved);

  // ⭐ IMPORTANT : Firebase onAuthStateChanged tire TOUJOURS avec null en premier
  // avant de résoudre avec l'utilisateur réel (si session existe).
  // On ignore ce premier fire null pour éviter un flash vers la landing page.
  if (!user && !authResolved) {
    console.log('[AUTH] Ignoring initial null fire (Firebase session check)');
    // Ne PAS afficher la landing page — attendre que Firebase résolve
    // le vrai état d'auth dans les prochaines millisecondes
    
    // ⭐ Safety: si après 5s on n'a toujours pas de user, c'est qu'on est vraiment
    // pas connecté — on accepte le null (increased from 3s to 5s for slower connections)
    if (!authResolveTimer) {
      authResolveTimer = setTimeout(() => {
        if (!authResolved) {
          console.log('[AUTH] Auth resolve timeout (5s) — user is truly not authenticated');
          authResolved = true;
          // Cacher le loading screen
          const ls = document.getElementById('app-loading-screen');
          if (ls) ls.style.display = 'none';
          // Respect hasSeenLanding from localStorage
          const hasSeen = localStorage.getItem('hasSeenLanding') === '1';
          updateAppState({ loading: false, isAuthenticated: false, hasSeenLanding: hasSeen });
        }
      }, 5000);
    }
    return;
  }

  // ⭐ Marquer l'auth comme résolu (on a eu au moins une réponse non-null,
  // ou un null après le premier fire)
  if (!authResolved) {
    authResolved = true;
    if (authResolveTimer) {
      clearTimeout(authResolveTimer);
      authResolveTimer = null;
    }
  }

  if (!user) {
    // ===== UTILISATEUR VRAIMENT NON CONNECTÉ (pas un race condition) =====
    setCurrentUser(null);
    setUserData(null);
    resetState();

    // ⭐ Reset hasSeenLanding pour re-voir la landing après déconnexion
    // But only if this is a real logout, not a page refresh without session
    // We check if we had previously seen the landing to avoid showing it
    // again on refresh when user was already on login page
    try { localStorage.removeItem('hasSeenLanding'); } catch(e) {}

    // Cacher le loading screen
    const ls = document.getElementById('app-loading-screen');
    if (ls) ls.style.display = 'none';

    updateAppState({
      isAuthenticated: false,
      onboardingCompleted: false,
      hasSeenLanding: false,
      loading: false,
    });
    return;
  }

  // ===== UTILISATEUR CONNECTÉ =====

  // 1. Pendant le chargement des données : loading
  setCurrentUser(user);
  resetState();

  // 2. Charger les données depuis Firebase
  try {
    await Promise.all([
      loadUserData(user.uid),
      loadUserMeta(user.uid),
    ]);
  } catch (e) {
    console.warn('Chargement données échoué :', e);
  }

  await checkWeekReset();
  updateAvatar(user);

  // 3. Décider : onboarding terminé ou pas ?
  const state = getState();
  const hasProfile = !!(state && state.profile && state.profile.goal);
  const hasProgram = !!(state && state.program && Array.isArray(state.program) && state.program.length === 7);
  const onboardingDone = hasProfile && hasProgram;

  console.log('[FLOW] hasProfile:', hasProfile, '| hasProgram:', hasProgram, '→ onboardingDone:', onboardingDone);

  // 4. Préparer l'UI selon le cas
  if (onboardingDone) {
    renderHome();
    scheduleReminder();
    setSubPage('home');
  } else {
    resetOnboardingUI();
  }

  // 5. Cacher le loading screen AVANT le render final
  const ls = document.getElementById('app-loading-screen');
  if (ls) ls.style.display = 'none';

  // 6. UN SEUL update final → render
  updateAppState({
    isAuthenticated: true,
    onboardingCompleted: onboardingDone,
    loading: false,
  });

  // 7. Init bottom nav
  initBottomNav();

  // 8. Init scroll animations (landing page)
  initScrollAnimations();
});
} catch (e) {
  console.warn('[APP] Auth listener not set up (Firebase unavailable):', e.message);
  // Show landing page for non-authenticated users
  const ls = document.getElementById('app-loading-screen');
  if (ls) ls.style.display = 'none';
  updateAppState({ loading: false, isAuthenticated: false });
}
} else {
  // Firebase not available — already handled above
}

// ============================================================
// 6. EVENT LISTENERS GLOBAUX
// ============================================================
function bindGlobalEvents() {
  // ⭐ Init sidebar + theme buttons + coach IA
  initSidebar();
  bindThemeButtons();

  // Theme toggle switch (header) — Liquid Glass pill toggle
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    updateThemeToggleIcon();
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      // Cycle: auto → dark → light → auto
      let next;
      if (current === 'auto' || !current) {
        next = 'dark';
      } else if (current === 'dark') {
        next = 'light';
      } else {
        next = 'auto';
      }
      applyTheme(next);
      updateThemeToggleIcon();
      // Animate the pill with squash effect
      const pill = themeToggleBtn.querySelector('.theme-toggle-pill');
      if (pill) {
        pill.classList.remove('animating');
        void pill.offsetWidth;
        pill.classList.add('animating');
        pill.addEventListener('animationend', () => pill.classList.remove('animating'), { once: true });
      }
      // Haptic feedback
      try { if (navigator.vibrate) navigator.vibrate(8); } catch(e) {}
    });
    // Keyboard support
    themeToggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        themeToggleBtn.click();
      }
    });
  }

  initCoach();
  initDraggableFab();
  initNutrition();
  initChallenges();

  // Listener pour navigation custom (sidebar → pages spéciales)
  window.addEventListener('opt:nav', (e) => {
    const page = e.detail?.page;
    if (page === 'nutrition') {
      setSubPage('nutrition');
      renderNutrition();
      window.scrollTo(0, 0);
      // Update bottom nav active tab
      import('./features/bottomNav.js').then(mod => { if (mod.setActiveBottomTab) mod.setActiveBottomTab('nutrition'); });
    } else if (page === 'challenges') {
      setSubPage('challenges');
      renderChallenges();
      window.scrollTo(0, 0);
      import('./features/bottomNav.js').then(mod => { if (mod.setActiveBottomTab) mod.setActiveBottomTab('challenges'); });
    }
  });

  // ⭐ Landing page CTAs
  on('landing-cta-start', 'click', () => setHasSeenLanding(true));
  on('landing-cta-login', 'click', () => setHasSeenLanding(true));
  on('landing-cta-final', 'click', () => setHasSeenLanding(true));
  on('landing-pricing-free', 'click', () => setHasSeenLanding(true));
  on('landing-pricing-premium', 'click', () => setHasSeenLanding(true));

  on('btn-google', 'click', loginGoogle);
  on('btn-email-action', 'click', handleEmailAuth);
  on('toggle-mode', 'click', toggleAuthMode);
  on('btn-logout', 'click', confirmLogout);

  // ⭐ Password reset
  on('btn-forgot-password', 'click', handlePasswordReset);

  // ⭐ Account deletion
  on('btn-delete-account', 'click', handleDeleteAccount);

  on('input-password', 'keydown', e => { if (e.key === 'Enter') handleEmailAuth(); });
  on('input-password2', 'keydown', e => { if (e.key === 'Enter') handleEmailAuth(); });
  on('input-email', 'keydown', e => {
    if (e.key === 'Enter') document.getElementById('input-password').focus();
  });

  on('settings-btn', 'click', openSettings);

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  on('btn-back-home', 'click', goHome);
  on('btn-complete-workout', 'click', completeWorkout);

  on('btn-close-settings', 'click', closeSettings);
  on('set-reminders', 'change', toggleReminders);
  on('set-time', 'change', saveSettings);
  on('set-sound', 'change', saveSettings);
  on('set-vibrate', 'change', saveSettings);
  on('settings-modal', 'click', e => { if (e.target === e.currentTarget) closeSettings(); });

  on('btn-timer-minus', 'click', () => addTimerTime(-15));
  on('btn-timer-plus', 'click', () => addTimerTime(15));
  on('timer-pause', 'click', toggleTimer);
  on('btn-timer-cancel', 'click', closeTimer);

  on('btn-close-ex-info', 'click', closeExInfo);
  on('ex-info-modal', 'click', e => { if (e.target === e.currentTarget) closeExInfo(); });

  on('btn-close-badge', 'click', closeBadgeModal);
  on('badge-modal', 'click', e => { if (e.target === e.currentTarget) closeBadgeModal(); });

  // Refaire le questionnaire (custom modal)
  on('btn-reset-profile', 'click', async () => {
    const { confirmModal } = await import('./utils/notifications.js');
    const confirmed = await confirmModal('Refaire le questionnaire ? Ton historique et tes badges seront conservés.', {
      title: 'Refaire le questionnaire',
      confirmText: 'Refaire',
      cancelText: 'Annuler',
    });
    if (!confirmed) return;
    const state = getState();
    state.profile = null;
    state.program = null;
    await saveImmediate();
    resetOnboardingUI();
    setOnboardingCompleted(false);
  });
}

function updateThemeToggleIcon() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const current = document.documentElement.getAttribute('data-theme');
  const isDark = current === 'dark' || (current === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const sunIcon = btn.querySelector('.theme-icon-sun');
  const moonIcon = btn.querySelector('.theme-icon-moon');
  if (sunIcon && moonIcon) {
    // Dark mode: sun is active (click to go light), Light mode: moon is active (click to go dark)
    sunIcon.classList.toggle('active', isDark);
    moonIcon.classList.toggle('active', !isDark);
  }
  // Update ARIA
  btn.setAttribute('aria-checked', !isDark);
  btn.setAttribute('aria-label', isDark ? 'Passer en mode clair' : 'Passer en mode sombre');
  // Also update sidebar theme buttons
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === current);
  });
}

// ============================================================
// SECURITY
// ============================================================
if (!window.location.hostname.includes('localhost')) {
  try { Object.freeze(Object.prototype); } catch (e) {}
}

// ============================================================
// DRAGGABLE COACH FAB
// ============================================================
function initDraggableFab() {
  const fab = document.getElementById('coach-fab');
  if (!fab) return;

  let isDragging = false;
  let startX, startY, initialX, initialY;
  let hasMoved = false;

  function onStart(e) {
    isDragging = true;
    hasMoved = false;
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    const rect = fab.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    fab.style.transition = 'none';
    fab.style.cursor = 'grabbing';
  }

  function onMove(e) {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
    const newX = initialX + dx;
    const newY = initialY + dy;
    fab.style.position = 'fixed';
    fab.style.left = newX + 'px';
    fab.style.top = newY + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
    e.preventDefault();
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;
    fab.style.cursor = 'grab';
    fab.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    // Snap to nearest edge
    const rect = fab.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const snapX = rect.left + rect.width / 2 < vw / 2 ? 16 : vw - rect.width - 16;
    fab.style.left = snapX + 'px';
    fab.style.right = 'auto';

    // Keep within vertical bounds
    const minY = 80;
    const maxY = vh - rect.height - 80;
    const currentTop = rect.top;
    const clampedTop = Math.max(minY, Math.min(maxY, currentTop));
    fab.style.top = clampedTop + 'px';
    fab.style.bottom = 'auto';
  }

  fab.addEventListener('mousedown', onStart);
  fab.addEventListener('touchstart', onStart, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onEnd);
  window.addEventListener('touchend', onEnd);

  // Override click to only open if not dragging
  const originalClick = fab.onclick;
  fab.addEventListener('click', (e) => {
    if (hasMoved) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
}

// ============================================================
// HELPER
// ============================================================
function on(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

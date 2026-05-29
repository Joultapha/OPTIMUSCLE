/* ============================================================
   OPTIMUSCLE — Entry point (utilise appState UNIQUEMENT)
   ============================================================
   Cette version ne touche PLUS jamais au DOM des pages directement.
   Toute décision de rendu passe par appState.render()
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

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
import { initTheme, bindThemeButtons, bindLiquidSwitcher, applyTheme } from './features/theme.js';
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

// ============================================================
// 2. INIT FIREBASE
// ============================================================
const firebaseApp = initializeApp(firebaseConfig);
const auth = await initAuth(firebaseApp);
const db = getDatabase(firebaseApp);
initDatabase(db, ref, set, get);

cleanupOldEntries();
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
setupAuthListener(async (user) => {
  console.log('[AUTH] User changed:', user ? user.email : 'null');

  if (!user) {
    // ===== UTILISATEUR NON CONNECTÉ → LANDING (puis LOGIN) =====
    setCurrentUser(null);
    setUserData(null);
    resetState();

    // ⭐ Reset hasSeenLanding pour re-voir la landing après déconnexion
    try { localStorage.removeItem('hasSeenLanding'); } catch(e) {}

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
  setLoading(true);
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

  // 5. UN SEUL update final → render
  updateAppState({
    isAuthenticated: true,
    onboardingCompleted: onboardingDone,
    loading: false,
  });

  // 6. Init bottom nav après le premier render
  initBottomNav();

  // 7. Init scroll animations (landing page)
  initScrollAnimations();
});

// ============================================================
// 6. EVENT LISTENERS GLOBAUX
// ============================================================
function bindGlobalEvents() {
  // ⭐ Init sidebar + theme buttons + coach IA
  initSidebar();
  bindThemeButtons();

  // Apple Liquid Glass Theme Switcher
  bindLiquidSwitcher();

  initCoach();
  initDraggableFab();
  initNutrition();
  initChallenges();

  // Listener pour navigation custom (sidebar → pages spéciales)
  window.addEventListener('opt:nav', (e) => {
    const page = e.detail?.page;
    if (page === 'nutrition') {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-nutrition')?.classList.add('active');
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      renderNutrition();
      window.scrollTo(0, 0);
    } else if (page === 'challenges') {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-challenges')?.classList.add('active');
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      renderChallenges();
      window.scrollTo(0, 0);
    }
  });

  // ⭐ Landing page CTAs
  on('landing-cta-start', 'click', () => setHasSeenLanding(true));
  on('landing-cta-login', 'click', () => setHasSeenLanding(true));
  on('landing-cta-final', 'click', () => setHasSeenLanding(true));

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

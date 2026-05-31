/* ============================================================
   OPTIMUSCLE — Entry point (utilise appState UNIQUEMENT)
   ============================================================
   Cette version ne touche PLUS jamais au DOM des pages directement.
   Toute décision de rendu passe par appState.render()

   ⭐ ROBUSTESSE :
   - Firebase est chargé dynamiquement (pas de blocage si CDN down)
   - Chaque init() est wrappé dans try/catch (un crash n'en empêche pas un autre)
   - Les CTAs landing sont bindés IMMÉDIATEMENT (pas besoin d'attendre Firebase)
   - Fallbacks multiples pour cacher le loading screen
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
import { PLANS, setDevPlan, isDevMode, getDevPlan, verifyDevPin, markDevVerified, isDevVerified, revokeDevVerification, getTodayDevPin } from './saas/subscription.js';
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

// ⭐ CRITICAL: Check if fallback already showed landing page
// If the inline fallback already set data-view to something other than "loading",
// DON'T override it back to loading — that causes the stuck loading screen
if (window.__optFallbackFired) {
  console.log('[APP] Fallback already fired — skipping setLoading(true)');
} else {
  setLoading(true);
  render('app-start');
}

// ⭐ NE PAS mettre __appReady = true ici !
// On le mettra seulement quand l'app est VRAIMENT prête.
// Sinon le fallback inline pense que l'app est chargée.

// ⭐ Flag pour ignorer le premier fire null de Firebase (race condition)
let authResolved = false;
let authResolveTimer = null;
let globalEventsBound = false;

// ⭐ Helper : cacher le loading screen de façon fiable
function hideLoadingScreen(reason) {
  const ls = document.getElementById('app-loading-screen');
  if (ls) {
    const isVisible = getComputedStyle(ls).display !== 'none';
    if (isVisible) {
      ls.style.setProperty('display', 'none', 'important');
      console.log('[APP] Loading screen hidden — reason:', reason);
    }
  }
  // ⭐ Signal to inline fallback that app is ready
  window.__appReady = true;
  // ⭐ Signal that loading was dismissed so app.js doesn't re-show it
  window.__optFallbackFired = true;
}

// ⭐ Bind landing page CTAs IMMEDIATELY (before Firebase)
// This way, even if Firebase takes 10s, the landing buttons work right away
function bindLandingCTAs() {
  on('landing-cta-start', 'click', () => setHasSeenLanding(true));
  on('landing-cta-login', 'click', () => setHasSeenLanding(true));
  on('landing-cta-final', 'click', () => setHasSeenLanding(true));
  on('landing-pricing-free', 'click', () => setHasSeenLanding(true));
  on('landing-pricing-premium', 'click', () => setHasSeenLanding(true));
}
bindLandingCTAs();

// Fallback: if app doesn't resolve in 4s, force hide loading screen
setTimeout(() => {
  const ls = document.getElementById('app-loading-screen');
  const status = document.getElementById('loading-status');
  const retryBtn = document.getElementById('loading-retry-btn');
  const isVisible = ls && getComputedStyle(ls).display !== 'none';
  if (isVisible) {
    if (status) status.textContent = 'Chargement lent... Vérifie ta connexion.';
    if (retryBtn) retryBtn.style.display = 'block';
    console.warn('[APP] Loading timeout (4s) — Firebase may be slow');
    if (!authResolved) {
      authResolved = true;
      hideLoadingScreen('4s-timeout');
      const hasSeen = localStorage.getItem('hasSeenLanding') === '1';
      // ⭐ FIX: Pour les utilisateurs qui reviennent, ne PAS forcer isAuthenticated: false
      // Cela évite le flash landing → dashboard. On garde loading: false mais on
      // attend que Firebase résolve l'auth correctement au lieu de forcer un état.
      if (hasSeen) {
        // Utilisateur connu : on affiche l'état "reconnecting" (spinner)
        // au lieu de la landing page, en attendant que Firebase résolve l'auth
        updateAppState({ loading: false, hasSeenLanding: hasSeen, reconnecting: true });
      } else {
        // Nouvel utilisateur : montrer la landing/login
        updateAppState({ loading: false, isAuthenticated: false, hasSeenLanding: hasSeen });
      }
    }
  }
}, 4000);

// ============================================================
// 2. INIT FIREBASE (dynamic imports — resilient to CDN failures)
// ============================================================
let firebaseApp, auth, db;
let firebaseAvailable = false;

try {
  // Dynamic import: if CDN is down or version doesn't exist,
  // only this try/catch fails — the rest of the app still works
  // ⭐ Reduced timeout to 5s (was 10s) — don't hang forever on slow CDN
  const firebasePromise = Promise.all([
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js"),
  ]);
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Firebase CDN timeout (5s)')), 5000)
  );
  
  const [appModule, dbModule] = await Promise.race([firebasePromise, timeoutPromise]);

  firebaseApp = appModule.initializeApp(firebaseConfig);
  db = dbModule.getDatabase(firebaseApp);
  initDatabase(db, dbModule.ref, dbModule.set, dbModule.get);

  // Init auth via auth.js (which uses its own dynamic import)
  auth = await initAuth(firebaseApp);
  firebaseAvailable = true;

} catch (e) {
  console.error('[APP] Firebase init failed:', e.message || e);
  firebaseAvailable = false;
  const status = document.getElementById('loading-status');
  if (status) status.textContent = 'Mode hors-ligne...';
  // Still allow app to function in offline mode — show landing page
  hideLoadingScreen('firebase-failed');
  const hasSeen = localStorage.getItem('hasSeenLanding') === '1';
  updateAppState({ loading: false, isAuthenticated: false, hasSeenLanding: hasSeen });
  // Do NOT throw — allow the app to continue in offline/landing mode
}

cleanupOldEntries();

console.log(`${APP_NAME} v${APP_VERSION} initialized (Firebase: ${firebaseAvailable ? 'OK' : 'OFFLINE'})`);

// ============================================================
// 3. INIT MODULES (chaque init est wrappé dans try/catch)
// ============================================================
try { initOnboarding(); } catch (e) { console.error('[APP] initOnboarding failed:', e); }
try { bindGlobalEvents(); } catch (e) { console.error('[APP] bindGlobalEvents failed:', e); }

// ============================================================
// 4. GLOBAL ERROR HANDLER
// ============================================================
window.addEventListener('error', (event) => {
  console.error('[GLOBAL ERROR]', event.error || event.message);
  try { showToast('Une erreur est survenue. Réessaie.'); } catch (e) {}
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]', event.reason);
  try { showToast('Erreur réseau. Vérifie ta connexion.'); } catch (e) {}
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
    
    // ⭐ Safety: si après 2s on n'a toujours pas de user, c'est qu'on est vraiment
    // pas connecté — on accepte le null
    if (!authResolveTimer) {
      authResolveTimer = setTimeout(() => {
        if (!authResolved) {
          console.log('[AUTH] Auth resolve timeout (2s) — user is truly not authenticated');
          authResolved = true;
          hideLoadingScreen('auth-2s-timeout');
          const hasSeen = localStorage.getItem('hasSeenLanding') === '1';
          updateAppState({ loading: false, isAuthenticated: false, hasSeenLanding: hasSeen });
        }
      }, 2000);
    }
    return;
  }

  // ⭐ Marquer l'auth comme résolu
  if (!authResolved) {
    authResolved = true;
    if (authResolveTimer) {
      clearTimeout(authResolveTimer);
      authResolveTimer = null;
    }
  }

  if (!user) {
    // ===== UTILISATEUR VRAIMENT NON CONNECTÉ =====
    setCurrentUser(null);
    setUserData(null);
    resetState();

    // Reset hasSeenLanding après déconnexion
    try { localStorage.removeItem('hasSeenLanding'); } catch(e) {}

    hideLoadingScreen('auth-null-user');
    updateAppState({
      isAuthenticated: false,
      onboardingCompleted: false,
      hasSeenLanding: false,
      loading: false,
      reconnecting: false,
    });
    return;
  }

  // ===== UTILISATEUR CONNECTÉ =====
  setCurrentUser(user);
  resetState();

  // Charger les données depuis Firebase
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

  // Décider : onboarding terminé ou pas ?
  const state = getState();
  const hasProfile = !!(state && state.profile && state.profile.goal);
  const hasProgram = !!(state && state.program && Array.isArray(state.program) && state.program.length === 7);
  const onboardingDone = hasProfile && hasProgram;

  console.log('[FLOW] hasProfile:', hasProfile, '| hasProgram:', hasProgram, '→ onboardingDone:', onboardingDone);

  if (onboardingDone) {
    renderHome();
    scheduleReminder();
    setSubPage('home');
  } else {
    resetOnboardingUI();
  }

  hideLoadingScreen('auth-user-ready');

  updateAppState({
    isAuthenticated: true,
    onboardingCompleted: onboardingDone,
    loading: false,
    reconnecting: false,
  });

  try { initBottomNav(); } catch (e) { console.error('[APP] initBottomNav failed:', e); }
  try { initScrollAnimations(); } catch (e) { console.error('[APP] initScrollAnimations failed:', e); }
});
} catch (e) {
  console.warn('[APP] Auth listener not set up (Firebase unavailable):', e.message);
  hideLoadingScreen('auth-listener-failed');
  updateAppState({ loading: false, isAuthenticated: false });
}
} else {
  // Firebase not available — already handled above
}

// ============================================================
// 6. EVENT LISTENERS GLOBAUX
// ============================================================
function bindGlobalEvents() {
  if (globalEventsBound) return;
  globalEventsBound = true;

  // ⭐ Init sidebar + theme buttons + coach IA
  // Chaque init est wrappé dans try/catch pour qu'un crash
  // n'empêche pas les autres de s'initialiser
  try { initSidebar(); } catch (e) { console.error('[APP] initSidebar failed:', e); }
  try { bindThemeButtons(); } catch (e) { console.error('[APP] bindThemeButtons failed:', e); }

  // Theme toggle switch (header) — Liquid Glass pill toggle
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    updateThemeToggleIcon();
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
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
      const pill = themeToggleBtn.querySelector('.theme-toggle-pill');
      if (pill) {
        pill.classList.remove('animating');
        void pill.offsetWidth;
        pill.classList.add('animating');
        pill.addEventListener('animationend', () => pill.classList.remove('animating'), { once: true });
      }
      try { if (navigator.vibrate) navigator.vibrate(8); } catch(e) {}
    });
    themeToggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        themeToggleBtn.click();
      }
    });
  }

  try { initCoach(); } catch (e) { console.error('[APP] initCoach failed:', e); }
  try { initDraggableFab(); } catch (e) { console.error('[APP] initDraggableFab failed:', e); }
  try { initNutrition(); } catch (e) { console.error('[APP] initNutrition failed:', e); }
  try { initChallenges(); } catch (e) { console.error('[APP] initChallenges failed:', e); }
  try { initDevMode(); } catch (e) { console.error('[APP] initDevMode failed:', e); }

  // Listener pour navigation custom (sidebar → pages spéciales)
  window.addEventListener('opt:nav', (e) => {
    const page = e.detail?.page;
    if (page === 'nutrition') {
      setSubPage('nutrition');
      renderNutrition();
      window.scrollTo(0, 0);
      import('./features/bottomNav.js').then(mod => { if (mod.setActiveBottomTab) mod.setActiveBottomTab('nutrition'); });
    } else if (page === 'challenges') {
      setSubPage('challenges');
      renderChallenges();
      window.scrollTo(0, 0);
      import('./features/bottomNav.js').then(mod => { if (mod.setActiveBottomTab) mod.setActiveBottomTab('challenges'); });
    }
  });

  // Auth buttons
  on('btn-google', 'click', loginGoogle);
  on('btn-email-action', 'click', handleEmailAuth);
  on('toggle-mode', 'click', toggleAuthMode);
  on('btn-logout', 'click', confirmLogout);

  on('btn-forgot-password', 'click', handlePasswordReset);
  on('btn-delete-account', 'click', handleDeleteAccount);

  on('input-password', 'keydown', e => { if (e.key === 'Enter') handleEmailAuth(); });
  on('input-password2', 'keydown', e => { if (e.key === 'Enter') handleEmailAuth(); });
  on('input-email', 'keydown', e => {
    if (e.key === 'Enter') document.getElementById('input-password')?.focus();
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
    sunIcon.classList.toggle('active', isDark);
    moonIcon.classList.toggle('active', !isDark);
  }
  btn.setAttribute('aria-checked', !isDark);
  btn.setAttribute('aria-label', isDark ? 'Passer en mode clair' : 'Passer en mode sombre');
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === current);
  });
}

// ============================================================
// SECURITY
// ============================================================
// ⭐ REMOVED: Object.freeze(Object.prototype) was breaking Firebase
// initialization and other libraries that extend Object.prototype.
// This caused the loading screen to be permanently stuck on GitHub Pages.
// Real security comes from Firebase Rules + server-side validation.

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

    const rect = fab.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const snapX = rect.left + rect.width / 2 < vw / 2 ? 16 : vw - rect.width - 16;
    fab.style.left = snapX + 'px';
    fab.style.right = 'auto';

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

// ============================================================
// DEV MODE — 5 taps on logo → PIN → dev panel
// ============================================================
let devTapCount = 0;
let devTapTimer = null;

function initDevMode() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev') === '1') {
    console.log('[DEV] Mode dev détecté via URL — PIN requis');
    setTimeout(() => showDevPinInput(), 2000);
  }

  // 5 taps on logo → PIN input
  const logoEl = document.getElementById('app-logo') || document.querySelector('.sidebar-logo');
  if (logoEl) {
    logoEl.addEventListener('click', () => {
      devTapCount++;
      if (devTapTimer) clearTimeout(devTapTimer);
      devTapTimer = setTimeout(() => { devTapCount = 0; }, 1500);
      if (devTapCount >= 5) {
        devTapCount = 0;
        showDevPinInput();
      }
    });
  }

  // Also support 5 taps on the hero greeting
  const heroGreeting = document.getElementById('hero-greeting');
  if (heroGreeting) {
    heroGreeting.addEventListener('click', () => {
      devTapCount++;
      if (devTapTimer) clearTimeout(devTapTimer);
      devTapTimer = setTimeout(() => { devTapCount = 0; }, 1500);
      if (devTapCount >= 5) {
        devTapCount = 0;
        showDevPinInput();
      }
    });
  }
}

/**
 * Affiche la boîte de saisie du PIN pour le mode dev.
 * Si déjà authentifié, ouvre directement le panneau dev.
 */
function showDevPinInput() {
  if (isDevVerified()) {
    showDevPanel();
    return;
  }

  const existing = document.getElementById('dev-pin-modal');
  if (existing) { existing.remove(); return; }

  if (!document.getElementById('dev-shake-keyframe')) {
    const style = document.createElement('style');
    style.id = 'dev-shake-keyframe';
    style.textContent = `
      @keyframes devShake {
        0%, 100% { transform: translate(-50%, -50%); }
        10%, 50%, 90% { transform: translate(calc(-50% + 8px), -50%); }
        30%, 70% { transform: translate(calc(-50% - 8px), -50%); }
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = 'dev-pin-modal';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  `;

  const card = document.createElement('div');
  card.id = 'dev-pin-card';
  card.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #1a1a2e; border: 2px solid #7c3aed;
    border-radius: 16px; padding: 28px 24px; min-width: 280px; max-width: 340px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5); text-align: center;
  `;

  card.innerHTML = `
    <div style="font-size: 28px; margin-bottom: 8px;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <h3 style="margin: 0 0 4px; color: #7c3aed; font-size: 16px;">Accès développeur</h3>
    <p style="color: #888; font-size: 12px; margin: 0 0 20px;">PIN qui change tous les jours — entre le code du jour</p>
    <input id="dev-pin-input" type="password" inputmode="numeric" maxlength="6" placeholder="····" autocomplete="off" style="
      width: 100%; padding: 14px 16px; border-radius: 10px;
      border: 1.5px solid #333; background: #222; color: #fff;
      font-size: 20px; text-align: center; letter-spacing: 8px;
      outline: none; box-sizing: border-box;
      transition: border-color 0.2s;
    " />
    <div id="dev-pin-error" style="color: #ef4444; font-size: 12px; margin-top: 8px; min-height: 18px;"></div>
    <button id="dev-pin-submit" style="
      width: 100%; padding: 12px; border-radius: 10px; border: none;
      background: #7c3aed; color: #fff; font-size: 14px; font-weight: 600;
      cursor: pointer; margin-top: 12px;
      transition: background 0.2s;
    ">Déverrouiller</button>
    <button id="dev-pin-cancel" style="
      width: 100%; padding: 8px; border-radius: 8px; border: none;
      background: none; color: #888; font-size: 12px; cursor: pointer; margin-top: 8px;
    ">Annuler</button>
    <p style="color: #444; font-size: 9px; margin: 16px 0 0;">PIN change tous les jours · Expire après 2h</p>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const pinInput = document.getElementById('dev-pin-input');
  const errorEl = document.getElementById('dev-pin-error');
  const submitBtn = document.getElementById('dev-pin-submit');

  setTimeout(() => pinInput?.focus(), 200);

  pinInput?.addEventListener('focus', () => {
    pinInput.style.borderColor = '#7c3aed';
  });
  pinInput?.addEventListener('blur', () => {
    pinInput.style.borderColor = '#333';
  });

  const handleSubmit = () => {
    const pin = pinInput?.value?.trim();
    if (!pin) {
      errorEl.textContent = 'Entre un code PIN';
      return;
    }
    if (verifyDevPin(pin)) {
      markDevVerified();
      overlay.remove();
      showToast('Mode dev activé (expire dans 2h)');
      showDevPanel();
    } else {
      errorEl.textContent = 'Code incorrect';
      pinInput.value = '';
      pinInput.focus();
      card.style.animation = 'devShake 0.4s ease';
      setTimeout(() => { card.style.animation = ''; }, 400);
      pinInput.style.borderColor = '#ef4444';
      setTimeout(() => { pinInput.style.borderColor = '#333'; }, 1500);
    }
  };

  submitBtn?.addEventListener('click', handleSubmit);
  pinInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmit(); });
  document.getElementById('dev-pin-cancel')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function showDevPanel() {
  const existing = document.getElementById('dev-panel');
  if (existing) { existing.remove(); return; }
  document.getElementById('dev-panel-backdrop')?.remove();

  const currentPlan = getDevPlan();
  const currentPlanId = currentPlan ? currentPlan.id : 'free';

  let expiryText = '';
  try {
    const data = JSON.parse(sessionStorage.getItem('opt_dev_verified'));
    if (data?.ts) {
      const remaining = Math.max(0, 2 * 60 * 60 * 1000 - (Date.now() - data.ts));
      const hours = Math.floor(remaining / 3600000);
      const mins = Math.floor((remaining % 3600000) / 60000);
      expiryText = `Expire dans ${hours}h${mins}m`;
    }
  } catch (e) {}

  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 99999; background: #1a1a2e; border: 2px solid #7c3aed;
    border-radius: 16px; padding: 24px; min-width: 300px; max-width: 360px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
  `;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0; color: #7c3aed; font-size: 16px;">DEV MODE</h3>
      <button id="dev-panel-close" style="background: none; border: none; color: #888; font-size: 20px; cursor: pointer; padding: 4px 8px;">✕</button>
    </div>
    <p style="color: #888; font-size: 12px; margin: 0 0 4px;">Simule n'importe quel plan. Survit au rechargement (sessionStorage).</p>
    <p style="color: #7c3aed88; font-size: 10px; margin: 0 0 16px;">${expiryText}</p>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button class="dev-plan-btn" data-plan="free" style="
        padding: 12px 16px; border-radius: 10px; border: 1.5px solid #333;
        background: ${currentPlanId === 'free' ? '#7c3aed22' : '#222'}; color: #fff;
        cursor: pointer; text-align: left; font-size: 14px;
        ${currentPlanId === 'free' ? 'border-color: #7c3aed;' : ''}
      ">
        <strong>Gratuit</strong> — 2 séances/sem, historique 7j
      </button>
      <button class="dev-plan-btn" data-plan="premium_monthly" style="
        padding: 12px 16px; border-radius: 10px; border: 1.5px solid #333;
        background: ${currentPlanId === 'premium_monthly' ? '#7c3aed22' : '#222'}; color: #fff;
        cursor: pointer; text-align: left; font-size: 14px;
        ${currentPlanId === 'premium_monthly' ? 'border-color: #7c3aed;' : ''}
      ">
        <strong>Premium (4,99€/mois)</strong> — Coach IA, programmes custom
      </button>
      <button class="dev-plan-btn" data-plan="premium_yearly" style="
        padding: 12px 16px; border-radius: 10px; border: 1.5px solid #333;
        background: ${currentPlanId === 'premium_yearly' ? '#7c3aed22' : '#222'}; color: #fff;
        cursor: pointer; text-align: left; font-size: 14px;
        ${currentPlanId === 'premium_yearly' ? 'border-color: #7c3aed;' : ''}
      ">
        <strong>Elite (39,99€/an)</strong> — Stats avancées, badge elite
      </button>
      <button class="dev-plan-btn" data-plan="premium_lifetime" style="
        padding: 12px 16px; border-radius: 10px; border: 1.5px solid #333;
        background: ${currentPlanId === 'premium_lifetime' ? '#7c3aed22' : '#222'}; color: #fff;
        cursor: pointer; text-align: left; font-size: 14px;
        ${currentPlanId === 'premium_lifetime' ? 'border-color: #7c3aed;' : ''}
      ">
        <strong>Lifetime (99,99€)</strong> — Tout, pour toujours
      </button>
    </div>
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #333;">
      <button id="dev-reset-btn" style="
        padding: 8px 16px; border-radius: 8px; border: 1px solid #ef4444;
        background: #ef444422; color: #ef4444; cursor: pointer; font-size: 12px; width: 100%;
      ">Reset (revenir au plan réel Firebase)</button>
    </div>
    <p style="color: #555; font-size: 10px; margin: 12px 0 0; text-align: center;">
      Plan actuel : <strong style="color: #7c3aed;">${PLANS[currentPlanId]?.name || 'Gratuit'}</strong>
    </p>
  `;

  document.body.appendChild(panel);

  const backdrop = document.createElement('div');
  backdrop.id = 'dev-panel-backdrop';
  backdrop.style.cssText = 'position: fixed; inset: 0; z-index: 99998; background: rgba(0,0,0,0.5);';
  backdrop.addEventListener('click', () => { panel.remove(); backdrop.remove(); });
  document.body.appendChild(backdrop);

  document.getElementById('dev-panel-close')?.addEventListener('click', () => {
    panel.remove();
    backdrop.remove();
  });

  panel.querySelectorAll('.dev-plan-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.dataset.plan;
      setDevPlan(planId);
      panel.remove();
      backdrop.remove();
      showToast(`Dev: plan changé → ${PLANS[planId]?.name || planId}`);
      setTimeout(() => window.location.reload(), 500);
    });
  });

  document.getElementById('dev-reset-btn')?.addEventListener('click', () => {
    revokeDevVerification();
    panel.remove();
    backdrop.remove();
    showToast('Dev: plan réinitialisé → plan Firebase réel');
    setTimeout(() => window.location.reload(), 500);
  });
}

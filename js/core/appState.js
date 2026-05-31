/* ============================================================
   OPTIMUSCLE — Source unique de vérité du flow utilisateur
   ============================================================

   ⚠️ RÈGLE D'OR :
   - PERSONNE ne manipule directement le DOM des pages principales
   - TOUT passe par render()
   - render() est la SEULE fonction qui décide quoi afficher

   ÉTAT DE L'APP :
     loading: true            → écran de chargement
     !isAuthenticated         → page login
     !onboardingCompleted     → questionnaire onboarding
     onboardingCompleted      → dashboard
*/

// ============================================================
// SOURCE UNIQUE DE VÉRITÉ
// ============================================================
const appState = {
  isAuthenticated: false,
  onboardingCompleted: false,
  loading: true,
  hasSeenLanding: false,  // ⭐ true = utilisateur a cliqué sur "Commencer"
  currentSubPage: 'home',  // home | history | badges | profile | workout
  reconnecting: false,      // ⭐ true = utilisateur qui revient, en attente de Firebase
};

// ============================================================
// GETTERS PURS (pas d'effet de bord)
// ============================================================

export function getAppState() {
  return { ...appState };
}

/**
 * Décide quelle vue afficher selon l'état utilisateur.
 * C'est la SEULE source de décision.
 *
 * @returns {"loading"|"login"|"onboarding"|"dashboard"}
 */
export function getCurrentView() {
  if (appState.loading) return 'loading';
  // ⭐ Reconnecting: utilisateur qui revient, en attente de Firebase
  // MAIS on impose un timeout max de 6s — après ça, on montre la page appropriée
  // pour éviter un écran de chargement permanent si Firebase est lent/down
  if (appState.reconnecting) return 'reconnecting';
  if (!appState.isAuthenticated) {
    // Si pas vu la landing → afficher landing d'abord
    return appState.hasSeenLanding ? 'login' : 'landing';
  }
  if (!appState.onboardingCompleted) return 'onboarding';
  return 'dashboard';
}

// ============================================================
// SETTERS (utilisent automatiquement render())
// ============================================================

export function setLoading(isLoading) {
  appState.loading = !!isLoading;
  render('setLoading:' + isLoading);
}

export function setAuthenticated(isAuth) {
  appState.isAuthenticated = !!isAuth;
  render('setAuthenticated:' + isAuth);
}

export function setOnboardingCompleted(isCompleted) {
  appState.onboardingCompleted = !!isCompleted;
  render('setOnboardingCompleted:' + isCompleted);
}

export function setHasSeenLanding(value) {
  appState.hasSeenLanding = !!value;
  // Persister pour ne pas re-voir la landing après refresh
  try { localStorage.setItem('hasSeenLanding', value ? '1' : '0'); } catch(e) {}
  render('setHasSeenLanding:' + value);
}

export function setSubPage(page) {
  const allowed = ['home', 'history', 'badges', 'profile', 'workout', 'training', 'nutrition', 'challenges'];
  if (!allowed.includes(page)) return;
  appState.currentSubPage = page;
  render('setSubPage:' + page);
}

/**
 * Met à jour plusieurs valeurs d'un coup et render UNE seule fois.
 */
export function updateAppState(updates) {
  let changed = false;
  for (const [key, value] of Object.entries(updates)) {
    if (key in appState && appState[key] !== value) {
      appState[key] = value;
      changed = true;
    }
  }
  if (changed) render('updateAppState');
}

// ============================================================
// LE RENDERER UNIQUE
// ============================================================

// ⭐ Charger hasSeenLanding depuis localStorage au boot
try {
  if (localStorage.getItem('hasSeenLanding') === '1') {
    appState.hasSeenLanding = true;
  }
} catch(e) {}

let renderInProgress = false;
let pendingRender = false;

/**
 * Fonction UNIQUE qui décide quoi afficher.
 *
 * Architecture :
 * - 1 attribut data-view sur body
 * - Le CSS gère qui est visible
 * - JS ne touche JAMAIS à .style.display des views
 */
// ⭐ Track last view to avoid unnecessary scroll/re-render
let lastRenderedView = null;
let lastRenderedSubPage = null;

export function render(reason = 'unknown') {
  // Évite les renders concurrents (boucle infinie)
  if (renderInProgress) {
    pendingRender = true;
    return;
  }

  renderInProgress = true;

  try {
    const view = getCurrentView();
    const subPage = appState.currentSubPage;
    const viewChanged = view !== lastRenderedView;
    const subPageChanged = subPage !== lastRenderedSubPage;

    // ⭐ Skip render si rien n'a changé (sauf si forcé)
    if (!viewChanged && !subPageChanged && reason !== 'manual' && reason !== 'updateAppState') {
      renderInProgress = false;
      return;
    }

    console.log(`[RENDER] reason="${reason}" → view="${view}" subPage="${subPage}"` +
      (viewChanged ? ' [VIEW CHANGED]' : '') +
      (subPageChanged ? ' [SUBPAGE CHANGED]' : ''));

    lastRenderedView = view;
    lastRenderedSubPage = subPage;

    // ⭐ UNE SEULE source de vérité visuelle : data-view sur body
    document.body.setAttribute('data-view', view);
    document.body.setAttribute('data-subpage', subPage);

    // Update les éléments visuels (active class) pour compat ancien CSS
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(p => p.classList.remove('active'));

    // Mapping subpage → page element ID
    const subpageToPage = {
      home: 'page-home',
      history: 'page-history',
      badges: 'page-badges',
      profile: 'page-profile',
      workout: 'page-workout',
      training: 'page-home',       // Training = home page content
      nutrition: 'page-nutrition',
      challenges: 'page-challenges',
    };

    // Définir quelle page-X doit être active
    const pageMap = {
      loading: null,
      reconnecting: null,  // Pas de page — loading screen persiste
      landing: null,  // géré séparément
      login: null,
      onboarding: 'page-onboarding',
      dashboard: subpageToPage[subPage] || 'page-home',
    };

    const pageId = pageMap[view];
    if (pageId) {
      const el = document.getElementById(pageId);
      if (el) el.classList.add('active');
    }

    // Login overlay
    const loginEl = document.getElementById('page-login');
    if (loginEl) {
      if (view === 'login') {
        loginEl.classList.remove('hidden');
      } else {
        loginEl.classList.add('hidden');
      }
    }

    // Header / settings : visibles UNIQUEMENT sur dashboard
    const showAppShell = (view === 'dashboard' && subPage !== 'workout');
    const showHeaderOnly = (view === 'dashboard' && subPage === 'workout');

    const headerEl = document.getElementById('app-header');
    const tabsEl = document.getElementById('tabs');
    const settingsEl = document.getElementById('settings-btn');
    const avatarEl = document.getElementById('user-avatar-wrap');

    if (headerEl) headerEl.style.display = (showAppShell || showHeaderOnly) ? 'flex' : 'none';
    // Old tabs toujours cachées — on utilise bottom-nav maintenant
    if (tabsEl) tabsEl.style.display = 'none';
    if (settingsEl) settingsEl.style.display = (showAppShell || showHeaderOnly) ? 'grid' : 'none';
    if (avatarEl) avatarEl.style.display = (showAppShell || showHeaderOnly) ? 'block' : 'none';

    // Tab actif (pour le visuel des tabs)
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === subPage);
    });

    // ⭐ Scroll en haut UNIQUEMENT quand la view principale change
    // (pas sur les changements de subpage — évite les sauts)
    if (viewChanged) {
      window.scrollTo(0, 0);
    }

  } catch (e) {
    console.error('[RENDER] Erreur:', e);
  } finally {
    renderInProgress = false;
    if (pendingRender) {
      pendingRender = false;
      // Re-render si une demande est arrivée pendant le rendu
      setTimeout(() => render('pending'), 0);
    }
  }
}

// ============================================================
// DEBUG (exposé sur window)
// ============================================================
if (typeof window !== 'undefined') {
  window.__appState = {
    get: getAppState,
    view: getCurrentView,
    render: () => render('manual'),
    setOnboarding: setOnboardingCompleted,
    setAuth: setAuthenticated,
    setLoading: setLoading,
  };
}

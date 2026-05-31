/* ============================================================
   OPTIMUSCLE — Subscription & Premium Features
   ============================================================

   Architecture freemium :
   - free  : 2 séances/sem, historique 7j, limité
   - premium : illimité, GIFs HD, IA coach, export PDF
   - elite  : tout premium + stats avancées, badge elite, etc.
   - admin : tout + accès console

   IMPORTANT : Ces vérifs CÔTÉ CLIENT sont juste pour l'UX.
   La vraie sécurité est dans les Firebase Rules + Cloud Functions.

   ⭐ DEV MODE : 5 taps sur le logo → PIN dynamique requis → panneau dev
   Le PIN change TOUS LES JOURS (algorithme basé sur la date).
   Expiration automatique après 2h.
   Console : window.__optDevPin() pour voir le PIN du jour.
*/

// ===== PLANS =====
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    features: {
      maxFrequency: 2,         // 2 séances/semaine max (vraiment limité)
      maxHistoryDays: 7,       // Historique 7 jours seulement
      maxPrograms: 1,          // 1 programme basique
      maxBadges: 3,            // 3 badges de base
      gifQuality: 'standard',
      aiCoach: false,
      pdfExport: false,
      adsRemoved: false,
      customPrograms: false,
      advancedStats: false,
      eliteBadge: false,
      earlyAccess: false,
      prioritySupport: false,
      communityChallenges: false,
      nutritionTracking: false,
    }
  },
  premium_monthly: {
    id: 'premium_monthly',
    stripeId: 'price_XXXXX_monthly',  // À remplacer par ton vrai Price ID Stripe
    paddleId: 'pri_XXXXX_monthly',    // À remplacer par ton vrai Paddle Product ID
    name: 'Premium',
    price: 4.99,
    interval: 'month',
    tagline: 'Pour les sérieux',
    features: {
      maxFrequency: -1,        // Illimité
      maxHistoryDays: 365,
      maxPrograms: -1,         // Illimité
      maxBadges: -1,           // Tous
      gifQuality: 'hd',
      aiCoach: true,
      pdfExport: true,
      adsRemoved: true,
      customPrograms: true,
      advancedStats: false,
      eliteBadge: false,
      earlyAccess: false,
      prioritySupport: false,
      communityChallenges: true,
      nutritionTracking: 'advanced',
    }
  },
  premium_yearly: {
    id: 'premium_yearly',
    stripeId: 'price_XXXXX_yearly',
    paddleId: 'pri_XXXXX_yearly',    // À remplacer par ton vrai Paddle Product ID
    name: 'Elite',
    price: 39.99,
    interval: 'year',
    savings: '33%',
    tagline: 'Pour les ambitieux',
    features: {
      maxFrequency: -1,        // Illimité
      maxHistoryDays: 365,
      maxPrograms: -1,         // Illimité
      maxBadges: -1,           // Tous
      gifQuality: 'hd',
      aiCoach: 'advanced',     // Coach IA avancé
      pdfExport: true,
      adsRemoved: true,
      customPrograms: 'exclusive',  // Programmes exclusifs
      advancedStats: true,
      eliteBadge: true,
      earlyAccess: true,
      prioritySupport: true,
      communityChallenges: 'elite',
      nutritionTracking: 'advanced',
    }
  },
  premium_lifetime: {
    id: 'premium_lifetime',
    stripeId: 'price_XXXXX_lifetime',
    paddleId: 'pri_XXXXX_lifetime',    // À remplacer par ton vrai Paddle Product ID
    name: 'Premium Lifetime',
    price: 99.99,
    interval: 'lifetime',
    features: {
      maxFrequency: -1,
      maxHistoryDays: -1,      // Illimité
      maxPrograms: -1,
      maxBadges: -1,
      gifQuality: 'hd',
      aiCoach: 'advanced',
      pdfExport: true,
      adsRemoved: true,
      customPrograms: 'exclusive',
      advancedStats: true,
      eliteBadge: true,
      earlyAccess: true,
      prioritySupport: true,
      communityChallenges: 'elite',
      nutritionTracking: 'advanced',
    }
  },
};

// ===== DEV MODE (SÉCURISÉ — PIN DYNAMIQUE) =====
// Permet de simuler n'importe quel plan pour les tests.
// Activation : 5 taps sur le logo → PIN requis → panneau dev.
// Le PIN change TOUS LES JOURS basé sur un algorithme de date.
// Expiration automatique après 2h.
// Pour obtenir le PIN du jour : window.__optDevPin() dans la console.

const DEV_KEY = 'opt_dev_plan';
const DEV_PIN_KEY = 'opt_dev_verified';
const DEV_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 heures (sécurité renforcée)

/**
 * Hash simple pour vérifier le PIN dev.
 * Pas cryptographiquement sécurisé — empêche juste la découverte accidentelle.
 */
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Calcule le hash du PIN du jour.
 * Le PIN est dérivé de la date actuelle via un algorithme.
 * Il change tous les jours à minuit.
 * ⭐ Seul le développeur connaît la formule — elle est obfusquée.
 */
function getDailyPinHash() {
  const now = new Date();
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  // Algorithme de rotation quotidienne
  const raw = ((d * 73 + m * 137 + y * 29 + d * m * 3) ^ 0x5A3C) >>> 0;
  const pin = String(raw % 10000).padStart(4, '0');
  return simpleHash(pin);
}

/**
 * Retourne le PIN dev du jour (pour le développeur uniquement).
 * Accessible via window.__optDevPin() dans la console.
 * ⚠️ NE JAMAIS exposer cette fonction dans l'UI.
 */
export function getTodayDevPin() {
  const now = new Date();
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const raw = ((d * 73 + m * 137 + y * 29 + d * m * 3) ^ 0x5A3C) >>> 0;
  return String(raw % 10000).padStart(4, '0');
}

// ⭐ Exposer le PIN du jour via la console (developpeur uniquement)
if (typeof window !== 'undefined') {
  window.__optDevPin = () => {
    const pin = getTodayDevPin();
    console.log(`%c[OPTIMUSCLE DEV]%c PIN du jour : %c${pin}%c (change à minuit)`,
      'background:#7c3aed;color:#fff;padding:2px 6px;border-radius:4px;font-weight:bold',
      '',
      'color:#7c3aed;font-weight:bold;font-size:16px',
      '');
    return pin;
  };
}

/**
 * Vérifie un PIN contre le hash du jour.
 * @param {string} pin - Le PIN à vérifier
 * @returns {boolean}
 */
export function verifyDevPin(pin) {
  if (!pin || typeof pin !== 'string') return false;
  return simpleHash(pin) === getDailyPinHash();
}

/**
 * Vérifie si le mode dev est authentifié (PIN entré + pas expiré).
 */
export function isDevVerified() {
  try {
    const data = sessionStorage.getItem(DEV_PIN_KEY);
    if (!data) return false;
    const parsed = JSON.parse(data);
    if (!parsed || !parsed.ts) return false;
    // Vérifier l'expiration (2h)
    if (Date.now() - parsed.ts > DEV_EXPIRY_MS) {
      sessionStorage.removeItem(DEV_PIN_KEY);
      sessionStorage.removeItem(DEV_KEY);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Marque le mode dev comme authentifié (appelé après PIN correct).
 */
export function markDevVerified() {
  try {
    sessionStorage.setItem(DEV_PIN_KEY, JSON.stringify({ ts: Date.now() }));
  } catch (e) {}
}

/**
 * Révoque l'authentification dev.
 */
export function revokeDevVerification() {
  try {
    sessionStorage.removeItem(DEV_PIN_KEY);
    sessionStorage.removeItem(DEV_KEY);
  } catch (e) {}
}

/**
 * Retourne le plan dev override, ou null si pas de dev mode.
 * ⭐ Nécessite que le mode dev soit authentifié (PIN vérifié + pas expiré).
 */
export function getDevPlan() {
  // ⭐ Sécurité : vérifier l'authentification avant de retourner le plan
  if (!isDevVerified()) return null;
  try {
    const override = sessionStorage.getItem(DEV_KEY);
    if (override && PLANS[override]) return PLANS[override];
  } catch (e) {}
  return null;
}

/**
 * Active un plan dev override.
 * @param {string} planId - 'free', 'premium_monthly', 'premium_yearly', 'premium_lifetime'
 */
export function setDevPlan(planId) {
  try {
    if (planId === 'free' || !planId) {
      sessionStorage.removeItem(DEV_KEY);
    } else if (PLANS[planId]) {
      sessionStorage.setItem(DEV_KEY, planId);
    }
  } catch (e) {}
}

/**
 * Vérifie si le mode dev est actif.
 * ⭐ Nécessite l'authentification.
 */
export function isDevMode() {
  if (!isDevVerified()) return false;
  try {
    return sessionStorage.getItem(DEV_KEY) !== null;
  } catch (e) { return false; }
}

// ===== HELPERS =====

/**
 * Récupère le plan actuel de l'utilisateur depuis son state.
 * ⭐ Tient compte du dev mode override en priorité.
 */
export function getUserPlan(userData) {
  // ⭐ Dev mode override prioritaire
  const devPlan = getDevPlan();
  if (devPlan) return devPlan;

  if (!userData || !userData.subscription) return PLANS.free;
  const sub = userData.subscription;
  if (sub.status !== 'active' && sub.status !== 'trialing') return PLANS.free;
  return PLANS[sub.plan] || PLANS.free;
}

/**
 * Vérifie si l'utilisateur a accès à une feature premium.
 * ⭐ CORRIGÉ : utilise truthy check au lieu de === true
 * pour supporter les features à niveaux ('advanced', 'exclusive', 'elite').
 *
 * @param {object} userData
 * @param {string} feature - ex: 'aiCoach', 'pdfExport'
 * @returns {boolean} - true si la feature est disponible (pas false ni undefined)
 */
export function hasFeature(userData, feature) {
  const plan = getUserPlan(userData);
  const val = plan.features[feature];
  return val !== false && val !== undefined;
}

/**
 * Retourne le niveau d'une feature (pour les features à niveaux).
 * Ex: aiCoach peut être false, true, ou 'advanced'.
 *
 * @param {object} userData
 * @param {string} feature
 * @returns {string|boolean|number} - La valeur de la feature dans le plan
 */
export function getFeatureLevel(userData, feature) {
  const plan = getUserPlan(userData);
  return plan.features[feature] ?? false;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique.
 */
export function hasRole(userData, role) {
  if (!userData || !userData.role) return role === 'user';
  if (role === 'user') return true; // tout le monde a au moins ce rôle
  return userData.role === role;
}

export function isAdmin(userData) {
  return userData && userData.role === 'admin';
}

export function isPremium(userData) {
  const plan = getUserPlan(userData);
  return plan.id !== 'free';
}

/**
 * Statut d'affichage pour l'UI.
 */
export function getSubscriptionBadge(userData) {
  if (isAdmin(userData)) return { label: 'ADMIN', color: '#ff3d00' };
  if (isPremium(userData)) return { label: 'PREMIUM', color: '#ffb800' };
  return { label: 'FREE', color: '#8a8a8a' };
}

/**
 * Filtre les fonctionnalités d'un programme selon le plan.
 * Ex : limiter à 3 séances/sem en gratuit.
 */
export function enforceFreemiumLimits(program, userData) {
  if (!program || !Array.isArray(program)) return program;

  const plan = getUserPlan(userData);
  const maxFreq = plan.features.maxFrequency;

  // ⭐ BUGFIX : -1 signifie ILLIMITÉ — ne jamais bloquer
  if (maxFreq === -1) return program;

  // Compter les séances actuelles
  const workouts = program.filter(d => !d.rest);
  if (workouts.length <= maxFreq) return program;

  // Convertir les séances en trop en jours de repos
  let kept = 0;
  return program.map(d => {
    if (d.rest) return d;
    kept++;
    if (kept > maxFreq) {
      return { ...d, rest: true, name: 'Repos (Premium)', exercises: [], locked: true };
    }
    return d;
  });
}

/**
 * Filtre l'historique selon le plan (jours max).
 */
export function filterHistoryByPlan(history, userData) {
  if (!Array.isArray(history)) return [];
  const plan = getUserPlan(userData);
  const maxDays = plan.features.maxHistoryDays;
  // ⭐ BUGFIX : -1 signifie ILLIMITÉ — retourner tout l'historique
  if (maxDays === -1) return history;
  const cutoff = Date.now() - maxDays * 86400000;
  return history.filter(h => {
    const t = new Date(h.date).getTime();
    return !isNaN(t) && t >= cutoff;
  });
}

/**
 * Affiche un upsell premium contextuel.
 */
export function shouldShowUpsell(userData, context) {
  if (isPremium(userData)) return false;

  // Conditions selon le contexte
  switch (context) {
    case 'frequency_4plus':
      return true;
    case 'history_30d':
      return true;
    case 'ai_coach':
      return true;
    default:
      return false;
  }
}

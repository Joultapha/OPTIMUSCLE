/* ============================================================
   OPTIMUSCLE — Subscription & Premium Features
   ============================================================

   Architecture freemium :
   - free  : 3 séances/sem, historique 30j, badges de base
   - premium : illimité, GIFs HD, IA coach, export PDF
   - admin : tout + accès console

   IMPORTANT : Ces vérifs CÔTÉ CLIENT sont juste pour l'UX.
   La vraie sécurité est dans les Firebase Rules + Cloud Functions.
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
      nutritionTracking: 'basic',
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

// ===== HELPERS =====

/**
 * Récupère le plan actuel de l'utilisateur depuis son state.
 */
export function getUserPlan(userData) {
  if (!userData || !userData.subscription) return PLANS.free;
  const sub = userData.subscription;
  if (sub.status !== 'active' && sub.status !== 'trialing') return PLANS.free;
  return PLANS[sub.plan] || PLANS.free;
}

/**
 * Vérifie si l'utilisateur a accès à une feature premium.
 *
 * @param {object} userData
 * @param {string} feature - ex: 'aiCoach', 'pdfExport'
 * @returns {boolean}
 */
export function hasFeature(userData, feature) {
  const plan = getUserPlan(userData);
  return plan.features[feature] === true;
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

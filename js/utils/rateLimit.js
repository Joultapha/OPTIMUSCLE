/* ============================================================
   OPTIMUSCLE — Rate Limiting & Anti-Abuse (côté client)
   ============================================================

   ⚠️ Note : un rate limiting CÔTÉ CLIENT n'est pas une vraie sécurité
   (l'utilisateur peut le contourner). Mais c'est utile pour :
   - Éviter les bugs (boucles infinies)
   - Réduire les coûts Firebase (limite les écritures)
   - Améliorer l'UX (debounce naturel)

   Pour la VRAIE sécurité anti-spam, voir functions/index.js
   (App Check + rate limit serveur).
*/

const limits = new Map();

/**
 * Rate limiter avec sliding window.
 *
 * @param {string} key - Identifiant unique de l'action (ex: 'save', 'login')
 * @param {number} maxCalls - Nombre max d'appels autorisés
 * @param {number} windowMs - Fenêtre de temps en ms
 * @returns {boolean} true si OK, false si limite atteinte
 *
 * Exemple :
 *   if (!rateLimit('save', 10, 60000)) {
 *     return showToast('Trop de sauvegardes, patiente...');
 *   }
 */
export function rateLimit(key, maxCalls = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = limits.get(key) || { calls: [], blocked: false };

  // Nettoyer les appels hors fenêtre
  entry.calls = entry.calls.filter(t => now - t < windowMs);

  if (entry.calls.length >= maxCalls) {
    entry.blocked = true;
    limits.set(key, entry);
    console.warn(`🚫 Rate limit atteint pour "${key}" (${maxCalls}/${windowMs}ms)`);
    return false;
  }

  entry.calls.push(now);
  entry.blocked = false;
  limits.set(key, entry);
  return true;
}

/**
 * Debounce : exécute fn une seule fois après que les appels
 * aient cessé pendant `delay` ms.
 *
 * Idéal pour les saves Firebase : on attend que l'utilisateur
 * arrête de cliquer avant de sauvegarder.
 */
export function debounce(fn, delay = 500) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle : exécute fn au max une fois toutes les `delay` ms.
 */
export function throttle(fn, delay = 1000) {
  let lastCall = 0;
  let timeoutId = null;
  return function (...args) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    if (remaining <= 0) {
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Anti-bot léger : honeypot timing.
 * Vérifie qu'un utilisateur a passé un minimum de temps sur un formulaire
 * (les bots remplissent en millisecondes).
 */
const formStartTimes = new Map();

export function startFormTimer(formId) {
  formStartTimes.set(formId, Date.now());
}

export function isHumanTiming(formId, minMs = 1500) {
  const start = formStartTimes.get(formId);
  if (!start) return true; // pas de timer = on laisse passer
  return Date.now() - start >= minMs;
}

/**
 * Compte les tentatives échouées de login (anti-brute force client).
 * Bloque temporairement après X échecs.
 */
const failedAttempts = new Map();

export function recordFailedAttempt(key = 'login') {
  const entry = failedAttempts.get(key) || { count: 0, blockedUntil: 0 };
  entry.count++;

  // Backoff progressif : 5 échecs = 1 min, 10 = 5 min, 15 = 30 min
  if (entry.count >= 15) entry.blockedUntil = Date.now() + 30 * 60_000;
  else if (entry.count >= 10) entry.blockedUntil = Date.now() + 5 * 60_000;
  else if (entry.count >= 5) entry.blockedUntil = Date.now() + 60_000;

  failedAttempts.set(key, entry);
}

export function isBlocked(key = 'login') {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (entry.blockedUntil > Date.now()) {
    const remainingMs = entry.blockedUntil - Date.now();
    return Math.ceil(remainingMs / 1000); // secondes restantes
  }
  return false;
}

export function resetAttempts(key = 'login') {
  failedAttempts.delete(key);
}

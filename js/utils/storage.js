/* ============================================================
   OPTIMUSCLE — Safe localStorage wrapper
   ============================================================

   Problèmes du localStorage natif :
   - Pas de validation (on lit n'importe quoi)
   - Pas de namespace (collisions possibles)
   - Pas de TTL
   - Peut être corrompu par d'autres scripts
   - Quota errors non gérés

   Cette couche corrige tout ça.
*/

const NAMESPACE = 'om:';  // optimuscle
const MAX_ITEM_SIZE = 500_000; // 500 KB max par item

/**
 * Lit une valeur du localStorage avec validation JSON.
 *
 * @param {string} key
 * @param {object} options - { fallback, validator }
 * @returns {any} valeur ou fallback
 */
export function safeGet(key, { fallback = null, validator = null } = {}) {
  try {
    const raw = localStorage.getItem(NAMESPACE + key);
    if (raw === null) return fallback;

    const parsed = JSON.parse(raw);

    // Vérifier TTL si présent
    if (parsed && parsed.__expires && parsed.__expires < Date.now()) {
      localStorage.removeItem(NAMESPACE + key);
      return fallback;
    }

    const value = parsed && parsed.__data !== undefined ? parsed.__data : parsed;

    // Validation custom
    if (validator) {
      const result = validator(value);
      if (!result || result.ok === false) {
        console.warn(`⚠️ Validation échouée pour ${key}:`, result?.error);
        localStorage.removeItem(NAMESPACE + key);
        return fallback;
      }
    }

    return value;
  } catch (e) {
    console.warn(`⚠️ Erreur lecture localStorage ${key}:`, e.message);
    try { localStorage.removeItem(NAMESPACE + key); } catch (_) {}
    return fallback;
  }
}

/**
 * Écrit une valeur dans localStorage avec sécurité.
 *
 * @param {string} key
 * @param {any} value
 * @param {object} options - { ttlMs }
 * @returns {boolean} true si OK
 */
export function safeSet(key, value, { ttlMs = null } = {}) {
  try {
    let toStore = value;

    if (ttlMs) {
      toStore = { __data: value, __expires: Date.now() + ttlMs };
    }

    const json = JSON.stringify(toStore);

    if (json.length > MAX_ITEM_SIZE) {
      console.warn(`⚠️ Item trop gros pour localStorage: ${key} (${json.length} bytes)`);
      return false;
    }

    localStorage.setItem(NAMESPACE + key, json);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('💾 localStorage plein, tentative de cleanup...');
      cleanupOldEntries();
      try {
        localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    }
    console.warn(`⚠️ Erreur écriture localStorage ${key}:`, e.message);
    return false;
  }
}

export function safeRemove(key) {
  try {
    localStorage.removeItem(NAMESPACE + key);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Nettoie les entrées expirées et les vieilles clés non-namespacées.
 */
export function cleanupOldEntries() {
  try {
    const keys = Object.keys(localStorage);

    // Supprimer les clés expirées
    for (const k of keys) {
      if (!k.startsWith(NAMESPACE)) continue;
      try {
        const v = JSON.parse(localStorage.getItem(k));
        if (v && v.__expires && v.__expires < Date.now()) {
          localStorage.removeItem(k);
        }
      } catch (_) {
        localStorage.removeItem(k); // valeur corrompue
      }
    }

    // Migration : supprimer les anciennes clés non-namespacées (v3, v4...)
    const OLD_KEYS = ['fitcoach_v1', 'fitcoach_v2', 'fitcoach_v3', 'fitcoach_v4', 'optimuscle_v1'];
    for (const k of keys) {
      for (const old of OLD_KEYS) {
        if (k.startsWith(old)) {
          // Migration possible ici, sinon on garde (pour anciens utilisateurs)
        }
      }
    }
  } catch (_) {}
}

/**
 * Migre les anciennes données (fitcoach_v3, optimuscle_v1) vers le nouveau format.
 */
export function migrateOldStorage(uid) {
  const oldKeys = [
    `optimuscle_v1_${uid}`,
    `fitcoach_v3`,
    `fitcoach_v2`,
  ];

  for (const oldKey of oldKeys) {
    try {
      const raw = localStorage.getItem(oldKey);
      if (!raw) continue;
      const newKey = `state:${uid}`;
      // Ne migre que si on n'a pas encore de nouvelle donnée
      if (!localStorage.getItem(NAMESPACE + newKey)) {
        safeSet(newKey, JSON.parse(raw));
        console.log(`✓ Migré ${oldKey} → ${NAMESPACE}${newKey}`);
      }
      localStorage.removeItem(oldKey); // cleanup
    } catch (e) {
      console.warn('Migration échouée:', e.message);
    }
  }
}

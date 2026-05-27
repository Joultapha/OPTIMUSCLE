/* ============================================================
   OPTIMUSCLE — State Management (sécurisé)
   ============================================================
   Centralise toutes les données de l'app.
   Toute écriture passe par save() qui valide + sync Firebase.
*/

import { DEFAULT_STATE, STORAGE_KEY } from './config.js';
import { validateState, sanitizeState, LIMITS } from '../utils/validation.js';
import { safeGet, safeSet, migrateOldStorage } from '../utils/storage.js';
import { rateLimit, debounce } from '../utils/rateLimit.js';

// State global (lecture seule depuis l'extérieur, modifs via fonctions)
export let state = JSON.parse(JSON.stringify(DEFAULT_STATE));

// User Firebase courant
let currentUser = null;

// Données utilisateur depuis Firebase (rôle, abonnement, etc.)
let userData = null;

// Firebase DB instance (injectée par app.js)
let dbInstance = null;
let dbRef = null;
let dbSet = null;
let dbGet = null;

// ===== GETTERS =====
export function getState() { return state; }
export function getCurrentUser() { return currentUser; }
export function getUserData() { return userData; }

// ===== SETTERS (contrôlés) =====
export function setCurrentUser(user) { currentUser = user; }
export function setUserData(data) { userData = data; }

export function resetState() {
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
}

/**
 * Merge sécurisé : valide AVANT d'appliquer.
 */
export function mergeState(newData) {
  if (!newData) return { ok: false, error: 'Aucune donnée' };

  const sanitized = sanitizeState(newData);
  const validation = validateState(sanitized);

  if (!validation.ok) {
    console.error('⚠️ State invalide rejeté:', validation.error);
    return validation;
  }

  state = { ...state, ...sanitized };
  return { ok: true };
}

// ===== FIREBASE INIT =====
export function initDatabase(db, ref, set, get) {
  dbInstance = db;
  dbRef = ref;
  dbSet = set;
  dbGet = get;
}

// ===== SAVE (avec rate limit + debounce + validation + retry) =====

// Save immédiat (interne) avec retry
async function _saveNow(retryCount = 0) {
  // Validation finale avant sauvegarde
  const validation = validateState(state);
  if (!validation.ok) {
    console.error('⚠️ Refus de sauvegarder state invalide:', validation.error);
    return false;
  }

  // Rate limit : max 20 saves/min (anti-boucle infinie)
  if (!rateLimit('save', 20, 60_000)) {
    console.warn('⏳ Save rate limited');
    return false;
  }

  const userId = currentUser?.uid || 'local';

  // 1. localStorage (toujours)
  const ok = safeSet(`state:${userId}`, state);
  if (!ok) console.warn('⚠️ Save localStorage échoué');

  // 2. Firebase (si connecté)
  if (currentUser && dbInstance && dbRef && dbSet) {
    try {
      const json = JSON.stringify(state);
      if (json.length > LIMITS.MAX_STATE_SIZE_BYTES) {
        console.warn('⚠️ State trop gros pour Firebase, écriture annulée');
        return false;
      }
      await dbSet(dbRef(dbInstance, `users/${currentUser.uid}/state`), json);
      await dbSet(dbRef(dbInstance, `users/${currentUser.uid}/updatedAt`), Date.now());
    } catch (e) {
      console.warn(`⚠️ Sync cloud échouée (tentative ${retryCount + 1}/3):`, e.message);
      // ⭐ Retry logic avec exponential backoff
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
        await new Promise(r => setTimeout(r, delay));
        return _saveNow(retryCount + 1);
      }
      // On ne throw pas : le user a quand même son local
    }
  }

  return true;
}

// Save debounced (public) : attend 800ms avant de save
// Ça évite de spammer Firebase quand l'utilisateur clique vite
export const save = debounce(_saveNow, 800);

// Save immédiat (pour cas critiques : logout, paiement, etc.)
export const saveImmediate = _saveNow;

// ===== LOAD =====

/**
 * Charge depuis Firebase puis localStorage en fallback.
 */
export async function loadUserData(uid) {
  if (!uid) return;

  // Migration des anciennes clés
  migrateOldStorage(uid);

  // 1. Tentative cloud
  if (dbInstance && dbRef && dbGet) {
    try {
      const snap = await dbGet(dbRef(dbInstance, `users/${uid}/state`));
      if (snap.exists()) {
        const json = snap.val();
        // Le state est stocké en JSON string (rules ".validate" l'imposent)
        const parsed = typeof json === 'string' ? JSON.parse(json) : json;
        const r = mergeState(parsed);
        if (r.ok) {
          console.log('✓ State chargé depuis Firebase');
          return;
        }
      }
    } catch (e) {
      console.warn('⚠️ Chargement Firebase échoué:', e.message);
    }
  }

  // 2. Fallback localStorage
  const local = safeGet(`state:${uid}`, { validator: validateState });
  if (local) {
    mergeState(local);
    console.log('✓ State chargé depuis localStorage');
  }
}

/**
 * Charge les métadonnées utilisateur (rôle, abonnement).
 * À appeler après login.
 */
export async function loadUserMeta(uid) {
  if (!dbInstance || !dbRef || !dbGet) return;
  try {
    const snap = await dbGet(dbRef(dbInstance, `users/${uid}`));
    if (snap.exists()) {
      const data = snap.val();
      userData = {
        role: data.role || 'user',
        subscription: data.subscription || { plan: 'free', status: 'free' },
      };
    } else {
      userData = { role: 'user', subscription: { plan: 'free', status: 'free' } };
    }
  } catch (e) {
    console.warn('⚠️ Chargement metadata échoué:', e.message);
    userData = { role: 'user', subscription: { plan: 'free', status: 'free' } };
  }
}

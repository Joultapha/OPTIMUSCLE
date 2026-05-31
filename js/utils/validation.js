/* ============================================================
   OPTIMUSCLE — Schemas de validation des données
   ============================================================

   Toute donnée entrante (formulaire, Firebase, localStorage)
   doit être validée AVANT d'être utilisée.

   Approche : valider STRICTEMENT, rejeter sinon.
*/

import { isSafeString, isValidEmail } from './sanitize.js';

// ===== CONSTANTES =====
export const ALLOWED_GOALS = ['muscle', 'loss', 'endurance', 'health'];
export const ALLOWED_LEVELS = ['beginner', 'intermediate', 'advanced'];
export const ALLOWED_PLACES = ['home_none', 'home_basic', 'gym'];
export const ALLOWED_FREQUENCIES = ['3', '4', '5', '6'];
export const ALLOWED_DURATIONS = ['20', '40', '60'];
export const ALLOWED_ROLES = ['user', 'premium', 'admin'];
export const ALLOWED_SUB_STATUS = ['free', 'trialing', 'active', 'past_due', 'canceled'];

// Limites anti-abus
export const LIMITS = {
  MAX_HISTORY_ITEMS: 100,
  MAX_SESSION_DURATION_MIN: 240,    // 4h max par séance
  MAX_DAILY_SESSIONS: 5,            // 5 séances/jour max
  MAX_TOTAL_SESSIONS: 100000,
  MAX_TOTAL_MINUTES: 1000000,
  MAX_STREAK: 10000,
  MAX_BADGES: 100,
  MAX_STATE_SIZE_BYTES: 100000,     // 100 KB max par state
};

// ===== VALIDATEURS DE BASE =====

export function isInt(n, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n >= min && n <= max;
}

export function isPositiveNum(n, max = Number.MAX_SAFE_INTEGER) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;
}

export function isOneOf(val, list) {
  return list.includes(val);
}

// ===== VALIDATEURS MÉTIER =====

/**
 * Valide un profil utilisateur (output du questionnaire).
 */
export function validateProfile(p) {
  if (!p || typeof p !== 'object') return { ok: false, error: 'Profil invalide' };
  if (!isOneOf(p.goal, ALLOWED_GOALS)) return { ok: false, error: 'Objectif invalide' };
  if (!isOneOf(p.level, ALLOWED_LEVELS)) return { ok: false, error: 'Niveau invalide' };
  if (!isOneOf(p.place, ALLOWED_PLACES)) return { ok: false, error: 'Lieu invalide' };
  if (!isOneOf(p.frequency, ALLOWED_FREQUENCIES)) return { ok: false, error: 'Fréquence invalide' };
  if (!isOneOf(p.duration, ALLOWED_DURATIONS)) return { ok: false, error: 'Durée invalide' };
  return { ok: true };
}

/**
 * Valide les stats utilisateur.
 */
export function validateStats(s) {
  if (!s || typeof s !== 'object') return { ok: false, error: 'Stats invalides' };
  if (!isPositiveNum(s.totalSessions, LIMITS.MAX_TOTAL_SESSIONS)) return { ok: false, error: 'totalSessions hors limite' };
  if (!isPositiveNum(s.totalMinutes, LIMITS.MAX_TOTAL_MINUTES)) return { ok: false, error: 'totalMinutes hors limite' };
  if (!isPositiveNum(s.streak, LIMITS.MAX_STREAK)) return { ok: false, error: 'streak hors limite' };
  if (!isPositiveNum(s.bestStreak, LIMITS.MAX_STREAK)) return { ok: false, error: 'bestStreak hors limite' };
  return { ok: true };
}

/**
 * Valide une entrée d'historique.
 */
export function validateHistoryEntry(h) {
  if (!h || typeof h !== 'object') return { ok: false, error: 'Entry invalide' };
  if (!h.date || typeof h.date !== 'string') return { ok: false, error: 'Date invalide' };
  const d = new Date(h.date);
  if (isNaN(d.getTime())) return { ok: false, error: 'Date non parsable' };
  if (d.getTime() > Date.now() + 60000) return { ok: false, error: 'Date dans le futur' }; // +60s tolérance
  if (!isSafeString(h.name, { maxLen: 100 })) return { ok: false, error: 'Nom invalide' };
  if (!isPositiveNum(h.duration, LIMITS.MAX_SESSION_DURATION_MIN)) return { ok: false, error: 'Durée invalide' };
  if (!isInt(h.exercises, 0, 50)) return { ok: false, error: 'Nb exercices invalide' };
  return { ok: true };
}

/**
 * Valide un programme généré.
 */
export function validateProgram(prog) {
  if (!Array.isArray(prog)) return { ok: false, error: 'Programme doit être un array' };
  if (prog.length !== 7) return { ok: false, error: 'Programme doit avoir 7 jours' };

  for (const day of prog) {
    if (!day || typeof day !== 'object') return { ok: false, error: 'Jour invalide' };
    if (!isSafeString(day.day, { maxLen: 10 })) return { ok: false, error: 'Nom jour invalide' };
    if (!isSafeString(day.name, { maxLen: 100 })) return { ok: false, error: 'Nom séance invalide' };
    if (typeof day.rest !== 'boolean') return { ok: false, error: 'rest doit être boolean' };
    if (typeof day.done !== 'boolean') return { ok: false, error: 'done doit être boolean' };
    if (!Array.isArray(day.exercises)) return { ok: false, error: 'exercises doit être array' };
    if (day.exercises.length > 50) return { ok: false, error: 'Trop d\'exercices' };
  }

  return { ok: true };
}

/**
 * Valide les settings utilisateur.
 */
export function validateSettings(s) {
  if (!s || typeof s !== 'object') return { ok: false, error: 'Settings invalides' };
  if (typeof s.reminders !== 'boolean') return { ok: false, error: 'reminders doit être boolean' };
  if (typeof s.sound !== 'boolean') return { ok: false, error: 'sound doit être boolean' };
  if (typeof s.vibrate !== 'boolean') return { ok: false, error: 'vibrate doit être boolean' };
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(s.time)) return { ok: false, error: 'Heure invalide' };
  return { ok: true };
}

/**
 * Valide le state global complet (anti-corruption Firebase).
 */
export function validateState(state) {
  if (!state || typeof state !== 'object') return { ok: false, error: 'State invalide' };

  // Profil (peut être null si pas encore fait l'onboarding)
  if (state.profile !== null) {
    const r = validateProfile(state.profile);
    if (!r.ok) return r;
  }

  // Stats
  if (state.stats) {
    const r = validateStats(state.stats);
    if (!r.ok) return r;
  }

  // Programme (peut être null)
  if (state.program !== null && state.program !== undefined) {
    const r = validateProgram(state.program);
    if (!r.ok) return r;
  }

  // Historique
  if (state.history) {
    if (!Array.isArray(state.history)) return { ok: false, error: 'Historique doit être array' };
    if (state.history.length > LIMITS.MAX_HISTORY_ITEMS) {
      return { ok: false, error: 'Historique trop long' };
    }
    for (const h of state.history) {
      const r = validateHistoryEntry(h);
      if (!r.ok) return { ok: false, error: 'Entry historique invalide: ' + r.error };
    }
  }

  // Badges
  if (state.badges) {
    if (!Array.isArray(state.badges)) return { ok: false, error: 'Badges doit être array' };
    if (state.badges.length > LIMITS.MAX_BADGES) return { ok: false, error: 'Trop de badges' };
    for (const b of state.badges) {
      if (!isSafeString(b, { maxLen: 50 })) return { ok: false, error: 'Badge ID invalide' };
    }
  }

  // Settings
  if (state.settings) {
    const r = validateSettings(state.settings);
    if (!r.ok) return r;
  }

  return { ok: true };
}

/**
 * Sanitise un state en supprimant les champs inconnus
 * (whitelist approach - défense en profondeur).
 */
export function sanitizeState(state) {
  if (!state || typeof state !== 'object') return null;

  const ALLOWED_KEYS = ['profile', 'program', 'weekStart', 'stats', 'history', 'badges', 'settings', 'currentDay'];
  const clean = {};

  for (const k of ALLOWED_KEYS) {
    if (k in state) clean[k] = state[k];
  }

  return clean;
}

// ===== VALIDATION FORMULAIRES =====

export function validateEmailField(email) {
  if (!isValidEmail(email)) return 'Email invalide';
  return null;
}

export function validatePasswordField(pw, { isRegister = false } = {}) {
  if (typeof pw !== 'string') return 'Mot de passe invalide';
  if (pw.length < 6) return 'Mot de passe : 6 caractères minimum';
  if (pw.length > 128) return 'Mot de passe trop long';
  if (isRegister) {
    // En inscription, on demande au moins un chiffre + une lettre
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
      return 'Doit contenir au moins une lettre et un chiffre';
    }
  }
  return null;
}

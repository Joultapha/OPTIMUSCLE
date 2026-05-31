/* ============================================================
   OPTIMUSCLE — Configuration globale
   ============================================================ */

export const APP_NAME = 'OPTIMUSCLE';
export const APP_VERSION = '22.0.0';
export const STORAGE_KEY = 'optimuscle_v22';

// 🔥 Firebase config (publique, safe à committer)
export const firebaseConfig = {
  apiKey: "AIzaSyAZ_0PD5gun-n02Glij3nbhLiE2zEQd11w",
  authDomain: "fitcoach-6dd28.firebaseapp.com",
  projectId: "fitcoach-6dd28",
  storageBucket: "fitcoach-6dd28.firebasestorage.app",
  messagingSenderId: "69673744347",
  appId: "1:69673744347:web:ba4cf0ba7bd50c794159fe",
  databaseURL: "https://fitcoach-6dd28-default-rtdb.firebaseio.com"
};

// 🛡️ reCAPTCHA Site Key pour App Check
export const RECAPTCHA_SITE_KEY = '6LdGNPAsAAAAACzsIwWviH67pwDswKEXrT6QZMbJ';

// 🤖 Groq API Key (Llama 3.3 70B - gratuit, sans carte)
// ⚠️ Cette clé est PUBLIQUE dans le code (frontend). C'est OK car :
// - Groq a un quota par clé (14k req/jour gratuit)
// - On peut rate-limit côté client
// Obtenir : https://console.groq.com/keys
export const GROQ_API_KEY = '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';

// 🤖 Gemini API Key (fallback, optionnel)
export const GEMINI_API_KEY = 'AIzaSyD6BJI8zQswAyQq6Bsqq60qtDqTAA8vTUs';

// État par défaut
export const DEFAULT_STATE = {
  profile: null,
  program: null,
  weekStart: null,
  stats: {
    totalSessions: 0,
    totalMinutes: 0,
    streak: 0,
    bestStreak: 0,
    lastDone: null
  },
  history: [],
  badges: [],
  settings: {
    reminders: false,
    time: "18:00",
    sound: true,
    vibrate: true
  },
  currentDay: 0,
};

// Labels (i18n FR)
export const GOAL_LABELS = {
  muscle: { title: "PRISE DE MUSCLE", sub: "Programme hypertrophie personnalisé" },
  loss: { title: "PERTE DE POIDS", sub: "Cardio et tonification au programme" },
  endurance: { title: "ENDURANCE", sub: "Améliore ton souffle progressivement" },
  health: { title: "FORME GÉNÉRALE", sub: "Bouge, respire, sois en forme" },
};

export const PLACE_LABELS = {
  home_none: "Maison (sans matériel)",
  home_basic: "Maison (haltères)",
  gym: "Salle de sport"
};

export const LEVEL_LABELS = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé"
};

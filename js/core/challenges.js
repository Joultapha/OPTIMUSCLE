/* ============================================================
   OPTIMUSCLE — Système de Défis
   ============================================================
   Types :
   1. Défis hebdomadaires (changent chaque lundi, génération auto)
   2. Défis 30 jours (catalogue à lancer manuellement)
   3. Défis IA (générés par OPTI selon ton profil)
============================================================ */

// ============================================================
// CATALOGUE DE DÉFIS 30 JOURS
// ============================================================
export const CHALLENGES_30D = [
  {
    id: 'pushups_30d',
    title: '30 jours Pompes',
    icon: '💪',
    desc: 'Progression progressive jusqu\'à 100 pompes',
    duration: 30,
    category: 'force',
    difficulty: 'intermediate',
    color: '#ff5722',
    daily: (day) => {
      const counts = [10,15,20,25,30,30,'REPOS',35,40,45,50,55,60,'REPOS',60,65,70,75,80,80,'REPOS',85,85,90,90,95,95,'REPOS',100,100];
      const val = counts[day - 1];
      return val === 'REPOS' ? { rest: true, label: 'Jour de repos' } : { count: val, label: `${val} pompes` };
    }
  },
  {
    id: 'squats_30d',
    title: '30 jours Squats',
    icon: '🦵',
    desc: 'Renforce tes jambes et fessiers',
    duration: 30,
    category: 'force',
    difficulty: 'beginner',
    color: '#06b6d4',
    daily: (day) => {
      const base = 20 + (day - 1) * 4;
      const isRest = day % 7 === 0;
      return isRest ? { rest: true, label: 'Jour de repos' } : { count: base, label: `${base} squats` };
    }
  },
  {
    id: 'plank_30d',
    title: '30 jours Planche',
    icon: '🧘',
    desc: 'De 20 secondes à 4 minutes',
    duration: 30,
    category: 'gainage',
    difficulty: 'beginner',
    color: '#8b5cf6',
    daily: (day) => {
      const seconds = 20 + (day - 1) * 8;
      return { count: seconds, label: `${seconds} sec de planche`, unit: 'sec' };
    }
  },
  {
    id: 'no_sugar_30d',
    title: '30 jours Sans Sucre',
    icon: '🚫',
    desc: 'Zéro sucre ajouté pendant 30 jours',
    duration: 30,
    category: 'nutrition',
    difficulty: 'advanced',
    color: '#ef4444',
    daily: () => ({ label: 'Pas de sucre ajouté aujourd\'hui' })
  },
  {
    id: 'water_30d',
    title: '30 jours 2L d\'eau',
    icon: '💧',
    desc: 'Hydratation parfaite quotidienne',
    duration: 30,
    category: 'nutrition',
    difficulty: 'beginner',
    color: '#06b6d4',
    daily: () => ({ label: 'Boire 2L d\'eau (8 verres)' })
  },
  {
    id: 'cardio_30d',
    title: '30 jours Cardio',
    icon: '🏃',
    desc: '20 minutes de cardio quotidien',
    duration: 30,
    category: 'cardio',
    difficulty: 'intermediate',
    color: '#10b981',
    daily: (day) => {
      const minutes = day <= 10 ? 15 : (day <= 20 ? 20 : 30);
      return { count: minutes, label: `${minutes} min cardio`, unit: 'min' };
    }
  },
  {
    id: 'burpees_30d',
    title: '30 jours Burpees',
    icon: '🔥',
    desc: 'Le défi qui tue (mais qui marche)',
    duration: 30,
    category: 'hiit',
    difficulty: 'advanced',
    color: '#ff5722',
    daily: (day) => {
      const counts = [5,8,10,12,15,'REPOS',18,20,22,25,28,30,'REPOS',32,35,38,40,42,45,'REPOS',48,50,52,55,58,60,'REPOS',65,70,75];
      const val = counts[day - 1];
      return val === 'REPOS' ? { rest: true, label: 'Jour de repos' } : { count: val, label: `${val} burpees` };
    }
  },
  {
    id: 'sleep_30d',
    title: '30 jours Sommeil',
    icon: '😴',
    desc: 'Dormir 7-8h chaque nuit',
    duration: 30,
    category: 'recovery',
    difficulty: 'beginner',
    color: '#8b5cf6',
    daily: () => ({ label: 'Dormir au moins 7h' })
  },
];

// ============================================================
// DÉFIS HEBDOMADAIRES (auto-générés selon profil)
// ============================================================
const WEEKLY_TEMPLATES = [
  { title: 'Semaine Régularité', icon: '📅', desc: 'Fais toutes tes séances cette semaine', metric: 'sessions', target: null, fromProfile: true, color: '#ff5722' },
  { title: 'Mode Beast', icon: '🦁', desc: 'Termine 5 séances cette semaine', metric: 'sessions', target: 5, color: '#ef4444' },
  { title: 'Marathonien', icon: '⏱️', desc: 'Cumule 180 minutes cette semaine', metric: 'minutes', target: 180, color: '#06b6d4' },
  { title: 'Streak Master', icon: '🔥', desc: 'Maintiens 7 jours consécutifs', metric: 'streak', target: 7, color: '#ff5722' },
  { title: 'Hydratation Pro', icon: '💧', desc: 'Bois 2L d\'eau chaque jour', metric: 'water_days', target: 7, color: '#06b6d4' },
  { title: 'Précision Macros', icon: '🎯', desc: 'Atteins tes macros 5 jours sur 7', metric: 'nutrition_days', target: 5, color: '#10b981' },
  { title: 'Explorateur', icon: '🌟', desc: 'Débloque 3 nouveaux badges', metric: 'badges', target: 3, color: '#fbbf24' },
];

// Génère le défi de la semaine selon le user
export function generateWeeklyChallenge(userData) {
  const weekKey = getWeekKey();
  // Hash simple pour avoir le MÊME défi toute la semaine pour cet user
  const seed = (userData?.profile?.frequency || 3) + weekHash(weekKey);
  let tpl = WEEKLY_TEMPLATES[seed % WEEKLY_TEMPLATES.length];

  // Adapter selon le profil
  if (tpl.fromProfile && userData?.profile?.frequency) {
    tpl = { ...tpl, target: parseInt(userData.profile.frequency) };
  }

  return {
    id: 'weekly_' + weekKey,
    weekKey,
    ...tpl,
  };
}

function getWeekKey() {
  // ISO week format : YYYY-Www
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function weekHash(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ============================================================
// CALCUL PROGRESSION
// ============================================================

export function calculateChallengeProgress(challenge, state) {
  if (!challenge || !state) return { current: 0, target: 1, percent: 0 };

  const stats = state.stats || {};
  let current = 0;
  let target = challenge.target || 1;

  // Stats spécifiques à la semaine si défi weekly
  if (challenge.weekKey) {
    const startOfWeek = getStartOfWeek();
    switch (challenge.metric) {
      case 'sessions':
        current = (state.history || []).filter(h => new Date(h.date) >= startOfWeek).length;
        break;
      case 'minutes':
        current = (state.history || [])
          .filter(h => new Date(h.date) >= startOfWeek)
          .reduce((a, b) => a + (b.duration || 0), 0);
        break;
      case 'streak':
        current = stats.streak || 0;
        break;
      case 'badges':
        // Compter badges débloqués cette semaine (approximation : total badges actuels)
        current = (state.badges || []).length;
        break;
      case 'water_days':
      case 'nutrition_days':
        // À implémenter plus tard
        current = 0;
        break;
    }
  }

  const percent = Math.min(100, Math.round((current / target) * 100));
  return { current, target, percent, completed: percent >= 100 };
}

// ============================================================
// HELPERS POUR DÉFIS 30 JOURS
// ============================================================

export function startChallenge30d(challengeId, state) {
  if (!state.challenges) state.challenges = { weekly: {}, active30d: [] };

  const exists = (state.challenges.active30d || []).find(c => c.id === challengeId);
  if (exists) return null;

  const newChallenge = {
    id: challengeId,
    startedAt: Date.now(),
    completedDays: [],
    failedDays: [],
  };

  if (!state.challenges.active30d) state.challenges.active30d = [];
  state.challenges.active30d.push(newChallenge);
  return newChallenge;
}

export function abandonChallenge30d(challengeId, state) {
  if (!state.challenges?.active30d) return;
  state.challenges.active30d = state.challenges.active30d.filter(c => c.id !== challengeId);
}

export function getChallenge30dDay(challenge) {
  if (!challenge || !challenge.startedAt) return 1;
  const daysSinceStart = Math.floor((Date.now() - challenge.startedAt) / (24 * 60 * 60 * 1000)) + 1;
  return Math.min(30, daysSinceStart);
}

export function markChallenge30dDay(challengeId, day, state, success = true) {
  if (!state.challenges?.active30d) return;
  const ch = state.challenges.active30d.find(c => c.id === challengeId);
  if (!ch) return;

  if (success) {
    if (!ch.completedDays.includes(day)) ch.completedDays.push(day);
    ch.failedDays = (ch.failedDays || []).filter(d => d !== day);
  } else {
    if (!ch.failedDays) ch.failedDays = [];
    if (!ch.failedDays.includes(day)) ch.failedDays.push(day);
    ch.completedDays = ch.completedDays.filter(d => d !== day);
  }
}

export function getChallenge30dStatus(challenge) {
  if (!challenge) return null;
  const def = CHALLENGES_30D.find(c => c.id === challenge.id);
  if (!def) return null;
  const day = getChallenge30dDay(challenge);
  const completed = (challenge.completedDays || []).length;
  const progress = Math.round((completed / def.duration) * 100);
  const todayDone = (challenge.completedDays || []).includes(day);
  return { def, currentDay: day, completed, total: def.duration, progress, todayDone };
}

function getStartOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1); // Lundi
  return d;
}

// ============================================================
// XP RÉCOMPENSES POUR DÉFIS
// ============================================================
export const CHALLENGE_XP = {
  daily_30d: 30,          // par jour validé
  complete_30d: 1000,     // bonus à la fin
  weekly_complete: 500,   // défi hebdo complété
};

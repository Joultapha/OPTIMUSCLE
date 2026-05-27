/* ============================================================
   OPTIMUSCLE — XP & Leveling System
   ============================================================
   Système addictif type RPG : gagne de l'XP, monte de niveau,
   débloque des titres. Crée un sentiment de progression continu.
*/

// XP par action
export const XP_REWARDS = {
  workoutComplete: 100,
  exerciseComplete: 10,
  streakDay: 25,
  badge: 50,
  weekComplete: 250,
  firstWorkoutOfDay: 50,
};

// Niveaux (formule exponentielle douce)
// Niveau N requiert : floor(100 * N^1.5) XP cumulés
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgressInLevel(xp) {
  const lvl = levelFromXp(xp);
  const currentLevelXp = xpForLevel(lvl);
  const nextLevelXp = xpForLevel(lvl + 1);
  const inLevel = xp - currentLevelXp;
  const toNext = nextLevelXp - currentLevelXp;
  return {
    level: lvl,
    currentXp: inLevel,
    requiredXp: toNext,
    percentage: Math.min(100, Math.round((inLevel / toNext) * 100)),
    totalXp: xp,
    nextLevelAt: nextLevelXp,
  };
}

// Titres de niveau (motivants)
export const LEVEL_TITLES = {
  1: 'Débutant',
  2: 'Novice',
  3: 'Apprenti',
  5: 'Sportif',
  7: 'Athlète',
  10: 'Guerrier',
  15: 'Champion',
  20: 'Élite',
  25: 'Maître',
  30: 'Légende',
  40: 'Titan',
  50: 'Immortel',
};

export function getTitleForLevel(level) {
  let title = 'Débutant';
  for (const [lvl, t] of Object.entries(LEVEL_TITLES)) {
    if (level >= parseInt(lvl)) title = t;
  }
  return title;
}

// Calculer l'XP total à partir du state
export function computeTotalXp(state) {
  if (!state || !state.stats) return 0;
  const stats = state.stats;
  const badges = (state.badges || []).length;

  return (
    (stats.totalSessions || 0) * XP_REWARDS.workoutComplete +
    (stats.bestStreak || 0) * XP_REWARDS.streakDay +
    badges * XP_REWARDS.badge
  );
}

// Vérifier si le user vient de level-up
export function checkLevelUp(oldXp, newXp) {
  const oldLevel = levelFromXp(oldXp);
  const newLevel = levelFromXp(newXp);
  return newLevel > oldLevel ? { oldLevel, newLevel, gained: newLevel - oldLevel } : null;
}

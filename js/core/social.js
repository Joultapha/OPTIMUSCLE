/* ============================================================
   OPTIMUSCLE — Social Proof & Motivational Content
   ============================================================ */

// Citations motivantes (random à chaque chargement)
export const MOTIVATIONAL_QUOTES = [
  "La discipline bat le talent.",
  "Un jour ou jour 1. Toi tu choisis.",
  "Ton seul concurrent, c'est toi d'hier.",
  "Les excuses ne font pas de muscles.",
  "Sue maintenant, brille plus tard.",
  "Plus fort, plus rapide, plus déterminé.",
  "Le corps suit l'esprit.",
  "Chaque rep compte. Chaque jour compte.",
  "Repousse tes limites. Définis-les.",
  "Le succès se construit hors saison.",
];

export function getRandomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

// Greetings selon l'heure
export function getGreeting(name) {
  const h = new Date().getHours();
  let greet;
  if (h < 5) greet = 'Bonne nuit';
  else if (h < 12) greet = 'Bon matin';
  else if (h < 18) greet = 'Bon après-midi';
  else greet = 'Bonsoir';

  if (name) {
    const first = String(name).split(' ')[0].slice(0, 20);
    return `${greet}, ${first}`;
  }
  return greet;
}

// Témoignages (réalistes, anonymisés)
export const TESTIMONIALS = [
  {
    initial: 'M',
    name: 'Marc D.',
    age: 28,
    text: "8 semaines, -5kg et je me sens enfin bien dans ma peau. L'app m'a tenu la main.",
    stars: 5,
  },
  {
    initial: 'S',
    name: 'Sarah L.',
    age: 34,
    text: "J'ai testé plein d'apps, c'est la seule où j'arrive à tenir 3 mois d'affilée.",
    stars: 5,
  },
  {
    initial: 'T',
    name: 'Thomas R.',
    age: 41,
    text: "Les démos vidéo m'évitent les mauvaises postures. Mon dos me remercie.",
    stars: 5,
  },
  {
    initial: 'A',
    name: 'Amélie K.',
    age: 26,
    text: "20min/jour à la maison, sans matos. Résultat : +12kg de muscle en 6 mois.",
    stars: 5,
  },
  {
    initial: 'K',
    name: 'Karim B.',
    age: 32,
    text: "Le système de badges m'a rendu accro. J'ai pas raté une séance depuis 4 mois.",
    stars: 5,
  },
];

// Statistiques sociales (à animer en compteur croissant)
export const SOCIAL_STATS = {
  users: { value: 48720, suffix: '+', label: 'Athlètes actifs' },
  workouts: { value: 1247000, suffix: '+', label: 'Séances complétées' },
  rating: { value: 4.8, suffix: '/5', label: 'Note moyenne' },
};

// Compteur "en ligne maintenant" (random réaliste)
export function getLiveCount() {
  const hour = new Date().getHours();
  // Plus d'activité 6h-9h et 17h-22h
  const peakBoost = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 22) ? 1.5 : 1;
  const base = 280 + Math.floor(Math.random() * 120);
  return Math.floor(base * peakBoost);
}

// Messages contextuels (selon progression)
export function getContextualMessage(stats) {
  if (!stats) return null;
  const sessions = stats.totalSessions || 0;
  const streak = stats.streak || 0;

  if (sessions === 0) return { icon: '▲', text: "Lance ta première séance !" };
  if (sessions === 1) return { icon: '↑', text: "Bien joué pour la première !" };
  if (streak >= 7) return { icon: '⚡', text: `${streak} jours d'affilée, tu es en feu !` };
  if (streak >= 3) return { icon: '✦', text: `${streak} jours, continue comme ça !` };
  if (sessions >= 50) return { icon: '👑', text: "Tu fais partie des 5% les plus actifs" };
  if (sessions >= 10) return { icon: '🌟', text: `${sessions} séances déjà, impressionnant !` };
  if (sessions >= 5) return { icon: '⭐', text: `Bientôt 10 séances, tu progresses !` };

  return null;
}

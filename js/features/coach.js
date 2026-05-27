/* ============================================================
   OPTIMUSCLE — Coach IA Virtuel (Groq API + fallback démo)
   ============================================================
   - Chat conversationnel avec Llama 3.3 via Groq
   - Ultra rapide (30 req/min, 14k req/jour gratuit)
   - Contexte utilisateur personnalisé
   - Mode démo si pas de clé
============================================================ */

import { getState, getCurrentUser } from '../core/state.js';
import { getTodayNutritionContext } from './nutrition.js';
import { GOAL_LABELS, LEVEL_LABELS, PLACE_LABELS, GROQ_API_KEY } from '../core/config.js';
import { createEl, clearEl, sanitizeUrl } from '../utils/sanitize.js';
import { showToast } from '../utils/notifications.js';
import { haptic } from '../utils/animations.js';
import { rateLimit } from '../utils/rateLimit.js';

// Groq API (OpenAI-compatible)
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';  // Le meilleur du tier gratuit

// Historique de conversation (session uniquement)
let conversationHistory = [];

// Suggestions de questions au démarrage
const STARTER_QUESTIONS = [
  { icon: 'target', text: 'Comment progresser plus vite ?' },
  { icon: 'muscle', text: 'Quels exercices pour les pecs ?' },
  { icon: 'utensils', text: 'Suggère-moi un menu pour finir ma journée' },
  { icon: 'trophy', text: 'Propose-moi un défi personnalisé' },
  { icon: 'apple', text: 'Conseils nutrition pour la prise de muscle' },
  { icon: 'moon', text: 'Combien de temps récupérer ?' },
  { icon: 'shield', text: 'Comment éviter les blessures ?' },
  { icon: 'fire', text: 'Routine pour brûler des graisses' },
];

// Vérifie si l'API est configurée
function isApiConfigured() {
  return GROQ_API_KEY && GROQ_API_KEY !== 'REPLACE_ME' && GROQ_API_KEY.startsWith('gsk_');
}

// Construit le system prompt avec le contexte utilisateur
function buildSystemPrompt() {
  const data = getState();
  const user = getCurrentUser();
  const userName = user?.displayName?.split(' ')[0] || 'athlète';

  let context = `Tu es OPTI, le coach virtuel intelligent de l'application OPTIMUSCLE. Tu es à la fois :
- 💪 MOTIVANT : tu encourages, célèbres les progrès, pousses à donner le meilleur
- 🎓 EXPERT : connaissances pointues en musculation, cardio, nutrition, physiologie
- 🤗 BIENVEILLANT : tu comprends les difficultés, adaptes ton ton selon l'humeur

RÈGLES STRICTES :
- Réponds TOUJOURS en français
- Tutoie l'utilisateur (jamais "vous")
- Réponses COURTES et percutantes (3-6 lignes max, sauf si demandé long)
- Utilise des emojis avec parcimonie (1-2 par réponse)
- Donne des conseils CONCRETS et actionnables
- Si la question est hors fitness/santé, redirige gentiment
- Ne donne JAMAIS de conseil médical, redirige vers un pro si symptômes
- Sois direct, va à l'essentiel
- Utilise du **gras** (markdown) pour les points clés

NOM DE L'UTILISATEUR : ${userName}`;

  if (data.profile) {
    const goal = GOAL_LABELS[data.profile.goal]?.title || data.profile.goal;
    const level = LEVEL_LABELS[data.profile.level] || data.profile.level;
    const place = PLACE_LABELS[data.profile.place] || data.profile.place;
    context += `

PROFIL DE ${userName.toUpperCase()} :
- Objectif : ${goal}
- Niveau : ${level}
- Lieu d'entraînement : ${place}
- Fréquence : ${data.profile.frequency} séances/semaine
- Durée : ${data.profile.duration} min par séance`;
  }

  if (data.stats) {
    context += `

PROGRESSION ACTUELLE :
- Séances totales : ${data.stats.totalSessions || 0}
- Minutes totales : ${data.stats.totalMinutes || 0}
- Série actuelle : ${data.stats.streak || 0} jours
- Meilleure série : ${data.stats.bestStreak || 0} jours
- Badges débloqués : ${(data.badges || []).length}`;
  }

  // ⭐ Ajouter contexte défis actifs
  try {
    const challs = data.challenges?.active30d || [];
    if (challs.length > 0) {
      context += `\n\nDÉFIS EN COURS :`;
      challs.forEach(c => {
        const done = (c.completedDays || []).length;
        context += `\n- ${c.id} : ${done}/30 jours`;
      });
    }
  } catch (e) {}

  // ⭐ Ajouter contexte nutrition si dispo
  try {
    const nut = getTodayNutritionContext();
    if (nut) {
      context += `

NUTRITION DU JOUR :
- Objectif : ${nut.targetKcal} kcal (P${nut.targetProtein}g · G${nut.targetCarbs}g · L${nut.targetFat}g)
- Consommé : ${Math.round(nut.consumed.kcal)} kcal (P${Math.round(nut.consumed.prot)}g · G${Math.round(nut.consumed.carb)}g · L${Math.round(nut.consumed.fat)}g)
- Restant : ${nut.remaining.kcal} kcal (P${Math.round(nut.remaining.prot)}g · G${Math.round(nut.remaining.carb)}g · L${Math.round(nut.remaining.fat)}g)
- Repas pris : ${nut.mealsCount}`;
    }
  } catch (e) { /* ignore */ }

  return context;
}

/**
 * Envoie un message à Groq et retourne la réponse.
 */
async function callGroq(userMessage) {
  if (!isApiConfigured()) {
    return getDemoResponse(userMessage);
  }

  // Construire les messages au format OpenAI/Groq
  const messages = [
    { role: 'system', content: buildSystemPrompt() }
  ];

  // Historique précédent
  conversationHistory.forEach(msg => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text
    });
  });

  // Nouveau message
  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.8,
        max_tokens: 600,
        top_p: 0.95,
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      console.error('Groq API error:', error);
      if (response.status === 429) {
        return "Trop de questions d'un coup ! Attends 30 secondes et réessaie.";
      }
      if (response.status === 401 || response.status === 403) {
        return "Problème d'authentification. Contacte le support.";
      }
      if (response.status >= 500) {
        return "Le service est temporairement indisponible. Réessaie dans un moment.";
      }
      return "Désolé, j'ai un petit souci technique. Réessaie !";
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return "Hmm, je n'ai pas trouvé de réponse. Reformule ta question ?";
    }

    return text.trim();
  } catch (e) {
    console.error('Erreur Groq:', e);
    return "Problème de connexion. Vérifie ton internet et réessaie.";
  }
}

// Réponses de démo (sans API)
function getDemoResponse(message) {
  const m = message.toLowerCase();
  if (m.includes('progresser') || m.includes('plus vite')) {
    return "💪 Pour progresser vite : 1) **Régularité** avant intensité, 2) **Surcharge progressive** (augmente poids/reps chaque semaine), 3) Sommeil 7-9h, 4) Protéines à chaque repas. Tiens 8 semaines minimum sans skip !";
  }
  if (m.includes('pec') || m.includes('pectoraux')) {
    return "🏋️ Top exos pecs : **Développé couché** (force), **Pompes** (volume), **Écarté incliné** (forme). Vise 4 séries de 8-12 reps. Repos 90s entre séries.";
  }
  if (m.includes('nutrition') || m.includes('manger') || m.includes('alim')) {
    return "🍎 Règles d'or : **1,6-2g de protéines/kg** de poids, 4-5 repas/jour, hydratation 2-3L, glucides autour des entraînements. Compte tes calories pendant 2 semaines pour calibrer.";
  }
  if (m.includes('récup') || m.includes('repos')) {
    return "😴 Récupération = **50% du résultat**. Min 48h par groupe musculaire travaillé. Dors 7-9h. Étire-toi après. Une semaine 'décharge' toutes les 6-8 semaines.";
  }
  if (m.includes('blessure') || m.includes('mal') || m.includes('douleur')) {
    return "🚨 Si tu as une douleur vive : **ARRÊTE et consulte** un kiné/médecin. Préventif : échauffement 10 min, technique parfaite avant lourd, hydratation, sommeil. Ne force jamais sur la douleur.";
  }
  if (m.includes('grasse') || m.includes('graisse') || m.includes('maigrir')) {
    return "🔥 Perte de graisse : **déficit calorique léger** (200-500 kcal/jour), cardio 2-3x/sem (HIIT efficace), force pour garder muscle, patience (0,5-1kg/sem max). Le sommeil et le stress comptent !";
  }
  return "🤖 Mode démo activé ! L'IA complète sera disponible bientôt. En attendant, pose-moi des questions sur la progression, les pecs, la nutrition, la récupération, les blessures ou la perte de graisse.";
}

// ============================================================
// UI : Rendu des messages
// ============================================================

function addMessageToUI(text, role) {
  const list = document.getElementById('coach-messages');
  if (!list) return;

  const msg = createEl('div', {
    className: 'coach-msg coach-msg-' + role,
  });

  if (role === 'assistant') {
    const avatar = createEl('div', { className: 'coach-msg-avatar' });
    // SVG statique contrôlé — safe car pas de data user
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('viewBox', '0 0 24 24');
    svgEl.setAttribute('fill', 'none');
    svgEl.setAttribute('stroke', 'currentColor');
    svgEl.setAttribute('stroke-width', '2');
    svgEl.setAttribute('stroke-linecap', 'round');
    svgEl.setAttribute('stroke-linejoin', 'round');
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z');
    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z');
    svgEl.appendChild(path1);
    svgEl.appendChild(path2);
    avatar.appendChild(svgEl);
    msg.appendChild(avatar);
  }

  const bubble = createEl('div', { className: 'coach-msg-bubble' });

  // Markdown simple : bold + line breaks + escape HTML
  // Parse le texte en fragments safe
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const formatted = escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

  // innerHTML est acceptable ici car le contenu est échappé ci-dessus
  bubble.innerHTML = formatted;

  msg.appendChild(bubble);
  list.appendChild(msg);

  setTimeout(() => {
    list.scrollTop = list.scrollHeight;
  }, 50);
}

function showTypingIndicator() {
  const list = document.getElementById('coach-messages');
  if (!list) return;

  const msg = createEl('div', {
    className: 'coach-msg coach-msg-assistant coach-typing',
    attrs: { id: 'coach-typing' }
  });

  const avatar = createEl('div', { className: 'coach-msg-avatar' });
  // SVG statique contrôlé — safe
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('viewBox', '0 0 24 24');
  svgEl.setAttribute('fill', 'none');
  svgEl.setAttribute('stroke', 'currentColor');
  svgEl.setAttribute('stroke-width', '2');
  svgEl.setAttribute('stroke-linecap', 'round');
  svgEl.setAttribute('stroke-linejoin', 'round');
  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z');
  const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path2.setAttribute('d', 'M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z');
  svgEl.appendChild(path1);
  svgEl.appendChild(path2);
  avatar.appendChild(svgEl);
  msg.appendChild(avatar);

  const bubble = createEl('div', { className: 'coach-msg-bubble coach-typing-dots' });
  // 3 spans statiques pour le typing animation — safe
  bubble.appendChild(createEl('span'));
  bubble.appendChild(createEl('span'));
  bubble.appendChild(createEl('span'));
  msg.appendChild(bubble);

  list.appendChild(msg);
  list.scrollTop = list.scrollHeight;
}

function hideTypingIndicator() {
  const el = document.getElementById('coach-typing');
  if (el) el.remove();
}

// ============================================================
// MAIN : Envoyer message
// ============================================================

export async function sendMessage(text) {
  text = String(text || '').trim();
  if (!text) return;
  if (text.length > 500) {
    showToast('Message trop long (max 500 caractères)');
    return;
  }

  // Rate limit côté client
  if (!rateLimit('coach', 20, 60_000)) {
    showToast('Patiente avant de poser une autre question');
    return;
  }

  addMessageToUI(text, 'user');
  conversationHistory.push({ role: 'user', text });

  const input = document.getElementById('coach-input');
  if (input) input.value = '';

  const starters = document.getElementById('coach-starters');
  if (starters) starters.style.display = 'none';

  showTypingIndicator();
  haptic('light');

  const response = await callGroq(text);

  hideTypingIndicator();
  addMessageToUI(response, 'assistant');
  conversationHistory.push({ role: 'assistant', text: response });
  haptic('medium');

  // Limite historique à 20 messages
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }
}

// ============================================================
// INIT
// ============================================================

let initialized = false;

export function initCoach() {
  if (initialized) return;
  initialized = true;

  const form = document.getElementById('coach-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('coach-input');
      if (input) sendMessage(input.value);
    });
  }

  document.querySelectorAll('.coach-starter').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text || btn.textContent.trim();
      sendMessage(text);
    });
  });

  const floatBtn = document.getElementById('coach-fab');
  if (floatBtn) {
    floatBtn.addEventListener('click', openCoachModal);
  }

  const closeBtn = document.getElementById('coach-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeCoachModal);

  const overlay = document.getElementById('coach-modal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeCoachModal();
    });
  }

  renderWelcome();
}

function renderWelcome() {
  const list = document.getElementById('coach-messages');
  if (!list) return;
  if (list.children.length > 0) return;

  const user = getCurrentUser();
  const name = user?.displayName?.split(' ')[0] || 'champion';

  const welcomeText = `Salut **${name}** ! Je suis **OPTI**, ton coach virtuel.\n\nPose-moi tes questions sur l'entraînement, la nutrition, la récup... Je suis là pour t'aider à atteindre tes objectifs.`;

  addMessageToUI(welcomeText, 'assistant');
  renderStarters();
}


function getStarterIconSVG(name) {
  const icons = {
    target: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    muscle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2"/><path d="M20 12h2"/><rect x="4" y="9" width="3" height="6" rx="1"/><rect x="17" y="9" width="3" height="6" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
    utensils: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    trophy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 0 12 0V3H6z"/><path d="M6 3H4a2 2 0 0 0 0 4h2"/><path d="M18 3h2a2 2 0 0 1 0 4h-2"/><path d="M10 21v-3a2 2 0 0 1 4 0v3"/><path d="M8 21h8"/></svg>',
    apple: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 2a4 4 0 0 0-4 4c0 2 1 4 4 6 3-2 4-4 4-6a4 4 0 0 0-4-4z"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    fire: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  };
  return icons[name] || '';
}

function renderStarters() {
  const container = document.getElementById('coach-starters');
  if (!container) return;
  clearEl(container);
  container.style.display = 'flex';

  STARTER_QUESTIONS.forEach(q => {
    const btn = createEl('button', {
      className: 'coach-starter',
      attrs: { type: 'button', 'data-text': q.text },
    });
    const icon = createEl('span', { className: 'coach-starter-icon' });
    icon.innerHTML = getStarterIconSVG(q.icon);
    const text = createEl('span', { text: q.text });
    btn.appendChild(icon);
    btn.appendChild(text);
    btn.addEventListener('click', () => sendMessage(q.text));
    container.appendChild(btn);
  });
}

export function openCoachModal() {
  document.getElementById('coach-modal').classList.add('show');
  setTimeout(() => {
    const input = document.getElementById('coach-input');
    if (input) input.focus();
  }, 300);
}

export function closeCoachModal() {
  document.getElementById('coach-modal').classList.remove('show');
}

export function resetConversation() {
  conversationHistory = [];
  const list = document.getElementById('coach-messages');
  if (list) clearEl(list);
  renderWelcome();
}

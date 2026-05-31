/* ============================================================
   OPTIMUSCLE — Challenges UI
   ============================================================ */

import { getState, getCurrentUser, getUserData, save, saveImmediate } from '../core/state.js';
import {
  CHALLENGES_30D,
  generateWeeklyChallenge,
  calculateChallengeProgress,
  startChallenge30d,
  abandonChallenge30d,
  getChallenge30dStatus,
  getChallenge30dDay,
  markChallenge30dDay,
  CHALLENGE_XP,
} from '../core/challenges.js';
import { createEl, clearEl } from '../utils/sanitize.js';
import { showToast, confirmModal } from '../utils/notifications.js';
import { haptic } from '../utils/animations.js';
import { hasFeature } from '../saas/subscription.js';

// ============================================================
// INIT STATE
// ============================================================
function ensureChallengesState() {
  const state = getState();
  if (!state.challenges) {
    state.challenges = {
      weekly: {},        // { 'YYYY-Www': { completed: false, progress: x } }
      active30d: [],     // [{ id, startedAt, completedDays: [...] }]
      completed30d: [],  // [{ id, completedAt }]
    };
  }
  if (!state.challenges.weekly) state.challenges.weekly = {};
  if (!state.challenges.active30d) state.challenges.active30d = [];
  if (!state.challenges.completed30d) state.challenges.completed30d = [];
  return state.challenges;
}

// ============================================================
// RENDU PRINCIPAL
// ============================================================
export function renderChallenges() {
  // ⭐ Premium gate : Défis communautaires réservés Premium
  const userData = getUserData();
  if (!hasFeature(userData, 'communityChallenges')) {
    renderChallengesLocked();
    return;
  }

  ensureChallengesState();
  const container = document.getElementById('challenges-content');
  if (!container) return;
  clearEl(container);

  // Header
  container.appendChild(createEl('div', {
    className: 'chal-header',
    html: `
      <span class="label-eyebrow"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M6 9a6 6 0 0 0 12 0V3H6z"/><path d="M6 3H4a2 2 0 0 0 0 4h2"/><path d="M18 3h2a2 2 0 0 1 0 4h-2"/><path d="M10 21v-3a2 2 0 0 1 4 0v3"/><path d="M8 21h8"/></svg> Défis</span>
      <h1>Pousse tes <span class="text-gradient">limites</span></h1>
      <p>Relève des défis quotidiens et hebdomadaires pour rester motivé</p>
    `
  }));

  // SECTION 1 : Défi de la semaine
  container.appendChild(renderWeeklyChallenge());

  // SECTION 2 : Défis 30 jours actifs
  const state = getState();
  if (state.challenges.active30d.length > 0) {
    container.appendChild(renderActive30dList());
  }

  // SECTION 3 : Catalogue 30 jours
  container.appendChild(renderCatalog30d());
}

// ============================================================
// DÉFI HEBDOMADAIRE
// ============================================================
function renderWeeklyChallenge() {
  const state = getState();
  const userData = { profile: state.profile };
  const weekly = generateWeeklyChallenge(userData);
  const progress = calculateChallengeProgress(weekly, state);

  const wrap = createEl('div', { className: 'chal-section' });
  wrap.appendChild(createEl('h2', {
    className: 'chal-section-title',
    html: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> <span>Défi de la semaine</span>'
  }));

  const card = createEl('div', {
    className: 'chal-weekly-card ' + (progress.completed ? 'completed' : ''),
  });

  card.innerHTML = `
    <div class="chal-weekly-glow" style="background: radial-gradient(circle, ${weekly.color}40 0%, transparent 70%);"></div>
    <div class="chal-weekly-header">
      <div class="chal-weekly-icon" style="background: linear-gradient(135deg, ${weekly.color}, ${weekly.color}aa);">${weekly.icon}</div>
      <div class="chal-weekly-info">
        <div class="chal-weekly-tag">CETTE SEMAINE</div>
        <h3 class="chal-weekly-title">${escapeHtml(weekly.title)}</h3>
        <p class="chal-weekly-desc">${escapeHtml(weekly.desc)}</p>
      </div>
    </div>

    <div class="chal-weekly-progress">
      <div class="chal-progress-info">
        <span class="chal-progress-current">${progress.current}<span class="dim">/${progress.target}</span></span>
        <span class="chal-progress-percent">${progress.percent}%</span>
      </div>
      <div class="chal-progress-bar">
        <div class="chal-progress-fill" style="width: ${progress.percent}%; background: linear-gradient(90deg, ${weekly.color}, ${weekly.color}cc);"></div>
      </div>
    </div>

    ${progress.completed ? `
      <div class="chal-completed-badge">
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11.5 14.5 16 9.5"/></svg> DÉFI TERMINÉ ! <strong>+${CHALLENGE_XP.weekly_complete} XP</strong>
      </div>
    ` : ''}
  `;

  wrap.appendChild(card);
  return wrap;
}

// ============================================================
// DÉFIS 30 JOURS ACTIFS
// ============================================================
function renderActive30dList() {
  const state = getState();
  const wrap = createEl('div', { className: 'chal-section' });

  wrap.appendChild(createEl('h2', {
    className: 'chal-section-title',
    html: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> <span>Défis en cours</span>'
  }));

  state.challenges.active30d.forEach(activeChallenge => {
    const status = getChallenge30dStatus(activeChallenge);
    if (!status) return;
    wrap.appendChild(renderActive30dCard(activeChallenge, status));
  });

  return wrap;
}

function renderActive30dCard(active, status) {
  const { def, currentDay, completed, total, progress, todayDone } = status;
  const todayTask = def.daily(currentDay);

  const card = createEl('div', { className: 'chal-active-card' });

  card.innerHTML = `
    <div class="chal-active-glow" style="background: radial-gradient(circle, ${def.color}30 0%, transparent 70%);"></div>
    <div class="chal-active-header">
      <div class="chal-active-icon" style="background: linear-gradient(135deg, ${def.color}, ${def.color}aa);">${def.icon}</div>
      <div class="chal-active-info">
        <h3 class="chal-active-title">${escapeHtml(def.title)}</h3>
        <div class="chal-active-day">Jour <strong>${currentDay}</strong>/${total}</div>
      </div>
      <button class="chal-active-abandon" data-id="${def.id}" type="button" aria-label="Abandonner">✕</button>
    </div>

    <div class="chal-active-progress">
      <div class="chal-progress-info">
        <span class="chal-progress-current">${completed}<span class="dim">/${total} jours</span></span>
        <span class="chal-progress-percent">${progress}%</span>
      </div>
      <div class="chal-progress-bar">
        <div class="chal-progress-fill" style="width: ${progress}%; background: linear-gradient(90deg, ${def.color}, ${def.color}cc);"></div>
      </div>
    </div>

    <div class="chal-today-task ${todayTask.rest ? 'rest' : ''} ${todayDone ? 'done' : ''}">
      <div class="chal-today-label">${todayTask.rest ? "<svg width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align:-2px\"><path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"/></svg> AUJOURD'HUI" : '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> OBJECTIF DU JOUR'}</div>
      <div class="chal-today-value">${escapeHtml(todayTask.label)}</div>
      ${!todayTask.rest ? `
        <button class="chal-today-btn ${todayDone ? 'done' : ''}" data-id="${def.id}" data-day="${currentDay}" type="button">
          ${todayDone ? '✓ Validé !' : 'Marquer comme fait'}
        </button>
      ` : ''}
    </div>

    <div class="chal-streak-grid">
      ${Array.from({ length: total }, (_, i) => {
        const day = i + 1;
        const isCompleted = (active.completedDays || []).includes(day);
        const isFailed = (active.failedDays || []).includes(day);
        const isToday = day === currentDay;
        const isFuture = day > currentDay;
        return `<span class="chal-day-cell ${isCompleted ? 'done' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${isFailed ? 'failed' : ''}" title="Jour ${day}"></span>`;
      }).join('')}
    </div>
  `;

  // Bind buttons
  setTimeout(() => {
    card.querySelector('.chal-active-abandon')?.addEventListener('click', () => abandonChallenge(def.id));
    card.querySelector('.chal-today-btn:not(.done)')?.addEventListener('click', () => markDayDone(def.id, currentDay));
  }, 10);

  return card;
}

// ============================================================
// CATALOGUE 30 JOURS
// ============================================================
function renderCatalog30d() {
  const state = getState();
  const activeIds = state.challenges.active30d.map(c => c.id);

  const wrap = createEl('div', { className: 'chal-section' });
  wrap.appendChild(createEl('h2', {
    className: 'chal-section-title',
    html: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> <span>Catalogue de défis</span>'
  }));

  const grid = createEl('div', { className: 'chal-catalog-grid' });

  CHALLENGES_30D.forEach(def => {
    const isActive = activeIds.includes(def.id);
    const card = createEl('div', {
      className: 'chal-catalog-card ' + (isActive ? 'active' : ''),
    });

    card.innerHTML = `
      <div class="chal-catalog-glow" style="background: radial-gradient(circle, ${def.color}20 0%, transparent 70%);"></div>
      <div class="chal-catalog-icon" style="background: linear-gradient(135deg, ${def.color}, ${def.color}aa);">${def.icon}</div>
      <div class="chal-catalog-content">
        <h3 class="chal-catalog-title">${escapeHtml(def.title)}</h3>
        <p class="chal-catalog-desc">${escapeHtml(def.desc)}</p>
        <div class="chal-catalog-meta">
          <span class="chal-meta-pill">${def.duration}j</span>
          <span class="chal-meta-pill chal-meta-${def.difficulty}">${def.difficulty === 'beginner' ? '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 22v-8"/><path d="M12 14c-4 0-7-3-7-7 4 0 7 3 7 7z"/><path d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7z"/></svg> Débutant' : def.difficulty === 'intermediate' ? '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Inter' : '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> Avancé'}</span>
        </div>
      </div>
      <button class="chal-catalog-btn ${isActive ? 'active' : ''}" data-id="${def.id}" type="button">
        ${isActive ? '✓ Actif' : '+ Lancer'}
      </button>
    `;

    grid.appendChild(card);
  });

  wrap.appendChild(grid);

  // Bind buttons
  setTimeout(() => {
    grid.querySelectorAll('.chal-catalog-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!btn.classList.contains('active')) {
          startChallenge(id);
        }
      });
    });
  }, 10);

  return wrap;
}

// ============================================================
// ACTIONS
// ============================================================

async function startChallenge(challengeId) {
  const state = getState();
  ensureChallengesState();
  const result = startChallenge30d(challengeId, state);
  if (!result) {
    showToast('Défi déjà actif');
    return;
  }
  haptic('success');
  showToast(`Défi lancé ! C'est parti !`);
  await save();
  renderChallenges();
}

async function abandonChallenge(challengeId) {
  const confirmed = await confirmModal('Abandonner ce défi ? Toute la progression sera perdue.', {
    title: 'Abandonner le défi',
    confirmText: 'Abandonner',
    cancelText: 'Annuler',
    danger: true,
  });
  if (!confirmed) return;
  const state = getState();
  abandonChallenge30d(challengeId, state);
  haptic('medium');
  await save();
  renderChallenges();
  showToast('Défi abandonné');
}

async function markDayDone(challengeId, day) {
  const state = getState();
  markChallenge30dDay(challengeId, day, state, true);
  haptic('success');

  // Vérifier si défi terminé
  const ch = state.challenges.active30d.find(c => c.id === challengeId);
  const def = CHALLENGES_30D.find(c => c.id === challengeId);
  if (ch && def && ch.completedDays.length === def.duration) {
    // Défi complété !
    state.challenges.completed30d.push({
      id: challengeId,
      completedAt: Date.now(),
    });
    state.challenges.active30d = state.challenges.active30d.filter(c => c.id !== challengeId);
    await save();
    showChallengeCompleted(def);
    renderChallenges();
    return;
  }

  await save();
  showToast(`Jour ${day} validé ! +${CHALLENGE_XP.daily_30d} XP`);
  renderChallenges();
}

function showChallengeCompleted(def) {
  // Modal de félicitations (réutilise badge modal pour simplicité)
  const modal = document.getElementById('badge-modal');
  if (!modal) return;
  document.getElementById('badge-modal-emoji').innerHTML = def.icon;
  document.getElementById('badge-modal-name').textContent = def.title.toUpperCase();
  document.getElementById('badge-modal-desc').textContent = `Défi terminé ! +${CHALLENGE_XP.complete_30d} XP`;
  modal.classList.add('show');
  haptic('success');
}

// ============================================================
// HELPERS
// ============================================================

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// LOCKED VIEW (free users)
// ============================================================
function renderChallengesLocked() {
  const container = document.getElementById('challenges-content');
  if (!container) return;
  clearEl(container);

  container.appendChild(createEl('div', {
    className: 'chal-header',
    html: `
      <span class="label-eyebrow"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M6 9a6 6 0 0 0 12 0V3H6z"/><path d="M6 3H4a2 2 0 0 0 0 4h2"/><path d="M18 3h2a2 2 0 0 1 0 4h-2"/><path d="M10 21v-3a2 2 0 0 1 4 0v3"/><path d="M8 21h8"/></svg> Défis</span>
      <h1>Pousse tes <span class="text-gradient">limites</span></h1>
    `
  }));

  const lockedCard = createEl('div', {
    className: 'chal-locked-card',
    html: `
      <div class="chal-locked-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" fill="rgba(212,168,67,0.1)"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h2 class="chal-locked-title">Défis communautaires</h2>
      <p class="chal-locked-desc">Relève des défis quotidiens et hebdomadaires pour rester motivé. Disponible avec Premium.</p>
      <button class="btn btn-primary chal-locked-btn" type="button">Voir les plans</button>
    `,
  });
  lockedCard.querySelector('.chal-locked-btn')?.addEventListener('click', () => {
    import('./sidebar.js').then(mod => { if (mod.openPremiumModal) mod.openPremiumModal(); });
  });
  container.appendChild(lockedCard);
}

// ============================================================
// INIT
// ============================================================
let initialized = false;
export function initChallenges() {
  if (initialized) return;
  initialized = true;
}

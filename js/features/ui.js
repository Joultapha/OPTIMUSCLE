/* ============================================================
   OPTIMUSCLE PREMIUM — UI Rendering (sécurisé + animations)
   ============================================================ */

import { getState, getUserData, save, getCurrentUser, saveImmediate } from '../core/state.js';
import { setSubPage } from '../core/appState.js';
import { GOAL_LABELS, PLACE_LABELS, LEVEL_LABELS } from '../core/config.js';
import { HERO_IMAGES, getFocusImage, EX_DB, EX_GIFS, BADGES } from '../core/data.js';
import { startTimer } from '../core/timer.js';
import { showToast, showToastWithAction, confirmModal } from '../utils/notifications.js';
import { createEl, clearEl, sanitizeUrl } from '../utils/sanitize.js';
import {
  enforceFreemiumLimits,
  filterHistoryByPlan,
  isPremium,
  hasFeature,
  getSubscriptionBadge,
} from '../saas/subscription.js';
import {
  computeTotalXp,
  xpProgressInLevel,
  getTitleForLevel,
  checkLevelUp,
  XP_REWARDS,
} from '../saas/xp.js';
import {
  TESTIMONIALS,
  getGreeting,
  getRandomQuote,
  getLiveCount,
  getContextualMessage,
} from '../core/social.js';
import { animateCount, haptic } from '../utils/animations.js';

// ========== NAVIGATION (via appState) ==========
export function switchTab(tab) {
  // ⭐ N'utilise QUE setSubPage. Le render() central s'occupe du DOM.
  setSubPage(tab);
  const handlers = { home: renderHome, history: renderHistory, badges: renderBadges, profile: renderProfile };
  if (handlers[tab]) handlers[tab]();
  // Sync bottom nav active tab
  import('./bottomNav.js').then(mod => { if (mod.setActiveBottomTab) mod.setActiveBottomTab(tab); }).catch(() => {});
  haptic('light');
}

export function goHome() {
  switchTab('home');
}

export function showApp() {
  // ⭐ DEPRECATED : utiliser setOnboardingCompleted(true) à la place
  setSubPage('home');
  renderHome();
}

// ========== HOME ==========
export function renderHome() {
  const state = getState();
  if (!state.profile || !state.program) return;

  const userData = getUserData();
  const user = getCurrentUser();
  const visibleProgram = enforceFreemiumLimits(state.program, userData);

  // ===== HERO PREMIUM =====
  const greeting = getGreeting(user?.displayName || user?.email);
  const heroGreeting = document.getElementById('hero-greeting');
  if (heroGreeting) {
    clearEl(heroGreeting);
    heroGreeting.appendChild(document.createTextNode(greeting.split(',')[0]));
    heroGreeting.appendChild(createEl('strong', { text: greeting.split(',')[1] || ' Champion' }));
  }

  const ctx = getContextualMessage(state.stats);
  const heroTag = document.getElementById('hero-tag');
  if (heroTag) {
    if (ctx) {
      heroTag.innerHTML = `${ctx.icon} ${ctx.text}`;
    } else {
      heroTag.textContent = 'Cette semaine';
    }
  }

  const g = GOAL_LABELS[state.profile.goal];
  if (g) {
    setText('hero-title', g.title);
  }

  setText('hero-quote', getRandomQuote());

  // Hero image
  const heroUrl = sanitizeUrl(HERO_IMAGES[state.profile.goal]);
  if (heroUrl) {
    const heroImg = document.getElementById('hero-img');
    const weekBg = document.getElementById('week-card-bg');
    if (heroImg) heroImg.style.backgroundImage = `url('${heroUrl}')`;
    if (weekBg) weekBg.style.backgroundImage = `url('${heroUrl}')`;
  }

  // ===== STREAK CARD =====
  const streak = state.stats.streak || 0;
  const streakCard = document.getElementById('streak-card');
  if (streak > 0 && streakCard) {
    streakCard.style.display = 'flex';
    setText('streak-number', streak);
    setText('streak-best', `Best : ${state.stats.bestStreak || streak} jours`);
  } else if (streakCard) {
    streakCard.style.display = 'none';
  }

  // ===== XP & LEVEL =====
  const totalXp = computeTotalXp(state);
  const xpProgress = xpProgressInLevel(totalXp);
  const title = getTitleForLevel(xpProgress.level);

  setText('xp-title', `Niveau ${xpProgress.level} · ${title}`);
  setText('xp-level-badge', `LVL ${xpProgress.level}`);
  setText('xp-current', xpProgress.currentXp);
  setText('xp-required', xpProgress.requiredXp);

  const xpFill = document.getElementById('xp-fill');
  if (xpFill) {
    requestAnimationFrame(() => {
      xpFill.style.width = xpProgress.percentage + '%';
    });
  }

  // ===== WEEK PROGRESS =====
  const totalWorkouts = visibleProgram.filter(d => !d.rest).length;
  const doneWorkouts = visibleProgram.filter(d => !d.rest && d.done).length;

  // Animation count
  const doneEl = document.getElementById('done-count');
  const totalEl = document.getElementById('total-count');
  if (doneEl) animateCount(doneEl, doneWorkouts, { duration: 800 });
  if (totalEl) setText('total-count', totalWorkouts);

  const fill = document.getElementById('week-fill');
  if (fill) {
    requestAnimationFrame(() => {
      fill.style.width = (totalWorkouts ? doneWorkouts / totalWorkouts * 100 : 0) + '%';
    });
  }

  // ===== STATS =====
  animateCount(document.getElementById('stat-total'), state.stats.totalSessions || 0);
  animateCount(document.getElementById('stat-min'), state.stats.totalMinutes || 0);
  animateCount(document.getElementById('stat-badges'), (state.badges || []).length);

  // ===== DAYS LIST =====
  const list = document.getElementById('days-list');
  clearEl(list);
  const todayIdx = (new Date().getDay() + 6) % 7;

  visibleProgram.forEach((d, i) => {
    const isToday = i === todayIdx;
    const card = createDayCard(d, i, isToday);
    card.style.animation = `fadeUp 400ms var(--ease-out) ${i * 60}ms both`;
    list.appendChild(card);
  });

  // ===== SOCIAL PROOF =====
  renderTestimonials();
  setText('live-count', getLiveCount());
}

function createDayCard(d, i, isToday) {
  const isLocked = d.locked === true;

  const card = createEl('div', {
    className: 'day-card'
      + (d.rest ? ' rest' : '')
      + (d.done ? ' done' : '')
      + (isToday && !isLocked ? ' today' : '')
      + (isLocked ? ' locked' : ''),
  });

  const imgUrl = sanitizeUrl(getFocusImage(d.name));
  const imgDiv = createEl('div', { className: 'day-card-img' });
  if (imgUrl) imgDiv.style.backgroundImage = `url('${imgUrl}')`;
  card.appendChild(imgDiv);

  card.appendChild(createEl('div', { className: 'day-card-overlay' }));

  const content = createEl('div', { className: 'day-card-content' });

  // Day number
  const dayNum = createEl('div', { className: 'day-num' });
  dayNum.appendChild(createEl('div', { className: 'day-num-day', text: String(d.day).toUpperCase() }));
  dayNum.appendChild(createEl('div', { className: 'day-num-label', text: `JOUR ${i + 1}` }));
  content.appendChild(dayNum);

  // Day info
  const info = createEl('div', { className: 'day-info' });
  const nameEl = createEl('div', { className: 'day-name' });
  nameEl.appendChild(document.createTextNode(String(d.name).toUpperCase()));

  if (isToday && !isLocked && !d.rest) {
    const badge = createEl('span', { className: 'today-badge', text: "AUJOURD'HUI" });
    nameEl.appendChild(badge);
  }
  info.appendChild(nameEl);

  const detail = createEl('div', { className: 'day-detail' });
  if (d.rest) {
    detail.appendChild(document.createTextNode(isLocked ? 'Réservé Premium' : 'Repos & récupération'));
  } else {
    detail.appendChild(document.createTextNode(`${d.exercises.length} exos`));
    detail.appendChild(createEl('span', { className: 'day-detail-dot' }));
    detail.appendChild(document.createTextNode(`${d.duration} min`));
    detail.appendChild(createEl('span', { className: 'day-detail-dot' }));
    detail.appendChild(document.createTextNode(d.difficulty));
  }
  info.appendChild(detail);
  content.appendChild(info);

  if (!d.rest && !isLocked) {
    content.appendChild(createEl('div', { className: 'day-arrow', text: '›' }));
  }

  card.appendChild(content);

  if (!d.rest && !isLocked) {
    card.addEventListener('click', () => openWorkout(i));
  } else if (isLocked) {
    card.addEventListener('click', () => {
      haptic('medium');
      showToast('Disponible avec Premium');
    });
  }

  return card;
}

// ========== TESTIMONIALS ==========
function renderTestimonials() {
  const container = document.getElementById('testimonials-list');
  if (!container) return;
  clearEl(container);

  TESTIMONIALS.forEach((t) => {
    const card = createEl('div', { className: 'testimonial-card' });

    const starSVG = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    const stars = createEl('div', { className: 'testimonial-stars', html: starSVG.repeat(t.stars) });
    card.appendChild(stars);

    const text = createEl('div', { className: 'testimonial-text', text: `"${t.text}"` });
    card.appendChild(text);

    const author = createEl('div', { className: 'testimonial-author' });
    author.appendChild(createEl('div', { className: 'testimonial-avatar', text: t.initial }));
    const info = createEl('div', { className: 'testimonial-info' });
    info.appendChild(createEl('div', { className: 'testimonial-name', text: t.name }));
    info.appendChild(createEl('div', { className: 'testimonial-meta', text: `${t.age} ans` }));
    author.appendChild(info);
    card.appendChild(author);

    container.appendChild(card);
  });
}

// ========== WORKOUT ==========
export function openWorkout(idx) {
  const state = getState();
  state.currentDay = idx;
  const d = state.program[idx];
  if (!d || d.rest) return;

  setSubPage('workout');

  const heroUrl = sanitizeUrl(getFocusImage(d.name));
  const heroImg = document.getElementById('wk-hero-img');
  if (heroImg && heroUrl) heroImg.style.backgroundImage = `url('${heroUrl}')`;

  setText('wk-day', String(d.day).toUpperCase() + ' · SÉANCE');
  setText('wk-title', String(d.name).toUpperCase());
  setText('wk-ex-count', d.exercises.length);
  setText('wk-duration', d.duration);
  setText('wk-difficulty', d.difficulty);

  const list = document.getElementById('exercise-list');
  clearEl(list);

  d.exercises.forEach((ex, i) => {
    const card = createExerciseCard(ex, i);
    card.style.animationDelay = (i * 80) + 'ms';
    list.appendChild(card);
  });

  window.scrollTo(0, 0);
}

function createExerciseCard(ex, idx) {
  const card = createEl('div', {
    className: 'exercise' + (ex.done ? ' done' : ''),
  });

  const top = createEl('div', { className: 'exercise-top' });

  const check = createEl('div', {
    className: 'check-circle' + (ex.done ? ' checked' : ''),
    attrs: { 'data-ex': String(idx), role: 'checkbox', tabindex: '0' },
    on: {
      click: () => toggleExercise(idx),
      keydown: (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleExercise(idx);
        }
      }
    },
  });
  top.appendChild(check);

  const body = createEl('div', { className: 'exercise-body' });
  body.appendChild(createEl('div', { className: 'exercise-muscle', text: ex.muscle }));

  const nameWrap = createEl('div', { className: 'exercise-name' });
  nameWrap.appendChild(document.createTextNode(String(ex.name).toUpperCase() + ' '));
  const infoBtn = createEl('button', {
    className: 'info-btn',
    attrs: { type: 'button', title: 'Comment faire ?', 'aria-label': 'Voir détails' },
    text: '?',
    on: {
      click: (e) => {
        e.stopPropagation();
        showExInfo(ex.key);
      },
    },
  });
  nameWrap.appendChild(infoBtn);

  // ⭐ Edit button (Premium only)
  const userData = getUserData();
  if (hasFeature(userData, 'customPrograms')) {
    const editBtn = createEl('button', {
      className: 'info-btn ex-edit-btn',
      attrs: { type: 'button', title: 'Modifier', 'aria-label': 'Modifier exercice' },
      html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      on: {
        click: (e) => {
          e.stopPropagation();
          openExerciseEditor(idx);
        },
      },
    });
    nameWrap.appendChild(editBtn);
  }

  // ⭐ Substitute button (Premium only)
  if (hasFeature(userData, 'customPrograms')) {
    const subBtn = createEl('button', {
      className: 'info-btn ex-sub-btn',
      attrs: { type: 'button', title: 'Remplacer', 'aria-label': 'Remplacer exercice' },
      html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
      on: {
        click: (e) => {
          e.stopPropagation();
          openSubstituteDialog(idx);
        },
      },
    });
    nameWrap.appendChild(subBtn);
  }

  body.appendChild(nameWrap);

  const sets = createEl('div', { className: 'sets' });
  sets.appendChild(createPill(String(ex.sets), 'séries'));
  sets.appendChild(createPill(String(ex.reps), ex.time ? '' : 'reps'));
  sets.appendChild(createPill(`${ex.rest}s`, 'repos'));
  body.appendChild(sets);

  const timerBtn = createEl('button', {
    className: 'timer-btn',
    attrs: { type: 'button' },
    text: `Timer ${ex.rest}s`,
    on: { click: () => { haptic('medium'); startTimer(ex.rest, ex.name); } },
  });
  body.appendChild(timerBtn);

  top.appendChild(body);
  card.appendChild(top);
  return card;
}

function createPill(value, label) {
  const pill = createEl('div', { className: 'set-pill' });
  const strong = createEl('strong', { text: value });
  pill.appendChild(strong);
  if (label) pill.appendChild(document.createTextNode(' ' + label));
  return pill;
}

async function toggleExercise(i) {
  const state = getState();
  const d = state.program[state.currentDay];
  d.exercises[i].done = !d.exercises[i].done;
  haptic(d.exercises[i].done ? 'success' : 'light');
  await save();
  openWorkout(state.currentDay);
}

// ========== WORKOUT COMPLETION WITH UNDO ==========
export async function completeWorkout() {
  const state = getState();
  const d = state.program[state.currentDay];

  if (!d.done) {
    // Sauvegarder l'état avant complétion pour undo
    const beforeState = {
      done: d.done,
      exercisesDone: d.exercises.map(e => e.done),
      totalSessions: state.stats.totalSessions,
      totalMinutes: state.stats.totalMinutes,
      streak: state.stats.streak,
      bestStreak: state.stats.bestStreak,
      lastDone: state.stats.lastDone,
      historyLength: state.history.length,
    };

    // XP avant
    const oldXp = computeTotalXp(state);

    d.done = true;
    d.exercises.forEach(e => e.done = true);
    state.stats.totalSessions++;
    state.stats.totalMinutes += d.duration;

    const today = new Date().toDateString();
    const lastDate = state.stats.lastDone ? new Date(state.stats.lastDone).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastDate === today) {
      // ok
    } else if (lastDate === yesterday || !lastDate) {
      state.stats.streak++;
    } else {
      state.stats.streak = 1;
    }

    if (state.stats.streak > state.stats.bestStreak) {
      state.stats.bestStreak = state.stats.streak;
    }
    state.stats.lastDone = new Date().toISOString();

    const historyEntry = {
      date: new Date().toISOString(),
      name: d.name,
      duration: d.duration,
      exercises: d.exercises.length,
    };
    state.history.unshift(historyEntry);

    if (state.history.length > 100) state.history = state.history.slice(0, 100);

    await save();
    haptic('success');

    // ⭐ FIX v24: Show toast non-blocking, navigate home immediately
    // Previously: await showToastWithAction() blocked for 5s before showing level-up
    // Now: toast is fire-and-forget, undo is handled via the toast action callback
    let undoRequested = false;
    showToastWithAction(
      `Bravo ! +${XP_REWARDS.workoutComplete} XP`,
      'Annuler',
      4000
    ).then(clicked => {
      if (clicked && !undoRequested) {
        undoRequested = true;
        // Annuler la complétion
        d.done = beforeState.done;
        d.exercises.forEach((e, i) => e.done = beforeState.exercisesDone[i]);
        state.stats.totalSessions = beforeState.totalSessions;
        state.stats.totalMinutes = beforeState.totalMinutes;
        state.stats.streak = beforeState.streak;
        state.stats.bestStreak = beforeState.bestStreak;
        state.stats.lastDone = beforeState.lastDone;
        if (state.history.length > beforeState.historyLength) {
          state.history.shift();
        }
        save();
        showToast('Séance annulée');
        goHome();
      }
    });

    // Vérif level up — don't wait for toast
    const newXp = computeTotalXp(state);
    const levelUp = checkLevelUp(oldXp, newXp);

    // Navigate home first, THEN show level-up after settling
    goHome();

    if (levelUp) {
      // Show level-up modal after the home page has rendered
      setTimeout(() => showLevelUp(levelUp.newLevel), 600);
    } else {
      setTimeout(() => checkBadges(), 300);
    }
  } else {
    // Workout already done — just go home
    goHome();
  }
}

// ========== EXERCISE EDITOR ==========
function openExerciseEditor(exIdx) {
  const state = getState();
  const d = state.program[state.currentDay];
  const ex = d.exercises[exIdx];
  if (!ex) return;

  // ⭐ Premium gate: custom programs reserved for Premium
  if (!hasFeature(getUserData(), 'customPrograms')) {
    showToast('Programmes personnalisés disponibles avec Premium');
    import('./sidebar.js').then(mod => { if (mod.openPremiumModal) mod.openPremiumModal(); });
    return;
  }

  let overlay = document.getElementById('ex-editor-overlay');
  if (!overlay) {
    overlay = createEl('div', {
      className: 'modal-overlay',
      attrs: { id: 'ex-editor-overlay' },
    });
    document.body.appendChild(overlay);
  }
  clearEl(overlay);

  const modal = createEl('div', { className: 'modal' });
  modal.appendChild(createEl('h3', { text: 'Modifier l\'exercice' }));
  modal.appendChild(createEl('p', {
    className: 'confirm-modal-message',
    text: ex.name.toUpperCase() + ' — ' + ex.muscle,
  }));

  // Sets input
  const setsLabel = createEl('label', { className: 'nut-onb-label-sm', text: 'Séries' });
  const setsInput = createEl('input', {
    className: 'nut-input',
    attrs: { type: 'number', min: '1', max: '20', value: String(ex.sets) },
  });
  modal.appendChild(setsLabel);
  modal.appendChild(setsInput);

  // Reps input
  const repsLabel = createEl('label', { className: 'nut-onb-label-sm', text: 'Réps / Durée', style: 'margin-top:12px;display:block;' });
  const repsInput = createEl('input', {
    className: 'nut-input',
    attrs: { type: 'text', value: String(ex.reps) },
  });
  modal.appendChild(repsLabel);
  modal.appendChild(repsInput);

  // Buttons
  const btnRow = createEl('div', { className: 'confirm-modal-btns' });
  btnRow.appendChild(createEl('button', {
    className: 'btn btn-ghost',
    text: 'Annuler',
    on: { click: () => overlay.classList.remove('show') },
  }));
  btnRow.appendChild(createEl('button', {
    className: 'btn btn-primary',
    text: 'Sauvegarder',
    on: {
      click: async () => {
        const newSets = Math.max(1, Math.min(20, parseInt(setsInput.value) || ex.sets));
        const newReps = repsInput.value.trim() || ex.reps;
        d.exercises[exIdx].sets = newSets;
        d.exercises[exIdx].reps = newReps;
        await save();
        overlay.classList.remove('show');
        openWorkout(state.currentDay);
        showToast('Exercice modifié');
      },
    },
  }));
  modal.appendChild(btnRow);

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('show');
  }, { once: true });
  requestAnimationFrame(() => overlay.classList.add('show'));
}

// ========== EXERCISE SUBSTITUTE DIALOG ==========
function openSubstituteDialog(exIdx) {
  const state = getState();
  const d = state.program[state.currentDay];
  const ex = d.exercises[exIdx];
  if (!ex) return;

  // ⭐ Premium gate: custom programs reserved for Premium
  if (!hasFeature(getUserData(), 'customPrograms')) {
    showToast('Programmes personnalisés disponibles avec Premium');
    import('./sidebar.js').then(mod => { if (mod.openPremiumModal) mod.openPremiumModal(); });
    return;
  }

  // Get user's place from profile
  const place = state.profile?.place || 'home_none';
  const currentMuscle = ex.muscle;

  // Find alternatives: same muscle group OR same place compatible
  const alternatives = Object.entries(EX_DB)
    .filter(([key, data]) => {
      return key !== ex.key &&
        data.places.includes(place) &&
        (data.muscle === currentMuscle || data.muscle.includes(currentMuscle) || currentMuscle.includes(data.muscle));
    })
    .slice(0, 10);

  // If not enough from same muscle, add any from same place
  if (alternatives.length < 5) {
    Object.entries(EX_DB).forEach(([key, data]) => {
      if (key !== ex.key &&
        data.places.includes(place) &&
        !alternatives.find(([k]) => k === key)) {
        alternatives.push([key, data]);
      }
    });
  }

  const shownAlternatives = alternatives.slice(0, 10);

  if (shownAlternatives.length === 0) {
    showToast('Aucun exercice de remplacement disponible');
    return;
  }

  let overlay = document.getElementById('ex-sub-overlay');
  if (!overlay) {
    overlay = createEl('div', {
      className: 'modal-overlay',
      attrs: { id: 'ex-sub-overlay' },
    });
    document.body.appendChild(overlay);
  }
  clearEl(overlay);

  const modal = createEl('div', { className: 'modal', attrs: { style: 'max-height: 80vh; overflow-y: auto;' } });
  modal.appendChild(createEl('h3', { text: 'Remplacer l\'exercice' }));
  modal.appendChild(createEl('p', {
    className: 'confirm-modal-message',
    text: `Remplacer ${ex.name} par :`,
  }));

  const list = createEl('div', { className: 'nut-search-results', attrs: { style: 'max-height: 50vh; overflow-y: auto;' } });

  shownAlternatives.forEach(([key, data]) => {
    const item = createEl('div', {
      className: 'nut-search-item',
      attrs: { style: 'cursor: pointer;' },
    });

    const leftDiv = createEl('div', { className: 'nut-search-item-left' });
    leftDiv.appendChild(createEl('span', { className: 'nut-search-item-emoji', text: '' }));
    const infoDiv = createEl('div');
    infoDiv.appendChild(createEl('div', { className: 'nut-search-item-name', text: data.name }));
    infoDiv.appendChild(createEl('div', {
      className: 'nut-search-item-info',
      text: `${data.muscle} · ${data.places.join(', ')}`,
    }));
    leftDiv.appendChild(infoDiv);
    item.appendChild(leftDiv);

    item.addEventListener('click', async () => {
      // Replace the exercise
      const params = {
        sets: d.exercises[exIdx].sets,
        reps: d.exercises[exIdx].reps,
        rest: d.exercises[exIdx].rest,
      };

      if (data.cardio) {
        d.exercises[exIdx] = {
          key, name: data.name, muscle: data.muscle,
          sets: 1, reps: `${state.profile?.duration || 20} min`,
          rest: 60, done: false, time: true,
        };
      } else if (data.time) {
        d.exercises[exIdx] = {
          key, name: data.name, muscle: data.muscle,
          sets: params.sets, reps: '30-45 sec',
          rest: params.rest, done: false, time: true,
        };
      } else {
        d.exercises[exIdx] = {
          key, name: data.name, muscle: data.muscle,
          sets: params.sets, reps: params.reps,
          rest: params.rest, done: false,
        };
      }

      await save();
      overlay.classList.remove('show');
      openWorkout(state.currentDay);
      showToast(`Remplacé par ${data.name}`);
    });

    list.appendChild(item);
  });

  modal.appendChild(list);

  modal.appendChild(createEl('button', {
    className: 'btn btn-ghost',
    attrs: { type: 'button', style: 'margin-top: 16px;' },
    text: 'Annuler',
    on: { click: () => overlay.classList.remove('show') },
  }));

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('show');
  }, { once: true });
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function showLevelUp(newLevel) {
  const modal = document.getElementById('levelup-modal');
  if (!modal) return;
  setText('levelup-level', `NIVEAU ${newLevel}`);
  setText('levelup-title', `Tu deviens : ${getTitleForLevel(newLevel)}`);
  modal.classList.add('show');
  haptic('success');
  // ⭐ FIX: Don't call checkBadges here — it would show a badge modal
  // on top of the level-up modal, blocking the "Continue" button.
  // checkBadges will be called when the user closes this modal.
}

export function closeLevelup() {
  const modal = document.getElementById('levelup-modal');
  if (modal) modal.classList.remove('show');
  // ⭐ FIX: Now that the level-up modal is closed, check for new badges
  setTimeout(() => checkBadges(), 300);
}

// ========== EXERCISE INFO ==========
export function showExInfo(key) {
  const ex = EX_DB[key];
  if (!ex) return;

  setText('ex-info-name', String(ex.name).toUpperCase());
  setText('ex-info-muscle', ex.muscle);
  setText('ex-info-desc', ex.desc || '—');

  const ul = document.getElementById('ex-info-tips');
  clearEl(ul);
  (ex.tips || []).forEach(t => ul.appendChild(createEl('li', { text: t })));

  const gifUrl = sanitizeUrl(EX_GIFS[key]);
  const gifWrap = document.getElementById('ex-gif-wrap');
  const gifImg = document.getElementById('ex-gif-img');
  const gifLoading = gifWrap.querySelector('.ex-gif-loading');
  const gifFallback = gifWrap.querySelector('.ex-gif-fallback');

  // Reset état
  gifWrap.style.display = 'flex';
  if (gifLoading) gifLoading.style.display = 'none';
  if (gifFallback) gifFallback.style.display = 'none';
  gifImg.style.display = 'none';

  if (gifUrl) {
    // GIF disponible : tentative de chargement
    if (gifLoading) gifLoading.style.display = 'flex';
    // ⭐ Timeout : si le GIF ne charge pas en 8s, afficher le fallback
    let gifTimeout = setTimeout(() => {
      if (gifImg.style.display === 'none') {
        // GIF pas encore affiché → fallback
        gifImg.style.display = 'none';
        if (gifLoading) gifLoading.style.display = 'none';
        if (gifFallback) {
          gifFallback.style.display = 'flex';
          const muscleIcon = gifFallback.querySelector('.ex-gif-fallback-muscle');
          if (muscleIcon) muscleIcon.textContent = ex.muscle;
        }
      }
    }, 8000);
    gifImg.onload = () => {
      clearTimeout(gifTimeout);
      gifImg.style.display = 'block';
      if (gifLoading) gifLoading.style.display = 'none';
      if (gifFallback) gifFallback.style.display = 'none';
    };
    gifImg.onerror = () => {
      clearTimeout(gifTimeout);
      // Si le GIF foire : afficher le fallback icône
      gifImg.style.display = 'none';
      if (gifLoading) gifLoading.style.display = 'none';
      if (gifFallback) {
        gifFallback.style.display = 'flex';
        const muscleIcon = gifFallback.querySelector('.ex-gif-fallback-muscle');
        if (muscleIcon) muscleIcon.textContent = ex.muscle;
      }
    };
    gifImg.src = gifUrl;
  } else {
    // Pas de GIF disponible : afficher directement l'icône fallback
    if (gifFallback) {
      gifFallback.style.display = 'flex';
      // Personnaliser le fallback selon l'exercice
      const muscleIcon = gifFallback.querySelector('.ex-gif-fallback-muscle');
      if (muscleIcon) muscleIcon.textContent = ex.muscle;
    }
  }

  document.getElementById('ex-info-modal').classList.add('show');
}

export function closeExInfo() {
  document.getElementById('ex-info-modal').classList.remove('show');
  const gif = document.getElementById('ex-gif-img');
  if (gif) gif.src = '';
}

// ========== HISTORY WITH LINE CHART (TRADING STYLE) ==========
let currentChartPeriod = 7;

export function renderHistory() {
  const state = getState();
  const userData = getUserData();
  const filteredHistory = filterHistoryByPlan(state.history, userData);

  // ===== Period selector event listeners =====
  const periodBtns = document.querySelectorAll('.chart-period-btn');
  periodBtns.forEach(btn => {
    // Remove old listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      currentChartPeriod = parseInt(newBtn.dataset.period);
      document.querySelectorAll('.chart-period-btn').forEach(b => b.classList.remove('active'));
      newBtn.classList.add('active');
      renderLineChart(filteredHistory, currentChartPeriod);
    });
  });

  // ===== Render chart with current period =====
  renderLineChart(filteredHistory, currentChartPeriod);

  // ===== Stats cards =====
  const last7 = getSessionsByDay(filteredHistory, 7);
  const totalWeek = last7.reduce((a, b) => a + b, 0);
  animateCount(document.getElementById('week-sessions'), totalWeek);
  animateCount(document.getElementById('hist-week'), totalWeek);

  const monthCount = filteredHistory.filter(h =>
    (Date.now() - new Date(h.date).getTime()) < 30 * 86400000
  ).length;
  animateCount(document.getElementById('hist-month'), monthCount);
  animateCount(document.getElementById('hist-best'), state.stats.bestStreak || 0);

  // ⭐ CALENDAR VIEW
  renderCalendar(filteredHistory);

  // ⭐ Premium upsell : si utilisateur gratuit, afficher une bannière
  if (!isPremium(userData)) {
    const upsellCard = createEl('div', {
      className: 'hist-premium-upsell',
      html: `
        <div class="hist-premium-upsell-icon">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="rgba(212,168,67,0.15)"/></svg>
        </div>
        <div class="hist-premium-upsell-content">
          <div class="hist-premium-upsell-title">Historique limité à 7 jours</div>
          <div class="hist-premium-upsell-desc">Passe à Premium pour accéder à ton historique complet (365 jours)</div>
        </div>
        <button class="btn btn-primary btn-sm hist-premium-upsell-btn" type="button">Premium</button>
      `,
    });
    const calContainer = document.getElementById('history-calendar');
    if (calContainer && calContainer.nextSibling) {
      calContainer.parentNode.insertBefore(upsellCard, calContainer.nextSibling);
    } else if (calContainer) {
      calContainer.parentNode.appendChild(upsellCard);
    }
    upsellCard.querySelector('.hist-premium-upsell-btn')?.addEventListener('click', () => {
      import('./sidebar.js').then(mod => { if (mod.openPremiumModal) mod.openPremiumModal(); });
    });
  }

  const list = document.getElementById('history-list');
  clearEl(list);

  if (filteredHistory.length === 0) {
    const empty = createEl('div', { className: 'empty' });
    empty.appendChild(createEl('div', { className: 'empty-icon', html: '<svg width=\"48\" height=\"48\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"/><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"/></svg>' }));
    empty.appendChild(document.createTextNode('Aucune séance encore. Lance-toi !'));
    list.appendChild(empty);
    return;
  }

  const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
  filteredHistory.slice(0, 20).forEach((h, i) => {
    const d = new Date(h.date);
    if (isNaN(d.getTime())) return;

    const card = createEl('div', { className: 'history-card' });
    card.style.animation = `fadeUp 400ms var(--ease-out) ${i * 50}ms both`;

    const dateBox = createEl('div', { className: 'history-date' });
    dateBox.appendChild(createEl('div', { className: 'history-day', text: d.getDate() }));
    dateBox.appendChild(createEl('div', { className: 'history-month', text: months[d.getMonth()] }));
    card.appendChild(dateBox);

    const info = createEl('div', { className: 'history-info' });
    info.appendChild(createEl('div', { className: 'history-name', text: String(h.name).toUpperCase() }));
    const meta = createEl('div', { className: 'history-meta' });
    meta.appendChild(document.createTextNode(`${h.exercises} exos`));
    meta.appendChild(createEl('span', { className: 'day-detail-dot' }));
    meta.appendChild(document.createTextNode(`${h.duration} min`));
    info.appendChild(meta);
    card.appendChild(info);

    list.appendChild(card);
  });
}

// ========== LINE CHART RENDERER (TRADING STYLE) ==========
function renderLineChart(history, periodDays) {
  const svg = document.getElementById('chart-line-svg');
  const tooltip = document.getElementById('chart-tooltip');
  const periodLabel = document.getElementById('chart-period-label');
  const trendEl = document.getElementById('chart-trend');
  const sessionCountEl = document.getElementById('week-sessions');

  if (!svg) return;
  clearEl(svg);

  // ===== Aggregate data by period =====
  const data = aggregateChartData(history, periodDays);
  const totalSessions = data.reduce((a, b) => a + b.count, 0);

  // Update period label
  const periodLabels = { 7: '7 DERNIERS JOURS', 30: '30 DERNIERS JOURS', 90: '90 DERNIERS JOURS', 365: 'DERNIÈRE ANNÉE' };
  if (periodLabel) periodLabel.textContent = periodLabels[periodDays] || `${periodDays} JOURS`;
  if (sessionCountEl) sessionCountEl.textContent = totalSessions;

  // ===== Calculate trend =====
  if (trendEl) {
    clearEl(trendEl);
    if (data.length >= 2) {
      const halfLen = Math.floor(data.length / 2);
      const firstHalf = data.slice(0, halfLen).reduce((a, b) => a + b.count, 0);
      const secondHalf = data.slice(halfLen).reduce((a, b) => a + b.count, 0);
      const diff = secondHalf - firstHalf;
      const pct = firstHalf > 0 ? Math.round((diff / firstHalf) * 100) : (secondHalf > 0 ? 100 : 0);

      if (diff > 0) {
        trendEl.className = 'chart-trend up';
        trendEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> +${pct}% vs début`;
      } else if (diff < 0) {
        trendEl.className = 'chart-trend down';
        trendEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg> ${pct}% vs début`;
      } else {
        trendEl.className = 'chart-trend flat';
        trendEl.textContent = 'Stable';
      }
    }
  }

  // ===== SVG dimensions =====
  const W = 600, H = 200;
  const PAD_L = 30, PAD_R = 10, PAD_T = 10, PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  // ===== No data case =====
  if (data.length === 0) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', W / 2);
    text.setAttribute('y', H / 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'var(--text-dim)');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-weight', '500');
    text.textContent = 'Aucune donnée';
    svg.appendChild(text);
    return;
  }

  const maxVal = Math.max(...data.map(d => d.count), 1);

  // ===== Y-axis grid lines =====
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const y = PAD_T + (plotH / ySteps) * i;
    const val = Math.round(maxVal * (1 - i / ySteps));
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', PAD_L);
    line.setAttribute('x2', W - PAD_R);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('class', 'chart-grid-line');
    svg.appendChild(line);

    // Y labels (only if max > 0)
    if (maxVal > 0) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', PAD_L - 4);
      label.setAttribute('y', y + 3);
      label.setAttribute('class', 'chart-label-y');
      label.textContent = val;
      svg.appendChild(label);
    }
  }

  // ===== Compute points =====
  const points = data.map((d, i) => ({
    x: PAD_L + (i / Math.max(data.length - 1, 1)) * plotW,
    y: PAD_T + plotH - (d.count / maxVal) * plotH,
    ...d,
  }));

  // If only 1 data point, center it
  if (points.length === 1) {
    points[0].x = W / 2;
  }

  // ===== Area fill (gradient under the line) =====
  const ns = 'http://www.w3.org/2000/svg';

  // Gradient definition
  const defs = document.createElementNS(ns, 'defs');
  const grad = document.createElementNS(ns, 'linearGradient');
  grad.setAttribute('id', 'chartAreaGrad');
  grad.setAttribute('x1', '0');
  grad.setAttribute('y1', '0');
  grad.setAttribute('x2', '0');
  grad.setAttribute('y2', '1');
  const stop1 = document.createElementNS(ns, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', 'var(--accent)');
  stop1.setAttribute('stop-opacity', '0.4');
  const stop2 = document.createElementNS(ns, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', 'var(--accent)');
  stop2.setAttribute('stop-opacity', '0');
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Area path
  const bottomY = PAD_T + plotH;
  let areaD = `M ${points[0].x} ${bottomY}`;
  areaD += ` L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    // Smooth bezier curve
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    areaD += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  areaD += ` L ${points[points.length - 1].x} ${bottomY} Z`;

  const area = document.createElementNS(ns, 'path');
  area.setAttribute('d', areaD);
  area.setAttribute('fill', 'url(#chartAreaGrad)');
  area.setAttribute('class', 'chart-area-fill chart-area-animated');
  svg.appendChild(area);

  // ===== Line path =====
  let lineD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    lineD += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }

  const line = document.createElementNS(ns, 'path');
  line.setAttribute('d', lineD);
  line.setAttribute('class', 'chart-line chart-line-animated');
  svg.appendChild(line);

  // ===== Dots + X labels =====
  const maxLabels = periodDays <= 7 ? 7 : periodDays <= 30 ? 10 : periodDays <= 90 ? 12 : 12;
  const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));

  points.forEach((p, i) => {
    // Dot
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', p.x);
    dot.setAttribute('cy', p.y);
    dot.setAttribute('class', 'chart-dot');
    dot.setAttribute('r', '3.5');

    // Hover / touch tooltip
    const showTip = (e) => {
      if (tooltip) {
        tooltip.innerHTML = `<div class="tooltip-date">${p.label}</div><div class="tooltip-value">${p.count} séance${p.count > 1 ? 's' : ''}</div>`;
        tooltip.classList.add('visible');
        // Position tooltip near the dot
        const svgRect = svg.getBoundingClientRect();
        let tipX = (p.x / W) * svgRect.width - tooltip.offsetWidth / 2;
        let tipY = (p.y / H) * svgRect.height - tooltip.offsetHeight - 12;
        // Keep in bounds
        tipX = Math.max(4, Math.min(tipX, svgRect.width - tooltip.offsetWidth - 4));
        if (tipY < 0) tipY = (p.y / H) * svgRect.height + 12;
        tooltip.style.left = tipX + 'px';
        tooltip.style.top = tipY + 'px';
      }
    };
    const hideTip = () => {
      if (tooltip) tooltip.classList.remove('visible');
    };

    dot.addEventListener('mouseenter', showTip);
    dot.addEventListener('mouseleave', hideTip);
    dot.addEventListener('touchstart', (e) => { e.preventDefault(); showTip(e); }, { passive: false });
    dot.addEventListener('touchend', hideTip);

    svg.appendChild(dot);

    // X-axis labels (show only some to avoid clutter)
    if (i % labelStep === 0 || i === data.length - 1) {
      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', p.x);
      label.setAttribute('y', H - 4);
      label.setAttribute('class', 'chart-label-x');
      label.textContent = p.shortLabel || p.label;
      svg.appendChild(label);
    }
  });
}

// ========== CHART DATA AGGREGATION ==========
function aggregateChartData(history, periodDays) {
  if (!Array.isArray(history) || history.length === 0) return [];

  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const cutoff = new Date(now.getTime() - periodDays * 86400000);

  const result = [];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  if (periodDays <= 7) {
    // ===== Daily: one point per day =====
    const sessionsByDay = getSessionsByDay(history, periodDays);
    for (let i = 0; i < periodDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (periodDays - 1 - i));
      const dayIdx = d.getDay();
      result.push({
        count: sessionsByDay[i],
        label: `${dayNames[dayIdx]} ${d.getDate()}`,
        shortLabel: dayNames[dayIdx],
        date: d,
      });
    }
  } else if (periodDays <= 30) {
    // ===== Daily for 30 days, but label only some =====
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d.getTime() + 86400000);

      const count = history.filter(h => {
        const t = new Date(h.date).getTime();
        return t >= d.getTime() && t < nextD.getTime();
      }).length;

      result.push({
        count,
        label: `${d.getDate()} ${monthNames[d.getMonth()]}`,
        shortLabel: d.getDate() % 5 === 0 || i === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : '',
        date: d,
      });
    }
  } else if (periodDays <= 90) {
    // ===== Weekly aggregation =====
    const weeks = Math.ceil(periodDays / 7);
    for (let w = weeks - 1; w >= 0; w--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      weekEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(weekEnd.getTime() - 7 * 86400000);
      weekStart.setHours(0, 0, 0, 0);

      const count = history.filter(h => {
        const t = new Date(h.date).getTime();
        return t >= weekStart.getTime() && t <= weekEnd.getTime();
      }).length;

      result.push({
        count,
        label: `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]}`,
        shortLabel: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        date: weekStart,
      });
    }
  } else {
    // ===== Monthly aggregation for 1 year =====
    for (let m = 11; m >= 0; m--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);

      const count = history.filter(h => {
        const t = new Date(h.date).getTime();
        return t >= monthDate.getTime() && t < nextMonth.getTime();
      }).length;

      result.push({
        count,
        label: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
        shortLabel: monthNames[monthDate.getMonth()],
        date: monthDate,
      });
    }
  }

  return result;
}

// ========== CALENDAR VIEW ==========
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function renderCalendar(history) {
  // Find or create calendar container
  let calContainer = document.getElementById('history-calendar');
  if (!calContainer) {
    // Insert before history-list
    const historyList = document.getElementById('history-list');
    if (historyList && historyList.parentNode) {
      calContainer = createEl('div', {
        className: 'calendar-card',
        attrs: { id: 'history-calendar' },
      });
      historyList.parentNode.insertBefore(calContainer, historyList);
    } else {
      return;
    }
  }
  clearEl(calContainer);

  // Build set of workout dates
  const workoutDates = new Set();
  history.forEach(h => {
    const d = new Date(h.date);
    if (!isNaN(d.getTime())) {
      workoutDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  });

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Header with nav
  const header = createEl('div', { className: 'calendar-header' });

  const prevBtn = createEl('button', {
    className: 'calendar-nav-btn',
    attrs: { type: 'button', 'aria-label': 'Mois précédent' },
    text: '‹',
    on: {
      click: () => {
        calendarMonth--;
        if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
        renderCalendar(history);
      },
    },
  });
  header.appendChild(prevBtn);

  header.appendChild(createEl('span', {
    className: 'calendar-title',
    text: `${months[calendarMonth]} ${calendarYear}`,
  }));

  const nextBtn = createEl('button', {
    className: 'calendar-nav-btn',
    attrs: { type: 'button', 'aria-label': 'Mois suivant' },
    text: '›',
    on: {
      click: () => {
        calendarMonth++;
        if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
        renderCalendar(history);
      },
    },
  });
  header.appendChild(nextBtn);
  calContainer.appendChild(header);

  // Day names row
  const dayNamesRow = createEl('div', { className: 'calendar-daynames' });
  dayNames.forEach(d => dayNamesRow.appendChild(createEl('span', { className: 'calendar-dayname', text: d })));
  calContainer.appendChild(dayNamesRow);

  // Grid
  const grid = createEl('div', { className: 'calendar-grid' });

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const today = new Date();

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    grid.appendChild(createEl('span', { className: 'calendar-cell empty' }));
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${calendarYear}-${calendarMonth}-${day}`;
    const hasWorkout = workoutDates.has(dateKey);
    const isToday = today.getDate() === day && today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;

    const cell = createEl('span', {
      className: 'calendar-cell'
        + (hasWorkout ? ' has-workout' : '')
        + (isToday ? ' is-today' : ''),
      text: String(day),
    });
    grid.appendChild(cell);
  }

  calContainer.appendChild(grid);
}

function getSessionsByDay(history, days) {
  const result = new Array(days).fill(0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  history.forEach(h => {
    const hd = new Date(h.date);
    if (isNaN(hd.getTime())) return;
    hd.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - hd) / 86400000);
    if (diff >= 0 && diff < days) result[days - 1 - diff]++;
  });

  return result;
}

// ========== BADGES ==========
export function renderBadges() {
  const state = getState();
  const grid = document.getElementById('badges-grid');
  clearEl(grid);

  let unlocked = 0;
  BADGES.forEach((b, i) => {
    const isUnlocked = state.badges.includes(b.id);
    if (isUnlocked) unlocked++;

    const div = createEl('div', { className: 'badge ' + (isUnlocked ? 'unlocked' : 'locked') });
    div.style.animation = `scaleIn 300ms var(--ease-spring) ${i * 40}ms both`;
    div.appendChild(createEl('span', { className: 'badge-emoji', html: b.emoji }));
    div.appendChild(createEl('div', { className: 'badge-name', text: b.name }));
    div.appendChild(createEl('div', { className: 'badge-desc', text: b.desc }));
    grid.appendChild(div);
  });

  animateCount(document.getElementById('badges-unlocked'), unlocked);
  setText('badges-total', BADGES.length);
}

export async function checkBadges() {
  const state = getState();
  const newBadges = [];

  BADGES.forEach(b => {
    if (!state.badges.includes(b.id) && b.check(state)) {
      state.badges.push(b.id);
      newBadges.push(b);
    }
  });

  await save();
  if (newBadges.length > 0) {
    setTimeout(() => showBadgeUnlock(newBadges[0]), 800);
  }
}

function showBadgeUnlock(b) {
  const emojiEl = document.getElementById('badge-modal-emoji');
  if (emojiEl) emojiEl.innerHTML = b.emoji;
  setText('badge-modal-name', b.name);
  setText('badge-modal-desc', b.desc);
  document.getElementById('badge-modal').classList.add('show');
  haptic('success');
}

export function closeBadgeModal() {
  document.getElementById('badge-modal').classList.remove('show');
}

// ========== PROFILE ==========
export function renderProfile() {
  const state = getState();
  const userData = getUserData();
  const user = getCurrentUser();
  const p = state.profile;
  if (!p) return;

  const info = document.getElementById('profile-info');
  clearEl(info);

  const xpProgress = xpProgressInLevel(computeTotalXp(state));
  const title = getTitleForLevel(xpProgress.level);
  const subBadge = getSubscriptionBadge(userData);

  const rows = [
    ['Niveau', `LVL ${xpProgress.level} · ${title}`],
    ['Abonnement', subBadge.label],
    ['Objectif', GOAL_LABELS[p.goal]?.title || p.goal],
    ['Niveau initial', LEVEL_LABELS[p.level] || p.level],
    ['Lieu', PLACE_LABELS[p.place] || p.place],
    ['Fréquence', `${p.frequency} séances/sem`],
    ['Durée', `${p.duration} min`],
  ];

  rows.forEach(([label, value]) => {
    const row = createEl('div', { className: 'profile-row' });
    row.appendChild(createEl('span', { text: label }));
    row.appendChild(createEl('span', { text: value }));
    info.appendChild(row);
  });

  // Update email line
  const emailLine = document.getElementById('profile-email-line');
  if (emailLine && user?.email) {
    emailLine.textContent = user.email;
  }
}

// ========== USER AVATAR ==========
export function updateAvatar(user) {
  const wrap = document.getElementById('user-avatar-wrap');
  if (!wrap) return;
  wrap.style.display = 'block';
  clearEl(wrap);

  const photoUrl = sanitizeUrl(user.photoURL);

  let el;
  if (photoUrl) {
    el = createEl('img', {
      className: 'user-avatar',
      attrs: { src: photoUrl, alt: 'Avatar', title: 'Profil' },
    });
    el.addEventListener('error', () => {
      clearEl(wrap);
      const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
      const placeholder = createEl('div', {
        className: 'user-avatar-placeholder',
        attrs: { title: 'Profil' },
        text: initial,
        on: { click: () => switchTab('profile') },
      });
      wrap.appendChild(placeholder);
    });
  } else {
    const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
    el = createEl('div', {
      className: 'user-avatar-placeholder',
      attrs: { title: 'Profil' },
      text: initial,
    });
  }

  el.addEventListener('click', () => switchTab('profile'));
  wrap.appendChild(el);

  const emailLine = document.getElementById('profile-email-line');
  if (emailLine && user.email) {
    emailLine.textContent = user.email;
  }
}

// ========== SETTINGS ==========
export function openSettings() {
  const state = getState();
  document.getElementById('set-reminders').checked = !!state.settings.reminders;
  document.getElementById('set-time').value = state.settings.time || '18:00';
  document.getElementById('set-sound').checked = !!state.settings.sound;
  document.getElementById('set-vibrate').checked = !!state.settings.vibrate;
  document.getElementById('settings-modal').classList.add('show');
}

export function closeSettings() {
  document.getElementById('settings-modal').classList.remove('show');
}

export async function saveSettings() {
  const state = getState();
  const timeVal = document.getElementById('set-time').value;
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeVal)) {
    state.settings.time = timeVal;
  }
  state.settings.sound = !!document.getElementById('set-sound').checked;
  state.settings.vibrate = !!document.getElementById('set-vibrate').checked;
  await save();
}

// ========== ONBOARDING PROGRESS ==========
export function updateOnboardingProgress(step) {
  const bar = document.getElementById('onb-progress');
  if (bar) bar.style.width = (step / 5 * 100) + '%';
}

// ========== UTILITIES ==========
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

function escapeText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   OPTIMUSCLE — Nutrition UI Module
   ============================================================ */

import { getState, getCurrentUser, getUserData, save, saveImmediate } from '../core/state.js';
import {
  FOOD_DB,
  searchLocalFoods,
  searchOpenFoodFacts,
  calculatePortion,
  calculateDayTotals,
  calculateTDEE,
  calculateMacros,
  getTodayKey,
  MEAL_TYPES,
  ACTIVITY_LEVELS,
} from '../core/nutrition.js';
import { createEl, clearEl, sanitizeUrl } from '../utils/sanitize.js';
import { showToast, confirmModal } from '../utils/notifications.js';
import { haptic } from '../utils/animations.js';
import { GROQ_API_KEY } from '../core/config.js';
import { hasFeature, getFeatureLevel } from '../saas/subscription.js';
import { showToastWithAction } from '../utils/notifications.js';

let currentMealType = 'breakfast';
let currentSearchTimeout = null;
let openFoodFactsCache = {};
// ⭐ FIX v25: Track the current nutrition level so sub-actions
// (add/delete/water) re-render with the correct level
let currentNutritionLevel = 'basic';

// ============================================================
// INIT DU MODULE NUTRITION DANS LE STATE
// ============================================================
function ensureNutritionState() {
  const state = getState();

  if (!state.nutrition) {
    state.nutrition = {
      onboardingDone: false,    // a-t-il fait le mini-questionnaire ?
      weight: null,             // kg
      height: null,             // cm
      age: null,
      gender: null,             // 'M' | 'F'
      activityLevel: null,
      // Objectifs calculés
      targetKcal: null,
      targetProtein: null,
      targetCarbs: null,
      targetFat: null,
      tdee: null,
      // Repas par jour : { "2026-05-26": { breakfast: [...], lunch: [...], ... }, ... }
      dailyMeals: {},
      // Eau par jour : { "2026-05-26": 3 } (nombre de verres 250ml)
      dailyWater: {},
    };
  }

  // S'assurer que les structures existent
  if (!state.nutrition.dailyMeals) state.nutrition.dailyMeals = {};
  if (!state.nutrition.dailyWater) state.nutrition.dailyWater = {};

  return state.nutrition;
}

// ============================================================
// RENDU PRINCIPAL : page Nutrition
// ============================================================
export function renderNutrition() {
  // ⭐ Premium gate : Nutrition réservé Premium
  const userData = getUserData();
  const nutritionLevel = getFeatureLevel(userData, 'nutritionTracking');

  // Si nutritionLevel === false → feature pas du tout disponible (FREE)
  // Si 'basic' → onboarding + vue limitée
  // Si 'advanced' → tout le dashboard

  // ⭐ FREE users: show locked view
  if (nutritionLevel === false) {
    showToast('Suivi nutritionnel disponible avec Premium');
    import('./sidebar.js').then(mod => { if (mod.openPremiumModal) mod.openPremiumModal(); });
    renderNutritionLocked();
    return;
  }

  ensureNutritionState();
  const nut = getState().nutrition;

  // Si onboarding nutrition pas fait → afficher le questionnaire
  if (!nut.onboardingDone) {
    renderNutritionOnboarding();
    return;
  }

  // Sinon → afficher le dashboard nutrition du jour
  renderNutritionDashboard(nutritionLevel);
}

// ============================================================
// ONBOARDING NUTRITION (1 fois)
// ============================================================
function renderNutritionOnboarding() {
  const container = document.getElementById('nutrition-content');
  if (!container) return;
  clearEl(container);

  const wrap = createEl('div', { className: 'nut-onb-wrap' });

  wrap.appendChild(createEl('div', {
    className: 'nut-onb-header',
    html: `
      <span class="label-eyebrow"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Activation nutrition</span>
      <h1>Calcule tes besoins<br/><span class="text-gradient">en 30 secondes</span></h1>
      <p>On a besoin de quelques infos pour personnaliser ton suivi alimentaire.</p>
    `
  }));

  // Form
  const form = createEl('form', { className: 'nut-onb-form', attrs: { id: 'nut-onb-form' } });

  // Genre
  form.appendChild(formField('Genre', 'gender', [
    createRadio('gender', 'M', '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="10" cy="14" r="5"/><path d="M15 9l5-5"/><path d="M15 4h5v5"/></svg> Homme'),
    createRadio('gender', 'F', '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="12" cy="10" r="5"/><path d="M12 15v7"/><path d="M9 19h6"/></svg> Femme'),
  ]));

  // Âge / Poids / Taille en grille
  const grid = createEl('div', { className: 'nut-onb-grid' });
  grid.appendChild(formInput('Âge', 'age', 'number', { min: 14, max: 100, placeholder: '25' }));
  grid.appendChild(formInput('Poids (kg)', 'weight', 'number', { min: 30, max: 300, placeholder: '70', step: '0.1' }));
  grid.appendChild(formInput('Taille (cm)', 'height', 'number', { min: 100, max: 250, placeholder: '175' }));
  form.appendChild(grid);

  // Niveau d'activité
  form.appendChild(createEl('label', { className: 'nut-onb-label', text: "Niveau d'activité" }));
  const activityList = createEl('div', { className: 'nut-onb-activity-list' });
  ACTIVITY_LEVELS.forEach(lvl => {
    const item = createEl('label', { className: 'nut-onb-activity' });
    const radio = createEl('input', {
      attrs: { type: 'radio', name: 'activityLevel', value: lvl.id }
    });
    if (lvl.id === 'moderate') radio.checked = true;
    item.appendChild(radio);
    const content = createEl('div', { className: 'nut-onb-activity-content' });
    content.appendChild(createEl('div', { className: 'nut-onb-activity-name', text: lvl.name }));
    content.appendChild(createEl('div', { className: 'nut-onb-activity-desc', text: lvl.desc }));
    item.appendChild(content);
    activityList.appendChild(item);
  });
  form.appendChild(activityList);

  // Bouton submit
  const submitBtn = createEl('button', {
    className: 'btn btn-primary',
    attrs: { type: 'submit', style: 'margin-top: 24px;' },
    text: 'Calculer mes besoins'
  });
  form.appendChild(submitBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitNutritionOnboarding(form);
  });

  wrap.appendChild(form);
  container.appendChild(wrap);
}

function formField(label, name, children) {
  const wrap = createEl('div', { className: 'nut-form-field' });
  wrap.appendChild(createEl('label', { className: 'nut-onb-label', text: label }));
  const group = createEl('div', { className: 'nut-radio-group' });
  children.forEach(c => group.appendChild(c));
  wrap.appendChild(group);
  return wrap;
}

function createRadio(name, value, label) {
  const wrap = createEl('label', { className: 'nut-radio' });
  const input = createEl('input', { attrs: { type: 'radio', name, value, required: 'required' } });
  wrap.appendChild(input);
  wrap.appendChild(createEl('span', { html: label }));
  return wrap;
}

function formInput(label, name, type, attrs = {}) {
  const wrap = createEl('div', { className: 'nut-form-input' });
  wrap.appendChild(createEl('label', { className: 'nut-onb-label-sm', text: label }));
  const input = createEl('input', {
    className: 'nut-input',
    attrs: { type, name, required: 'required', ...attrs }
  });
  wrap.appendChild(input);
  return wrap;
}

async function submitNutritionOnboarding(form) {
  const formData = new FormData(form);
  const gender = formData.get('gender');
  const age = parseInt(formData.get('age'));
  const weight = parseFloat(formData.get('weight'));
  const height = parseInt(formData.get('height'));
  const activityLevel = formData.get('activityLevel');

  if (!gender || !age || !weight || !height || !activityLevel) {
    showToast('Remplis tous les champs');
    return;
  }
  if (age < 14 || age > 100) return showToast('Âge invalide');
  if (weight < 30 || weight > 300) return showToast('Poids invalide');
  if (height < 100 || height > 250) return showToast('Taille invalide');

  haptic('success');

  // Calculer TDEE et macros
  const tdee = calculateTDEE({ weight, height, age, gender, activityLevel });
  const state = getState();
  const goal = state.profile?.goal || 'health';
  const macros = calculateMacros(tdee, goal, weight);

  // Sauvegarder
  const nut = ensureNutritionState();
  nut.weight = weight;
  nut.height = height;
  nut.age = age;
  nut.gender = gender;
  nut.activityLevel = activityLevel;
  nut.targetKcal = macros.kcal;
  nut.targetProtein = macros.protein;
  nut.targetCarbs = macros.carbs;
  nut.targetFat = macros.fat;
  nut.tdee = tdee;
  nut.onboardingDone = true;

  await saveImmediate();

  showToast(`Objectif : ${macros.kcal} kcal/jour`);

  // Re-render avec le dashboard
  renderNutrition();
}

// ============================================================
// DASHBOARD NUTRITION DU JOUR
// ============================================================
function renderNutritionDashboard(nutritionLevel = 'basic') {
  // ⭐ FIX v25: Store the nutrition level for subsequent re-renders
  currentNutritionLevel = nutritionLevel;
  const container = document.getElementById('nutrition-content');
  if (!container) return;
  clearEl(container);

  const nut = getState().nutrition;
  const today = getTodayKey();
  const todayMeals = nut.dailyMeals[today] || {};
  const allMeals = Object.values(todayMeals).flat();
  const totals = calculateDayTotals(allMeals);
  const waterCount = nut.dailyWater[today] || 0;

  // Header
  const header = createEl('div', { className: 'nut-dash-header' });
  header.appendChild(createEl('span', { className: 'label-eyebrow', html: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 3c-1-1-3-1-4 0-3 2-4 6-3 10s3 7 7 7 6-3 7-7 0-8-3-10c-1-1-3-1-4 0z"/><path d="M12 3V1"/><path d="M14 1c1 0 2 1 2 2"/></svg> Nutrition du jour' }));
  header.appendChild(createEl('h1', { html: `<span class="text-gradient">${todayLabel()}</span>` }));
  container.appendChild(header);

  // CARTE PRINCIPALE : Calories restantes (avec ring)
  container.appendChild(renderKcalRing(totals.kcal, nut.targetKcal));

  // 3 BARRES MACROS
  container.appendChild(renderMacrosBars(totals, nut));

  // EAU
  container.appendChild(renderWaterTracker(waterCount));

  // REPAS DU JOUR (4 sections)
  container.appendChild(renderMealsList(todayMeals));

  // ⭐ PREMIUM UPSELL : Recherche OpenFoodFacts réservée Premium
  if (nutritionLevel !== 'advanced') {
    const upsellCard = createEl('div', {
      className: 'nut-premium-upsell',
      html: `
        <div class="nut-premium-upsell-icon">
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="rgba(212,168,67,0.15)"/></svg>
        </div>
        <div class="nut-premium-upsell-content">
          <div class="nut-premium-upsell-title">Suivi nutrition avancé</div>
          <div class="nut-premium-upsell-desc">Recherche dans +1M aliments, suivi hydratation détaillé, analyses hebdo</div>
        </div>
        <button class="btn btn-primary btn-sm nut-premium-upsell-btn" type="button">Premium</button>
      `,
    });
    upsellCard.querySelector('.nut-premium-upsell-btn')?.addEventListener('click', () => {
      import('./sidebar.js').then(mod => { if (mod.openPremiumModal) mod.openPremiumModal(); });
    });
    container.appendChild(upsellCard);
  }

  // Bouton Settings (modifier ses objectifs)
  const settingsBtn = createEl('button', {
    className: 'btn btn-ghost nut-settings-btn',
    text: 'Modifier mes objectifs',
    on: { click: () => resetNutritionOnboarding() }
  });
  container.appendChild(settingsBtn);
}

function todayLabel() {
  const d = new Date();
  const opts = { weekday: 'long', day: 'numeric', month: 'long' };
  return d.toLocaleDateString('fr-FR', opts).toUpperCase();
}

function renderKcalRing(consumed, target) {
  const remaining = Math.max(0, target - consumed);
  const pct = Math.min(100, Math.round((consumed / target) * 100));
  const overOk = consumed > target * 1.05;

  const card = createEl('div', { className: 'nut-kcal-card' });

  // SVG ring
  const ringSize = 200;
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  const ringWrap = createEl('div', { className: 'nut-kcal-ring' });
  ringWrap.innerHTML = `
    <svg viewBox="0 0 ${ringSize} ${ringSize}">
      <defs>
        <linearGradient id="kcal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff5722"/>
          <stop offset="100%" stop-color="#ff8a3d"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="${radius}" fill="none" stroke="var(--bg-elev-2)" stroke-width="14"/>
      <circle cx="100" cy="100" r="${radius}" fill="none"
        stroke="${overOk ? '#ef4444' : 'url(#kcal-grad)'}"
        stroke-width="14" stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 100 100)"
        style="transition: stroke-dashoffset 1s ease-out"/>
    </svg>
    <div class="nut-kcal-center">
      <div class="nut-kcal-value">${consumed}</div>
      <div class="nut-kcal-label">sur ${target} kcal</div>
      <div class="nut-kcal-remaining ${overOk ? 'over' : ''}">${overOk ? '+' + (consumed - target) + ' au-dessus' : remaining + ' restantes'}</div>
    </div>
  `;
  card.appendChild(ringWrap);

  return card;
}

function renderMacrosBars(totals, nut) {
  const card = createEl('div', { className: 'nut-macros-card' });
  card.appendChild(createEl('div', { className: 'nut-macros-title', text: 'Macros' }));

  const grid = createEl('div', { className: 'nut-macros-grid' });

  const macros = [
    { label: 'Protéines', current: totals.prot, target: nut.targetProtein, color: '#10b981', unit: 'g' },
    { label: 'Glucides', current: totals.carb, target: nut.targetCarbs, color: '#06b6d4', unit: 'g' },
    { label: 'Lipides', current: totals.fat, target: nut.targetFat, color: '#fbbf24', unit: 'g' },
  ];

  macros.forEach(m => {
    const pct = Math.min(100, Math.round((m.current / m.target) * 100));
    const item = createEl('div', { className: 'nut-macro' });
    item.innerHTML = `
      <div class="nut-macro-header">
        <span class="nut-macro-label">${m.label}</span>
        <span class="nut-macro-value">${Math.round(m.current)}<span class="dim">/${m.target}${m.unit}</span></span>
      </div>
      <div class="nut-macro-bar">
        <div class="nut-macro-fill" style="width: ${pct}%; background: ${m.color};"></div>
      </div>
    `;
    grid.appendChild(item);
  });

  card.appendChild(grid);
  return card;
}

function renderWaterTracker(count) {
  const target = 8; // 8 verres = 2L
  const card = createEl('div', { className: 'nut-water-card' });

  card.innerHTML = `
    <div class="nut-water-header">
      <div>
        <div class="nut-water-title"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg> Hydratation</div>
        <div class="nut-water-sub">${count}/${target} verres (${(count * 0.25).toFixed(1)}L)</div>
      </div>
      <div class="nut-water-actions">
        <button class="nut-water-btn" id="nut-water-minus">−</button>
        <button class="nut-water-btn" id="nut-water-plus">+</button>
      </div>
    </div>
    <div class="nut-water-glasses">
      ${Array.from({ length: target }, (_, i) =>
        `<span class="nut-water-glass ${i < count ? 'filled' : ''}"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg></span>`
      ).join('')}
    </div>
  `;

  // Bind buttons
  setTimeout(() => {
    document.getElementById('nut-water-minus')?.addEventListener('click', () => changeWater(-1));
    document.getElementById('nut-water-plus')?.addEventListener('click', () => changeWater(1));
  }, 10);

  return card;
}

async function changeWater(delta) {
  const nut = ensureNutritionState();
  const today = getTodayKey();
  const current = nut.dailyWater[today] || 0;
  const newVal = Math.max(0, Math.min(20, current + delta));
  nut.dailyWater[today] = newVal;
  haptic('light');
  await save();
  renderNutritionDashboard(currentNutritionLevel);
}

function renderMealsList(todayMeals) {
  const wrap = createEl('div', { className: 'nut-meals-wrap' });
  wrap.appendChild(createEl('div', { className: 'nut-meals-title', text: 'Repas du jour' }));

  MEAL_TYPES.forEach(meal => {
    const items = todayMeals[meal.id] || [];
    const totals = calculateDayTotals(items);

    const card = createEl('div', { className: 'nut-meal-card' });

    // Header
    const head = createEl('div', { className: 'nut-meal-head' });
    head.innerHTML = `
      <div class="nut-meal-head-left">
        <span class="nut-meal-emoji">${meal.emoji}</span>
        <div>
          <div class="nut-meal-name">${meal.name}</div>
          <div class="nut-meal-stats">${items.length} aliment(s) · ${totals.kcal} kcal</div>
        </div>
      </div>
      <button class="nut-meal-add" data-meal="${meal.id}" type="button">+ Ajouter</button>
    `;
    card.appendChild(head);

    // Items
    if (items.length > 0) {
      const list = createEl('div', { className: 'nut-meal-items' });
      items.forEach((item, idx) => {
        const row = createEl('div', { className: 'nut-meal-item' });
        row.innerHTML = `
          <div class="nut-meal-item-left">
            <span class="nut-meal-item-emoji">${item.emoji || '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>'}</span>
            <div>
              <div class="nut-meal-item-name">${escapeHtml(item.name)}</div>
              <div class="nut-meal-item-portion">${item.grams || ''}g · ${item.kcal} kcal</div>
            </div>
          </div>
          <button class="nut-meal-item-del" data-meal="${meal.id}" data-idx="${idx}" type="button" aria-label="Supprimer">✕</button>
        `;
        list.appendChild(row);
      });
      card.appendChild(list);
    }

    wrap.appendChild(card);
  });

  // Bind add buttons + delete
  setTimeout(() => {
    document.querySelectorAll('.nut-meal-add').forEach(btn => {
      btn.addEventListener('click', () => openAddMealModal(btn.dataset.meal));
    });
    document.querySelectorAll('.nut-meal-item-del').forEach(btn => {
      btn.addEventListener('click', () => deleteMealItem(btn.dataset.meal, parseInt(btn.dataset.idx)));
    });
  }, 10);

  return wrap;
}

async function deleteMealItem(mealId, idx) {
  const confirmed = await confirmModal('Supprimer cet aliment ?', {
    title: 'Supprimer',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    danger: true,
  });
  if (!confirmed) return;
  const nut = ensureNutritionState();
  const today = getTodayKey();
  if (!nut.dailyMeals[today] || !nut.dailyMeals[today][mealId]) return;
  nut.dailyMeals[today][mealId].splice(idx, 1);
  if (nut.dailyMeals[today][mealId].length === 0) {
    delete nut.dailyMeals[today][mealId];
  }
  haptic('medium');
  await save();
  renderNutritionDashboard(currentNutritionLevel);
}

// ============================================================
// MODAL "AJOUTER UN ALIMENT"
// ============================================================
function openAddMealModal(mealType) {
  currentMealType = mealType;
  const modal = document.getElementById('nut-add-modal');
  if (!modal) return;

  // Reset
  const input = document.getElementById('nut-search-input');
  const results = document.getElementById('nut-search-results');
  if (input) input.value = '';
  if (results) {
    clearEl(results);
    renderLocalSearchResults('');
  }

  modal.classList.add('show');

  // Mettre le titre selon le type
  const title = document.getElementById('nut-add-modal-title');
  const meal = MEAL_TYPES.find(m => m.id === mealType);
  if (title && meal) title.innerHTML = `${meal.emoji} Ajouter à : ${meal.name}`;

  setTimeout(() => input?.focus(), 200);
}

function closeAddMealModal() {
  document.getElementById('nut-add-modal').classList.remove('show');
}

function renderLocalSearchResults(query) {
  const results = document.getElementById('nut-search-results');
  if (!results) return;
  clearEl(results);

  const locals = searchLocalFoods(query).slice(0, 30);
  if (locals.length === 0 && !query) {
    results.appendChild(createEl('div', { className: 'nut-search-empty', text: 'Aucun aliment' }));
    return;
  }

  // Header local
  if (locals.length > 0) {
    results.appendChild(createEl('div', { className: 'nut-search-section-title', html: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M3 8l9-5 9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg> Base locale' }));
    locals.forEach(food => results.appendChild(createFoodItem(food)));
  }

  // ⭐ Si query >= 2, lancer aussi recherche OpenFoodFacts (Premium uniquement)
  const userData = getUserData();
  const nutritionLevel = getFeatureLevel(userData, 'nutritionTracking');
  if (query.length >= 2 && nutritionLevel === 'advanced') {
    const offHeader = createEl('div', { className: 'nut-search-section-title', html: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> OpenFoodFacts <span class="nut-search-loading-mini">...</span>' });
    results.appendChild(offHeader);

    searchOpenFoodFacts(query).then(offFoods => {
      // Retirer l'indicateur loading
      const loader = offHeader.querySelector('.nut-search-loading-mini');
      if (loader) loader.remove();

      if (offFoods.length === 0) {
        offHeader.appendChild(createEl('span', { text: ' (rien trouvé)', attrs: { style: 'color: var(--text-dim); font-size: 11px;' } }));
      }

      offFoods.forEach(food => results.appendChild(createFoodItem(food)));
    });
  }
}

function createFoodItem(food) {
  const row = createEl('div', { className: 'nut-search-item' });
  row.innerHTML = `
    <div class="nut-search-item-left">
      <span class="nut-search-item-emoji">${food.emoji || '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>'}</span>
      <div>
        <div class="nut-search-item-name">${escapeHtml(food.name)}${food.brand ? ` <span class="nut-search-item-brand">· ${escapeHtml(food.brand)}</span>` : ''}</div>
        <div class="nut-search-item-info">${food.kcal} kcal · P${food.prot}g · G${food.carb}g · L${food.fat}g <span style="opacity:0.6;">(/100g)</span></div>
      </div>
    </div>
    <button class="nut-search-item-add" type="button">→</button>
  `;
  row.addEventListener('click', () => openPortionModal(food));
  return row;
}

// ============================================================
// MODAL PORTION : choisir la quantité en grammes
// ============================================================
function openPortionModal(food) {
  const modal = document.getElementById('nut-portion-modal');
  if (!modal) return;

  const content = document.getElementById('nut-portion-content');
  if (!content) return;
  clearEl(content);

  let grams = food.perPortion ? (food.portionG || 100) : 100;

  const wrap = createEl('div', { className: 'nut-portion-wrap' });

  // Header
  wrap.innerHTML = `
    <div class="nut-portion-head">
      <span class="nut-portion-emoji">${food.emoji || '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>'}</span>
      <div>
        <div class="nut-portion-name">${escapeHtml(food.name)}</div>
        ${food.brand ? `<div class="nut-portion-brand">${escapeHtml(food.brand)}</div>` : ''}
      </div>
    </div>

    <div class="nut-portion-input-wrap">
      <label class="nut-portion-label">Quantité (g)</label>
      <div class="nut-portion-quick">
        <button type="button" class="nut-portion-quick-btn" data-g="50">50</button>
        <button type="button" class="nut-portion-quick-btn" data-g="100">100</button>
        <button type="button" class="nut-portion-quick-btn" data-g="150">150</button>
        <button type="button" class="nut-portion-quick-btn" data-g="200">200</button>
        <button type="button" class="nut-portion-quick-btn" data-g="300">300</button>
      </div>
      <input type="number" class="nut-input nut-portion-input" id="nut-portion-grams" value="${grams}" min="1" max="2000" />
    </div>

    <div class="nut-portion-preview" id="nut-portion-preview"></div>

    <button class="btn btn-primary" id="nut-portion-confirm" type="button" style="margin-top: 20px;">Ajouter à mon repas</button>
  `;

  content.appendChild(wrap);

  const input = document.getElementById('nut-portion-grams');
  const preview = document.getElementById('nut-portion-preview');

  const updatePreview = () => {
    const g = Math.max(1, Math.min(2000, parseInt(input.value) || 100));
    const calc = calculatePortion(food, g);
    preview.innerHTML = `
      <div class="nut-portion-pkcal">${calc.kcal} <span>kcal</span></div>
      <div class="nut-portion-pmacros">
        <span style="color: #10b981;">P ${calc.prot}g</span>
        <span style="color: #06b6d4;">G ${calc.carb}g</span>
        <span style="color: #fbbf24;">L ${calc.fat}g</span>
      </div>
    `;
  };

  input.addEventListener('input', updatePreview);
  document.querySelectorAll('.nut-portion-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.g;
      updatePreview();
    });
  });

  document.getElementById('nut-portion-confirm').addEventListener('click', async () => {
    const g = Math.max(1, Math.min(2000, parseInt(input.value) || 100));
    const calc = calculatePortion(food, g);
    await addFoodToMeal({
      ...food,
      grams: g,
      ...calc,
      addedAt: Date.now(),
    });
    closePortionModal();
    closeAddMealModal();
  });

  updatePreview();
  modal.classList.add('show');
}

function closePortionModal() {
  document.getElementById('nut-portion-modal').classList.remove('show');
}

async function addFoodToMeal(foodEntry) {
  const nut = ensureNutritionState();
  const today = getTodayKey();
  if (!nut.dailyMeals[today]) nut.dailyMeals[today] = {};
  if (!nut.dailyMeals[today][currentMealType]) nut.dailyMeals[today][currentMealType] = [];
  nut.dailyMeals[today][currentMealType].push(foodEntry);
  haptic('success');
  await save();
  showToast(`${foodEntry.name} ajouté !`);
  renderNutritionDashboard(currentNutritionLevel);
}

// ============================================================
// RESET NUTRITION (refaire le questionnaire)
// ============================================================
async function resetNutritionOnboarding() {
  const confirmed = await confirmModal('Recalculer tes besoins nutritionnels ?', {
    title: 'Recalcul nutrition',
    confirmText: 'Recalculer',
    cancelText: 'Annuler',
  });
  if (!confirmed) return;
  const nut = ensureNutritionState();
  nut.onboardingDone = false;
  await save();
  renderNutrition();
}

// ============================================================
// LOCKED VIEW (free users)
// ============================================================
function renderNutritionLocked() {
  const container = document.getElementById('nutrition-content');
  if (!container) return;
  clearEl(container);

  container.appendChild(createEl('div', {
    className: 'nut-onb-wrap',
    html: `
      <div class="nut-onb-header">
        <span class="label-eyebrow"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><rect x="3" y="11" width="18" height="11" rx="2" fill="rgba(212,168,67,0.1)"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Suivi nutritionnel</span>
        <h1>Suivi <span class="text-gradient">nutritionnel</span></h1>
        <p>Suis tes calories, macros et hydratation au quotidien. Disponible avec Premium.</p>
      </div>
      <div style="text-align:center;padding:32px 0;">
        <div style="margin-bottom:16px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" fill="rgba(212,168,67,0.08)"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <button class="btn btn-primary chal-locked-btn" type="button" id="nut-locked-premium-btn">Voir les plans Premium</button>
      </div>
    `,
  }));

  setTimeout(() => {
    document.getElementById('nut-locked-premium-btn')?.addEventListener('click', () => {
      import('./sidebar.js').then(mod => { if (mod.openPremiumModal) mod.openPremiumModal(); });
    });
  }, 10);
}

// ============================================================
// INIT (bind events)
// ============================================================
let initialized = false;

export function initNutrition() {
  if (initialized) return;
  initialized = true;

  // Search input
  const input = document.getElementById('nut-search-input');
  if (input) {
    input.addEventListener('input', () => {
      if (currentSearchTimeout) clearTimeout(currentSearchTimeout);
      currentSearchTimeout = setTimeout(() => {
        renderLocalSearchResults(input.value);
      }, 300);
    });
  }

  // Close buttons
  document.getElementById('nut-add-modal-close')?.addEventListener('click', closeAddMealModal);
  document.getElementById('nut-portion-modal-close')?.addEventListener('click', closePortionModal);

  // Backdrop close
  document.getElementById('nut-add-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'nut-add-modal') closeAddMealModal();
  });
  document.getElementById('nut-portion-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'nut-portion-modal') closePortionModal();
  });
}

// Utility (escape simple)
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Export pour intégration future avec OPTI coach
export function getTodayNutritionContext() {
  const nut = getState().nutrition;
  if (!nut || !nut.onboardingDone) return null;

  const today = getTodayKey();
  const todayMeals = nut.dailyMeals?.[today] || {};
  const allMeals = Object.values(todayMeals).flat();
  const totals = calculateDayTotals(allMeals);

  return {
    targetKcal: nut.targetKcal,
    targetProtein: nut.targetProtein,
    targetCarbs: nut.targetCarbs,
    targetFat: nut.targetFat,
    consumed: totals,
    remaining: {
      kcal: Math.max(0, nut.targetKcal - totals.kcal),
      prot: Math.max(0, nut.targetProtein - totals.prot),
      carb: Math.max(0, nut.targetCarbs - totals.carb),
      fat: Math.max(0, nut.targetFat - totals.fat),
    },
    mealsCount: allMeals.length,
  };
}

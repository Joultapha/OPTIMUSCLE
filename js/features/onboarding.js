/* ============================================================
   OPTIMUSCLE — Onboarding (5-step questionnaire)
   ============================================================
   ⚠️ NE TOUCHE PLUS AU DOM des pages.
   À la fin, appelle UNIQUEMENT setOnboardingCompleted(true).
*/

import { getState, saveImmediate } from '../core/state.js';
import { generateProgram } from '../core/program.js';
import { setOnboardingCompleted } from '../core/appState.js';
import { renderHome } from './ui.js';
import { scheduleReminder } from '../utils/notifications.js';
import { validateProfile } from '../utils/validation.js';
import { showToast } from '../utils/notifications.js';

let currentStep = 1;
let stepData = {};

export function initOnboarding() {
  document.querySelectorAll('.options').forEach(group => {
    group.addEventListener('click', e => {
      const opt = e.target.closest('.option');
      if (!opt) return;

      group.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');

      const field = String(group.dataset.field || '').slice(0, 50);
      const value = String(opt.dataset.value || '').slice(0, 50);
      if (field && value) stepData[field] = value;

      const step = group.closest('.step');
      const nextBtn = step.querySelector('.btn-next, #btn-finish-onb');
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', nextStep);
  });

  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', prevStep);
  });

  const finishBtn = document.getElementById('btn-finish-onb');
  if (finishBtn) finishBtn.addEventListener('click', finishOnboarding);
}

export function resetOnboardingUI() {
  currentStep = 1;
  stepData = {};
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.querySelector('.step[data-step="1"]')?.classList.add('active');
  document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  document.querySelectorAll('.step .btn-primary').forEach(b => b.disabled = true);
}

function nextStep() {
  document.querySelector(`.step[data-step="${currentStep}"]`)?.classList.remove('active');
  currentStep = Math.min(5, currentStep + 1);
  document.querySelector(`.step[data-step="${currentStep}"]`)?.classList.add('active');
  window.scrollTo(0, 0);
}

function prevStep() {
  document.querySelector(`.step[data-step="${currentStep}"]`)?.classList.remove('active');
  currentStep = Math.max(1, currentStep - 1);
  document.querySelector(`.step[data-step="${currentStep}"]`)?.classList.add('active');
  window.scrollTo(0, 0);
}

async function finishOnboarding() {
  // 1. Validation
  const v = validateProfile(stepData);
  if (!v.ok) {
    showToast('Données invalides : ' + v.error);
    console.error('Profil rejeté:', v.error, stepData);
    return;
  }

  // 2. Save profile
  const state = getState();
  state.profile = { ...stepData };

  // 3. Générer programme
  await generateProgram();

  // 4. Save immédiat en Firebase
  await saveImmediate();

  // 5. Préparer le rendu home AVANT la transition
  renderHome();
  scheduleReminder();

  // 6. ⭐ SEUL POINT DE BASCULE : setOnboardingCompleted(true)
  // Le render() centralisé va automatiquement basculer vers dashboard.
  setOnboardingCompleted(true);

  showToast('🎉 Programme prêt !');
}

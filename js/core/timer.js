/* ============================================================
   OPTIMUSCLE — Rest Timer
   ============================================================ */

import { getState } from './state.js';

let timerInterval = null;
let timerTotal = 60;
let timerRemaining = 60;
let timerPaused = false;

export function startTimer(seconds, exName) {
  // Validation paranoïaque
  if (typeof seconds !== 'number' || seconds < 1 || seconds > 600) {
    console.warn('Timer: durée invalide', seconds);
    return;
  }
  const safeName = String(exName || '—').slice(0, 100);

  timerTotal = seconds;
  timerRemaining = seconds;
  timerPaused = false;

  const nameEl = document.getElementById('timer-ex-name');
  const pauseEl = document.getElementById('timer-pause');
  if (nameEl) nameEl.textContent = safeName; // textContent = safe
  if (pauseEl) pauseEl.textContent = 'Pause';

  document.getElementById('timer-modal').classList.add('show');
  updateTimerDisplay();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!timerPaused) {
      timerRemaining--;
      updateTimerDisplay();
      if (timerRemaining <= 0) finishTimer();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  if (display) display.textContent = timerRemaining;
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (timerRemaining / timerTotal) * circumference;
  const fg = document.getElementById('timer-fg');
  if (fg) fg.style.strokeDashoffset = offset;
}

export function toggleTimer() {
  timerPaused = !timerPaused;
  const el = document.getElementById('timer-pause');
  if (el) el.textContent = timerPaused ? 'Reprendre' : 'Pause';
}

export function addTimerTime(seconds) {
  timerRemaining = Math.max(0, Math.min(3600, timerRemaining + seconds));
  if (timerRemaining > timerTotal) timerTotal = timerRemaining;
  updateTimerDisplay();
}

function finishTimer() {
  clearInterval(timerInterval);
  timerInterval = null;

  const state = getState();

  // Sound
  if (state.settings?.sound) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.15, 0.3].forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.12);
      });
    } catch (e) { /* audio blocked */ }
  }

  // Vibration
  if (state.settings?.vibrate && navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

  setTimeout(closeTimer, 800);
}

export function closeTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('timer-modal').classList.remove('show');
}

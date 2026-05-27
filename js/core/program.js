/* ============================================================
   OPTIMUSCLE — Program Generator
   ============================================================ */

import { getState, save } from './state.js';
import { TEMPLATES, FOCUS_MAP, EX_DB } from './data.js';
import { validateProfile } from '../utils/validation.js';

export function getMondayISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function pickWorkoutDays(freq) {
  const map = {
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 4, 5],
    6: [0, 1, 2, 3, 4, 5]
  };
  return map[freq] || [0, 2, 4];
}

export function getParams(goal, level) {
  let sets = 3, reps = "10", rest = 60, cardioMin = 20;

  if (goal === 'muscle') {
    sets = level === 'beginner' ? 3 : (level === 'intermediate' ? 4 : 5);
    reps = level === 'advanced' ? "6-8" : (level === 'intermediate' ? "8-10" : "10-12");
    rest = 90;
  } else if (goal === 'loss') {
    sets = 3; reps = "12-15"; rest = 30; cardioMin = 25;
  } else if (goal === 'endurance') {
    sets = 3; reps = "15-20"; rest = 30; cardioMin = 30;
  } else {
    sets = 3; reps = "10-12"; rest = 45; cardioMin = 15;
  }

  return { sets, reps, rest, cardioMin };
}

export function buildExercises(focus, place, count, params) {
  let pool = (FOCUS_MAP[focus] || ["squat", "pushup", "plank"]).slice();
  pool = pool.filter(k => EX_DB[k] && EX_DB[k].places.includes(place));

  const fillers = Object.keys(EX_DB).filter(k => EX_DB[k].places.includes(place));
  let safetyCounter = 0;
  while (pool.length < count && safetyCounter++ < 50) {
    const next = fillers[Math.floor(Math.random() * fillers.length)];
    if (!pool.includes(next)) pool.push(next);
  }
  pool = pool.slice(0, count);

  return pool.map(k => {
    const ex = EX_DB[k];
    if (ex.cardio) {
      return {
        key: k, name: ex.name, muscle: ex.muscle,
        sets: 1, reps: `${params.cardioMin} min`,
        rest: 60, done: false, time: true
      };
    }
    if (ex.time) {
      return {
        key: k, name: ex.name, muscle: ex.muscle,
        sets: params.sets, reps: "30-45 sec",
        rest: params.rest, done: false, time: true
      };
    }
    return {
      key: k, name: ex.name, muscle: ex.muscle,
      sets: params.sets, reps: params.reps,
      rest: params.rest, done: false
    };
  });
}

export async function generateProgram() {
  const state = getState();
  if (!state.profile) {
    console.warn('Pas de profil → impossible de générer un programme');
    return;
  }

  // Re-valider le profil (paranoïa)
  const v = validateProfile(state.profile);
  if (!v.ok) {
    console.error('Profil invalide:', v.error);
    return;
  }

  const { goal, level, place, frequency, duration } = state.profile;
  const freq = parseInt(frequency, 10);
  const dur = parseInt(duration, 10);
  const tpl = TEMPLATES[freq][goal];
  const params = getParams(goal, level);
  const exCount = dur <= 20 ? 4 : (dur <= 40 ? 5 : 7);
  const workoutDayIndices = pickWorkoutDays(freq);
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const days = [];
  let workoutIdx = 0;

  for (let i = 0; i < 7; i++) {
    if (workoutDayIndices.includes(i)) {
      const focus = tpl[workoutIdx % tpl.length];
      const exs = buildExercises(focus, place, exCount, params);
      days.push({
        day: dayNames[i],
        dayIdx: i,
        name: focus,
        exercises: exs,
        rest: false,
        done: false,
        duration: dur,
        difficulty: level === 'beginner' ? 'Modérée' : (level === 'intermediate' ? 'Soutenue' : 'Intense'),
      });
      workoutIdx++;
    } else {
      days.push({
        day: dayNames[i],
        dayIdx: i,
        name: "Repos",
        rest: true,
        done: false,
        exercises: []
      });
    }
  }

  state.program = days;
  state.weekStart = getMondayISO();
  await save();
}

export async function checkWeekReset() {
  const state = getState();
  if (!state.weekStart || !state.program) return;
  const start = new Date(state.weekStart);
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));

  if (diffDays >= 7) {
    state.program.forEach(d => {
      d.done = false;
      if (Array.isArray(d.exercises)) {
        d.exercises.forEach(e => e.done = false);
      }
    });
    state.weekStart = getMondayISO();
    await save();
  }
}

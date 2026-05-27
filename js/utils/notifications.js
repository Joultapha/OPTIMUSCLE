/* ============================================================
   OPTIMUSCLE — Notifications & Toasts
   ============================================================ */

import { getState, save } from '../core/state.js';
import { createEl, clearEl } from './sanitize.js';

let reminderTimeout = null;

export function showToast(msg, duration = 2200) {
  const t = document.getElementById('toast');
  if (!t) return;
  // textContent = jamais d'innerHTML pour les toasts !
  t.textContent = String(msg).slice(0, 200);
  t.classList.add('show');
  // Remove any existing action buttons
  const existingAction = t.querySelector('.toast-action');
  if (existingAction) existingAction.remove();
  setTimeout(() => t.classList.remove('show'), duration);
}

/**
 * Affiche un toast avec un bouton d'action (ex: "Annuler").
 * Retourne une Promise qui se résout quand le toast disparaît.
 * Si l'utilisateur clique l'action, resolve avec true.
 */
export function showToastWithAction(msg, actionLabel, duration = 5000) {
  return new Promise((resolve) => {
    const t = document.getElementById('toast');
    if (!t) { resolve(false); return; }

    // Reset
    clearEl(t);
    t.appendChild(document.createTextNode(String(msg).slice(0, 150)));

    const actionBtn = createEl('button', {
      className: 'toast-action',
      text: actionLabel,
      on: {
        click: (e) => {
          e.stopPropagation();
          t.classList.remove('show');
          resolve(true);
        },
      },
    });
    t.appendChild(actionBtn);

    t.classList.add('show');

    const timer = setTimeout(() => {
      t.classList.remove('show');
      resolve(false);
    }, duration);

    // If action clicked before timeout, already resolved above
  });
}

/**
 * Affiche un modal de confirmation personnalisé (remplace window.confirm).
 * Retourne une Promise<boolean> : true si confirmé, false si annulé.
 *
 * @param {string} message - Message de confirmation
 * @param {object} options - { title, confirmText, cancelText, danger }
 * @returns {Promise<boolean>}
 */
export function confirmModal(message, options = {}) {
  const {
    title = 'Confirmation',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    danger = false,
  } = options;

  return new Promise((resolve) => {
    // Créer ou réutiliser le modal
    let overlay = document.getElementById('confirm-modal-overlay');
    if (!overlay) {
      overlay = createEl('div', {
        className: 'modal-overlay confirm-modal-overlay',
        attrs: { id: 'confirm-modal-overlay' },
      });
      document.body.appendChild(overlay);
    }

    clearEl(overlay);

    const modal = createEl('div', { className: 'modal confirm-modal' });

    // Titre
    modal.appendChild(createEl('h3', {
      className: 'confirm-modal-title',
      text: title,
    }));

    // Message
    modal.appendChild(createEl('p', {
      className: 'confirm-modal-message',
      text: message,
    }));

    // Boutons
    const btnRow = createEl('div', { className: 'confirm-modal-btns' });

    const cancelBtn = createEl('button', {
      className: 'btn btn-ghost',
      text: cancelText,
      on: {
        click: () => {
          overlay.classList.remove('show');
          resolve(false);
        },
      },
    });
    btnRow.appendChild(cancelBtn);

    const confirmBtn = createEl('button', {
      className: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'),
      text: confirmText,
      on: {
        click: () => {
          overlay.classList.remove('show');
          resolve(true);
        },
      },
    });
    btnRow.appendChild(confirmBtn);

    modal.appendChild(btnRow);
    overlay.appendChild(modal);

    // Clic backdrop = annuler
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        resolve(false);
      }
    }, { once: true });

    // Échap = annuler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.classList.remove('show');
        resolve(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Afficher
    requestAnimationFrame(() => overlay.classList.add('show'));
  });
}

export async function toggleReminders() {
  const state = getState();
  const enabled = document.getElementById('set-reminders').checked;

  if (enabled) {
    if (!('Notification' in window)) {
      showToast('Notifications non supportées');
      document.getElementById('set-reminders').checked = false;
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        state.settings.reminders = true;
        await save();
        scheduleReminder();
        showToast('🔔 Rappels activés');
      } else {
        document.getElementById('set-reminders').checked = false;
        showToast('Permission refusée');
      }
    } catch (e) {
      document.getElementById('set-reminders').checked = false;
      showToast('Erreur permissions');
    }
  } else {
    state.settings.reminders = false;
    await save();
    if (reminderTimeout) clearTimeout(reminderTimeout);
  }
}

export function scheduleReminder() {
  const state = getState();
  if (reminderTimeout) clearTimeout(reminderTimeout);
  if (!state.settings.reminders) return;

  const timeStr = state.settings.time || '18:00';
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr)) return;

  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const delay = next - now;

  reminderTimeout = setTimeout(() => {
    if (Notification.permission === 'granted' && state.program) {
      const todayIdx = (new Date().getDay() + 6) % 7;
      const today = state.program[todayIdx];
      const msg = today && !today.rest && !today.done
        ? `Aujourd'hui : ${today.name} (${today.duration} min) 💪`
        : "C'est l'heure de bouger un peu ! 💪";
      try {
        new Notification('OPTIMUSCLE', { body: msg, icon: '/assets/favicon.svg' });
      } catch (e) { /* notif blocked */ }
    }
    scheduleReminder();
  }, delay);
}

/* ============================================================
   OPTIMUSCLE — Authentication (sécurisé)
   ============================================================ */

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { validateEmailField, validatePasswordField } from '../utils/validation.js';
import {
  rateLimit,
  recordFailedAttempt,
  resetAttempts,
  isBlocked,
  startFormTimer,
  isHumanTiming,
} from '../utils/rateLimit.js';
import { escapeHtml } from '../utils/sanitize.js';
import { confirmModal, showToast } from '../utils/notifications.js';
import { createEl, clearEl } from '../utils/sanitize.js';

let isRegisterMode = false;
let authInstance = null;

export async function initAuth(firebaseApp) {
  authInstance = getAuth(firebaseApp);
  // Persistance locale (mais session unique par device)
  await setPersistence(authInstance, browserLocalPersistence).catch(() => {});

  // Démarrer le timer anti-bot dès l'init
  startFormTimer('login');

  return authInstance;
}

export function getAuthInstance() {
  return authInstance;
}

export function setupAuthListener(callback) {
  if (!authInstance) throw new Error('Auth not initialized');
  onAuthStateChanged(authInstance, callback);
}

// ========== UI HELPERS ==========
export function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const get = (id) => document.getElementById(id);

  get('login-form-title').textContent = isRegisterMode ? 'CRÉER UN COMPTE' : 'CONNEXION';
  get('login-form-sub').textContent = isRegisterMode
    ? 'Rejoins la communauté OPTIMUSCLE'
    : 'Accède à ton programme personnalisé';
  get('input-password2').style.display = isRegisterMode ? 'block' : 'none';
  get('btn-email-action').textContent = isRegisterMode ? "S'inscrire" : 'Se connecter';
  get('toggle-text').textContent = isRegisterMode ? 'Déjà un compte ?' : 'Pas encore de compte ?';
  get('toggle-mode').textContent = isRegisterMode ? ' Se connecter' : ' Créer un compte';
  get('login-error').style.display = 'none';

  // Hide/show forgot password link (only visible in login mode)
  const forgotLink = get('btn-forgot-password');
  if (forgotLink) {
    forgotLink.style.display = isRegisterMode ? 'none' : 'block';
  }

  // Reset timer anti-bot
  startFormTimer('login');
}

export function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (!el) return;
  // textContent = safe (jamais innerHTML !)
  el.textContent = String(msg).slice(0, 200);
  el.style.display = 'block';
}

export function showLoginLoading(show) {
  document.getElementById('login-loading').style.display = show ? 'block' : 'none';
  document.getElementById('login-form-area').style.display = show ? 'none' : 'block';
}

// ========== AUTH ACTIONS ==========

export async function loginGoogle() {
  // Rate limit (anti-spam clic)
  if (!rateLimit('login_google', 5, 60_000)) {
    showLoginError('Trop de tentatives, patiente.');
    return;
  }

  // Check blocage par échecs répétés
  const blocked = isBlocked('login');
  if (blocked) {
    showLoginError(`Bloqué ${blocked}s suite à trop de tentatives.`);
    return;
  }

  showLoginLoading(true);
  try {
    const provider = new GoogleAuthProvider();
    // Bonne pratique : prompt 'select_account' pour éviter le mauvais compte
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(authInstance, provider);
    resetAttempts('login');
  } catch (e) {
    showLoginLoading(false);
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
      return; // silent
    }
    recordFailedAttempt('login');
    showLoginError('Erreur Google : ' + (e.message || 'Réessaie'));
  }
}

export async function handleEmailAuth() {
  // 🤖 Anti-bot : vérif timing minimum
  if (!isHumanTiming('login', 1200)) {
    showLoginError('Vérification de sécurité...');
    return;
  }

  // 🔒 Rate limit
  if (!rateLimit('login_email', 8, 60_000)) {
    showLoginError('Trop de tentatives, patiente.');
    return;
  }

  // 🚫 Blocage temporaire si trop d'échecs
  const blocked = isBlocked('login');
  if (blocked) {
    showLoginError(`Bloqué ${blocked}s suite à trop de tentatives.`);
    return;
  }

  const email = (document.getElementById('input-email').value || '').trim().toLowerCase();
  const pass = document.getElementById('input-password').value || '';
  const pass2 = document.getElementById('input-password2').value || '';

  // Reset error display
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.style.display = 'none';

  // ✅ Validation client
  const emailErr = validateEmailField(email);
  if (emailErr) return showLoginError(emailErr);

  const passErr = validatePasswordField(pass, { isRegister: isRegisterMode });
  if (passErr) return showLoginError(passErr);

  if (isRegisterMode && pass !== pass2) {
    return showLoginError('Les mots de passe ne correspondent pas.');
  }

  showLoginLoading(true);

  try {
    if (isRegisterMode) {
      await createUserWithEmailAndPassword(authInstance, email, pass);
    } else {
      await signInWithEmailAndPassword(authInstance, email, pass);
    }
    resetAttempts('login');
  } catch (e) {
    showLoginLoading(false);
    recordFailedAttempt('login');

    const msgs = {
      'auth/user-not-found': "Aucun compte avec cet email.",
      'auth/wrong-password': "Mot de passe incorrect.",
      'auth/email-already-in-use': "Cet email est déjà utilisé.",
      'auth/invalid-email': "Email invalide.",
      'auth/invalid-credential': "Email ou mot de passe incorrect.",
      'auth/weak-password': "Mot de passe trop faible (6 caractères min).",
      'auth/too-many-requests': "Trop de tentatives. Réessaie plus tard.",
      'auth/network-request-failed': "Pas de connexion internet.",
    };

    // ⚠️ On n'expose JAMAIS le message d'erreur Firebase brut
    // (peut fuiter info sur les comptes existants)
    const safeMsg = msgs[e.code] || "Erreur. Réessaie.";
    showLoginError(safeMsg);
  }
}

// ========== LOGOUT (custom modal) ==========
export async function confirmLogout() {
  const confirmed = await confirmModal("Se déconnecter d'OPTIMUSCLE ?", {
    title: 'Déconnexion',
    confirmText: 'Se déconnecter',
    cancelText: 'Annuler',
    danger: true,
  });
  if (confirmed) {
    signOut(authInstance);
  }
}

// ========== PASSWORD RESET ==========
export async function handlePasswordReset() {
  // Demander l'email via un modal custom
  const email = document.getElementById('input-email')?.value || '';
  const resetEmail = await showResetEmailModal(email);

  if (!resetEmail) return;

  try {
    await sendPasswordResetEmail(authInstance, resetEmail);
    showToast('📧 Email de réinitialisation envoyé !');
  } catch (e) {
    const msgs = {
      'auth/user-not-found': "Aucun compte avec cet email.",
      'auth/invalid-email': "Email invalide.",
      'auth/too-many-requests': "Trop de tentatives. Réessaie plus tard.",
    };
    showToast(msgs[e.code] || "Erreur lors de l'envoi. Réessaie.");
  }
}

function showResetEmailModal(prefilledEmail) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('reset-modal-overlay');
    if (!overlay) {
      overlay = createEl('div', {
        className: 'modal-overlay',
        attrs: { id: 'reset-modal-overlay' },
      });
      document.body.appendChild(overlay);
    }
    clearEl(overlay);

    const modal = createEl('div', { className: 'modal' });
    modal.appendChild(createEl('h3', { text: '🔑 Réinitialiser le mot de passe' }));
    modal.appendChild(createEl('p', {
      className: 'confirm-modal-message',
      text: 'Entre ton adresse email pour recevoir un lien de réinitialisation.',
    }));

    const input = createEl('input', {
      className: 'login-input',
      attrs: {
        type: 'email',
        placeholder: 'Adresse email',
        value: prefilledEmail,
        autocomplete: 'email',
      },
    });
    modal.appendChild(input);

    const btnRow = createEl('div', { className: 'confirm-modal-btns' });

    const cancelBtn = createEl('button', {
      className: 'btn btn-ghost',
      text: 'Annuler',
      on: {
        click: () => {
          overlay.classList.remove('show');
          resolve(null);
        },
      },
    });
    btnRow.appendChild(cancelBtn);

    const sendBtn = createEl('button', {
      className: 'btn btn-primary',
      text: 'Envoyer',
      on: {
        click: () => {
          const val = input.value.trim().toLowerCase();
          if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            showToast('Email invalide');
            return;
          }
          overlay.classList.remove('show');
          resolve(val);
        },
      },
    });
    btnRow.appendChild(sendBtn);
    modal.appendChild(btnRow);

    overlay.appendChild(modal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
        resolve(null);
      }
    }, { once: true });

    requestAnimationFrame(() => overlay.classList.add('show'));
    setTimeout(() => input.focus(), 300);
  });
}

// ========== ACCOUNT DELETION ==========
export async function handleDeleteAccount() {
  const confirmed = await confirmModal(
    'Ton compte, tes données et tout ton historique seront supprimés définitivement. Cette action est irréversible.',
    {
      title: 'Supprimer mon compte',
      confirmText: 'Supprimer définitivement',
      cancelText: 'Annuler',
      danger: true,
    }
  );

  if (!confirmed) return;

  const user = authInstance.currentUser;
  if (!user) {
    showToast('Erreur : aucun utilisateur connecté');
    return;
  }

  try {
    await deleteUser(user);
    showToast('Compte supprimé');
  } catch (e) {
    if (e.code === 'auth/requires-recent-login') {
      showToast('Reconnecte-toi avant de supprimer ton compte');
    } else {
      showToast('Erreur lors de la suppression. Réessaie.');
    }
  }
}

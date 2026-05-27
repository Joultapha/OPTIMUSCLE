/* ============================================================
   OPTIMUSCLE — Sanitization & XSS Protection Utilities
   ============================================================

   Ce module remplace TOUS les usages dangereux de innerHTML
   par des méthodes sécurisées. Toute donnée venant de
   l'utilisateur ou de Firebase doit passer par ici.
*/

/**
 * Escape les caractères HTML dangereux pour éviter le XSS.
 * À utiliser pour TOUT affichage de données utilisateur.
 *
 * @param {string} str - String potentiellement dangereuse
 * @returns {string} String avec les caractères HTML échappés
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/=/g, '&#61;');
}

/**
 * Échappe une string pour l'utiliser dans un attribut HTML
 * (entre guillemets doubles).
 */
export function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"'`=]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;', '`': '&#96;', '=': '&#61;'
  })[c]);
}

/**
 * Valide qu'une URL est safe (pas de javascript:, data:, etc.)
 * À utiliser pour les images/liens venant de sources externes.
 *
 * @param {string} url
 * @returns {string|null} URL si safe, null sinon
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Bloquer javascript:, data:, vbscript:, etc.
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    console.warn('🚨 URL bloquée (XSS):', trimmed.substring(0, 50));
    return null;
  }

  // Autoriser http(s):// et les chemins relatifs
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }

  return null;
}

/**
 * Crée un élément DOM de façon sécurisée (sans innerHTML).
 * C'est l'alternative SAFE à innerHTML.
 *
 * @param {string} tag - Tag HTML ('div', 'span', etc.)
 * @param {object} options - { className, text, attrs: {}, children: [] }
 * @returns {HTMLElement}
 *
 * Exemple :
 *   const div = createEl('div', {
 *     className: 'card',
 *     text: userInput,  // Automatiquement échappé
 *     attrs: { 'data-id': '123' }
 *   });
 */
export function createEl(tag, { className, text, html, attrs = {}, children = [], on = {} } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;

  // text = setTextContent (safe, jamais interprété comme HTML)
  if (text !== undefined && text !== null) {
    el.textContent = String(text);
  }

  // html = innerHTML mais UNIQUEMENT pour du HTML statique (jamais data user!)
  // À utiliser avec prudence et seulement pour des templates contrôlés
  if (html !== undefined) {
    el.innerHTML = html;
  }

  // Attributs (échappés)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    // Filtrer les attributs dangereux (event handlers)
    if (k.startsWith('on')) {
      console.warn('🚨 Attribut on* bloqué:', k);
      continue;
    }
    el.setAttribute(k, String(v));
  }

  // Event listeners (méthode sûre)
  for (const [evt, handler] of Object.entries(on)) {
    el.addEventListener(evt, handler);
  }

  // Enfants
  children.forEach(child => {
    if (child instanceof Node) el.appendChild(child);
    else if (typeof child === 'string') el.appendChild(document.createTextNode(child));
  });

  return el;
}

/**
 * Vide un élément DOM proprement (sans innerHTML = '').
 * Plus performant et plus safe.
 */
export function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Vérifie qu'une string ne contient pas de caractères suspects
 * (utile pour valider des noms, emails, etc.)
 */
export function isSafeString(str, { maxLen = 200 } = {}) {
  if (typeof str !== 'string') return false;
  if (str.length === 0 || str.length > maxLen) return false;
  // Bloquer les caractères de contrôle
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(str)) return false;
  return true;
}

/**
 * Valide un email basique.
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length > 254) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * Génère un ID aléatoire safe (crypto-safe si possible).
 */
export function safeRandomId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback (moins sûr mais ok)
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/* ============================================================
   OPTIMUSCLE — Animation Utilities
   ============================================================ */

/**
 * Anime un compteur numérique de 0 (ou val initiale) vers une valeur finale.
 * Effet "count up" pour stats, XP, etc.
 */
export function animateCount(el, target, options = {}) {
  if (!el) return;
  const {
    duration = 1200,
    decimals = 0,
    suffix = '',
    prefix = '',
    easing = (t) => 1 - Math.pow(1 - t, 3),  // easeOutCubic
  } = options;

  const start = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
  const diff = target - start;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easing(progress);
    const current = start + diff * eased;
    el.textContent = prefix + current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/**
 * Crée un effet ripple sur un élément (au clic).
 */
export function attachRipple(el) {
  if (!el || el._rippleAttached) return;
  el._rippleAttached = true;

  el.classList.add('ripple');
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-circle';
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
    `;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

/**
 * Intersection Observer pour animer les éléments quand ils entrent dans le viewport.
 */
let observer = null;
export function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
  }

  document.querySelectorAll('[data-animate]').forEach((el) => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
}

/**
 * Trigger une vibration légère (UX feedback).
 */
export function haptic(type = 'light') {
  if (!navigator.vibrate) return;
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [40],
    success: [50, 30, 50],
    error: [50, 100, 50, 100, 50],
  };
  try { navigator.vibrate(patterns[type] || patterns.light); } catch (e) {}
}

/**
 * Détecte le scroll et ajoute une classe au header (pour le styliser).
 */
export function initScrollHeader() {
  let lastScroll = 0;
  let ticking = false;

  function update() {
    const scroll = window.scrollY;
    const header = document.querySelector('header');
    if (header) {
      header.classList.toggle('scrolled', scroll > 8);
    }
    lastScroll = scroll;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

/**
 * Stagger d'animation sur les enfants d'un élément.
 */
export function staggerChildren(parent, delay = 80) {
  if (!parent) return;
  Array.from(parent.children).forEach((child, i) => {
    child.style.animationDelay = `${i * delay}ms`;
  });
}

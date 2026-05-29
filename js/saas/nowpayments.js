/* ============================================================
   OPTIMUSCLE — NOWPayments Integration (Crypto Payments)
   ============================================================
   Flow: User clicks Subscribe → Redirect to NOWPayments Checkout
   → Payment confirmed → Redirect back to OPTIMUSCLE
   → Premium activated locally (localStorage)

   IMPORTANT: Public Key only — safe for frontend.
   API Key is for server-side only (not used here).
   ============================================================ */

const NOWPAYMENTS_PUBLIC_KEY = '3a537511-bad2-413b-8d2b-b27471c593c7';
const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1';
// NOWPayments hosted checkout — correct URL format
const NOWPAYMENTS_CHECKOUT_URL = 'https://nowpayments.io/payment/';

// ===== PRICING =====
export const PRICING = {
  monthly: {
    id: 'premium_monthly',
    name: 'Premium Mensuel',
    price: 4.99,
    currency: 'usd',
    interval: 'mois',
    features: ['Coach IA illimité', 'Programmes personnalisés', 'Export PDF', 'Sans pub', 'Nutrition avancée'],
    popular: true,
  },
  yearly: {
    id: 'premium_yearly',
    name: 'Premium Annuel',
    price: 39.99,
    currency: 'usd',
    interval: 'an',
    savings: '33%',
    features: ['Tout le Premium Mensuel', 'Économie 33%', 'Support prioritaire', 'Badge exclusif'],
    popular: false,
  },
  lifetime: {
    id: 'premium_lifetime',
    name: 'Premium À Vie',
    price: 99.99,
    currency: 'usd',
    interval: 'vie',
    features: ['Tout le Premium Annuel', 'Accès à vie', 'Mises à jour futures', 'Badge or'],
    popular: false,
  },
};

// ===== SUB STORAGE =====
const SUB_KEY = 'optimuscle_subscription';

/**
 * Get current subscription from localStorage
 */
export function getSubscription() {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Save subscription to localStorage
 */
export function saveSubscription(sub) {
  try {
    localStorage.setItem(SUB_KEY, JSON.stringify(sub));
  } catch (e) {}
}

/**
 * Check if user has active premium
 */
export function isPremiumActive() {
  const sub = getSubscription();
  if (!sub) return false;
  if (sub.plan === 'free') return false;
  if (sub.status !== 'active') return false;
  // Check expiry for monthly/yearly
  if (sub.expiresAt && Date.now() > sub.expiresAt) {
    // Expired
    saveSubscription({ ...sub, status: 'expired' });
    return false;
  }
  return true;
}

/**
 * Activate premium after payment
 */
export function activatePremium(planId) {
  const plan = PRICING[planId] || PRICING.monthly;
  let expiresAt = null;

  if (planId === 'monthly') {
    expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  } else if (planId === 'yearly') {
    expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000; // 365 days
  }
  // lifetime = no expiry

  const sub = {
    plan: planId,
    planName: plan.name,
    status: 'active',
    activatedAt: Date.now(),
    expiresAt: expiresAt,
    price: plan.price,
  };

  saveSubscription(sub);
  return sub;
}

/**
 * Deactivate premium
 */
export function deactivatePremium() {
  saveSubscription({
    plan: 'free',
    status: 'inactive',
    deactivatedAt: Date.now(),
  });
}

// ===== PAYMENT FLOW =====

/**
 * Create a NOWPayments checkout URL and redirect the user.
 * Uses the hosted checkout page — simplest integration for pure frontend.
 *
 * @param {string} planId - 'monthly', 'yearly', or 'lifetime'
 * @returns {string} checkout URL
 */
export function createCheckoutUrl(planId) {
  const plan = PRICING[planId] || PRICING.monthly;
  const orderId = `optimuscle_${planId}_${Date.now()}`;

  // ⚠️ NOWPayments hosted checkout uses SNAKE_CASE params, not camelCase
  const params = new URLSearchParams({
    apikey: NOWPAYMENTS_PUBLIC_KEY,          // lowercase 'k'!
    price_amount: plan.price.toString(),     // snake_case
    price_currency: plan.currency,           // snake_case
    pay_currency: 'usdtsol',                 // USDT on Solana — low fees, fast
    order_id: orderId,                       // snake_case
    order_description: `OPTIMUSCLE ${plan.name}`, // snake_case
    success_url: `${window.location.origin}${window.location.pathname}?payment=success&plan=${planId}`, // snake_case
    cancel_url: `${window.location.origin}${window.location.pathname}?payment=cancel`, // snake_case
  });

  return `${NOWPAYMENTS_CHECKOUT_URL}?${params.toString()}`;
}

/**
 * Redirect user to NOWPayments checkout
 */
export function redirectToCheckout(planId) {
  const url = createCheckoutUrl(planId);
  window.location.href = url;
}

/**
 * Check URL params for payment result on page load
 * Called during app initialization
 */
export function checkPaymentResult() {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');

  if (paymentStatus === 'success') {
    const planId = params.get('plan');
    if (planId && PRICING[planId]) {
      activatePremium(planId);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return { success: true, plan: planId };
    }
  }

  if (paymentStatus === 'cancel') {
    window.history.replaceState({}, document.title, window.location.pathname);
    return { success: false, plan: null };
  }

  return null;
}

// ===== PAYMENT STATUS CHECK (optional, uses public API) =====

/**
 * Check payment status via NOWPayments public API
 * @param {string} paymentId - NOWPayments payment ID
 */
export async function checkPaymentStatus(paymentId) {
  try {
    const res = await fetch(`${NOWPAYMENTS_API_BASE}/payment/${paymentId}`, {
      headers: {
        'x-api-key': NOWPAYMENTS_PUBLIC_KEY,
      },
    });
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (e) {
    console.warn('NOWPayments status check failed:', e);
    return null;
  }
}

/* ============================================================
   OPTIMUSCLE — NOWPayments Integration (Crypto Payments)
   ============================================================
   Flow: User clicks Subscribe → NOWPayments Widget opens
   → User pays in crypto → Widget callback → Premium activated

   Uses NOWPayments Checkout Widget (official frontend method).
   Public Key only — safe for frontend.
   API Key is for server-side only (not used here).
   ============================================================ */

const NOWPAYMENTS_PUBLIC_KEY = '3a537511-bad2-413b-8d2b-b27471c593c7';

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

// ===== WIDGET LOADER =====

let widgetScriptLoaded = false;
let widgetScriptPromise = null;

/**
 * Load the NOWPayments widget script dynamically.
 * Only loads once, then cached.
 */
function loadWidgetScript() {
  if (widgetScriptLoaded) return Promise.resolve();
  if (widgetScriptPromise) return widgetScriptPromise;

  widgetScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.nowpayments.io/scripts/nowpayments.js';
    script.async = true;
    script.onload = () => {
      widgetScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load NOWPayments widget'));
    document.head.appendChild(script);
  });

  return widgetScriptPromise;
}

// ===== PAYMENT FLOW =====

/**
 * Open NOWPayments checkout widget for a plan.
 * Uses the official Checkout Widget — works in pure frontend.
 *
 * @param {string} planId - 'monthly', 'yearly', or 'lifetime'
 */
export async function redirectToCheckout(planId) {
  const plan = PRICING[planId] || PRICING.monthly;
  const orderId = `optimuscle_${planId}_${Date.now()}`;

  try {
    // 1. Load widget script
    await loadWidgetScript();

    // 2. Check widget is available
    if (!window.NowPayments) {
      throw new Error('NOWPayments widget not available');
    }

    // 3. Open payment widget
    window.NowPayments.showPayment({
      apiKey: NOWPAYMENTS_PUBLIC_KEY,
      priceAmount: plan.price,
      priceCurrency: plan.currency,
      payCurrency: 'usdtsol',        // USDT on Solana — low fees, fast
      orderId: orderId,
      orderDescription: `OPTIMUSCLE ${plan.name}`,
      successUrl: `${window.location.origin}${window.location.pathname}?payment=success&plan=${planId}`,
      cancelUrl: `${window.location.origin}${window.location.pathname}?payment=cancel`,
    });

  } catch (e) {
    console.error('[NOWPayments] Widget error:', e);

    // Fallback: redirect to hosted checkout page (no trailing slash!)
    const params = new URLSearchParams({
      apikey: NOWPAYMENTS_PUBLIC_KEY,
      price_amount: plan.price.toString(),
      price_currency: plan.currency,
      pay_currency: 'usdtsol',
      order_id: orderId,
      order_description: `OPTIMUSCLE ${plan.name}`,
      success_url: `${window.location.origin}${window.location.pathname}?payment=success&plan=${planId}`,
      cancel_url: `${window.location.origin}${window.location.pathname}?payment=cancel`,
    });
    window.location.href = `https://nowpayments.io/payment?${params.toString()}`;
  }
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

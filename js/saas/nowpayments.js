/* ============================================================
   OPTIMUSCLE — NOWPayments Integration (Crypto Payments)
   ============================================================
   Flow: User clicks Subscribe → NOWPayments Checkout page opens
   → User pays in crypto → Redirect back to OPTIMUSCLE
   → Premium activated locally (localStorage)

   Uses NOWPayments Hosted Checkout via 2 methods:
   - Primary: API Invoice (POST /v1/invoice → redirect to invoice_url)
   - Fallback: Direct URL with ?data= JSON parameter

   API Key is used server-side only in the invoice flow.
   For the ?data= method, API key is embedded in URL (by design,
   like Stripe publishable keys).
   ============================================================ */

const NOWPAYMENTS_API_KEY = 'QY9XACJ-CB5MJNM-PJG7JZV-DNCHB40';
const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1';

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
  if (sub.expiresAt && Date.now() > sub.expiresAt) {
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
    expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  } else if (planId === 'yearly') {
    expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
  }

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
 * METHOD 1 (Primary): Create an invoice via NOWPayments API,
 * then redirect the user to the hosted checkout page.
 *
 * Flow:
 *   POST /v1/invoice → get invoice_url → redirect user
 *
 * The invoice_url format is: https://nowpayments.io/payment?iid={id}
 * This is the OFFICIAL recommended method by NOWPayments.
 *
 * @param {string} planId - 'monthly', 'yearly', or 'lifetime'
 */
async function createInvoiceAndRedirect(planId) {
  const plan = PRICING[planId] || PRICING.monthly;
  const orderId = `optimuscle_${planId}_${Date.now()}`;

  const body = {
    price_amount: plan.price,
    price_currency: plan.currency,
    // NOT specifying pay_currency lets the user choose their crypto on the checkout page
    order_id: orderId,
    order_description: `OPTIMUSCLE ${plan.name}`,
    success_url: `${window.location.origin}${window.location.pathname}?payment=success&plan=${planId}`,
    cancel_url: `${window.location.origin}${window.location.pathname}?payment=cancel`,
  };

  console.log('[NOWPayments] Creating invoice via API...', body);

  try {
    const response = await fetch(`${NOWPAYMENTS_API_BASE}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[NOWPayments] Invoice API error:', response.status, errorData);
      throw new Error(`API error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('[NOWPayments] Invoice created:', data);

    if (data.invoice_url) {
      console.log('[NOWPayments] Redirecting to invoice_url:', data.invoice_url);
      window.location.href = data.invoice_url;
      return;
    }

    throw new Error('No invoice_url in response');
  } catch (err) {
    console.warn('[NOWPayments] Invoice API failed, falling back to ?data= method:', err.message);
    fallbackToDirectUrl(planId);
  }
}

/**
 * METHOD 2 (Fallback): Direct URL checkout with ?data= parameter.
 *
 * This method constructs a JSON object with payment details,
 * encodes it, and passes it as the ?data= parameter to:
 *   https://nowpayments.io/payment?data=<encoded JSON>
 *
 * This is the official WooCommerce-style integration.
 * The API key is included in the URL by design (like Stripe publishable keys).
 *
 * @param {string} planId - 'monthly', 'yearly', or 'lifetime'
 */
function fallbackToDirectUrl(planId) {
  const plan = PRICING[planId] || PRICING.monthly;
  const orderId = `optimuscle_${planId}_${Date.now()}`;

  const data = {
    apiKey: NOWPAYMENTS_API_KEY,
    paymentAmount: plan.price,
    paymentCurrency: plan.currency,
    successURL: `${window.location.origin}${window.location.pathname}?payment=success&plan=${planId}`,
    cancelURL: `${window.location.origin}${window.location.pathname}?payment=cancel`,
    orderID: orderId,
    orderDescription: `OPTIMUSCLE ${plan.name}`,
  };

  const encodedData = encodeURIComponent(JSON.stringify(data));
  const url = `https://nowpayments.io/payment?data=${encodedData}`;

  console.log('[NOWPayments] Fallback: Redirecting to ?data= URL');
  window.location.href = url;
}

/**
 * Redirect user to NOWPayments hosted checkout.
 * Tries the API Invoice method first, falls back to direct URL.
 */
export function redirectToCheckout(planId) {
  console.log('[NOWPayments] Starting checkout for plan:', planId);
  createInvoiceAndRedirect(planId);
}

/**
 * Check URL params for payment result on page load.
 * Called during app initialization.
 */
export function checkPaymentResult() {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');

  if (paymentStatus === 'success') {
    const planId = params.get('plan');
    if (planId && PRICING[planId]) {
      activatePremium(planId);
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

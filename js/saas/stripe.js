/* ============================================================
   OPTIMUSCLE — Stripe Integration (frontend)
   ============================================================

   Flow de paiement :
   1. User clique "Subscribe"
   2. Front appelle Cloud Function `createCheckoutSession`
   3. Cloud Function crée une Stripe Checkout Session
   4. Front redirige vers Stripe Checkout
   5. User paie → Stripe webhook → Cloud Function `stripeWebhook`
   6. Cloud Function met à jour le user.subscription dans Firestore
   7. Front lit les nouvelles données et débloque les features

   ⚠️ Le Cloud Function nécessite Firebase Blaze.
   En attendant : on prépare le code, on désactive le bouton "Upgrade".
*/

import { getCurrentUser } from '../core/state.js';
import { showToast } from '../utils/notifications.js';
import { PLANS } from './subscription.js';

// ⚠️ À remplacer par ta vraie clé publique Stripe (commence par pk_)
// Tu la trouveras sur https://dashboard.stripe.com/apikeys
// La clé publique est PUBLIQUE (safe à exposer), pas la clé secrète !
const STRIPE_PUBLIC_KEY = 'pk_test_REPLACE_ME';

// URL de ta Cloud Function (à activer en Blaze)
// Format : https://REGION-PROJECT.cloudfunctions.net/createCheckoutSession
const CHECKOUT_FUNCTION_URL = '';  // vide = mode démo

let stripePromise = null;

/**
 * Charge Stripe.js de façon asynchrone (lazy load).
 */
async function loadStripe() {
  if (stripePromise) return stripePromise;

  stripePromise = new Promise((resolve, reject) => {
    if (window.Stripe) return resolve(window.Stripe(STRIPE_PUBLIC_KEY));

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      if (window.Stripe) resolve(window.Stripe(STRIPE_PUBLIC_KEY));
      else reject(new Error('Stripe failed to load'));
    };
    script.onerror = () => reject(new Error('Stripe script load error'));
    document.head.appendChild(script);
  });

  return stripePromise;
}

/**
 * Lance le checkout pour un plan donné.
 */
export async function startCheckout(planId) {
  const user = getCurrentUser();
  if (!user) {
    showToast('Connecte-toi d\'abord');
    return;
  }

  const plan = PLANS[planId];
  if (!plan || plan.id === 'free') {
    showToast('Plan invalide');
    return;
  }

  // ===== MODE DÉMO (sans Cloud Function) =====
  if (!CHECKOUT_FUNCTION_URL || STRIPE_PUBLIC_KEY === 'pk_test_REPLACE_ME') {
    showToast('Stripe en mode démo — configurez Cloud Function');
    console.log('[DEMO] Checkout pour:', plan);
    // Ici tu peux simuler l'activation pour démo :
    // await simulatePremium(user.uid, planId);
    return;
  }

  // ===== MODE PRODUCTION =====
  try {
    // 1. Récupérer un ID token Firebase pour l'auth de la function
    const token = await user.getIdToken();

    // 2. Appeler la Cloud Function pour créer la session
    const res = await fetch(CHECKOUT_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        priceId: plan.stripeId,
        userId: user.uid,
      }),
    });

    if (!res.ok) throw new Error('Erreur création session');
    const { sessionId } = await res.json();

    // 3. Rediriger vers Stripe Checkout
    const stripe = await loadStripe();
    const result = await stripe.redirectToCheckout({ sessionId });
    if (result.error) throw new Error(result.error.message);

  } catch (e) {
    console.error('Stripe checkout error:', e);
    showToast('Erreur paiement : ' + e.message);
  }
}

/**
 * Ouvre le portail client Stripe (pour gérer/annuler).
 */
export async function openCustomerPortal() {
  const user = getCurrentUser();
  if (!user) return;

  // Nécessite une Cloud Function `createPortalSession`
  showToast('Portail client : à configurer');
}

/* ============================================================
   OPTIMUSCLE — Cloud Functions
   ============================================================

   ⚠️ NÉCESSITE Firebase Blaze (pay-as-you-go, gratuit jusqu'à 2M invocations/mois)

   À déployer avec :
     firebase deploy --only functions

   Variables d'environnement à configurer :
     firebase functions:config:set stripe.secret="sk_..." stripe.webhook="whsec_..."

   Functions exposées :
   - createCheckoutSession   : crée une session Stripe pour s'abonner
   - createPortalSession     : ouvre le portail client Stripe
   - stripeWebhook           : reçoit les events Stripe (paiements, annulations)
   - validateWorkout         : valide une séance terminée côté serveur (anti-triche)
   - dailyCleanup            : nettoie les vieilles données (cron quotidien)
   - setUserRole             : admin seulement, change le rôle d'un user
*/

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// ============================================================
// HELPERS
// ============================================================

function requireAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
  }
  return context.auth;
}

async function requireAdmin(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Accès admin requis');
  }
}

// Rate limiting serveur
async function checkRateLimit(uid, action, maxPerMinute = 30) {
  const ref = db.collection('rateLimits').doc(`${uid}_${action}`);
  const now = Date.now();
  const windowMs = 60_000;

  const snap = await ref.get();
  const data = snap.exists ? snap.data() : { count: 0, windowStart: now };

  if (now - data.windowStart > windowMs) {
    await ref.set({ count: 1, windowStart: now });
    return true;
  }

  if (data.count >= maxPerMinute) {
    throw new functions.https.HttpsError('resource-exhausted', `Limite atteinte : ${maxPerMinute}/min`);
  }

  await ref.update({ count: admin.firestore.FieldValue.increment(1) });
  return true;
}

// ============================================================
// 💳 STRIPE - Création checkout session
// ============================================================

exports.createCheckoutSession = functions
  .runWith({ secrets: ['STRIPE_SECRET_KEY'] })
  .https.onCall(async (data, context) => {
    const { uid, token } = requireAuth(context);
    await checkRateLimit(uid, 'checkout', 5);

    const { priceId, successUrl, cancelUrl } = data;
    if (!priceId || typeof priceId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'priceId requis');
    }

    // Validation whitelist des price IDs autorisés
    const ALLOWED_PRICES = [
      process.env.STRIPE_PRICE_MONTHLY,
      process.env.STRIPE_PRICE_YEARLY,
      process.env.STRIPE_PRICE_LIFETIME,
    ];
    if (!ALLOWED_PRICES.includes(priceId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Price non autorisé');
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const user = await auth.getUser(uid);

    // Récupérer ou créer le customer Stripe
    let customerId;
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      customerId = userDoc.data().stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { firebaseUid: uid },
      });
      customerId = customer.id;
      await db.collection('users').doc(uid).set({ stripeCustomerId: customerId }, { merge: true });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: priceId.includes('lifetime') ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.APP_URL}/?success=true`,
      cancel_url: cancelUrl || `${process.env.APP_URL}/?canceled=true`,
      metadata: { firebaseUid: uid },
      allow_promotion_codes: true,
    });

    return { sessionId: session.id, url: session.url };
  });

// ============================================================
// 💳 STRIPE - Webhook (paiements, annulations, etc.)
// ============================================================

exports.stripeWebhook = functions
  .runWith({ secrets: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'] })
  .https.onRequest(async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const uid = session.metadata.firebaseUid;
          if (!uid) break;

          const sub = session.subscription
            ? await stripe.subscriptions.retrieve(session.subscription)
            : null;

          const planMap = {
            [process.env.STRIPE_PRICE_MONTHLY]: 'premium_monthly',
            [process.env.STRIPE_PRICE_YEARLY]: 'premium_yearly',
            [process.env.STRIPE_PRICE_LIFETIME]: 'premium_lifetime',
          };

          const priceId = sub ? sub.items.data[0].price.id : session.line_items?.data[0]?.price?.id;
          const planId = planMap[priceId] || 'premium_monthly';

          await db.collection('users').doc(uid).set({
            role: 'premium',
            subscription: {
              plan: planId,
              status: 'active',
              stripeSubscriptionId: sub?.id || null,
              currentPeriodEnd: sub ? sub.current_period_end * 1000 : null,
              startedAt: Date.now(),
            },
          }, { merge: true });

          console.log(`✓ User ${uid} → ${planId}`);
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const sub = event.data.object;
          const userQuery = await db.collection('users')
            .where('stripeCustomerId', '==', sub.customer).limit(1).get();
          if (userQuery.empty) break;

          const uid = userQuery.docs[0].id;
          await db.collection('users').doc(uid).update({
            'subscription.status': sub.status,
            'subscription.currentPeriodEnd': sub.current_period_end * 1000,
            role: sub.status === 'active' ? 'premium' : 'user',
          });
          break;
        }

        case 'invoice.payment_failed': {
          // TODO : envoyer un email
          break;
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook handler error:', err);
      res.status(500).send('Internal error');
    }
  });

// ============================================================
// 🏋️ VALIDATE WORKOUT (anti-triche)
// ============================================================

exports.validateWorkout = functions.https.onCall(async (data, context) => {
  const { uid } = requireAuth(context);
  await checkRateLimit(uid, 'workout', 10);

  const { duration, name, exerciseCount } = data;

  // Validation stricte
  if (typeof duration !== 'number' || duration < 1 || duration > 240) {
    throw new functions.https.HttpsError('invalid-argument', 'Durée invalide');
  }
  if (typeof name !== 'string' || name.length === 0 || name.length > 100) {
    throw new functions.https.HttpsError('invalid-argument', 'Nom invalide');
  }
  if (typeof exerciseCount !== 'number' || exerciseCount < 1 || exerciseCount > 50) {
    throw new functions.https.HttpsError('invalid-argument', 'Nb exos invalide');
  }

  // Anti-triche : vérifier qu'il n'y a pas déjà eu trop de séances aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  const todayWorkouts = await db.collection('users').doc(uid)
    .collection('workouts')
    .where('date', '==', today)
    .get();

  if (todayWorkouts.size >= 5) {
    throw new functions.https.HttpsError('resource-exhausted', 'Max 5 séances/jour');
  }

  // Enregistrer la séance
  const workoutRef = await db.collection('users').doc(uid).collection('workouts').add({
    name,
    duration,
    exerciseCount,
    date: today,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Mettre à jour les stats de façon atomique
  await db.collection('users').doc(uid).update({
    'stats.totalSessions': admin.firestore.FieldValue.increment(1),
    'stats.totalMinutes': admin.firestore.FieldValue.increment(duration),
    'stats.lastDone': admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, workoutId: workoutRef.id };
});

// ============================================================
// 🧹 DAILY CLEANUP (cron)
// ============================================================

exports.dailyCleanup = functions.pubsub
  .schedule('every day 03:00')
  .timeZone('Europe/Paris')
  .onRun(async () => {
    // Nettoyer les rate limits expirés
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const expired = await db.collection('rateLimits')
      .where('windowStart', '<', cutoff).get();

    const batch = db.batch();
    expired.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    console.log(`✓ Cleanup : ${expired.size} rate limits supprimés`);
  });

// ============================================================
// 👑 SET USER ROLE (admin uniquement)
// ============================================================

exports.setUserRole = functions.https.onCall(async (data, context) => {
  const { uid: callerUid } = requireAuth(context);
  await requireAdmin(callerUid);

  const { targetUid, role } = data;
  if (!['user', 'premium', 'admin'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Rôle invalide');
  }

  await db.collection('users').doc(targetUid).update({ role });
  await auth.setCustomUserClaims(targetUid, { role });

  // Log admin
  await db.collection('adminLogs').add({
    action: 'setUserRole',
    by: callerUid,
    target: targetUid,
    newRole: role,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

// ============================================================
// 🆕 ON USER CREATE : initialiser le profil
// ============================================================

exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  await db.collection('users').doc(user.uid).set({
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    role: 'user',
    subscription: {
      plan: 'free',
      status: 'free',
    },
    stats: {
      totalSessions: 0,
      totalMinutes: 0,
      streak: 0,
      bestStreak: 0,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✓ Nouveau user créé : ${user.uid}`);
});

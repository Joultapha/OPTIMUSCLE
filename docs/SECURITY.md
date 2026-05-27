# 🛡️ OPTIMUSCLE — Documentation Sécurité

> Document décrivant l'architecture sécurité du projet, les protections en place et les bonnes pratiques.

---

## 📋 Sommaire

1. [Modèle de menace](#modele-de-menace)
2. [Couches de sécurité](#couches-de-sécurité)
3. [Configuration Firebase](#configuration-firebase)
4. [Sécurité frontend](#sécurité-frontend)
5. [Cloud Functions (Blaze)](#cloud-functions)
6. [Stripe](#stripe)
7. [Checklist de déploiement](#checklist)
8. [En cas d'incident](#en-cas-dincident)

---

## 🎯 Modèle de menace

### Attaques que ce projet bloque

| Attaque | Protection |
|---------|------------|
| **XSS** (injection de scripts) | `createEl()` + `textContent` + CSP stricte |
| **Falsification stats** | Firebase Rules + validation client + Cloud Functions |
| **Vol de compte** | Firebase Auth + 2FA Google + rate limit |
| **Brute force login** | Backoff progressif client + rate limit serveur |
| **Bots/spam** | Honeypot timing + reCAPTCHA App Check |
| **Abus quota** | Rate limit client + serveur + validation taille |
| **Injection** (URLs malveillantes) | `sanitizeUrl()` qui bloque `javascript:`, `data:` |
| **Corruption localStorage** | `safeGet()` avec validation + namespace |
| **Modification rôle/abonnement** | Firebase Rules `".write": false` + Cloud Function only |
| **Triche stats** | Validation progression réaliste dans Firestore rules |

### Limitations connues

⚠️ Ce qui n'est PAS protégé (et pourquoi) :

- **Reverse engineering du code client** : impossible à empêcher (web public). C'est OK : aucun secret n'est dans le code.
- **Triche locale (localStorage)** : un user peut éditer ses propres données dans le navigateur. C'est OK : ses stats Firebase sont validées séparément par les rules.
- **Coût Firebase si attaque DDoS** : nécessite App Check (recommandé en prod, voir Cloud Functions).

---

## 🏗️ Couches de sécurité

```
┌─────────────────────────────────────────┐
│  1. HTTPS + CSP + HSTS (transport)      │  ← Headers Netlify/Firebase Hosting
├─────────────────────────────────────────┤
│  2. Validation côté client (UX)         │  ← validation.js + sanitize.js
├─────────────────────────────────────────┤
│  3. Rate limiting client (anti-bug)     │  ← rateLimit.js
├─────────────────────────────────────────┤
│  4. Firebase Auth (identité)            │  ← auth.js + 2FA
├─────────────────────────────────────────┤
│  5. Firebase Rules (autorisation)       │  ← database.rules.json ⭐ CRITIQUE
├─────────────────────────────────────────┤
│  6. Cloud Functions (validation forte)  │  ← functions/index.js (Blaze)
└─────────────────────────────────────────┘
```

**La couche 5 (Rules) est la PLUS CRITIQUE.** Sans elle, n'importe qui peut tout lire/modifier.

---

## 🔥 Configuration Firebase

### Déployer les rules

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init (depuis le dossier optimuscle-v2)
firebase init
# Sélectionne : Database, Firestore (optionnel), Storage, Hosting

# Déployer SEULEMENT les rules
firebase deploy --only database
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Tester les rules

Firebase Console → Realtime Database → onglet "Rules" → bouton **"Rules Playground"**.

Test à faire :
- ✅ User A peut lire/écrire `/users/A/state`
- ❌ User A ne peut PAS lire `/users/B/state`
- ❌ User A ne peut PAS modifier `/users/A/role`
- ❌ Lecture publique de `/users` → bloquée

### Activer App Check (recommandé)

App Check empêche les requêtes Firebase venant d'ailleurs que ton domaine (anti-scraping, anti-bot).

1. Firebase Console → **App Check**
2. Active **reCAPTCHA v3** pour le web
3. Ajoute le code dans `app.js` :

```js
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app-check.js";

initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaV3Provider('VOTRE_SITE_KEY_RECAPTCHA'),
  isTokenAutoRefreshEnabled: true
});
```

---

## 🚫 Sécurité Frontend

### Règle d'or anti-XSS

**JAMAIS** :
```js
el.innerHTML = userInput; // ❌ DANGEREUX
el.innerHTML = `<div>${data.name}</div>`; // ❌ DANGEREUX
```

**TOUJOURS** :
```js
import { createEl } from './utils/sanitize.js';

const el = createEl('div', { text: userInput }); // ✅ SAFE
container.appendChild(el);
```

### URLs externes

```js
import { sanitizeUrl } from './utils/sanitize.js';

const safe = sanitizeUrl(userProvidedUrl);
if (safe) img.src = safe; // bloque javascript:, data:, etc.
```

### localStorage

```js
import { safeGet, safeSet } from './utils/storage.js';

safeSet('key', value);                          // ✅ avec namespace
safeGet('key', { validator: validateState });   // ✅ avec validation
```

### Validation

Toute donnée entrante (formulaire, Firebase, URL) doit passer par `validation.js` :

```js
import { validateProfile } from './utils/validation.js';

const result = validateProfile(data);
if (!result.ok) {
  console.error(result.error);
  return;
}
```

---

## ☁️ Cloud Functions

> Nécessite plan **Blaze** (pay-as-you-go, gratuit jusqu'à 2M invocations/mois).

### Déployer

```bash
cd functions
npm install
cd ..

# Configurer les secrets Stripe
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Déployer
firebase deploy --only functions
```

### Functions disponibles

| Function | Type | Description |
|----------|------|-------------|
| `createCheckoutSession` | Callable | Crée une session Stripe |
| `stripeWebhook` | HTTP | Reçoit les events Stripe |
| `validateWorkout` | Callable | Valide une séance (anti-triche) |
| `dailyCleanup` | Schedule | Nettoie les vieux rate limits |
| `setUserRole` | Callable | Admin seulement |
| `onUserCreate` | Trigger | Init user à l'inscription |

---

## 💳 Stripe

### Configuration

1. Crée un compte sur https://stripe.com
2. Récupère tes clés :
   - **Publishable Key** (`pk_...`) → dans `js/saas/stripe.js`
   - **Secret Key** (`sk_...`) → dans `firebase functions:secrets:set STRIPE_SECRET_KEY`
3. Crée tes produits/prix sur https://dashboard.stripe.com/products
4. Configure le webhook :
   - URL : `https://us-central1-PROJECT.cloudfunctions.net/stripeWebhook`
   - Events : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Récupère le **signing secret** (`whsec_...`) → dans `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`

### Test en mode test

Stripe fournit des numéros de carte de test :
- `4242 4242 4242 4242` (succès)
- `4000 0000 0000 0002` (refus)

---

## ✅ Checklist de déploiement

Avant de mettre en production :

### Firebase
- [ ] Rules Realtime DB déployées et testées
- [ ] Rules Firestore déployées (si utilisé)
- [ ] Rules Storage déployées
- [ ] App Check activé avec reCAPTCHA v3
- [ ] Domaines autorisés dans Authentication
- [ ] Provider Email + Google activés
- [ ] Budget Firebase configuré (alertes)

### Frontend
- [ ] Plus aucun `innerHTML` avec données dynamiques
- [ ] CSP testée (pas d'erreurs console)
- [ ] HTTPS forcé (HSTS)
- [ ] Validation activée sur tous les formulaires
- [ ] Pas de clés secrètes dans le code

### Backend (si Blaze)
- [ ] Cloud Functions déployées
- [ ] Secrets configurés (Stripe)
- [ ] Webhook Stripe testé
- [ ] Logs activés et monitorés
- [ ] Quotas configurés

### Légal
- [ ] CGU rédigées et accessibles
- [ ] Politique de confidentialité (RGPD)
- [ ] Page "Supprimer mon compte" disponible
- [ ] Cookie consent (si applicable)

---

## 🚨 En cas d'incident

### Compte compromis
1. Firebase Console → Authentication → trouve le user → **Disable**
2. Vérifier les logs `users/UID/` pour activité suspecte
3. Si attaque massive : suspendre l'auth Google le temps d'investiguer

### Rules trop permissives détectées
1. Déployer immédiatement des rules `".read/.write": false` partout
2. Identifier le scope de la fuite
3. Corriger les rules
4. Notifier les utilisateurs si données sensibles exposées (RGPD < 72h)

### DDoS Firebase
1. Activer App Check immédiatement
2. Réduire les quotas dans Firebase Console
3. Bloquer les IPs offensives via Cloud Armor (si Blaze)

### Bug critique en prod
1. Rollback via Netlify (1 clic → version précédente)
2. Hotfix dans une branche, deploy, test, merge

---

## 📞 Contact sécurité

Pour reporter une vulnérabilité : **security@optimuscle.com** (à configurer)

Programme de bug bounty : pas pour l'instant, mais ouvert à des reports responsables.

# 📝 Changelog OPTIMUSCLE

## v2.0.0 — Audit sécurité & SaaS architecture (2026-05-18)

### 🛡️ Sécurité
- ➕ **Firebase Rules strictes** (`database.rules.json`, `firestore.rules`, `storage.rules`)
- ➕ Module **`sanitize.js`** : `createEl()`, `escapeHtml()`, `sanitizeUrl()` — bloque toutes les XSS
- ➕ Module **`validation.js`** : schemas stricts pour toutes les données
- ➕ Module **`rateLimit.js`** : protection anti-spam, anti-brute force
- ➕ Module **`storage.js`** : localStorage sécurisé avec namespace + TTL
- 🔄 **Refactor complet `ui.js`** : suppression de TOUS les `innerHTML` dangereux → `createEl()`
- 🔄 **Refactor `auth.js`** : rate limit + anti-bot timing + messages d'erreur safe
- ➕ **CSP stricte** dans le HTML (Content Security Policy)
- ➕ **Headers de sécurité** Firebase Hosting (HSTS, X-Frame-Options...)
- ✅ Plus d'exposition d'erreurs Firebase brutes (fuite d'info)
- ✅ Validation timing anti-bot (formulaire rempli en <1.2s = bloqué)

### 💎 SaaS / Freemium
- ➕ Module **`subscription.js`** : système de plans (free/premium_monthly/yearly/lifetime)
- ➕ Module **`stripe.js`** : intégration Stripe Checkout prête (mode démo + prod)
- ➕ Fonction `enforceFreemiumLimits()` : limite séances selon le plan
- ➕ Fonction `filterHistoryByPlan()` : historique 30j gratuit / 365j premium
- ➕ Système de rôles : `user`, `premium`, `admin`
- ➕ Upsell premium contextuel dans l'UI

### ☁️ Cloud Functions (Blaze-ready)
- ➕ `createCheckoutSession` : crée session Stripe
- ➕ `stripeWebhook` : reçoit events Stripe (signature vérifiée)
- ➕ `validateWorkout` : valide une séance côté serveur (anti-triche)
- ➕ `dailyCleanup` : cron pour nettoyer les rate limits
- ➕ `setUserRole` : admin uniquement
- ➕ `onUserCreate` : init automatique d'un nouveau profil

### 🏗️ Architecture
- 🔄 Refactor en 4 dossiers : `core/`, `utils/`, `saas/`, `features/`
- ➕ State management amélioré (`getState()` au lieu d'import direct)
- ➕ Save debounced (800ms) pour économiser Firebase
- ➕ `saveImmediate()` pour cas critiques
- ➕ Migration auto des anciennes clés localStorage

### 📚 Documentation
- ➕ `docs/SECURITY.md` complet
- ➕ `docs/CHANGELOG.md`
- ➕ Commentaires JSDoc dans tous les fichiers
- 🔄 `README.md` mis à jour

### ⚡ Performance
- ✅ Lazy loading de Stripe.js (chargé seulement au checkout)
- ✅ Debounce des saves (économie Firebase quotas)
- ✅ Cache 1 an pour CSS/JS via headers
- ✅ `firebase-app-check` ready

### 🐛 Bugs corrigés
- ✅ Possible fuite memory dans les onload/onerror des GIFs
- ✅ Validation timing des dates (refuse les dates futures)
- ✅ Validation des inputs onboarding (anti-injection dataset)
- ✅ Gestion erreur "compte déjà existant" (avant exposait email)
- ✅ Possible spam de saves (corrigé avec debounce)

---

## v1.0.0 — Version initiale (2026-05-17)
- 🚀 Migration FITCOACH → OPTIMUSCLE
- ➕ Firebase Auth (Google + Email)
- ➕ Firebase Realtime Database
- ➕ Structure modulaire (10 fichiers JS)
- ➕ GIFs animés des exercices
- ➕ Responsive design (mobile/tablette/desktop)
- ➕ Sidebar rétractable

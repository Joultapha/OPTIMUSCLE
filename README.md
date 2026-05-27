# OPTIMUSCLE v6 — Premium + Landing + Theme + Sidebar

## 🆕 Nouveautés v6

### 🚀 Landing Page conversion-max
- Hero impactant avec gradient + photo athlète
- Trust badges ("48k+ athlètes", "★★★★★")
- 6 features avec icônes
- Testimonial highlight
- Section urgency (offre beta gratuite)
- CTA final puissant
- Footer minimaliste

### 🌓 Système de thème
- **Auto** (suit l'OS) par défaut
- **Light** mode complet
- **Dark** mode (existant)
- Switch dans la sidebar
- Persistence localStorage

### ☰ Menu rétractable (Sidebar)
- Bouton hamburger dans le header
- Sidebar avec avatar utilisateur
- Navigation complète (Accueil, Stats, Badges, Profil)
- Switch theme intégré
- Settings + Logout
- Fermeture : clic backdrop, échap, ou X

### 🖼️ Fix image hero
- `background-position: center 25%` → ne coupe plus les têtes
- Hauteur réduite sur desktop/tablette (proportions équilibrées)

## 🏗️ Architecture

```
js/
├── core/
│   ├── appState.js   ⭐ Source unique + gère landing
│   ├── config.js
│   ├── data.js
│   ├── program.js
│   ├── social.js
│   ├── state.js
│   └── timer.js
├── features/
│   ├── auth.js
│   ├── onboarding.js
│   ├── sidebar.js    🆕
│   ├── theme.js      🆕
│   └── ui.js
├── saas/
│   ├── stripe.js
│   ├── subscription.js
│   └── xp.js
└── utils/
    └── ...

css/
├── variables.css
├── base.css
├── components.css
├── pages.css
├── workout.css
├── responsive.css
├── view-system.css   ⭐ Filtre strict
├── themes.css        🆕 Dark/Light/Auto
├── sidebar.css       🆕 Menu rétractable
└── landing.css       🆕 Landing page
```

## 🎯 Flow utilisateur

```
NOUVEAU VISITEUR :
  loading → LANDING → (clique "Commencer") → login → onboarding → dashboard

VISITEUR DÉJÀ VENU (cache localStorage) :
  loading → login → onboarding → dashboard

USER CONNECTÉ EXISTANT :
  loading → dashboard (direct)
```

## 🧪 Debug

```js
__appState.get()         // état complet
__appState.view()        // view actuelle
localStorage.removeItem('hasSeenLanding')  // re-voir la landing
localStorage.removeItem('optimuscle_theme') // reset thème
```

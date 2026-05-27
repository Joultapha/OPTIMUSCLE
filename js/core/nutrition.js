/* ============================================================
   OPTIMUSCLE — Module Nutrition
   ============================================================
   - Base d'aliments locale (100 communs)
   - Recherche OpenFoodFacts (API gratuite, sans clé)
   - Calculs TDEE / macros
   - Helpers stockage repas
============================================================ */

// Iconly Pro-style SVG icon helper
const _s = (d) => `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

// ============================================================
// BASE D'ALIMENTS LOCAUX (top 100 communs)
// Valeurs : kcal, protéines (g), glucides (g), lipides (g) PAR 100g
// ============================================================
export const FOOD_DB = {
  // Protéines animales
  poulet_blanc:   { name: "Poulet (blanc)",      emoji: _s('<circle cx="14" cy="8" r="5"/><path d="M10 12L4 18"/><circle cx="3.5" cy="18.5" r="1.5"/>'), kcal: 165, prot: 31, carb: 0,  fat: 3.6 },
  poulet_cuisse:  { name: "Cuisse de poulet",    emoji: _s('<circle cx="14" cy="8" r="5"/><path d="M10 12L4 18"/><circle cx="3.5" cy="18.5" r="1.5"/>'), kcal: 209, prot: 26, carb: 0,  fat: 11  },
  boeuf_steak:    { name: "Steak de bœuf",       emoji: _s('<ellipse cx="12" cy="12" rx="8" ry="6"/><path d="M9 10c1-1 2-1 3 0"/>'), kcal: 250, prot: 26, carb: 0,  fat: 17  },
  boeuf_hache:    { name: "Bœuf haché (5%)",     emoji: _s('<ellipse cx="12" cy="12" rx="8" ry="6"/><path d="M9 10c1-1 2-1 3 0"/>'), kcal: 137, prot: 21, carb: 0,  fat: 5   },
  porc_filet:     { name: "Filet de porc",       emoji: _s('<path d="M3 7c2 0 2 4 4 4s2-4 4-4 2 4 4 4 2-4 4-4"/><path d="M3 17c2 0 2-4 4-4s2 4 4 4 2-4 4-4 2 4 4 4"/>'), kcal: 143, prot: 26, carb: 0,  fat: 4   },
  saumon:         { name: "Saumon",              emoji: _s('<path d="M2 12c4-5 10-5 14-2l4-4v12l-4-4c-4 3-10 3-14-2z"/><circle cx="8" cy="11" r="1"/>'), kcal: 208, prot: 20, carb: 0,  fat: 13  },
  thon:           { name: "Thon",                emoji: _s('<path d="M2 12c4-5 10-5 14-2l4-4v12l-4-4c-4 3-10 3-14-2z"/><circle cx="8" cy="11" r="1"/>'), kcal: 144, prot: 30, carb: 0,  fat: 1   },
  cabillaud:      { name: "Cabillaud",           emoji: _s('<path d="M2 12c4-5 10-5 14-2l4-4v12l-4-4c-4 3-10 3-14-2z"/><circle cx="8" cy="11" r="1"/>'), kcal: 82,  prot: 18, carb: 0,  fat: 0.7 },
  crevettes:      { name: "Crevettes",           emoji: _s('<path d="M4 16c0-5 4-8 8-8"/><path d="M4 16c0 2 2 4 4 4"/><path d="M12 8l4-4"/><path d="M12 8l3 3"/>'), kcal: 99,  prot: 24, carb: 0,  fat: 0.3 },
  oeuf:           { name: "Œuf entier",          emoji: _s('<path d="M12 2C8 2 5 6 5 11a7 7 0 0 0 14 0c0-5-3-9-7-9z"/>'), kcal: 155, prot: 13, carb: 1,  fat: 11  },
  blanc_oeuf:     { name: "Blanc d'œuf",         emoji: _s('<path d="M12 2C8 2 5 6 5 11a7 7 0 0 0 14 0c0-5-3-9-7-9z"/>'), kcal: 52,  prot: 11, carb: 0.7, fat: 0  },

  // Produits laitiers
  fromage_blanc:  { name: "Fromage blanc 0%",    emoji: _s('<path d="M8 2h8l-1 14H9L8 2z"/><path d="M9 16l1 4h4l1-4"/><line x1="12" y1="20" x2="12" y2="22"/>'), kcal: 45,  prot: 8,  carb: 4,  fat: 0   },
  yaourt_grec:    { name: "Yaourt grec",         emoji: _s('<path d="M8 2h8l-1 14H9L8 2z"/><path d="M9 16l1 4h4l1-4"/><line x1="12" y1="20" x2="12" y2="22"/>'), kcal: 100, prot: 9,  carb: 4,  fat: 5   },
  skyr:           { name: "Skyr",                emoji: _s('<path d="M8 2h8l-1 14H9L8 2z"/><path d="M9 16l1 4h4l1-4"/><line x1="12" y1="20" x2="12" y2="22"/>'), kcal: 63,  prot: 11, carb: 4,  fat: 0.2 },
  lait_demi:      { name: "Lait demi-écrémé",    emoji: _s('<path d="M8 2h8l-1 14H9L8 2z"/><path d="M9 16l1 4h4l1-4"/><line x1="12" y1="20" x2="12" y2="22"/>'), kcal: 47,  prot: 3.3, carb: 4.8, fat: 1.6 },
  parmesan:       { name: "Parmesan",            emoji: _s('<path d="M3 18L21 6v12H3z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="13" r="1.5"/>'), kcal: 431, prot: 38, carb: 4,  fat: 29  },
  mozzarella:     { name: "Mozzarella",          emoji: _s('<path d="M3 18L21 6v12H3z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="13" r="1.5"/>'), kcal: 280, prot: 28, carb: 3,  fat: 17  },
  feta:           { name: "Feta",                emoji: _s('<path d="M3 18L21 6v12H3z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="13" r="1.5"/>'), kcal: 264, prot: 14, carb: 4,  fat: 21  },

  // Féculents
  riz_blanc:      { name: "Riz blanc cuit",      emoji: _s('<path d="M3 12h18c0 5-4 9-9 9s-9-4-9-9z"/><path d="M3 12c0-2 4-3 9-3s9 1 9 3"/>'), kcal: 130, prot: 2.7, carb: 28, fat: 0.3 },
  riz_complet:    { name: "Riz complet cuit",    emoji: _s('<path d="M3 12h18c0 5-4 9-9 9s-9-4-9-9z"/><path d="M3 12c0-2 4-3 9-3s9 1 9 3"/>'), kcal: 112, prot: 2.6, carb: 23, fat: 0.9 },
  pates:          { name: "Pâtes cuites",        emoji: _s('<path d="M3 12h18c0 5-4 9-9 9s-9-4-9-9z"/><path d="M12 3v6"/><path d="M10 3v4"/><path d="M14 3v4"/>'), kcal: 131, prot: 5,   carb: 25, fat: 1.1 },
  pates_complet:  { name: "Pâtes complètes",     emoji: _s('<path d="M3 12h18c0 5-4 9-9 9s-9-4-9-9z"/><path d="M12 3v6"/><path d="M10 3v4"/><path d="M14 3v4"/>'), kcal: 124, prot: 5,   carb: 26, fat: 1.1 },
  pomme_terre:    { name: "Pomme de terre cuite", emoji: _s('<ellipse cx="12" cy="13" rx="7" ry="5"/><path d="M9 10c1 0 2 .5 2 1"/>'), kcal: 87, prot: 2,   carb: 20, fat: 0.1 },
  patate_douce:   { name: "Patate douce",        emoji: _s('<ellipse cx="12" cy="13" rx="7" ry="5"/><path d="M9 10c1 0 2 .5 2 1"/>'), kcal: 86,  prot: 1.6, carb: 20, fat: 0.1 },
  quinoa:         { name: "Quinoa cuit",         emoji: _s('<path d="M12 22V4"/><path d="M8 6l4-2 4 2"/><path d="M7 10l5-2 5 2"/><path d="M8 14l4-2 4 2"/>'), kcal: 120, prot: 4.4, carb: 21, fat: 1.9 },
  flocons_avoine: { name: "Flocons d'avoine",    emoji: _s('<path d="M12 22V4"/><path d="M8 6l4-2 4 2"/><path d="M7 10l5-2 5 2"/><path d="M8 14l4-2 4 2"/>'), kcal: 379, prot: 13,  carb: 67, fat: 7   },
  pain_complet:   { name: "Pain complet",        emoji: _s('<path d="M4 18V9c0-4 3-7 8-7s8 3 8 7v9H4z"/><path d="M4 14h16"/>'), kcal: 247, prot: 13,  carb: 41, fat: 3.4 },
  pain_blanc:     { name: "Pain blanc",          emoji: _s('<path d="M4 18V9c0-4 3-7 8-7s8 3 8 7v9H4z"/><path d="M4 14h16"/>'), kcal: 265, prot: 9,   carb: 49, fat: 3.2 },
  semoule:        { name: "Semoule cuite",       emoji: _s('<path d="M12 22V4"/><path d="M8 6l4-2 4 2"/><path d="M7 10l5-2 5 2"/><path d="M8 14l4-2 4 2"/>'), kcal: 112, prot: 4,   carb: 23, fat: 0.2 },

  // Légumineuses
  lentilles:      { name: "Lentilles cuites",    emoji: _s('<ellipse cx="8" cy="10" rx="3" ry="4.5"/><ellipse cx="16" cy="10" rx="3" ry="4.5"/><ellipse cx="12" cy="17" rx="3" ry="3.5"/>'), kcal: 116, prot: 9,   carb: 20, fat: 0.4 },
  pois_chiches:   { name: "Pois chiches",        emoji: _s('<ellipse cx="8" cy="10" rx="3" ry="4.5"/><ellipse cx="16" cy="10" rx="3" ry="4.5"/><ellipse cx="12" cy="17" rx="3" ry="3.5"/>'), kcal: 164, prot: 9,   carb: 27, fat: 2.6 },
  haricots_rouges:{ name: "Haricots rouges",     emoji: _s('<ellipse cx="8" cy="10" rx="3" ry="4.5"/><ellipse cx="16" cy="10" rx="3" ry="4.5"/><ellipse cx="12" cy="17" rx="3" ry="3.5"/>'), kcal: 127, prot: 9,   carb: 23, fat: 0.5 },
  tofu:           { name: "Tofu",                emoji: _s('<path d="M3 8l9-5 9 5v8l-9 5-9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>'), kcal: 144, prot: 17,  carb: 3,  fat: 9   },

  // Légumes
  brocoli:        { name: "Brocoli",             emoji: _s('<circle cx="12" cy="7" r="5"/><path d="M12 12v8"/><path d="M8 20h8"/>'), kcal: 34,  prot: 2.8, carb: 7,  fat: 0.4 },
  haricots_verts: { name: "Haricots verts",      emoji: _s('<path d="M12 22V8"/><path d="M12 8c0-5 6-6 8-6-1 3-3 8-8 8z"/><path d="M12 8c0-5-6-6-8-6 1 3 3 8 8 8z"/>'), kcal: 31,  prot: 1.8, carb: 7,  fat: 0.2 },
  epinards:       { name: "Épinards",            emoji: _s('<path d="M12 22V8"/><path d="M12 8c0-5 6-6 8-6-1 3-3 8-8 8z"/><path d="M12 8c0-5-6-6-8-6 1 3 3 8 8 8z"/>'), kcal: 23,  prot: 2.9, carb: 3.6, fat: 0.4 },
  salade:         { name: "Salade verte",        emoji: _s('<path d="M3 12h18c0 5-4 9-9 9s-9-4-9-9z"/><path d="M8 8c1-2 3-2 4 0"/><path d="M13 7c1-2 3-2 4 0"/>'), kcal: 15,  prot: 1.4, carb: 2.9, fat: 0.2 },
  tomate:         { name: "Tomate",              emoji: _s('<circle cx="12" cy="13" r="7"/><path d="M12 6V3"/><path d="M9 5c1-2 5-2 6 0"/>'), kcal: 18,  prot: 0.9, carb: 3.9, fat: 0.2 },
  concombre:      { name: "Concombre",           emoji: _s('<rect x="9" y="2" width="6" height="20" rx="3"/><path d="M12 7v10"/>'), kcal: 16,  prot: 0.7, carb: 3.6, fat: 0.1 },
  carotte:        { name: "Carotte",             emoji: _s('<path d="M12 22l-5-14h10L12 22z"/><path d="M7 8c0-2 2-4 5-4s5 2 5 4"/>'), kcal: 41,  prot: 0.9, carb: 10, fat: 0.2 },
  poivron:        { name: "Poivron",             emoji: _s('<path d="M12 3v4"/><path d="M8 7h8l-1 10c0 2-2 3-3 3s-3-1-3-3L8 7z"/>'), kcal: 31,  prot: 1,   carb: 6,  fat: 0.3 },
  courgette:      { name: "Courgette",           emoji: _s('<rect x="9" y="2" width="6" height="20" rx="3"/><path d="M12 7v10"/>'), kcal: 17,  prot: 1.2, carb: 3.1, fat: 0.3 },
  aubergine:      { name: "Aubergine",           emoji: _s('<path d="M8 3c-3 2-4 6-3 10s4 7 7 7 5-3 5-7-2-8-5-10"/><path d="M8 3c1 1 3 1 4 0"/>'), kcal: 25,  prot: 1,   carb: 6,  fat: 0.2 },
  champignons:    { name: "Champignons",         emoji: _s('<path d="M4 14c0-5 3-9 8-9s8 4 8 9H4z"/><path d="M8 14v6h8v-6"/>'), kcal: 22,  prot: 3.1, carb: 3.3, fat: 0.3 },
  oignon:         { name: "Oignon",              emoji: _s('<circle cx="12" cy="14" r="7"/><path d="M12 7V3"/><path d="M9 4c0-1 1-2 3-2s3 1 3 2"/>'), kcal: 40,  prot: 1.1, carb: 9,  fat: 0.1 },
  ail:            { name: "Ail",                 emoji: _s('<path d="M12 2c-3 0-6 3-6 7 0 5 3 9 6 11 3-2 6-6 6-11 0-4-3-7-6-7z"/><path d="M12 6v14"/>'), kcal: 149, prot: 6.4, carb: 33, fat: 0.5 },

  // Fruits
  pomme:          { name: "Pomme",               emoji: _s('<path d="M12 3c-1-1-3-1-4 0-3 2-4 6-3 10s3 7 7 7 6-3 7-7 0-8-3-10c-1-1-3-1-4 0z"/><path d="M12 3V1"/><path d="M14 1c1 0 2 1 2 2"/>'), kcal: 52,  prot: 0.3, carb: 14, fat: 0.2 },
  banane:         { name: "Banane",              emoji: _s('<path d="M5 20c2-4 5-14 14-14"/><path d="M5 20c2-2 6-3 10-2"/><path d="M19 6c0-2-1-3-3-3"/>'), kcal: 89,  prot: 1.1, carb: 23, fat: 0.3 },
  orange:         { name: "Orange",              emoji: _s('<circle cx="12" cy="13" r="8"/><path d="M12 5V3"/><path d="M9 13c0-2 1-3 3-3"/>'), kcal: 47,  prot: 0.9, carb: 12, fat: 0.1 },
  fraise:         { name: "Fraises",             emoji: _s('<circle cx="12" cy="14" r="6"/><path d="M12 8V4"/><path d="M9 5c1-1 3-1 6 0"/>'), kcal: 33,  prot: 0.7, carb: 8,  fat: 0.3 },
  myrtilles:      { name: "Myrtilles",           emoji: _s('<circle cx="12" cy="14" r="6"/><path d="M12 8V4"/><path d="M9 5c1-1 3-1 6 0"/>'), kcal: 57,  prot: 0.7, carb: 14, fat: 0.3 },
  raisin:         { name: "Raisin",              emoji: _s('<circle cx="9" cy="10" r="3"/><circle cx="15" cy="10" r="3"/><circle cx="12" cy="16" r="3"/><path d="M12 7V3"/>'), kcal: 67,  prot: 0.6, carb: 17, fat: 0.4 },
  ananas:         { name: "Ananas",              emoji: _s('<ellipse cx="12" cy="13" rx="7" ry="8"/><path d="M12 5V2"/><path d="M9 3c2-1 4-1 6 0"/>'), kcal: 50,  prot: 0.5, carb: 13, fat: 0.1 },
  mangue:         { name: "Mangue",              emoji: _s('<ellipse cx="12" cy="13" rx="7" ry="8"/><path d="M12 5V2"/><path d="M9 3c2-1 4-1 6 0"/>'), kcal: 60,  prot: 0.8, carb: 15, fat: 0.4 },
  kiwi:           { name: "Kiwi",                emoji: _s('<circle cx="12" cy="13" r="7"/><path d="M12 6V3"/><path d="M12 13l-3-3"/><path d="M12 13l3-3"/><path d="M12 13v4"/>'), kcal: 61,  prot: 1.1, carb: 15, fat: 0.5 },
  avocat:         { name: "Avocat",              emoji: _s('<path d="M12 2C8 2 5 7 5 13s3 9 7 9 7-3 7-9S16 2 12 2z"/><circle cx="12" cy="14" r="3"/>'), kcal: 160, prot: 2,   carb: 9,  fat: 15  },

  // Lipides bons
  amandes:        { name: "Amandes",             emoji: _s('<path d="M4 14c0-4 3-8 8-10 5 2 8 6 8 10s-3 6-8 6-8-2-8-6z"/><path d="M12 4v8"/>'), kcal: 579, prot: 21,  carb: 22, fat: 50  },
  noix:           { name: "Noix",                emoji: _s('<path d="M4 14c0-4 3-8 8-10 5 2 8 6 8 10s-3 6-8 6-8-2-8-6z"/><path d="M12 4v8"/>'), kcal: 654, prot: 15,  carb: 14, fat: 65  },
  noisettes:      { name: "Noisettes",           emoji: _s('<path d="M4 14c0-4 3-8 8-10 5 2 8 6 8 10s-3 6-8 6-8-2-8-6z"/><path d="M12 4v8"/>'), kcal: 628, prot: 15,  carb: 17, fat: 61  },
  beurre_arachide:{ name: "Beurre de cacahuète", emoji: _s('<path d="M4 14c0-4 3-8 8-10 5 2 8 6 8 10s-3 6-8 6-8-2-8-6z"/><path d="M12 4v8"/>'), kcal: 588, prot: 25,  carb: 20, fat: 50  },
  huile_olive:    { name: "Huile d'olive",       emoji: _s('<ellipse cx="12" cy="12" rx="5" ry="7"/><path d="M12 5V2"/><path d="M10 2h4"/>'), kcal: 884, prot: 0,   carb: 0,  fat: 100 },
  beurre:         { name: "Beurre",              emoji: _s('<rect x="4" y="8" width="16" height="10" rx="2"/><path d="M4 12h16"/><path d="M8 8V5h8v3"/>'), kcal: 717, prot: 0.9, carb: 0.1, fat: 81 },

  // Snacks / autres
  chocolat_noir:  { name: "Chocolat noir 70%",   emoji: _s('<rect x="3" y="6" width="18" height="14" rx="2"/><line x1="9" y1="6" x2="9" y2="20"/><line x1="15" y1="6" x2="15" y2="20"/><line x1="3" y1="12" x2="21" y2="12"/>'), kcal: 598, prot: 7.8, carb: 46, fat: 43  },
  miel:           { name: "Miel",                emoji: _s('<rect x="5" y="8" width="14" height="12" rx="2"/><path d="M5 12h14"/><path d="M8 8V5h8v3"/>'), kcal: 304, prot: 0.3, carb: 82, fat: 0   },
  proteine_whey:  { name: "Whey (1 scoop 30g)",  emoji: _s('<line x1="2" y1="12" x2="22" y2="12"/><rect x="4" y="8" width="4" height="8" rx="1"/><rect x="16" y="8" width="4" height="8" rx="1"/>'), kcal: 120, prot: 24,  carb: 3,  fat: 1.5, perPortion: true, portionG: 30 },
  barre_proteinee:{ name: "Barre protéinée",     emoji: _s('<rect x="3" y="6" width="18" height="14" rx="2"/><line x1="9" y1="6" x2="9" y2="20"/><line x1="15" y1="6" x2="15" y2="20"/><line x1="3" y1="12" x2="21" y2="12"/>'), kcal: 200, prot: 20,  carb: 18, fat: 7,   perPortion: true, portionG: 60 },

  // Boissons (par 100ml)
  cafe:           { name: "Café noir",           emoji: _s('<path d="M6 4h10l-1 12H7L6 4z"/><path d="M16 8h2a2 2 0 0 1 0 4h-2"/><line x1="8" y1="18" x2="14" y2="18"/>'), kcal: 2,   prot: 0.3, carb: 0,  fat: 0   },
  jus_orange:     { name: "Jus d'orange",        emoji: _s('<path d="M6 4h10l-1 14H7L6 4z"/><path d="M16 8h2a2 2 0 0 1 0 4h-1"/><path d="M10 4V1"/>'), kcal: 45,  prot: 0.7, carb: 10, fat: 0.2 },
  coca_light:     { name: "Coca Zéro/Light",     emoji: _s('<path d="M6 4h10l-1 14H7L6 4z"/><path d="M16 8h2a2 2 0 0 1 0 4h-1"/><path d="M10 4V1"/>'), kcal: 0.4, prot: 0,   carb: 0,  fat: 0   },
  biere:          { name: "Bière (5°)",          emoji: _s('<path d="M7 4h8l-1 14H8L7 4z"/><path d="M15 8h2a2 2 0 0 1 0 4h-1"/><path d="M8 18h6"/>'), kcal: 43,  prot: 0.5, carb: 3.6, fat: 0  },
  vin_rouge:      { name: "Vin rouge",           emoji: _s('<path d="M8 2h8l-3 10v6"/><path d="M5 18h14"/><path d="M13 12l3-10"/>'), kcal: 85,  prot: 0.1, carb: 2.6, fat: 0  },
};

// ============================================================
// RECHERCHE OPENFOODFACTS (API gratuite, sans clé)
// ============================================================

/**
 * Cherche des aliments via OpenFoodFacts.
 * @param {string} query
 * @returns {Promise<Array>} liste d'aliments
 */
export async function searchOpenFoodFacts(query) {
  if (!query || query.length < 2) return [];

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,product_name_fr,nutriments,brands,image_small_url,code`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products) return [];

    return data.products
      .filter(p => {
        const n = p.nutriments || {};
        return (p.product_name_fr || p.product_name) && n['energy-kcal_100g'];
      })
      .slice(0, 12)
      .map(p => {
        const n = p.nutriments || {};
        return {
          id: 'off_' + p.code,
          name: (p.product_name_fr || p.product_name || 'Produit').trim().slice(0, 80),
          brand: (p.brands || '').split(',')[0].trim().slice(0, 50),
          emoji: _s('<circle cx="8" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><path d="M2 4h3l3 12h10"/><path d="M5 4l2 8h11"/>'),
          image: p.image_small_url,
          kcal: Math.round(n['energy-kcal_100g'] || 0),
          prot: Math.round((n['proteins_100g'] || 0) * 10) / 10,
          carb: Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
          fat: Math.round((n['fat_100g'] || 0) * 10) / 10,
          source: 'openfoodfacts',
        };
      })
      .filter(p => p.kcal > 0); // exclure les produits sans kcal
  } catch (e) {
    console.warn('OpenFoodFacts search error:', e);
    return [];
  }
}

/**
 * Recherche dans la base locale.
 */
export function searchLocalFoods(query) {
  if (!query) return Object.entries(FOOD_DB).map(([id, f]) => ({ id, ...f, source: 'local' }));

  const q = query.toLowerCase().trim();
  return Object.entries(FOOD_DB)
    .filter(([id, f]) => f.name.toLowerCase().includes(q) || id.includes(q))
    .map(([id, f]) => ({ id, ...f, source: 'local' }));
}

// ============================================================
// CALCULS NUTRITION
// ============================================================

/**
 * Calcule le TDEE (Total Daily Energy Expenditure) en kcal/jour.
 * Formule Mifflin-St Jeor (la plus précise).
 *
 * @param {object} params - { weight (kg), height (cm), age, gender ('M'|'F'), activityLevel }
 * activityLevel : 'sedentary'|'light'|'moderate'|'active'|'very_active'
 */
export function calculateTDEE({ weight, height, age, gender, activityLevel = 'moderate' }) {
  // BMR (Basal Metabolic Rate)
  let bmr;
  if (gender === 'M') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Multiplicateurs d'activité
  const multipliers = {
    sedentary: 1.2,      // Bureau, peu d'exercice
    light: 1.375,        // 1-3 séances/sem
    moderate: 1.55,      // 3-5 séances/sem
    active: 1.725,       // 6-7 séances/sem
    very_active: 1.9,    // 2x/jour ou très physique
  };

  const tdee = bmr * (multipliers[activityLevel] || 1.55);
  return Math.round(tdee);
}

/**
 * Calcule les objectifs caloriques + macros selon l'objectif.
 *
 * @param {number} tdee
 * @param {string} goal - 'muscle' (surplus) | 'loss' (déficit) | 'endurance' | 'health' (maintien)
 * @param {number} weight - poids en kg pour calculer les protéines
 */
export function calculateMacros(tdee, goal, weight) {
  let targetKcal = tdee;
  let protPerKg = 1.6; // par défaut
  let fatPerKg = 0.8;

  switch (goal) {
    case 'muscle':
      targetKcal = Math.round(tdee + 300); // surplus modéré
      protPerKg = 2.0;
      fatPerKg = 0.8;
      break;
    case 'loss':
      targetKcal = Math.round(tdee - 400); // déficit modéré
      protPerKg = 2.2; // plus de prot en cut
      fatPerKg = 0.7;
      break;
    case 'endurance':
      targetKcal = tdee;
      protPerKg = 1.4;
      fatPerKg = 0.8;
      break;
    case 'health':
    default:
      targetKcal = tdee;
      protPerKg = 1.6;
      fatPerKg = 0.9;
      break;
  }

  const protein = Math.round(weight * protPerKg);          // g/jour
  const fat = Math.round(weight * fatPerKg);               // g/jour
  const kcalFromProt = protein * 4;
  const kcalFromFat = fat * 9;
  const kcalFromCarb = targetKcal - kcalFromProt - kcalFromFat;
  const carbs = Math.max(50, Math.round(kcalFromCarb / 4));

  return { kcal: targetKcal, protein, carbs, fat, tdee };
}

/**
 * Calcule les totaux d'une journée de repas.
 */
export function calculateDayTotals(meals) {
  if (!Array.isArray(meals)) return { kcal: 0, prot: 0, carb: 0, fat: 0 };

  return meals.reduce((tot, m) => ({
    kcal: tot.kcal + (m.kcal || 0),
    prot: tot.prot + (m.prot || 0),
    carb: tot.carb + (m.carb || 0),
    fat: tot.fat + (m.fat || 0),
  }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
}

/**
 * Calcule les valeurs nutritionnelles d'une portion.
 * @param {object} food - aliment avec valeurs pour 100g
 * @param {number} grams - quantité en grammes
 */
export function calculatePortion(food, grams) {
  const ratio = grams / 100;
  return {
    kcal: Math.round((food.kcal || 0) * ratio),
    prot: Math.round((food.prot || 0) * ratio * 10) / 10,
    carb: Math.round((food.carb || 0) * ratio * 10) / 10,
    fat: Math.round((food.fat || 0) * ratio * 10) / 10,
  };
}

/**
 * Retourne la clé du jour (YYYY-MM-DD) pour stocker les repas.
 */
export function getTodayKey() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// ============================================================
// CATÉGORIES DE REPAS
// ============================================================
export const MEAL_TYPES = [
  { id: 'breakfast', name: 'Petit-déjeuner', emoji: _s('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'), icon: 'sun' },
  { id: 'lunch',     name: 'Déjeuner',       emoji: _s('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'), icon: 'sun' },
  { id: 'snack',     name: 'Collation',      emoji: _s('<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="15" r="1" fill="currentColor"/>'), icon: 'cookie' },
  { id: 'dinner',    name: 'Dîner',          emoji: _s('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'), icon: 'moon' },
];

// ============================================================
// NIVEAUX D'ACTIVITÉ (pour le calcul TDEE)
// ============================================================
export const ACTIVITY_LEVELS = [
  { id: 'sedentary',   name: 'Sédentaire',         desc: 'Bureau, peu d\'exercice', multiplier: 1.2 },
  { id: 'light',       name: 'Légèrement actif',   desc: '1-3 séances/semaine',     multiplier: 1.375 },
  { id: 'moderate',    name: 'Modérément actif',   desc: '3-5 séances/semaine',     multiplier: 1.55 },
  { id: 'active',      name: 'Très actif',         desc: '6-7 séances/semaine',     multiplier: 1.725 },
  { id: 'very_active', name: 'Extrêmement actif',  desc: 'Sportif pro, 2x/jour',    multiplier: 1.9 },
];

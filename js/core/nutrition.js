/* ============================================================
   OPTIMUSCLE — Module Nutrition
   ============================================================
   - Base d'aliments locale (100 communs)
   - Recherche OpenFoodFacts (API gratuite, sans clé)
   - Calculs TDEE / macros
   - Helpers stockage repas
============================================================ */

// ============================================================
// BASE D'ALIMENTS LOCAUX (top 100 communs)
// Valeurs : kcal, protéines (g), glucides (g), lipides (g) PAR 100g
// ============================================================
export const FOOD_DB = {
  // Protéines animales
  poulet_blanc:   { name: "Poulet (blanc)",      emoji: "🍗", kcal: 165, prot: 31, carb: 0,  fat: 3.6 },
  poulet_cuisse:  { name: "Cuisse de poulet",    emoji: "🍗", kcal: 209, prot: 26, carb: 0,  fat: 11  },
  boeuf_steak:    { name: "Steak de bœuf",       emoji: "🥩", kcal: 250, prot: 26, carb: 0,  fat: 17  },
  boeuf_hache:    { name: "Bœuf haché (5%)",     emoji: "🥩", kcal: 137, prot: 21, carb: 0,  fat: 5   },
  porc_filet:     { name: "Filet de porc",       emoji: "🥓", kcal: 143, prot: 26, carb: 0,  fat: 4   },
  saumon:         { name: "Saumon",              emoji: "🐟", kcal: 208, prot: 20, carb: 0,  fat: 13  },
  thon:           { name: "Thon",                emoji: "🐟", kcal: 144, prot: 30, carb: 0,  fat: 1   },
  cabillaud:      { name: "Cabillaud",           emoji: "🐟", kcal: 82,  prot: 18, carb: 0,  fat: 0.7 },
  crevettes:      { name: "Crevettes",           emoji: "🦐", kcal: 99,  prot: 24, carb: 0,  fat: 0.3 },
  oeuf:           { name: "Œuf entier",          emoji: "🥚", kcal: 155, prot: 13, carb: 1,  fat: 11  },
  blanc_oeuf:     { name: "Blanc d'œuf",         emoji: "🥚", kcal: 52,  prot: 11, carb: 0.7, fat: 0  },

  // Produits laitiers
  fromage_blanc:  { name: "Fromage blanc 0%",    emoji: "🥛", kcal: 45,  prot: 8,  carb: 4,  fat: 0   },
  yaourt_grec:    { name: "Yaourt grec",         emoji: "🥛", kcal: 100, prot: 9,  carb: 4,  fat: 5   },
  skyr:           { name: "Skyr",                emoji: "🥛", kcal: 63,  prot: 11, carb: 4,  fat: 0.2 },
  lait_demi:      { name: "Lait demi-écrémé",    emoji: "🥛", kcal: 47,  prot: 3.3, carb: 4.8, fat: 1.6 },
  parmesan:       { name: "Parmesan",            emoji: "🧀", kcal: 431, prot: 38, carb: 4,  fat: 29  },
  mozzarella:     { name: "Mozzarella",          emoji: "🧀", kcal: 280, prot: 28, carb: 3,  fat: 17  },
  feta:           { name: "Feta",                emoji: "🧀", kcal: 264, prot: 14, carb: 4,  fat: 21  },

  // Féculents
  riz_blanc:      { name: "Riz blanc cuit",      emoji: "🍚", kcal: 130, prot: 2.7, carb: 28, fat: 0.3 },
  riz_complet:    { name: "Riz complet cuit",    emoji: "🍚", kcal: 112, prot: 2.6, carb: 23, fat: 0.9 },
  pates:          { name: "Pâtes cuites",        emoji: "🍝", kcal: 131, prot: 5,   carb: 25, fat: 1.1 },
  pates_complet:  { name: "Pâtes complètes",     emoji: "🍝", kcal: 124, prot: 5,   carb: 26, fat: 1.1 },
  pomme_terre:    { name: "Pomme de terre cuite", emoji: "🥔", kcal: 87, prot: 2,   carb: 20, fat: 0.1 },
  patate_douce:   { name: "Patate douce",        emoji: "🍠", kcal: 86,  prot: 1.6, carb: 20, fat: 0.1 },
  quinoa:         { name: "Quinoa cuit",         emoji: "🌾", kcal: 120, prot: 4.4, carb: 21, fat: 1.9 },
  flocons_avoine: { name: "Flocons d'avoine",    emoji: "🌾", kcal: 379, prot: 13,  carb: 67, fat: 7   },
  pain_complet:   { name: "Pain complet",        emoji: "🍞", kcal: 247, prot: 13,  carb: 41, fat: 3.4 },
  pain_blanc:     { name: "Pain blanc",          emoji: "🍞", kcal: 265, prot: 9,   carb: 49, fat: 3.2 },
  semoule:        { name: "Semoule cuite",       emoji: "🌾", kcal: 112, prot: 4,   carb: 23, fat: 0.2 },

  // Légumineuses
  lentilles:      { name: "Lentilles cuites",    emoji: "🫘", kcal: 116, prot: 9,   carb: 20, fat: 0.4 },
  pois_chiches:   { name: "Pois chiches",        emoji: "🫘", kcal: 164, prot: 9,   carb: 27, fat: 2.6 },
  haricots_rouges:{ name: "Haricots rouges",     emoji: "🫘", kcal: 127, prot: 9,   carb: 23, fat: 0.5 },
  tofu:           { name: "Tofu",                emoji: "🟫", kcal: 144, prot: 17,  carb: 3,  fat: 9   },

  // Légumes
  brocoli:        { name: "Brocoli",             emoji: "🥦", kcal: 34,  prot: 2.8, carb: 7,  fat: 0.4 },
  haricots_verts: { name: "Haricots verts",      emoji: "🥬", kcal: 31,  prot: 1.8, carb: 7,  fat: 0.2 },
  epinards:       { name: "Épinards",            emoji: "🥬", kcal: 23,  prot: 2.9, carb: 3.6, fat: 0.4 },
  salade:         { name: "Salade verte",        emoji: "🥗", kcal: 15,  prot: 1.4, carb: 2.9, fat: 0.2 },
  tomate:         { name: "Tomate",              emoji: "🍅", kcal: 18,  prot: 0.9, carb: 3.9, fat: 0.2 },
  concombre:      { name: "Concombre",           emoji: "🥒", kcal: 16,  prot: 0.7, carb: 3.6, fat: 0.1 },
  carotte:        { name: "Carotte",             emoji: "🥕", kcal: 41,  prot: 0.9, carb: 10, fat: 0.2 },
  poivron:        { name: "Poivron",             emoji: "🫑", kcal: 31,  prot: 1,   carb: 6,  fat: 0.3 },
  courgette:      { name: "Courgette",           emoji: "🥒", kcal: 17,  prot: 1.2, carb: 3.1, fat: 0.3 },
  aubergine:      { name: "Aubergine",           emoji: "🍆", kcal: 25,  prot: 1,   carb: 6,  fat: 0.2 },
  champignons:    { name: "Champignons",         emoji: "🍄", kcal: 22,  prot: 3.1, carb: 3.3, fat: 0.3 },
  oignon:         { name: "Oignon",              emoji: "🧅", kcal: 40,  prot: 1.1, carb: 9,  fat: 0.1 },
  ail:            { name: "Ail",                 emoji: "🧄", kcal: 149, prot: 6.4, carb: 33, fat: 0.5 },

  // Fruits
  pomme:          { name: "Pomme",               emoji: "🍎", kcal: 52,  prot: 0.3, carb: 14, fat: 0.2 },
  banane:         { name: "Banane",              emoji: "🍌", kcal: 89,  prot: 1.1, carb: 23, fat: 0.3 },
  orange:         { name: "Orange",              emoji: "🍊", kcal: 47,  prot: 0.9, carb: 12, fat: 0.1 },
  fraise:         { name: "Fraises",             emoji: "🍓", kcal: 33,  prot: 0.7, carb: 8,  fat: 0.3 },
  myrtilles:      { name: "Myrtilles",           emoji: "🫐", kcal: 57,  prot: 0.7, carb: 14, fat: 0.3 },
  raisin:         { name: "Raisin",              emoji: "🍇", kcal: 67,  prot: 0.6, carb: 17, fat: 0.4 },
  ananas:         { name: "Ananas",              emoji: "🍍", kcal: 50,  prot: 0.5, carb: 13, fat: 0.1 },
  mangue:         { name: "Mangue",              emoji: "🥭", kcal: 60,  prot: 0.8, carb: 15, fat: 0.4 },
  kiwi:           { name: "Kiwi",                emoji: "🥝", kcal: 61,  prot: 1.1, carb: 15, fat: 0.5 },
  avocat:         { name: "Avocat",              emoji: "🥑", kcal: 160, prot: 2,   carb: 9,  fat: 15  },

  // Lipides bons
  amandes:        { name: "Amandes",             emoji: "🌰", kcal: 579, prot: 21,  carb: 22, fat: 50  },
  noix:           { name: "Noix",                emoji: "🌰", kcal: 654, prot: 15,  carb: 14, fat: 65  },
  noisettes:      { name: "Noisettes",           emoji: "🌰", kcal: 628, prot: 15,  carb: 17, fat: 61  },
  beurre_arachide:{ name: "Beurre de cacahuète", emoji: "🥜", kcal: 588, prot: 25,  carb: 20, fat: 50  },
  huile_olive:    { name: "Huile d'olive",       emoji: "🫒", kcal: 884, prot: 0,   carb: 0,  fat: 100 },
  beurre:         { name: "Beurre",              emoji: "🧈", kcal: 717, prot: 0.9, carb: 0.1, fat: 81 },

  // Snacks / autres
  chocolat_noir:  { name: "Chocolat noir 70%",   emoji: "🍫", kcal: 598, prot: 7.8, carb: 46, fat: 43  },
  miel:           { name: "Miel",                emoji: "🍯", kcal: 304, prot: 0.3, carb: 82, fat: 0   },
  proteine_whey:  { name: "Whey (1 scoop 30g)",  emoji: "💪", kcal: 120, prot: 24,  carb: 3,  fat: 1.5, perPortion: true, portionG: 30 },
  barre_proteinee:{ name: "Barre protéinée",     emoji: "🍫", kcal: 200, prot: 20,  carb: 18, fat: 7,   perPortion: true, portionG: 60 },

  // Boissons (par 100ml)
  cafe:           { name: "Café noir",           emoji: "☕", kcal: 2,   prot: 0.3, carb: 0,  fat: 0   },
  jus_orange:     { name: "Jus d'orange",        emoji: "🥤", kcal: 45,  prot: 0.7, carb: 10, fat: 0.2 },
  coca_light:     { name: "Coca Zéro/Light",     emoji: "🥤", kcal: 0.4, prot: 0,   carb: 0,  fat: 0   },
  biere:          { name: "Bière (5°)",          emoji: "🍺", kcal: 43,  prot: 0.5, carb: 3.6, fat: 0  },
  vin_rouge:      { name: "Vin rouge",           emoji: "🍷", kcal: 85,  prot: 0.1, carb: 2.6, fat: 0  },
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
          emoji: '🛒',
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
  { id: 'breakfast', name: 'Petit-déjeuner', emoji: '🌅', icon: 'sun' },
  { id: 'lunch',     name: 'Déjeuner',       emoji: '☀️', icon: 'sun' },
  { id: 'snack',     name: 'Collation',      emoji: '🥨', icon: 'cookie' },
  { id: 'dinner',    name: 'Dîner',          emoji: '🌙', icon: 'moon' },
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

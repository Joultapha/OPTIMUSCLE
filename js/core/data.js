/* ===================================
   OPTIMUSCLE — Data (exercises, images, badges, templates)
   =================================== */

// ========== HERO IMAGES (par objectif) ==========
export const HERO_IMAGES = {
  muscle: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&q=80",
  loss: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=80",
  endurance: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=900&q=80",
  health: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80",
};

// ========== FOCUS IMAGES (par type de séance) ==========
export const FOCUS_IMAGES = {
  "Pectoraux": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  "Dos": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&q=80",
  "Jambes": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&q=80",
  "Épaules": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  "Bras": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
  "Épaules / Bras": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
  "Haut du corps": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&q=80",
  "Bas du corps": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&q=80",
  "Push (Pec/Ép/Tri)": "https://images.unsplash.com/photo-1584863231364-2edc166de576?w=800&q=80",
  "Pull (Dos/Bi)": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80",
  "Full Body A": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  "Full Body B": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80",
  "Full Body C": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&q=80",
  "HIIT": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80",
  "HIIT + Bas": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80",
  "Cardio + Haut": "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&q=80",
  "Circuit Full Body": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80",
  "Circuit": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80",
  "Force haut": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
  "Force bas": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&q=80",
  "Force": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
  "Cardio long": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  "Cardio modéré": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  "Cardio doux": "https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&q=80",
  "Cardio": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  "Intervalles": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80",
  "Fractionné": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80",
  "Endurance + gainage": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  "Renforcement haut": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&q=80",
  "Renforcement bas": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&q=80",
  "Renforcement": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&q=80",
  "Mobilité + cardio": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  "Mobilité": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  "Gainage": "https://images.unsplash.com/photo-1566241142559-40e1241fa3ec?w=800&q=80",
  "Core": "https://images.unsplash.com/photo-1566241142559-40e1241fa3ec?w=800&q=80",
  "Récup active": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  "Récup": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  "Haut": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&q=80",
  "Bas": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&q=80",
  "Marche active": "https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&q=80",
  "Repos": "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80",
};

export function getFocusImage(name) {
  return FOCUS_IMAGES[name] || "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80";
}

// ========== EXERCISE DATABASE ==========
export const EX_DB = {
  pushup: { name: "Pompes", muscle: "Pectoraux", places: ["home_none","home_basic","gym"], desc: "Exercice de base au poids du corps qui sollicite pectoraux, triceps et épaules.", tips: ["Mains écartées largeur épaules","Corps gainé, ligne droite tête-talons","Descends jusqu'à frôler le sol","Coudes à 45° du buste, pas écartés","Respire : inspire en descendant, expire en remontant"] },
  pushup_knee: { name: "Pompes sur genoux", muscle: "Pectoraux", places: ["home_none","home_basic"], desc: "Variante des pompes adaptée aux débutants.", tips: ["Genoux au sol, pieds croisés","Garde les hanches alignées avec le tronc","Descends doucement","Pousse fort vers le haut"] },
  squat: { name: "Squat", muscle: "Jambes", places: ["home_none","home_basic","gym"], desc: "Mouvement roi pour les jambes : quadriceps, fessiers, ischios.", tips: ["Pieds largeur épaules, légèrement ouverts","Descends comme pour t'asseoir","Genoux dans l'axe des pieds","Dos droit, regard devant","Cuisses parallèles au sol minimum"] },
  lunge: { name: "Fentes alternées", muscle: "Jambes", places: ["home_none","home_basic","gym"], desc: "Exercice unilatéral pour jambes et fessiers, améliore l'équilibre.", tips: ["Grand pas en avant","Genou arrière proche du sol","Genou avant à 90°","Buste droit","Alterne les jambes"] },
  plank: { name: "Planche", muscle: "Gainage", places: ["home_none","home_basic","gym"], time: true, desc: "Exercice isométrique fondamental pour le gainage profond.", tips: ["Avant-bras au sol, coudes sous épaules","Corps parfaitement aligné","Contracte abdos et fessiers","Ne creuse pas le bas du dos","Respire calmement"] },
  crunch: { name: "Crunchs", muscle: "Abdos", places: ["home_none","home_basic","gym"], desc: "Exercice ciblé sur les abdominaux supérieurs.", tips: ["Allongé, genoux pliés","Mains derrière la tête sans tirer","Décolle les épaules en contractant les abdos","Expire en montant","Mouvement court et contrôlé"] },
  burpee: { name: "Burpees", muscle: "Full body", places: ["home_none","home_basic","gym"], desc: "Exercice cardio complet : squat + pompe + saut. Très intense !", tips: ["Squat → mains au sol","Saute jambes en arrière en planche","Fais une pompe (optionnel)","Ramène les pieds vers les mains","Saute en l'air bras en haut"] },
  mountain: { name: "Mountain climbers", muscle: "Cardio / Abdos", places: ["home_none","home_basic","gym"], time: true, desc: "Cardio intense qui sollicite gainage et coordination.", tips: ["Position de planche haute","Ramène alternativement les genoux vers la poitrine","Garde les hanches basses","Rythme rapide et contrôlé"] },
  jumping_jack: { name: "Jumping jacks", muscle: "Cardio", places: ["home_none","home_basic","gym"], time: true, desc: "Échauffement classique cardio total.", tips: ["Saute en écartant jambes et bras","Bras au-dessus de la tête","Reviens en sautant","Atterris en douceur","Maintiens un rythme régulier"] },
  glute_bridge: { name: "Pont fessier", muscle: "Fessiers", places: ["home_none","home_basic","gym"], desc: "Exercice ciblé fessiers et bas du dos.", tips: ["Allongé, genoux pliés, pieds au sol","Pousse sur les talons","Soulève les hanches en contractant les fessiers","Aligne genoux, hanches, épaules","Tiens 1 sec en haut"] },
  superman: { name: "Superman", muscle: "Lombaires", places: ["home_none","home_basic","gym"], desc: "Renforce le bas du dos et les muscles posturaux.", tips: ["Allongé sur le ventre","Soulève simultanément bras et jambes","Contracte fessiers et lombaires","Tiens 2 sec","Repose en douceur"] },
  dips_chair: { name: "Dips sur chaise", muscle: "Triceps", places: ["home_none","home_basic"], desc: "Renforce triceps et arrière des épaules avec une chaise.", tips: ["Mains sur la chaise, dos tourné","Jambes pliées ou tendues","Descends en pliant les coudes","Pousse pour remonter","Coudes proches du corps"] },
  high_knees: { name: "Montées de genoux", muscle: "Cardio", places: ["home_none","home_basic","gym"], time: true, desc: "Échauffement et cardio qui sollicite jambes et abdos.", tips: ["Sur place, monte les genoux haut","Hanches niveau","Bras alternés comme en course","Rythme soutenu","Atterris sur la pointe des pieds"] },
  db_press: { name: "Développé haltères", muscle: "Pectoraux", places: ["home_basic","gym"], desc: "Exercice de base pour les pectoraux avec haltères.", tips: ["Allongé sur banc ou sol","Haltères au niveau des pectoraux","Pousse vers le haut","Coudes ne se verrouillent pas","Descends contrôlé"] },
  db_row: { name: "Rowing haltère", muscle: "Dos", places: ["home_basic","gym"], desc: "Tirage qui développe le grand dorsal et les rhomboïdes.", tips: ["Un genou et une main sur banc","Dos plat, presque parallèle au sol","Tire l'haltère vers la hanche","Coude proche du corps","Contracte les omoplates"] },
  db_curl: { name: "Curl biceps", muscle: "Biceps", places: ["home_basic","gym"], desc: "Exercice d'isolation du biceps.", tips: ["Debout, haltères en main","Coudes collés au corps","Plie les bras, paumes vers le haut","Contracte en haut","Descends en contrôle"] },
  db_shoulder: { name: "Élévations latérales", muscle: "Épaules", places: ["home_basic","gym"], desc: "Développe le faisceau moyen des épaules pour des épaules larges.", tips: ["Debout, haltères le long du corps","Lève les bras sur les côtés","Jusqu'à hauteur d'épaules","Légère flexion des coudes","Mouvement lent et contrôlé"] },
  db_squat: { name: "Goblet squat", muscle: "Jambes", places: ["home_basic","gym"], desc: "Squat avec haltère devant la poitrine, parfait pour la posture.", tips: ["Tiens l'haltère contre la poitrine","Pieds largeur épaules","Descends bien bas","Buste droit","Pousse fort à la remontée"] },
  db_lunge: { name: "Fentes haltères", muscle: "Jambes", places: ["home_basic","gym"], desc: "Fentes lestées pour intensifier le travail des jambes.", tips: ["Haltères dans chaque main, bras le long du corps","Grand pas en avant","Descends jusqu'à 90°","Pousse sur le talon avant","Alterne les jambes"] },
  db_dl: { name: "Soulevé de terre haltères", muscle: "Dos / Jambes", places: ["home_basic","gym"], desc: "Mouvement complet qui sollicite la chaîne postérieure.", tips: ["Haltères devant les jambes","Dos parfaitement plat","Pousse les hanches en arrière","Descends jusqu'aux tibias","Remonte en contractant fessiers"] },
  db_tri: { name: "Extensions triceps", muscle: "Triceps", places: ["home_basic","gym"], desc: "Isole les triceps pour des bras tonifiés.", tips: ["Haltère à deux mains au-dessus de la tête","Coudes pointés vers le plafond","Descends derrière la tête","Coudes immobiles","Remonte en contractant"] },
  bench: { name: "Développé couché", muscle: "Pectoraux", places: ["gym"], desc: "Exercice roi pour les pectoraux à la barre.", tips: ["Allongé sur le banc","Prise un peu plus large que les épaules","Descends la barre au niveau des pectoraux","Coudes à 45°","Pousse fort en expirant"] },
  pulldown: { name: "Tirage vertical", muscle: "Dos", places: ["gym"], desc: "Développe la largeur du dos.", tips: ["Assis, prise large","Tire la barre vers la poitrine","Contracte les omoplates","Buste légèrement incliné","Contrôle la remontée"] },
  leg_press: { name: "Presse à cuisses", muscle: "Jambes", places: ["gym"], desc: "Exercice machine pour développer les jambes en sécurité.", tips: ["Pieds largeur épaules sur le plateau","Descends jusqu'à 90°","Ne décolle pas le bas du dos","Pousse en contrôlant","Genoux dans l'axe"] },
  cable_row: { name: "Tirage horizontal", muscle: "Dos", places: ["gym"], desc: "Travaille l'épaisseur du dos.", tips: ["Assis, pieds calés","Buste droit, dos plat","Tire la poignée vers le ventre","Contracte les omoplates","Reviens contrôlé"] },
  shoulder_press: { name: "Développé épaules", muscle: "Épaules", places: ["gym"], desc: "Construit des épaules puissantes.", tips: ["Assis ou debout","Haltères au niveau des oreilles","Pousse vers le haut","Ne verrouille pas les coudes","Descends contrôlé"] },
  leg_curl: { name: "Leg curl", muscle: "Ischios", places: ["gym"], desc: "Isole les ischios-jambiers.", tips: ["Allongé sur la machine","Coussinet au niveau des chevilles","Plie les genoux à fond","Contracte en haut","Descends lentement"] },
  leg_ext: { name: "Leg extension", muscle: "Quadriceps", places: ["gym"], desc: "Isole les quadriceps.", tips: ["Assis sur la machine","Coussinet sur le bas des tibias","Étends les jambes complètement","Contracte 1 sec en haut","Reviens contrôlé"] },
  run: { name: "Course / Tapis", muscle: "Cardio", places: ["home_none","home_basic","gym"], time: true, cardio: true, desc: "Cardio fondamental qui développe l'endurance.", tips: ["Échauffe-toi 5 min en marchant","Foulée naturelle","Respire par le nez et la bouche","Garde un rythme stable","Termine par 5 min de retour au calme"] },
  bike: { name: "Vélo", muscle: "Cardio", places: ["gym"], time: true, cardio: true, desc: "Cardio doux pour les articulations.", tips: ["Règle la selle à hauteur du bassin","Pédale rond et fluide","Maintiens un dos droit","Varie l'intensité","Hydrate-toi"] },
  rope: { name: "Corde à sauter", muscle: "Cardio", places: ["home_basic","gym"], time: true, cardio: true, desc: "Cardio ultra efficace, brûle énormément de calories.", tips: ["Petits sauts, atterris sur les pointes","Coudes proches du corps","Tourne avec les poignets","Garde le regard devant","Commence par 30 sec"] },
};

// ========== EXERCISE GIFS (animations) ==========
export const EX_GIFS = {
  // ⭐ N'inclure QUE les GIFs qui correspondent VRAIMENT à l'exercice.
  // Pas de fallback : si pas de GIF correct, l'app affichera juste une icône.
  pushup:        "https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif",
  pushup_knee:   "https://fitnessprogramer.com/wp-content/uploads/2021/04/Knee-Push-Up.gif",
  squat:         "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif",
  plank:         "https://fitnessprogramer.com/wp-content/uploads/2021/02/plank.gif",
  crunch:        "https://fitnessprogramer.com/wp-content/uploads/2015/11/Crunch.gif",
  burpee:        "https://fitnessprogramer.com/wp-content/uploads/2021/02/burpees.gif",
  mountain:      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Mountain-climber.gif",
  jumping_jack:  "https://fitnessprogramer.com/wp-content/uploads/2021/05/Jumping-jack.gif",
  glute_bridge:  "https://fitnessprogramer.com/wp-content/uploads/2021/02/Glute-Bridge-.gif",
  superman:      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Superman-exercise.gif",
  dips_chair:    "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bench-Dips.gif",
  db_row:        "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif",
  db_curl:       "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Curl.gif",
  db_shoulder:   "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif",
  db_squat:      "https://fitnessprogramer.com/wp-content/uploads/2023/09/Dumbbell-Squat.gif",
  db_lunge:      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lunge.gif",
  db_dl:         "https://fitnessprogramer.com/wp-content/uploads/2023/09/dumbbell-deadlifts.gif",
  bench:         "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif",
  pulldown:      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif",
  leg_press:     "https://fitnessprogramer.com/wp-content/uploads/2015/11/Leg-Press.gif",
  cable_row:     "https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif",
  shoulder_press:"https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif",
  leg_curl:      "https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Curl.gif",
  leg_ext:       "https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif",
  run:           "https://fitnessprogramer.com/wp-content/uploads/2021/07/Run.gif",
  rope:          "https://fitnessprogramer.com/wp-content/uploads/2023/10/Skip-Jump-Rope.gif",
  // ⛔ Pas de GIF pour : lunge, high_knees, db_press, db_tri, bike
  // → L'app affichera une icône à la place
};

// ========== PROGRAM TEMPLATES ==========
export const TEMPLATES = {
  3: {
    muscle: ["Full Body A", "Full Body B", "Full Body C"],
    loss: ["HIIT + Bas", "Cardio + Haut", "Circuit Full Body"],
    endurance: ["Cardio long", "Intervalles", "Endurance + gainage"],
    health: ["Renforcement haut", "Renforcement bas", "Mobilité + cardio"],
  },
  4: {
    muscle: ["Haut du corps", "Bas du corps", "Push (Pec/Ép/Tri)", "Pull (Dos/Bi)"],
    loss: ["HIIT", "Force haut", "Cardio long", "Circuit Full Body"],
    endurance: ["Cardio long", "Intervalles", "Renforcement", "Récup active"],
    health: ["Haut du corps", "Bas du corps", "Cardio doux", "Mobilité"],
  },
  5: {
    muscle: ["Pectoraux", "Dos", "Jambes", "Épaules / Bras", "Full Body A"],
    loss: ["HIIT", "Force haut", "Cardio long", "Force bas", "Circuit"],
    endurance: ["Cardio long", "Fractionné", "Force", "Cardio modéré", "Récup"],
    health: ["Haut", "Bas", "Cardio", "Gainage", "Mobilité"],
  },
  6: {
    muscle: ["Pectoraux", "Dos", "Jambes", "Épaules", "Bras", "Full Body A"],
    loss: ["HIIT", "Force haut", "Cardio", "Force bas", "Circuit", "Cardio long"],
    endurance: ["Cardio long", "Fractionné", "Force haut", "Cardio modéré", "Force bas", "Récup"],
    health: ["Haut", "Bas", "Cardio", "Core", "Mobilité", "Marche active"],
  },
};

// ========== FOCUS MAP (exercises per focus) ==========
export const FOCUS_MAP = {
  "Full Body A": ["squat","pushup","db_row","plank","jumping_jack"],
  "Full Body B": ["lunge","db_press","superman","crunch","mountain"],
  "Full Body C": ["glute_bridge","pushup","db_row","plank","burpee"],
  "Pectoraux": ["bench","db_press","pushup","dips_chair","plank"],
  "Dos": ["pulldown","db_row","cable_row","superman","plank"],
  "Jambes": ["squat","db_lunge","leg_press","leg_curl","glute_bridge"],
  "Épaules": ["shoulder_press","db_shoulder","pushup","plank"],
  "Bras": ["db_curl","db_tri","dips_chair","db_curl"],
  "Épaules / Bras": ["db_shoulder","db_curl","db_tri","plank"],
  "Haut du corps": ["pushup","db_row","db_press","db_curl","plank"],
  "Bas du corps": ["squat","lunge","glute_bridge","db_dl","plank"],
  "Push (Pec/Ép/Tri)": ["bench","shoulder_press","db_tri","pushup"],
  "Pull (Dos/Bi)": ["pulldown","db_row","db_curl","superman"],
  "HIIT": ["burpee","mountain","jumping_jack","high_knees","squat"],
  "HIIT + Bas": ["squat","lunge","burpee","mountain","glute_bridge"],
  "Cardio + Haut": ["pushup","db_row","jumping_jack","mountain","plank"],
  "Circuit Full Body": ["squat","pushup","burpee","plank","crunch"],
  "Circuit": ["squat","pushup","db_row","mountain","crunch"],
  "Force haut": ["db_press","db_row","db_shoulder","db_curl","plank"],
  "Force bas": ["squat","db_lunge","glute_bridge","db_dl"],
  "Force": ["squat","pushup","db_row","plank"],
  "Cardio long": ["run","bike","jumping_jack"],
  "Cardio modéré": ["run","rope","high_knees"],
  "Cardio doux": ["run","jumping_jack"],
  "Cardio": ["run","jumping_jack","mountain"],
  "Intervalles": ["run","burpee","mountain","high_knees"],
  "Fractionné": ["run","burpee","jumping_jack","mountain"],
  "Endurance + gainage": ["run","plank","superman","crunch"],
  "Renforcement haut": ["pushup","db_row","db_press","plank"],
  "Renforcement bas": ["squat","lunge","glute_bridge"],
  "Renforcement": ["squat","pushup","db_row","plank"],
  "Mobilité + cardio": ["jumping_jack","high_knees","plank","superman"],
  "Mobilité": ["plank","superman","glute_bridge"],
  "Gainage": ["plank","crunch","mountain","superman"],
  "Core": ["plank","crunch","mountain","superman"],
  "Récup active": ["run","plank","superman"],
  "Récup": ["run","plank"],
  "Haut": ["pushup","db_row","db_press","db_curl"],
  "Bas": ["squat","lunge","glute_bridge"],
  "Marche active": ["run"],
};

// ========== BADGES ==========
export const BADGES = [
  { id: "first", emoji: "◎", name: "PREMIER PAS", desc: "1 séance terminée", check: s => s.stats.totalSessions >= 1 },
  { id: "five", emoji: "✦", name: "EN ROUTE", desc: "5 séances", check: s => s.stats.totalSessions >= 5 },
  { id: "ten", emoji: "✺", name: "RÉGULIER", desc: "10 séances", check: s => s.stats.totalSessions >= 10 },
  { id: "twenty", emoji: "◆", name: "ENGAGÉ", desc: "20 séances", check: s => s.stats.totalSessions >= 20 },
  { id: "fifty", emoji: "👑", name: "CHAMPION", desc: "50 séances", check: s => s.stats.totalSessions >= 50 },
  { id: "hundred", emoji: "★", name: "LÉGENDE", desc: "100 séances", check: s => s.stats.totalSessions >= 100 },
  { id: "streak3", emoji: "↑", name: "ÉCHAUFFÉ", desc: "3 jours d'affilée", check: s => s.stats.bestStreak >= 3 },
  { id: "streak7", emoji: "⚡", name: "UNE SEMAINE", desc: "7 jours d'affilée", check: s => s.stats.bestStreak >= 7 },
  { id: "streak30", emoji: "✦", name: "INARRÊTABLE", desc: "30 jours d'affilée", check: s => s.stats.bestStreak >= 30 },
  { id: "min60", emoji: "⏱", name: "1 HEURE", desc: "60 min cumulées", check: s => s.stats.totalMinutes >= 60 },
  { id: "min500", emoji: "▲", name: "ENDURANCE", desc: "500 min cumulées", check: s => s.stats.totalMinutes >= 500 },
  { id: "min1000", emoji: "✶", name: "MARATHONIEN", desc: "1000 min cumulées", check: s => s.stats.totalMinutes >= 1000 },
];

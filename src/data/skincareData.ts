import { SkincareProduct, IngredientInfo, Dermatologist } from "../types";
import sakuraCleanserImg from "../assets/images/sakura_cleanser_1788363415868.jpg";
import salicylicGelImg from "../assets/images/salicylic_acid_gel_1784479829189.jpg";
import riceWaterTonerImg from "../assets/images/rice_water_toner_1788363432197.jpg";
import niacinamideSerumImg from "../assets/images/niacinamide_serum_1788363448115.jpg";
import ahaBhaSerumImg from "../assets/images/aha_bha_serum_1788363461474.jpg";
import ceramideMoisturizerImg from "../assets/images/ceramide_moisturizer_1788363476285.jpg";
import centellaGelImg from "../assets/images/centella_gel_1788363492111.jpg";
import spf50SunscreenImg from "../assets/images/spf50_sunscreen_1788363504723.jpg";
import hydratingCleanserImg from "../assets/images/hydrating_cleanser_1788363518248.jpg";
import niacinamideTenImg from "../assets/images/niacinamide_ten_1788363531464.jpg";
import snailEssenceImg from "../assets/images/snail_essence_1788363547097.jpg";
import riceSunscreenImg from "../assets/images/rice_sunscreen_1788363561956.jpg";
import hyaluronicSerumImg from "../assets/images/hyaluronic_serum_1788363576969.jpg";
import bhaExfoliantImg from "../assets/images/bha_exfoliant_1788363589944.jpg";
import centellaAmpouleImg from "../assets/images/centella_ampoule_1788363605370.jpg";
import ceramideCreamImg from "../assets/images/ceramide_cream_1788363618190.jpg";
import vitaminCSerumImg from "../assets/images/vitamin_c_serum_1788363632044.jpg";
import retinoidSerumImg from "../assets/images/retinoid_serum_1788363645766.jpg";
import hyaluronicCreamImg from "../assets/images/hyaluronic_cream_1788363661336.jpg";
import heartleafTonerImg from "../assets/images/heartleaf_toner_1788363674692.jpg";
import hyaluCicaSunImg from "../assets/images/hyalu_cica_sun_1788363687314.jpg";
import volcanicClayImg from "../assets/images/volcanic_clay_1788363701613.jpg";
import berryLipMaskImg from "../assets/images/berry_lip_mask_1788363716379.jpg";
import lowPhCleanserImg from "../assets/images/low_ph_cleanser_1788363730515.jpg";

// Dermatologist Demo Images
import drAnanyaImg from "../assets/images/dr_ananya_sen_1788366790248.jpg";
import drRohanImg from "../assets/images/dr_rohan_mehta_1788366808892.jpg";
import drPriyaImg from "../assets/images/dr_priya_nair_1788366830734.jpg";
import drArjunImg from "../assets/images/dr_arjun_kapoor_1788366854798.jpg";
import drMeeraImg from "../assets/images/dr_meera_iyer_1788366876492.jpg";
import drVikramImg from "../assets/images/dr_vikram_singh_1788366897777.jpg";

export const DEMO_INDIAN_DERMATOLOGISTS: Dermatologist[] = [
  {
    id: "doc-1",
    name: "Dr. Ananya Sen",
    qualification: "MBBS, MD (Dermatology)",
    specialist: "Dermatologist & Skin Care Specialist",
    location: "Mumbai, India",
    rating: 4.9,
    consultationFee: 799,
    imageUrl: drAnanyaImg,
    isDemo: true,
    specialties: ["Acne Care", "Barrier Repair", "Skin Glow", "Pigmentation"],
    availableDays: ["Mon", "Wed", "Fri", "Sat"],
    availableSlots: ["10:00 AM", "11:30 AM", "02:30 PM", "05:00 PM"]
  },
  {
    id: "doc-2",
    name: "Dr. Rohan Mehta",
    qualification: "MBBS, DNB (Dermatology)",
    specialist: "Consultant Dermatologist",
    location: "Bengaluru, India",
    rating: 4.8,
    consultationFee: 899,
    imageUrl: drRohanImg,
    isDemo: true,
    specialties: ["Consultant Dermatology", "Hair & Scalp", "Anti-Aging", "Pore Care"],
    availableDays: ["Tue", "Thu", "Fri", "Sat"],
    availableSlots: ["10:30 AM", "01:00 PM", "03:30 PM", "06:00 PM"]
  },
  {
    id: "doc-3",
    name: "Dr. Priya Nair",
    qualification: "MBBS, DDVL",
    specialist: "Dermatologist & Aesthetic Skin Specialist",
    location: "Kochi, India",
    rating: 4.9,
    consultationFee: 799,
    imageUrl: drPriyaImg,
    isDemo: true,
    specialties: ["Aesthetic Skin", "Sensitive Skin", "Sun Damage", "Hydration"],
    availableDays: ["Mon", "Tue", "Thu", "Sat"],
    availableSlots: ["09:30 AM", "11:00 AM", "02:00 PM", "04:30 PM"]
  },
  {
    id: "doc-4",
    name: "Dr. Arjun Kapoor",
    qualification: "MBBS, DVD",
    specialist: "Dermatologist & Acne Specialist",
    location: "Delhi, India",
    rating: 4.8,
    consultationFee: 899,
    imageUrl: drArjunImg,
    isDemo: true,
    specialties: ["Acne & Scars", "Oil Control", "Teen Skin", "Skin Peels"],
    availableDays: ["Wed", "Thu", "Fri", "Sun"],
    availableSlots: ["11:00 AM", "01:30 PM", "04:00 PM", "06:30 PM"]
  },
  {
    id: "doc-5",
    name: "Dr. Meera Iyer",
    qualification: "MBBS, MD (Dermatology)",
    specialist: "Consultant Dermatologist",
    location: "Chennai, India",
    rating: 5.0,
    consultationFee: 799,
    imageUrl: drMeeraImg,
    isDemo: true,
    specialties: ["Clinical Dermatology", "Barrier Repair", "Rosacea", "Skin Health"],
    availableDays: ["Mon", "Wed", "Thu", "Fri"],
    availableSlots: ["10:00 AM", "12:00 PM", "03:00 PM", "05:30 PM"]
  },
  {
    id: "doc-6",
    name: "Dr. Vikram Singh",
    qualification: "MBBS, DNB (Dermatology)",
    specialist: "Dermatologist & Skin Health Specialist",
    location: "Hyderabad, India",
    rating: 4.9,
    consultationFee: 999,
    imageUrl: drVikramImg,
    isDemo: true,
    specialties: ["Skin Health", "Allergies", "Eczema Care", "Daily Skincare"],
    availableDays: ["Tue", "Wed", "Fri", "Sat"],
    availableSlots: ["09:00 AM", "11:30 AM", "02:30 PM", "05:00 PM"]
  }
];

export const CURATED_PRODUCTS: SkincareProduct[] = [
  {
    id: "prod-1",
    name: "Sakura Hydrating Cleanser",
    brand: "Nourish Glow Essentials",
    category: "Cleanser",
    price: 599,
    mrp: 799,
    rating: 4.8,
    image: sakuraCleanserImg,
    concerns: ["Dryness", "Dullness", "Sensitivity"],
    skinTypes: ["Dry", "Normal", "Sensitive"],
    ingredients: ["Sakura Flower Extract", "Hyaluronic Acid", "Centella Asiatica (Cica)"],
    description: "A velvety, non-foaming cream cleanser that gently lifts daily impurities while infusing deep hydration. Enriched with Japanese Cherry Blossom extract to calm redness and repair barriers.",
    benefits: [
      "Deeply hydrates while clearing away sebum and impurities.",
      "Cherry blossom flavonoids soothe inflammation and help brighten dull skin.",
      "pH-balanced (5.5) formula preserves the natural acid mantle."
    ],
    howToUse: "Massage a nickel-sized amount onto damp skin in circular motions. Rinse thoroughly with lukewarm water. Use morning and night.",
    inStock: true,
    stockCount: 28
  },
  {
    id: "prod-2",
    name: "Salicylic Acid Cleanser",
    brand: "Nourish Glow Lab",
    category: "Cleanser",
    price: 499,
    mrp: 699,
    rating: 4.7,
    image: salicylicGelImg,
    concerns: ["Acne", "Large Pores", "Excess Oil"],
    skinTypes: ["Oily", "Combination"],
    ingredients: ["Salicylic Acid (BHA 2%)", "Tea Tree Oil", "Green Tea Extract"],
    description: "An active, lightly foaming gel cleanser designed to penetrate deep inside pore linings. Dissolves blackheads and controls stubborn acne flare-ups without over-stripping.",
    benefits: [
      "Exfoliates dead cells inside pores to prevent future breakouts.",
      "Reduces active inflammation and skin shine within 7 days.",
      "Green tea provides vital antioxidant shield to reduce redness."
    ],
    howToUse: "Lather a small pump onto wet palms. Apply to face, concentrating on the T-zone. Leave on for 30 seconds before rinsing completely.",
    inStock: true,
    stockCount: 15
  },
  {
    id: "prod-3",
    name: "Rice Water Toner",
    brand: "Nourish Glow Essentials",
    category: "Toner",
    price: 699,
    mrp: 899,
    rating: 4.9,
    image: riceWaterTonerImg,
    concerns: ["Dullness", "Uneven Texture", "Dehydration"],
    skinTypes: ["All", "Normal", "Dry", "Combination"],
    ingredients: ["Fermented Rice Filtrate (Sake)", "Cherry Blossom Extract", "Glycerin"],
    description: "An ultra-fine milky toner inspired by ancient beauty rituals. Fermented rice extract releases amino acids and vitamins that accelerate cell turnover for instant supple plumpness.",
    benefits: [
      "Improves skin luminosity and refines coarse texturing.",
      "Deeply preps the skin to absorb serums and treatment complexes 3x better.",
      "Provides lightweight hydration and reinforces the microbiome."
    ],
    howToUse: "Pour 3-4 drops into palms and gently pat directly onto cleansed face and neck until fully absorbed. Do not wash off.",
    inStock: true,
    stockCount: 34
  },
  {
    id: "prod-4",
    name: "Niacinamide Serum",
    brand: "Nourish Glow Lab",
    category: "Serum",
    price: 899,
    mrp: 1199,
    rating: 4.8,
    image: niacinamideSerumImg,
    concerns: ["Hyperpigmentation", "Redness", "Large Pores", "Barrier Repair"],
    skinTypes: ["All", "Sensitive", "Oily"],
    ingredients: ["Niacinamide (10%)", "Zinc PCA (1%)", "Hyaluronic Acid"],
    description: "A clinically formulated booster serum that targets uneven skin tone and strengthens lipid bonds. Niacinamide lightens dark spots and balances sebum production.",
    benefits: [
      "Fades dark spots, acne scars, and post-inflammatory erythema.",
      "Zinc PCA regulates oil activity and inhibits acne-causing bacteria.",
      "Fortifies the moisture barrier to prevent dehydration."
    ],
    howToUse: "Apply 3 drops morning and evening onto clean, damp skin prior to creams or oils.",
    inStock: true,
    stockCount: 42
  },
  {
    id: "prod-5",
    name: "AHA BHA Exfoliating Serum",
    brand: "Dermacare Pro",
    category: "Serum",
    price: 799,
    mrp: 1099,
    rating: 4.6,
    image: ahaBhaSerumImg,
    concerns: ["Uneven Texture", "Acne", "Large Pores"],
    skinTypes: ["Oily", "Combination", "Normal"],
    ingredients: ["Glycolic Acid (5%)", "Salicylic Acid (1.5%)", "Lactic Acid (2%)", "Licorice Root"],
    description: "A powerful skin-smoothing liquid chemical exfoliant. Works on the surface to unglue dead cells while clearing out deep impurities inside congested pores.",
    benefits: [
      "Sweeps away dull surface build-up to reveal fresh baby-smooth skin.",
      "Reduces micro-comedones and rough dry patches.",
      "Licorice root extract visibly reduces skin discoloration."
    ],
    howToUse: "Use 2-3 nights per week. Apply onto dry, clean skin using a cotton round. Avoid the eye area. A temporary tingling sensation is normal.",
    inStock: true,
    stockCount: 19
  },
  {
    id: "prod-6",
    name: "Ceramide Moisturizer",
    brand: "Nourish Glow Essentials",
    category: "Moisturizer",
    price: 849,
    mrp: 1149,
    rating: 4.9,
    image: ceramideMoisturizerImg,
    concerns: ["Barrier Repair", "Dryness", "Sensitivity", "Redness"],
    skinTypes: ["Dry", "Sensitive", "Normal"],
    ingredients: ["Ceramides (EOP, AP, NP)", "Cholesterol", "Phytosphingosine", "Squalane"],
    description: "An intensive moisturizing cream mimicking the skin's natural lipid ratio. Deeply seals cracked skin cells, relieves flakiness, and establishes an invisible breathable barrier.",
    benefits: [
      "Repairs severely compromised or peeling skin in 48 hours.",
      "Squalane cushions dry cells without clogging pores or feeling greasy.",
      "Calms burning sensations and redness caused by acid overuse."
    ],
    howToUse: "Warm a pea-sized amount between fingertips and massage gently over the face and neck in upward sweeps.",
    inStock: true,
    stockCount: 25
  },
  {
    id: "prod-7",
    name: "Centella Gel Moisturizer",
    brand: "Nourish Glow Essentials",
    category: "Moisturizer",
    price: 649,
    mrp: 849,
    rating: 4.8,
    image: centellaGelImg,
    concerns: ["Excess Oil", "Sensitivity", "Acne"],
    skinTypes: ["Oily", "Combination", "Sensitive"],
    ingredients: ["Centella Asiatica (80%)", "Panthenol (Provitamin B5)", "Allantoin"],
    description: "A weightless, oil-free moisturizer designed specifically for acne-prone and reactive skin. Formulated with pure Centella Asiatica to cool irritation and re-hydrate.",
    benefits: [
      "Ultra-lightweight cooling hydration that absorbs instantly.",
      "Soothes heated skin, inflammation, and active pimple pain.",
      "Locks in moisture without triggering any blackheads or congestion."
    ],
    howToUse: "Apply generously to cleansed, toned face. Excellent for hot humid summer seasons or after intense outdoor workouts.",
    inStock: true,
    stockCount: 30
  },
  {
    id: "prod-8",
    name: "SPF 50 Sunscreen",
    brand: "Dermacare Pro",
    category: "Sunscreen",
    price: 749,
    mrp: 999,
    rating: 4.9,
    image: spf50SunscreenImg,
    concerns: ["Sun Protection", "Aging", "Hyperpigmentation"],
    skinTypes: ["All", "Sensitive"],
    ingredients: ["Zinc Oxide (12%)", "Hyaluronic Acid", "Niacinamide (2%)"],
    description: "A hybrid physical sun protection fluid that leaves a weightless satin finish. Zero white cast, zero eye stinging, and enriched with protective brighteners.",
    benefits: [
      "State-of-the-art UVA/UVB mineral-based filters protect against sunburn and aging.",
      "Niacinamide helps prevent sunspots and keeps the barrier calm.",
      "Slightly blurring texture serves as a beautiful makeup primer."
    ],
    howToUse: "Apply two finger lengths of sunscreen to the face, ears, and neck daily as the very last step of your AM skincare routine.",
    inStock: true,
    stockCount: 50
  },
  {
    id: "prod-9",
    name: "Hydrating Facial Cleanser",
    brand: "CeraVe",
    category: "Cleanser",
    price: 675,
    mrp: 850,
    rating: 4.9,
    image: hydratingCleanserImg,
    concerns: ["Dryness", "Barrier Repair", "Sensitivity"],
    skinTypes: ["Normal", "Dry", "Sensitive"],
    ingredients: ["Ceramides (1, 3, 6-II)", "Hyaluronic Acid", "MVE Delivery Technology"],
    description: "A gentle, non-foaming lotion cleanser developed with dermatologists to cleanse, hydrate, and restore the protective skin barrier with 3 essential ceramides.",
    benefits: [
      "Cleanses and refreshes without over-stripping or leaving skin feeling tight.",
      "MVE Technology continuously releases moisturizing ingredients for 24-hour hydration.",
      "Fragrance-free, non-comedogenic, and accepted by National Eczema Association."
    ],
    howToUse: "Wet skin with lukewarm water. Massage cleanser into skin in a gentle, circular motion. Rinse thoroughly.",
    inStock: true,
    stockCount: 45
  },
  {
    id: "prod-10",
    name: "Niacinamide 10% Serum",
    brand: "Minimalist",
    category: "Serum",
    price: 599,
    mrp: 699,
    rating: 4.8,
    image: niacinamideTenImg,
    concerns: ["Acne", "Large Pores", "Excess Oil", "Hyperpigmentation"],
    skinTypes: ["Oily", "Combination", "Sensitive"],
    ingredients: ["Niacinamide (10%)", "Zinc PCA (1%)", "EUK-134", "Aloe Vera Juice"],
    description: "A high-strength vitamin and mineral blemish formula with pure 10% Niacinamide and 1% Zinc PCA to balance sebum activity and diminish redness.",
    benefits: [
      "Reduces acne marks and evens skin tone in just 2 weeks.",
      "Balances excess sebum secretion to control oily shine throughout the day.",
      "Formulated in pure Aloe Vera base for soothing hydration."
    ],
    howToUse: "Apply 2-3 drops after cleansing and hydrating with hyaluronic acid. Gently pat until absorbed.",
    inStock: true,
    stockCount: 60
  },
  {
    id: "prod-11",
    name: "Snail Mucin Essence",
    brand: "COSRX",
    category: "Toner",
    price: 1299,
    mrp: 1450,
    rating: 4.9,
    image: snailEssenceImg,
    concerns: ["Dullness", "Dehydration", "Barrier Repair", "Fine Lines"],
    skinTypes: ["All", "Dry", "Sensitive", "Combination"],
    ingredients: ["Snail Secretion Filtrate (96%)", "Sodium Hyaluronate", "Allantoin", "Panthenol"],
    description: "A lightweight essence which quickly absorbs into the skin and gives you a natural glow from the inside. Enriched with 96.3% snail secretion filtrate for repair.",
    benefits: [
      "Replenishes intense moisture to rebuild tired skin barriers.",
      "Soothes irritated post-breakout skin and relieves redness.",
      "Delivers the iconic Korean glass-skin bouncy finish."
    ],
    howToUse: "After cleansing and toning, apply a small amount on your entire face. Gently pat using fingertips to aid absorption.",
    inStock: true,
    stockCount: 38
  },
  {
    id: "prod-12",
    name: "Rice Sunscreen SPF 50",
    brand: "Beauty of Joseon",
    category: "Sunscreen",
    price: 1150,
    mrp: 1350,
    rating: 4.9,
    image: riceSunscreenImg,
    concerns: ["Sun Protection", "Dryness", "Dullness"],
    skinTypes: ["Normal", "Dry", "Combination", "Sensitive"],
    ingredients: ["Rice Extract (30%)", "Grain Fermented Extracts", "Niacinamide (2%)"],
    description: "An organic chemical sunscreen that applies gently on the skin and is formulated with calming and brightening ingredients. Gives a moist glow without white cast.",
    benefits: [
      "Lightweight cream texture feels like a comfortable moisturizer.",
      "Grain fermented extracts provide vitamins B, C, E and amino acids.",
      "Zero white cast and zero sticky residue under makeup."
    ],
    howToUse: "At the last step of basic skin care routine, evenly apply to areas easily exposed to UV rays.",
    inStock: true,
    stockCount: 40
  },
  {
    id: "prod-13",
    name: "Hyaluronic Acid Serum",
    brand: "The Ordinary",
    category: "Serum",
    price: 690,
    mrp: 750,
    rating: 4.7,
    image: hyaluronicSerumImg,
    concerns: ["Dryness", "Dehydration", "Fine Lines"],
    skinTypes: ["All", "Dry", "Normal", "Sensitive"],
    ingredients: ["Hyaluronic Acid (Low, Medium, High MW)", "Sodium Hyaluronate Crosspolymer", "Pro-Vitamin B5"],
    description: "A water-based formula combining multi-molecular weight hyaluronic acid molecules and a next-generation HA crosspolymer for multi-depth plumping hydration.",
    benefits: [
      "Provides multi-depth hydration to plump skin layers.",
      "Pro-Vitamin B5 promotes surface hydration and epidermal softness.",
      "Lightweight serum leaves skin feeling supple and smooth."
    ],
    howToUse: "Apply a few drops to face in the morning and evening on slightly damp skin before heavy moisturizers.",
    inStock: true,
    stockCount: 55
  },
  {
    id: "prod-14",
    name: "2% Salicylic Acid Exfoliant",
    brand: "Paula's Choice",
    category: "Toner",
    price: 1100,
    mrp: 1250,
    rating: 4.9,
    image: bhaExfoliantImg,
    concerns: ["Acne", "Large Pores", "Blackheads", "Uneven Texture"],
    skinTypes: ["Oily", "Combination", "Normal"],
    ingredients: ["Salicylic Acid (2%)", "Green Tea Extract", "Methylpropanediol"],
    description: "A gentle leave-on liquid exfoliant with salicylic acid that quickly unclogs pores, smooths wrinkles, and brightens and evens out rough skin tone.",
    benefits: [
      "Dramatically improves skin texture for radiant, even-toned skin.",
      "Beta hydroxy acid (BHA) sheds built-up layers of dead skin inside pores.",
      "Fluid, lightweight texture absorbs quickly without residue."
    ],
    howToUse: "Apply once or twice daily after cleansing & toning. Lightly soak a cotton pad and apply over the entire face.",
    inStock: true,
    stockCount: 22
  },
  {
    id: "prod-15",
    name: "Centella Ampoule",
    brand: "Skin1004",
    category: "Serum",
    price: 1250,
    mrp: 1450,
    rating: 4.9,
    image: centellaAmpouleImg,
    concerns: ["Redness", "Sensitivity", "Acne", "Barrier Repair"],
    skinTypes: ["All", "Sensitive", "Acne-Prone"],
    ingredients: ["Centella Asiatica Extract (100%)"],
    description: "An all-in-one ampoule formulated with 100% pure Madagascar Centella Asiatica extract to soothe sensitive, irritated, or compromised skin while providing hydration.",
    benefits: [
      "Calms acute skin redness, burning, and acne inflammation rapidly.",
      "Strengthens the skin barrier by supporting balanced moisture levels.",
      "Hypoallergenic, water-like texture absorbs completely without heaviness."
    ],
    howToUse: "Drop an appropriate amount and evenly apply to the skin. Pat lightly to promote absorption.",
    inStock: true,
    stockCount: 30
  },
  {
    id: "prod-16",
    name: "Ceramide Moisturizing Cream",
    brand: "CeraVe",
    category: "Moisturizer",
    price: 1199,
    mrp: 1399,
    rating: 4.8,
    image: ceramideCreamImg,
    concerns: ["Dryness", "Barrier Repair", "Flaking"],
    skinTypes: ["Dry", "Very Dry", "Sensitive"],
    ingredients: ["Ceramides (1, 3, 6-II)", "Hyaluronic Acid", "Petrolatum", "Dimethicone"],
    description: "A rich, non-greasy, fast-absorbing moisturizing cream for normal to dry skin. Restores the protective skin barrier with continuous 24-hour hydration.",
    benefits: [
      "Provides long-lasting hydration and helps restore the skin's barrier.",
      "Rich texture seals in moisture without a greasy after-feel.",
      "Non-comedogenic and fragrance-free for highly reactive skin."
    ],
    howToUse: "Apply generously as often as needed, especially after cleansing or bathing.",
    inStock: true,
    stockCount: 35
  },
  {
    id: "prod-17",
    name: "Vitamin C Serum",
    brand: "Minimalist",
    category: "Serum",
    price: 699,
    mrp: 799,
    rating: 4.7,
    image: vitaminCSerumImg,
    concerns: ["Dullness", "Hyperpigmentation", "Aging"],
    skinTypes: ["Normal", "Dry", "Oily", "Combination"],
    ingredients: ["Ethyl Ascorbic Acid (10%)", "Centella Asiatica Water", "Polyhydroxy Acid (1%)"],
    description: "A glow-boosting serum formulated with stable Vitamin C derivative (Ethyl Ascorbic Acid) to provide antioxidant protection and fade dark spots without irritation.",
    benefits: [
      "Inhibits melanin production to brighten dark spots and acne discoloration.",
      "Centella Asiatica base calms skin and prevents oxidation redness.",
      "Ultra-stable formulation that does not oxidize into orange discoloration."
    ],
    howToUse: "After cleansing and toning, apply 2-3 drops in the AM routine. Always follow with a broad-spectrum sunscreen.",
    inStock: true,
    stockCount: 48
  },
  {
    id: "prod-18",
    name: "Retinoid Serum",
    brand: "The Ordinary",
    category: "Serum",
    price: 990,
    mrp: 1150,
    rating: 4.8,
    image: retinoidSerumImg,
    concerns: ["Aging", "Fine Lines", "Uneven Texture"],
    skinTypes: ["Normal", "Dry", "Oily", "Combination"],
    ingredients: ["Hydroxypinacolone Retinoate (Granactive Retinoid)", "Tasmanian Pepperberry Extract", "Bisabolol"],
    description: "An advanced active retinoid emulsion that offers visible anti-aging results without the irritation and redness associated with traditional retinol formulas.",
    benefits: [
      "Reduces the appearance of fine lines, wrinkles, and dynamic facial folds.",
      "Accelerates epidermal turnover for smooth and refined texture.",
      "Significantly less irritating than standard retinol formulas."
    ],
    howToUse: "Apply a small amount to the face in the PM as part of your skincare regimen, after water-based serums but before heavier treatments.",
    inStock: true,
    stockCount: 26
  },
  {
    id: "prod-19",
    name: "Hyaluronic Acid Moisturizer",
    brand: "Laneige",
    category: "Moisturizer",
    price: 1950,
    mrp: 2200,
    rating: 4.9,
    image: hyaluronicCreamImg,
    concerns: ["Dehydration", "Dryness", "Barrier Repair"],
    skinTypes: ["Normal", "Dry", "Combination"],
    ingredients: ["Blue Hyaluronic Acid (Micro-ionized)", "Ceramides", "Beta-Glucan"],
    description: "A lush, fast-absorbing moisturizing cream powered by micro-ionized Blue Hyaluronic Acid that deeply quenches thirsty skin and fortifies moisture barriers.",
    benefits: [
      "Penetrates 2,000x deeper than standard hyaluronic acid.",
      "Replenishes moisture and provides up to 100 hours of hydration.",
      "Leaves skin feeling bouncy, velvety soft, and glowing."
    ],
    howToUse: "Apply evenly across face and neck morning and evening after applying your serum.",
    inStock: true,
    stockCount: 18
  },
  {
    id: "prod-20",
    name: "Heartleaf Soothing Toner",
    brand: "Anua",
    category: "Toner",
    price: 1399,
    mrp: 1600,
    rating: 4.9,
    image: heartleafTonerImg,
    concerns: ["Redness", "Acne", "Sensitivity", "Excess Oil"],
    skinTypes: ["Sensitive", "Acne-Prone", "Oily", "Combination"],
    ingredients: ["Heartleaf Extract (77%)", "Centella Asiatica", "Chamomile Extract", "Panthenol"],
    description: "The bestselling Korean soothing toner formulated with 77% Heartleaf Extract. Calms sensitive skin, reduces redness, and balances sebum production.",
    benefits: [
      "Immediately relieves heat and redness from acne flare-ups.",
      "Optimizes skin's oil-to-moisture ratio to prevent congestion.",
      "Gentle slightly acidic formula suitable for everyday multi-layer toning."
    ],
    howToUse: "After cleansing, pour onto cotton pad or palms and gently pat into skin. Can be used as a 5-minute toner mask with cotton pads.",
    inStock: true,
    stockCount: 32
  },
  {
    id: "prod-21",
    name: "Hyalu-Cica Sunscreen SPF 50",
    brand: "Skin1004",
    category: "Sunscreen",
    price: 1290,
    mrp: 1490,
    rating: 4.9,
    image: hyaluCicaSunImg,
    concerns: ["Sun Protection", "Dehydration", "Sensitivity"],
    skinTypes: ["All", "Sensitive", "Oily", "Combination"],
    ingredients: ["Centella Asiatica Extract", "Hyaluronic Acid Complex", "Baby Sprout Extracts"],
    description: "A non-nano sunscreen that blocks UV rays while simultaneously hydrating skin. Leaves a dewy, glowing finish with zero white cast and serum-like texture.",
    benefits: [
      "Ultra-lightweight serum consistency that absorbs within 10 seconds.",
      "Unique Hyalu-Cica formula calms and deeply moisturizes sun-exposed skin.",
      "Reef-safe formula with zero eye irritation."
    ],
    howToUse: "Apply thoroughly onto face, neck and ears 15 minutes before stepping into sunlight. Reapply every 2-3 hours during prolonged sun exposure.",
    inStock: true,
    stockCount: 42
  },
  {
    id: "prod-22",
    name: "Volcanic Clay Mask",
    brand: "Innisfree",
    category: "Mask",
    price: 890,
    mrp: 1100,
    rating: 4.7,
    image: volcanicClayImg,
    concerns: ["Large Pores", "Blackheads", "Excess Oil"],
    skinTypes: ["Oily", "Combination"],
    ingredients: ["Jeju Volcanic Clusters", "AHA (Lactic Acid)", "Walnut Shell Powder"],
    description: "A multi-action volcanic clay mask that provides intensive pore care by absorbing excess sebum and purifying clogged pores with cooling Jeju volcanic clusters.",
    benefits: [
      "Absorbs 98% of sebum to deeply purify congested pores.",
      "Cooling sensation tightens enlarged pore walls.",
      "Exfoliates dead skin cells to smooth rough skin surfaces."
    ],
    howToUse: "After cleansing, apply onto dry face avoiding eye and lip area. Leave on for 10-15 minutes and rinse off with lukewarm water. Use 1-2 times weekly.",
    inStock: true,
    stockCount: 20
  },
  {
    id: "prod-23",
    name: "Berry Lip Sleeping Mask",
    brand: "Laneige",
    category: "Mask",
    price: 600,
    mrp: 750,
    rating: 4.9,
    image: berryLipMaskImg,
    concerns: ["Dryness", "Flaking"],
    skinTypes: ["All"],
    ingredients: ["Berry Fruit Complex (Vitamin C)", "Coconut Oil", "Shea Butter", "Murumuru Seed Butter"],
    description: "A leave-on lip mask that soothes and moisturizes for smoother, supple lips overnight. Melt away dead skin cells and lock in deep moisture with Berry Fruit Complex.",
    benefits: [
      "Melt away flaky dry dead skin cells while you sleep.",
      "Enriched with Vitamin C and antioxidants for baby-soft lips.",
      "Provides long-lasting moisture barrier for all-day hydration."
    ],
    howToUse: "Before going to bed in the evening, apply an adequate amount on the lips using the spatula. Gently wipe clean in the morning.",
    inStock: true,
    stockCount: 50
  },
  {
    id: "prod-24",
    name: "Low pH Gel Cleanser",
    brand: "COSRX",
    category: "Cleanser",
    price: 650,
    mrp: 790,
    rating: 4.8,
    image: lowPhCleanserImg,
    concerns: ["Acne", "Excess Oil", "Sensitivity"],
    skinTypes: ["Oily", "Combination", "Sensitive"],
    ingredients: ["Tea Tree Oil (0.5%)", "Betaine Salicylate (0.5%)", "Botanical Extracts"],
    description: "A gentle gel cleanser formulated with purifying botanical ingredients and mild acids to cleanse skin to its most supple and clear texture with a skin-friendly pH of 5.3.",
    benefits: [
      "Low pH level helps maintain the healthy acidic mantle of the skin.",
      "Tea tree oil soothes blemishes and clears out pore impurities.",
      "Leaves skin feeling fresh, balanced, and non-stripped."
    ],
    howToUse: "Use morning and night after removing makeup. Work into a foaming lather and massage onto face gently before rinsing.",
    inStock: true,
    stockCount: 36
  }
];

export const INGREDIENTS_DATABASE: IngredientInfo[] = [
  {
    name: "Retinol / Retinoids",
    category: "Anti-Aging & Cellular Turnover",
    description: "A derivative of Vitamin A, Retinol is considered the ultimate gold-standard ingredient for skin rejuvenation. It works by signaling dermal receptors to speed up cellular turnover and promote collagen synthesis.",
    benefits: [
      "Visibly reduces fine lines, deep wrinkles, and crows feet.",
      "Smooths out uneven rough skin texture and refines pore walls.",
      "Fades persistent acne markings and environmental sunspots."
    ],
    skinTypes: ["Normal", "Dry", "Oily", "Combination"],
    tier: "Gold Standard"
  },
  {
    name: "Vitamin C (L-Ascorbic Acid)",
    category: "Antioxidant & Luminosity",
    description: "A potent water-soluble antioxidant that neutralizes free radicals caused by daily UV rays and urban pollution. It actively inhibits melanin production to clarify overall skin tone.",
    benefits: [
      "Powerful brightening effect to clear up dull, tired skin complexions.",
      "Promotes natural skin elasticity and firms loose tissue.",
      "Fades hyperpigmentation and sunspots."
    ],
    skinTypes: ["Normal", "Dry", "Oily", "Combination"],
    tier: "Gold Standard"
  },
  {
    name: "Niacinamide (Vitamin B3)",
    category: "Barrier Fortifying & Sebum Balance",
    description: "A versatile, highly stable vitamin that addresses multiple skin concerns simultaneously. It is loved for its incredible compatibility across all skin types.",
    benefits: [
      "Triggers the synthesis of natural skin ceramides to heal lipid barrier.",
      "Reduces active redness, swelling, and facial irritation.",
      "Balances sebum (oil) excretion to dry out oily pores."
    ],
    skinTypes: ["All", "Sensitive", "Dry", "Oily"],
    tier: "Hydrator"
  },
  {
    name: "Salicylic Acid (BHA)",
    category: "Chemical Exfoliation & Pore Clearing",
    description: "An oil-soluble chemical exfoliant that can bypass natural facial lipids to sink deep into sebum-filled pores. It dissolves blockages of dirt, dead skin, and grease.",
    benefits: [
      "Deeply cleanses congested pores and blackheads.",
      "Has powerful anti-inflammatory and antibacterial properties to clear up acne.",
      "Calms inflamed skin during breakouts."
    ],
    skinTypes: ["Oily", "Combination"],
    tier: "Exfoliant"
  },
  {
    name: "Hyaluronic Acid",
    category: "Humectant & Deep Hydration",
    description: "A molecule naturally occurring in our skin that can hold up to 1000 times its own weight in water. It pulls atmospheric moisture directly into dry skin cells.",
    benefits: [
      "Incredibly plumps up fine dry lines instantly.",
      "Delivers intense, weightless hydration.",
      "Assists in skin healing and cell hydration."
    ],
    skinTypes: ["All", "Dry", "Sensitive"],
    tier: "Hydrator"
  },
  {
    name: "Ceramides",
    category: "Barrier Recovery & Lipids",
    description: "Lipids (fats) that constitute over 50% of our natural skin barrier. They act as the 'mortar' between skin-cell 'bricks' to block water loss and prevent environmental irritants from slipping into deep skin layers.",
    benefits: [
      "Restores natural skin barrier health.",
      "Extremely relieves flakiness, dryness, and chapped textures.",
      "Reduces skin sensitivity and reactivity."
    ],
    skinTypes: ["Dry", "Sensitive", "Normal"],
    tier: "Soothe"
  }
];

export interface CompatibilityResult {
  compatible: boolean;
  severity: "none" | "low" | "medium" | "high";
  title: string;
  verdict: string;
}

export const getIngredientCompatibility = (ing1: string, ing2: string): CompatibilityResult => {
  const i1 = ing1.toLowerCase();
  const i2 = ing2.toLowerCase();

  if (i1 === i2) {
    return {
      compatible: true,
      severity: "none",
      title: "Same Ingredient",
      verdict: "Perfect compatibility. These represent the same compound, designed to work naturally together."
    };
  }

  // Retinol + Vitamin C
  if ((i1.includes("retinol") && i2.includes("vitamin c")) || (i1.includes("vitamin c") && i2.includes("retinol"))) {
    return {
      compatible: false,
      severity: "high",
      title: "Potential Severe Irritation",
      verdict: "Retinol works best in a low pH environment (around 5.5-6) while L-Ascorbic Acid (Vitamin C) is highly acidic (pH 2.5-3.5). Layering them together neutralizes their effectiveness and can trigger skin peeling, severe redness, and skin barrier collapse. Use Vitamin C in the Morning (AM) and Retinol at Night (PM)."
    };
  }

  // Retinol + Salicylic Acid (BHA)
  if ((i1.includes("retinol") && i2.includes("salicylic")) || (i1.includes("salicylic") && i2.includes("retinol"))) {
    return {
      compatible: false,
      severity: "high",
      title: "Acid Over-Exfoliation Risk",
      verdict: "Both ingredients accelerate skin shedding. Combining them in a single session strips essential skin lipids, causing raw irritation, flaking, and severe breakouts. We recommend rotating nights: use BHA on nights 1 & 2, and Retinol on nights 3 & 4."
    };
  }

  // Vitamin C + Salicylic Acid (BHA)
  if ((i1.includes("vitamin c") && i2.includes("salicylic")) || (i1.includes("salicylic") && i2.includes("vitamin c"))) {
    return {
      compatible: true,
      severity: "medium",
      title: "Use with Caution",
      verdict: "While chemically compatible because both are acidic, layering them directly on top of each other can be too harsh for sensitive skin. Apply BHA first, wait 5 minutes, then apply Vitamin C, or split them: Vitamin C in the AM, BHA in the PM."
    };
  }

  // Niacinamide + Vitamin C
  if ((i1.includes("niacinamide") && i2.includes("vitamin c")) || (i1.includes("vitamin c") && i2.includes("niacinamide"))) {
    return {
      compatible: true,
      severity: "low",
      title: "Slight Glow Synergy",
      verdict: "A common myth suggests these can't be mixed, but modern formulations allow safe pairing. They work together beautifully to target hyperpigmentation from separate pathways: Vitamin C stops melanin production, while Niacinamide blocks its transfer into skin cells. Apply Vitamin C first, wait 2-3 minutes, then apply Niacinamide."
    };
  }

  // Ceramides + Retinol
  if ((i1.includes("ceramides") && i2.includes("retinol")) || (i1.includes("retinol") && i2.includes("ceramides"))) {
    return {
      compatible: true,
      severity: "none",
      title: "Perfect Golden Synergy",
      verdict: "Ceramides are highly recommended to use alongside Retinol. Retinol can cause initial dryness and shedding, and Ceramides provide the crucial lipid mortar to repair and fortify the barrier, significantly reducing Retinol flaking and irritation."
    };
  }

  // Ceramides + Hyaluronic Acid
  if ((i1.includes("ceramides") && i2.includes("hyaluronic")) || (i1.includes("hyaluronic") && i2.includes("ceramides"))) {
    return {
      compatible: true,
      severity: "none",
      title: "Ultimate Hydration Duo",
      verdict: "An amazing duo for all skin types! Hyaluronic Acid draws moisture deep into skin cells, while Ceramides lock it in and prevent evaporation (Transepidermal Water Loss). A highly safe, soothing, and restorative pairing."
    };
  }

  // Default fallback compatibility
  return {
    compatible: true,
    severity: "none",
    title: "Safe to Layer",
    verdict: "These ingredients can be safely integrated into the same skincare routine. Apply water-based or thinner products first, followed by heavier, lipid-rich formulas."
  };
};

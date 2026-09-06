import { CURATED_PRODUCTS } from "../data/skincareData";
import { SkincareProduct, VisionScanResult } from "../types";

export interface SkinConcernFinding {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  detectedZone?: string;
  sourceText?: string;
}

export interface RecommendedProductItem {
  product: SkincareProduct;
  skinConcern: string;
  explanation: string;
  matchScore: number;
}

/**
 * Extracts normalized, ranked skin concerns from a VisionScanResult.
 */
export function extractDetectedConcerns(scanResult: VisionScanResult): SkinConcernFinding[] {
  const findings: SkinConcernFinding[] = [];
  const addedIds = new Set<string>();

  const checkAndAdd = (id: string, label: string, severity: "high" | "medium" | "low", zone?: string, source?: string) => {
    if (!addedIds.has(id)) {
      addedIds.add(id);
      findings.push({ id, label, severity, detectedZone: zone, sourceText: source });
    }
  };

  // 1. Analyze primaryIdentifiedConcerns text from scan
  const allConcernsText = (scanResult.primaryIdentifiedConcerns || []).join(" ").toLowerCase();
  const skinTypeText = (scanResult.detectedSkinType || "").toLowerCase();

  // 2. Check each diagnostic zone
  (scanResult.zones || []).forEach((zone) => {
    const zName = zone.zoneName.toLowerCase();
    const keyFinding = (zone.keyFinding || "").toLowerCase();

    // Excess Oil / Sebaceous Activity
    if (
      zone.poreDensityScore > 50 ||
      keyFinding.includes("sebum") ||
      keyFinding.includes("lipid") ||
      keyFinding.includes("oil") ||
      allConcernsText.includes("oil") ||
      skinTypeText.includes("oily")
    ) {
      checkAndAdd("excess_oil", "Excess oil", zone.status === "Attention Needed" ? "high" : "medium", zone.zoneName, zone.keyFinding);
    }

    // Acne / Breakouts / Follicular Congestion
    if (
      keyFinding.includes("acne") ||
      keyFinding.includes("breakout") ||
      keyFinding.includes("congestion") ||
      keyFinding.includes("comedone") ||
      keyFinding.includes("blackhead") ||
      allConcernsText.includes("acne") ||
      allConcernsText.includes("congestion")
    ) {
      checkAndAdd("acne", "Acne & follicular congestion", zone.status === "Attention Needed" ? "high" : "medium", zone.zoneName, zone.keyFinding);
    }

    // Dryness / Dehydration
    if (
      zone.hydrationScore < 70 ||
      keyFinding.includes("dehydration") ||
      keyFinding.includes("dry") ||
      keyFinding.includes("flaking") ||
      allConcernsText.includes("dehydration") ||
      skinTypeText.includes("dry")
    ) {
      checkAndAdd("dryness", "Dryness / Dehydration", zone.hydrationScore < 60 ? "high" : "medium", zone.zoneName, zone.keyFinding);
    }

    // Redness / Sensitivity / Erythema
    if (
      zone.rednessScore > 30 ||
      keyFinding.includes("redness") ||
      keyFinding.includes("erythema") ||
      keyFinding.includes("reactive") ||
      keyFinding.includes("soothing") ||
      allConcernsText.includes("erythema") ||
      allConcernsText.includes("redness")
    ) {
      checkAndAdd("redness", "Redness / Sensitivity", zone.rednessScore > 40 ? "high" : "medium", zone.zoneName, zone.keyFinding);
    }

    // Under-Eye Concerns
    if (
      zName.includes("eye") ||
      keyFinding.includes("orbital") ||
      keyFinding.includes("under-eye") ||
      allConcernsText.includes("eye")
    ) {
      if (zone.status !== "Optimal" || zone.fineLinesScore > 25 || zone.hydrationScore < 70) {
        checkAndAdd("undereye", "Under-eye fatigue & micro-lines", "medium", "Under-Eye", zone.keyFinding);
      }
    }

    // Uneven Texture / Fine Lines
    if (
      zone.fineLinesScore > 25 ||
      keyFinding.includes("texture") ||
      keyFinding.includes("rough") ||
      keyFinding.includes("lines") ||
      allConcernsText.includes("texture")
    ) {
      checkAndAdd("uneven_texture", "Uneven texture", zone.fineLinesScore > 35 ? "high" : "medium", zone.zoneName, zone.keyFinding);
    }

    // Dark Spots / Hyperpigmentation
    if (
      keyFinding.includes("pigment") ||
      keyFinding.includes("dark spot") ||
      keyFinding.includes("melanin") ||
      keyFinding.includes("sunspot") ||
      allConcernsText.includes("pigment") ||
      allConcernsText.includes("dark spot")
    ) {
      checkAndAdd("hyperpigmentation", "Dark spots / Hyperpigmentation", "medium", zone.zoneName, zone.keyFinding);
    }
  });

  // Fallback if no issues exceeded threshold: provide top diagnostic findings
  if (findings.length === 0) {
    if (allConcernsText.includes("oil") || skinTypeText.includes("oily")) {
      checkAndAdd("excess_oil", "Excess oil", "medium");
    }
    if (allConcernsText.includes("red") || allConcernsText.includes("erythema")) {
      checkAndAdd("redness", "Redness / Sensitivity", "medium");
    }
    if (allConcernsText.includes("dry") || allConcernsText.includes("dehydrat")) {
      checkAndAdd("dryness", "Dryness / Dehydration", "medium");
    }
    if (findings.length === 0) {
      // Default to balanced preventative care
      checkAndAdd("excess_oil", "Excess oil", "low");
      checkAndAdd("uneven_texture", "Uneven texture", "low");
    }
  }

  // Rank findings: high severity first, then medium, then low
  const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  findings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return findings;
}

/**
 * Returns prioritized product recommendations strictly matching CURATED_PRODUCTS.
 * Generates clear, non-medical explanations tailored to the detected concerns.
 */
export function getRecommendedProductsForScan(scanResult: VisionScanResult): RecommendedProductItem[] {
  const detectedConcerns = extractDetectedConcerns(scanResult);
  const concernIds = new Set(detectedConcerns.map((c) => c.id));
  
  const recommendations: RecommendedProductItem[] = [];
  const addedProductIds = new Set<string>();

  // Map of verified products in CURATED_PRODUCTS tailored to specific concern categories
  // All IDs and objects correspond 1:1 with src/data/skincareData.ts
  const catalogMap = new Map<string, SkincareProduct>();
  CURATED_PRODUCTS.forEach((p) => catalogMap.set(p.id, p));

  const addRecommendation = (
    productId: string,
    skinConcern: string,
    explanation: string,
    score: number
  ) => {
    if (!addedProductIds.has(productId) && catalogMap.has(productId)) {
      addedProductIds.add(productId);
      recommendations.push({
        product: catalogMap.get(productId)!,
        skinConcern,
        explanation,
        matchScore: score
      });
    }
  };

  // 1. ACNE / BREAKOUTS
  if (concernIds.has("acne")) {
    addRecommendation(
      "prod-2",
      "Acne & Follicular Blemishes",
      "Recommended because your facial scan detected localized sebum elevation and pore congestion.",
      98
    );
    addRecommendation(
      "prod-14",
      "Acne & Blackheads",
      "Recommended because 2% Salicylic Acid penetrates deep inside congested pores to clear trapped debris without harsh scrubbing.",
      94
    );
    addRecommendation(
      "prod-10",
      "Blemishes & Pore Appearance",
      "Recommended because 10% Niacinamide with Zinc PCA helps refine pore walls and visibly reduce active blemish marks.",
      90
    );
  }

  // 2. OILY SKIN / EXCESS OIL
  if (concernIds.has("excess_oil")) {
    addRecommendation(
      "prod-10",
      "Excess Oil & Sebum Balance",
      "Recommended because your facial scan detected elevated sebum activity in the T-Zone.",
      96
    );
    addRecommendation(
      "prod-7",
      "Oil-Free Hydration & Sebum Control",
      "Recommended because oily and combination zones need lightweight, water-based hydration without clogging pores.",
      92
    );
    addRecommendation(
      "prod-22",
      "Pore Congestion & Excess Shine",
      "Recommended because volcanic clay clusters absorb surface oils and purify congested follicle openings.",
      88
    );
    addRecommendation(
      "prod-24",
      "Excess Oil & Gentle Cleansing",
      "Recommended for gentle, slightly acidic daily cleansing to balance excess shine while preserving the barrier.",
      84
    );
  }

  // 3. DRYNESS / DEHYDRATION
  if (concernIds.has("dryness")) {
    addRecommendation(
      "prod-13",
      "Dehydration & Moisture Deficit",
      "Recommended because your facial scan detected superficial hydration deficits across dermal test points.",
      97
    );
    addRecommendation(
      "prod-6",
      "Dryness & Lipid Barrier Repair",
      "Recommended to replenish essential ceramides and prevent trans-epidermal moisture loss throughout the day.",
      93
    );
    addRecommendation(
      "prod-1",
      "Dryness & Flaking",
      "Recommended to provide gentle, non-stripping facial cleansing enriched with sakura botanical hydrators.",
      89
    );
    addRecommendation(
      "prod-16",
      "Dryness & Barrier Support",
      "Recommended for deep continuous 24-hour hydration where significant moisture depletion was identified.",
      86
    );
  }

  // 4. REDNESS / SENSITIVITY
  if (concernIds.has("redness")) {
    addRecommendation(
      "prod-15",
      "Redness & Malar Sensitivity",
      "Recommended because your facial scan identified localized cheek erythema and barrier reactivity.",
      97
    );
    addRecommendation(
      "prod-20",
      "Redness & Inflammation",
      "Recommended because 77% Heartleaf Extract relieves skin heat, calms sensitivity, and balances flush zones.",
      93
    );
    addRecommendation(
      "prod-7",
      "Sensitivity & Barrier Soothing",
      "Recommended because Centella Asiatica calming gel immediately soothes irritated, flushed facial zones.",
      89
    );
    addRecommendation(
      "prod-21",
      "Sun Protection & Sensitive Skin",
      "Recommended to protect sensitive, reactive skin from UV-induced redness with a soothing chemical filter.",
      85
    );
  }

  // 5. UNDER-EYE CONCERNS
  if (concernIds.has("undereye")) {
    addRecommendation(
      "prod-11",
      "Under-Eye Micro-Dehydration",
      "Recommended because your facial scan detected delicate under-eye moisture depletion requiring weightless plumping.",
      95
    );
    addRecommendation(
      "prod-13",
      "Under-Eye Fine Lines",
      "Recommended because multi-weight hyaluronic molecules cushion the thin peri-orbital skin to smooth early dryness lines.",
      91
    );
    addRecommendation(
      "prod-4",
      "Under-Eye Tone & Micro-Fatigue",
      "Recommended to gently brighten the peri-orbital perimeter and support micro-circulation.",
      87
    );
  }

  // 6. UNEVEN TEXTURE
  if (concernIds.has("uneven_texture")) {
    addRecommendation(
      "prod-3",
      "Uneven Texture & Dullness",
      "Recommended because fermented rice amino acids gently refine surface roughness and boost suppleness.",
      94
    );
    addRecommendation(
      "prod-5",
      "Uneven Texture & Keratin Buildup",
      "Recommended because a balanced AHA/BHA blend accelerates epidermal renewal to smooth out rough patches.",
      91
    );
    addRecommendation(
      "prod-18",
      "Uneven Texture & Micro-Lines",
      "Recommended because advanced granactive retinoid smooths skin texture without the typical irritation of retinol.",
      88
    );
  }

  // 7. DARK SPOTS / HYPERPIGMENTATION
  if (concernIds.has("hyperpigmentation")) {
    addRecommendation(
      "prod-17",
      "Dark Spots & Hyperpigmentation",
      "Recommended because stabilized Vitamin C targets uneven melanin production and brightens persistent spots.",
      96
    );
    addRecommendation(
      "prod-4",
      "Hyperpigmentation & Post-Blemish Marks",
      "Recommended because Niacinamide blocks pigment transfer into skin cells to clarify discoloration.",
      91
    );
    addRecommendation(
      "prod-8",
      "Pigmentation & Sun Protection",
      "Recommended because broad-spectrum UV defense prevents hyperpigmentation from deepening.",
      87
    );
  }

  // Ensure broad coverage: if fewer than 3 products matched, add baseline balancing essentials
  if (recommendations.length < 3) {
    addRecommendation(
      "prod-12",
      "Daily Sun Defense",
      "Recommended to shield newly scanned facial zones from UV photo-aging and environmental oxidation.",
      80
    );
    addRecommendation(
      "prod-3",
      "Skin Barrier Hydration",
      "Recommended for daily pH balancing and gentle barrier hydration.",
      78
    );
  }

  // Sort strictly by match score descending
  recommendations.sort((a, b) => b.matchScore - a.matchScore);

  return recommendations;
}

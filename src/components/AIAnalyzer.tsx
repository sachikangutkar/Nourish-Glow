import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Dna, 
  Check, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  RotateCcw,
  Loader2,
  ChevronRight,
  ChevronLeft,
  User,
  ShieldCheck,
  Award
} from "lucide-react";
import { RoutineStep, SkinAnalysis } from "../types";
import { getUserItem, setUserItem } from "../lib/userStorage";

interface AIAnalyzerProps {
  onAdoptRoutine: (analysis: SkinAnalysis) => void;
  currentAnalysis: SkinAnalysis | null;
  user?: { uid: string; displayName?: string } | null;
  onAnalysisComplete?: (analysis: SkinAnalysis) => void;
}

export default function AIAnalyzer({ onAdoptRoutine, currentAnalysis, user, onAnalysisComplete }: AIAnalyzerProps) {
  // Form states initialized from user-scoped storage or defaults
  const [skinType, setSkinType] = useState<string>("Combination");
  const [concerns, setConcerns] = useState<string[]>(["acne"]);
  const [sensitivity, setSensitivity] = useState<string>("Moderate");
  const [climate, setClimate] = useState<string>("Moderate/Temperate");
  const [lifestyle, setLifestyle] = useState<string[]>(["Sun Exposure"]);
  
  // Quiz progress / UI states
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysis | null>(currentAnalysis);
  const [scanMessage, setScanMessage] = useState<string>("");
  const [adoptSuccess, setAdoptSuccess] = useState<boolean>(false);

  // Sync with current user profile
  useEffect(() => {
    if (user?.uid) {
      const savedAnswers = getUserItem<any>(user.uid, "quiz_answers", null);
      if (savedAnswers) {
        if (savedAnswers.skinType) setSkinType(savedAnswers.skinType);
        if (savedAnswers.concerns) setConcerns(savedAnswers.concerns);
        if (savedAnswers.sensitivity) setSensitivity(savedAnswers.sensitivity);
        if (savedAnswers.climate) setClimate(savedAnswers.climate);
        if (savedAnswers.lifestyle) setLifestyle(savedAnswers.lifestyle);
      } else {
        // Fresh user state
        setSkinType("Combination");
        setConcerns([]);
        setSensitivity("Low");
        setClimate("Moderate/Temperate");
        setLifestyle([]);
      }

      const savedResult = getUserItem<SkinAnalysis | null>(user.uid, "analysis", null);
      setAnalysisResult(savedResult || currentAnalysis);
    } else {
      setAnalysisResult(currentAnalysis);
    }
  }, [user?.uid, currentAnalysis]);

  const skinTypesList = [
    { name: "Dry", desc: "Tight, flaky, prone to rough patches", icon: "🏜️" },
    { name: "Oily", desc: "Greasy sheen, large visible pores, breakouts", icon: "✨" },
    { name: "Sensitive", desc: "Prone to redness, burning, rashes", icon: "🌸" },
    { name: "Normal", desc: "Balanced moisture, tiny pores, rare spots", icon: "⚖️" },
    { name: "Combination", desc: "Oily T-zone, dry or normal cheeks", icon: "🎭" }
  ];

  const concernsList = [
    { id: "acne", label: "Active Acne & Breakouts", desc: "Pimples, blackheads, whiteheads" },
    { id: "aging", label: "Fine Lines & Aging", desc: "Loss of firmness, crow's feet, wrinkles" },
    { id: "dullness", label: "Dullness / Fatigue", desc: "Lack of natural radiance, grayish complexion" },
    { id: "hyperpigmentation", label: "Dark Spots & Pigment", desc: "Acne scarring, sun freckles, melasma" },
    { id: "redness", label: "Redness & Barrier Break", desc: "Inflamed cells, persistent flushing" },
    { id: "pores", label: "Enlarged Pores & Clogs", desc: "Rough skin texture, visible oil pools" }
  ];

  const sensitivityList = ["None", "Low", "Moderate", "High"];

  const climatesList = ["Dry/Desert", "Hot/Humid", "Cold/Windy", "Moderate/Temperate"];

  const lifestyleList = [
    "High Daily Stress",
    "Sleep Deprived (< 6 hours)",
    "Frequent Sun Exposure",
    "High Caffeine/Sugar",
    "Air Pollutant Exposure"
  ];

  const handleToggleConcern = (id: string) => {
    if (concerns.includes(id)) {
      setConcerns(concerns.filter(item => item !== id));
    } else {
      setConcerns([...concerns, id]);
    }
  };

  const handleToggleLifestyle = (id: string) => {
    if (lifestyle.includes(id)) {
      setLifestyle(lifestyle.filter(item => item !== id));
    } else {
      setLifestyle([...lifestyle, id]);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Dynamic calculation engine strictly derived from actual user answers
   */
  const calculateDynamicAnalysis = (): SkinAnalysis => {
    // Base scores
    let hydration = 75;
    let barrier = 78;
    let sebum = 65;
    let clarity = 80;

    // Adjust for skin type
    if (skinType === "Dry") {
      hydration = 54;
      barrier = 68;
      sebum = 38;
      clarity = 78;
    } else if (skinType === "Oily") {
      hydration = 76;
      barrier = 80;
      sebum = 89;
      clarity = 66;
    } else if (skinType === "Sensitive") {
      hydration = 64;
      barrier = 58;
      sebum = 62;
      clarity = 72;
    } else if (skinType === "Combination") {
      hydration = 68;
      barrier = 75;
      sebum = 78;
      clarity = 74;
    } else if (skinType === "Normal") {
      hydration = 84;
      barrier = 86;
      sebum = 58;
      clarity = 88;
    }

    // Adjust for concerns
    if (concerns.includes("acne")) {
      clarity -= 14;
      sebum += 8;
    }
    if (concerns.includes("pores")) {
      sebum += 6;
      clarity -= 6;
    }
    if (concerns.includes("redness")) {
      barrier -= 12;
    }
    if (concerns.includes("dullness")) {
      clarity -= 10;
      hydration -= 6;
    }
    if (concerns.includes("aging")) {
      hydration -= 5;
      barrier -= 4;
    }
    if (concerns.includes("hyperpigmentation")) {
      clarity -= 12;
    }

    // Adjust for sensitivity
    if (sensitivity === "High") {
      barrier -= 14;
    } else if (sensitivity === "Moderate") {
      barrier -= 6;
    }

    // Adjust for climate
    if (climate === "Dry/Desert") {
      hydration -= 12;
      barrier -= 6;
    } else if (climate === "Hot/Humid") {
      sebum += 10;
    } else if (climate === "Cold/Windy") {
      hydration -= 8;
      barrier -= 8;
    }

    // Adjust for lifestyle
    if (lifestyle.includes("Sleep Deprived (< 6 hours)")) {
      hydration -= 6;
      clarity -= 6;
    }
    if (lifestyle.includes("High Daily Stress")) {
      barrier -= 6;
      sebum += 5;
    }
    if (lifestyle.includes("Frequent Sun Exposure")) {
      barrier -= 6;
      clarity -= 5;
    }

    // Clamp values between 35 and 98
    hydration = Math.max(35, Math.min(98, hydration));
    barrier = Math.max(35, Math.min(98, barrier));
    sebum = Math.max(35, Math.min(98, sebum));
    clarity = Math.max(35, Math.min(98, clarity));

    // Calculate composite skin score
    const skinScore = Math.round((hydration * 0.28) + (barrier * 0.32) + ((100 - Math.abs(sebum - 55)) * 0.20) + (clarity * 0.20));

    // Generate customized AM routine
    const amRoutine: RoutineStep[] = [
      {
        step: 1,
        category: "Cleanser",
        name: (skinType === "Oily" || concerns.includes("acne"))
          ? "Clarifying Salicylic & Zinc Gel Cleanser"
          : (skinType === "Sensitive" || sensitivity === "High")
          ? "Ultra-Gentle Centella Balancing Wash"
          : "Sakura Hydrating Rice Cleanser",
        purpose: "Purifies dermal surface without disrupting lipid barrier equilibrium",
        instructions: "Apply to damp skin, massage in gentle upward circles for 30s, rinse with tepid water",
        activeIngredients: (skinType === "Oily" || concerns.includes("acne"))
          ? ["0.5% Salicylic Acid", "Zinc PCA", "Green Tea Extract"]
          : ["Fermented Rice Water", "Centella Asiatica", "Glycerin"],
        completed: false
      },
      {
        step: 2,
        category: "Toner / Essence",
        name: concerns.includes("redness") || sensitivity === "High"
          ? "Calming Mugwort & Madecassoside Barrier Toner"
          : concerns.includes("hyperpigmentation")
          ? "Radiance Ferment & Niacinamide Essence"
          : "Bio-Hydrating Multi-Hyaluronic Essence",
        purpose: "Restores optimal physiological pH and infuses deep hydration into upper keratinocytes",
        instructions: "Pat 3-4 drops directly onto face and neck until absorbed",
        activeIngredients: ["3% Niacinamide", "Panthenol", "Hyaluronic Acid"],
        completed: false
      },
      {
        step: 3,
        category: "Moisturizer",
        name: skinType === "Oily"
          ? "Oil-Free Squalane Hydro Gel"
          : skinType === "Dry"
          ? "Intensive Ceramide NP Recovery Cream"
          : "Lightweight Barrier Shield Emulsion",
        purpose: "Seals in hydration and reinforces cellular lipid cohesion",
        instructions: "Smooth a nickel-sized amount evenly over face and neck",
        activeIngredients: ["Ceramides (EOP, NP, AP)", "Squalane", "Hyaluronic Acid"],
        completed: false
      },
      {
        step: 4,
        category: "Sunscreen",
        name: "Broad Spectrum Mineral & Hybrid SPF 50+ PA++++",
        purpose: "Non-negotiable photoprotection against UVA/UVB photo-damage and post-inflammatory pigmentation",
        instructions: "Dispense two finger lengths and apply evenly as the final morning step",
        activeIngredients: ["Zinc Oxide (12%)", "Niacinamide (2%)", "Ectoin"],
        completed: false
      }
    ];

    // Generate customized PM routine
    const pmRoutine: RoutineStep[] = [
      {
        step: 1,
        category: "Cleanser",
        name: "Botanical Melting Oil & Double Cleanser",
        purpose: "Thoroughly dissolves mineral sunscreen, environmental particulates, and excess sebum",
        instructions: "Massage onto dry skin for 45s, emulsify with warm water, rinse clean",
        activeIngredients: ["Jojoba Oil", "Camellia Seed Extract", "Vitamin E"],
        completed: false
      },
      {
        step: 2,
        category: "Treatment Serum",
        name: concerns.includes("acne")
          ? "2% BHA Salicylic & Tea Tree Clearing Serum"
          : concerns.includes("aging")
          ? "Encapsulated 0.3% Retinol & Multi-Peptide Serum"
          : concerns.includes("hyperpigmentation")
          ? "10% Niacinamide & Alpha-Arbutin Radiance Serum"
          : "Copper Tripeptide & Barrier Repair Serum",
        purpose: "Targeted nocturnal cellular repair and epidermal renewal",
        instructions: "Apply 2-3 drops to dry skin. Tap lightly until absorbed",
        activeIngredients: concerns.includes("acne")
          ? ["Salicylic Acid (2%)", "Zinc PCA"]
          : concerns.includes("aging")
          ? ["Encapsulated Retinol (0.3%)", "Palmitoyl Tripeptide-38"]
          : ["Niacinamide (10%)", "Alpha Arbutin (2%)"],
        completed: false
      },
      {
        step: 3,
        category: "Moisturizer",
        name: "Ceramide Overnight Cellular Recovery Balm",
        purpose: "Locks in nocturnal trans-epidermal moisture and prevents overnight dehydration",
        instructions: "Warm between fingertips and gently press into skin",
        activeIngredients: ["Phytoceramides", "Cholesterol", "Colloidal Oatmeal"],
        completed: false
      }
    ];

    // Recommended & avoided ingredients
    const rec: string[] = ["Ceramides", "Hyaluronic Acid", "Niacinamide"];
    const avoid: string[] = ["Alcohol Denat", "Synthetic Fragrances"];

    if (concerns.includes("acne")) {
      rec.push("Salicylic Acid", "Zinc PCA");
      avoid.push("Comedogenic Coconut Oil", "Heavy Petrolatum");
    }
    if (concerns.includes("aging")) {
      rec.push("Retinol", "Copper Peptides");
    }
    if (concerns.includes("hyperpigmentation")) {
      rec.push("Vitamin C", "Alpha Arbutin");
    }
    if (sensitivity === "High" || concerns.includes("redness")) {
      rec.push("Centella Asiatica", "Madecassoside");
      avoid.push("High % Glycolic Acid", "Physical Scrubs", "Essential Oils");
    }

    return {
      skinScore,
      metrics: {
        hydration,
        barrier,
        sebum,
        clarity
      },
      summary: `Diagnostic profile constructed for ${skinType} dermal characteristics in a ${climate} climate with focus on ${concerns.join(", ") || "daily vitality"}. ${sensitivity !== "None" ? `Barrier configured for ${sensitivity} sensitivity resilience.` : ""}`,
      amRoutine,
      pmRoutine,
      expertTips: [
        `In a ${climate} environment, balance ambient humidity and stay consistent with daytime SPF 50+ protection.`,
        "Allow treatment serums 90 seconds to fully absorb before layering heavier lipid moisturizers.",
        "Maintain your AM & PM steps consistently for at least 21-28 days to match your skin's natural cellular turnover cycle."
      ],
      ingredientInsights: {
        recommended: rec,
        avoid
      }
    };
  };

  const runSkinScanner = async () => {
    setIsAnalyzing(true);
    setAdoptSuccess(false);

    try {
      setScanMessage("Initiating clinical skin profile evaluation...");
      await sleep(700);
      setScanMessage("Assessing lipid barrier integrity and sebum regulation index...");
      await sleep(800);
      setScanMessage("Calculating cellular hydration and epidermal water loss...");
      await sleep(700);
      setScanMessage("Synthesizing personalized AM/PM routine formulas...");
      await sleep(600);

      let result: SkinAnalysis;

      try {
        const response = await fetch("/api/analyze-skin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skinType,
            concerns,
            sensitivity,
            climate,
            lifestyle
          })
        });

        if (response.ok) {
          result = await response.json();
        } else {
          result = calculateDynamicAnalysis();
        }
      } catch (e) {
        result = calculateDynamicAnalysis();
      }

      setAnalysisResult(result);
      onAnalysisComplete?.(result);

      // Save user-scoped data if user is logged in
      if (user?.uid) {
        setUserItem(user.uid, "analysis", result);
        setUserItem(user.uid, "quiz_answers", {
          skinType,
          concerns,
          sensitivity,
          climate,
          lifestyle
        });
      }
    } catch (err) {
      console.warn("Quiz calculation error, fallback engaged:", err);
      const fallbackResult = calculateDynamicAnalysis();
      setAnalysisResult(fallbackResult);
      if (user?.uid) {
        setUserItem(user.uid, "analysis", fallbackResult);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAdopt = () => {
    if (analysisResult) {
      onAdoptRoutine(analysisResult);
      setAdoptSuccess(true);
      setTimeout(() => {
        setAdoptSuccess(false);
      }, 4000);
    }
  };

  const resetQuiz = () => {
    setAnalysisResult(null);
    setCurrentStep(1);
    setAdoptSuccess(false);
  };

  // Render scanner loading animation
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-fade-in max-w-2xl mx-auto text-center">
        <div className="relative flex items-center justify-center w-36 h-36">
          <div className="absolute inset-0 border-4 border-rose-400/20 rounded-full animate-ping" />
          <div className="absolute inset-2 border-4 border-rose-500/30 rounded-full animate-pulse" />
          <div className="absolute inset-4 border-2 border-dashed border-rose-500/70 rounded-full animate-spin-slow" />
          <div className="h-20 w-20 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center shadow-md">
            <Dna className="h-8 w-8 text-rose-500 animate-pulse" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-serif font-semibold text-slate-900 tracking-tight">
            AI Dermal Biomarker Assessment
          </h3>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1.5">
            Analyzing your parameters • Please wait
          </p>
        </div>

        <div className="p-4 bg-white border border-rose-100 rounded-2xl w-full max-w-md flex items-center justify-center gap-3 shadow-xs">
          <Loader2 className="h-4 w-4 text-rose-500 animate-spin" />
          <span className="text-xs font-mono text-slate-700">{scanMessage}</span>
        </div>
      </div>
    );
  }

  // Render analysis result view
  if (analysisResult) {
    const skinScore = analysisResult.skinScore ?? 80;
    const metrics = analysisResult.metrics ?? { hydration: 78, barrier: 82, sebum: 65, clarity: 85 };
    const summary = analysisResult.summary ?? "Personalized clinical evaluation completed.";
    const safeAmRoutine = Array.isArray(analysisResult.amRoutine) ? analysisResult.amRoutine : [];
    const safePmRoutine = Array.isArray(analysisResult.pmRoutine) ? analysisResult.pmRoutine : [];
    const safeExpertTips = Array.isArray(analysisResult.expertTips) ? analysisResult.expertTips : [];
    const safeRecommended = Array.isArray(analysisResult.ingredientInsights?.recommended) ? analysisResult.ingredientInsights.recommended : [];
    const safeAvoid = Array.isArray(analysisResult.ingredientInsights?.avoid) ? analysisResult.ingredientInsights.avoid : [];
    return (
      <div className="space-y-8 animate-fade-in">
        {adoptSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Custom Routine Successfully Adopted!</p>
                <p className="text-xs text-emerald-700">Your personalized AM &amp; PM regimen steps have been synchronized to your Routine Planner and Dashboard.</p>
              </div>
            </div>
            <button
              onClick={() => setAdoptSuccess(false)}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header Summary */}
        <div id="ai-diagnostic-report-container" className="border border-rose-100 bg-white p-6 sm:p-8 rounded-3xl shadow-xs">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-rose-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full border border-rose-200 font-mono font-bold uppercase tracking-wider">
                  Personalized Diagnostic Report
                </span>
                {user?.displayName && (
                  <span className="text-xs text-slate-500 font-medium">
                    for {user.displayName}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mt-2 text-slate-900">
                Your Clinical Skin Profile
              </h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                Formulated dynamically from your {skinType} skin profile, climate indicators, and selected concerns.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>AI clinical guidance is informational and does not replace emergency medical diagnosis.</span>
              </div>
            </div>

            {/* Skin Health Score Circle */}
            <div className="flex items-center gap-4 bg-rose-50/50 p-4 border border-rose-100 rounded-2xl shadow-xs">
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-rose-500"
                    strokeDasharray={`${skinScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-bold font-mono text-slate-900">{skinScore}</span>
                  <span className="block text-[8px] font-mono text-slate-500 uppercase">Index</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-800">Dermal Vitality Score</p>
                <p className="text-[11px] text-slate-500 max-w-[130px] mt-0.5 leading-snug">
                  {skinScore >= 80 ? "Optimal cellular barrier health" : skinScore >= 65 ? "Moderate barrier balance" : "Requires barrier repair"}
                </p>
              </div>
            </div>
          </div>

          {/* Primary 4 Biomarker Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">Cellular Hydration</span>
                <span className="text-xs font-mono font-bold text-sky-600">{metrics.hydration}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all duration-700" style={{ width: `${metrics.hydration}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Epidermal water retention</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">Lipid Barrier Strength</span>
                <span className="text-xs font-mono font-bold text-emerald-600">{metrics.barrier}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${metrics.barrier}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Ceramide matrix density</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">Sebum Regulation</span>
                <span className="text-xs font-mono font-bold text-amber-600">{metrics.sebum}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${metrics.sebum}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Pore lipid activity</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500">Clarity Index</span>
                <span className="text-xs font-mono font-bold text-purple-600">{metrics.clarity}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${metrics.clarity}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Even tone &amp; micro-relief</p>
            </div>
          </div>

          {/* Diagnostic Clinical Summary */}
          <div className="mt-6 p-4 rounded-2xl bg-rose-50/40 border border-rose-100">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700 mb-1">Dermal Assessment Summary</p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">{summary}</p>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-6 border-t border-rose-100 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={resetQuiz}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Diagnostic Quiz
            </button>

            <button
              id="adopt-routine-btn"
              onClick={handleAdopt}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Adopt &amp; Save to My Routine
            </button>
          </div>
        </div>

        {/* Personalized AM & PM Routines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AM Routine */}
          <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <span>🌅</span> Recommended AM Regimen
              </h3>
              <span className="text-[10px] font-mono font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                {safeAmRoutine.length} Steps
              </span>
            </div>

            <div className="space-y-3">
              {safeAmRoutine.map((step) => (
                <div key={step.step} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                      Step {step.step} • {step.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{step.name}</h4>
                  <p className="text-[11px] text-slate-600">{step.purpose}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(step.activeIngredients || []).map((ing, i) => (
                      <span key={i} className="text-[9px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PM Routine */}
          <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <span>🌙</span> Recommended PM Regimen
              </h3>
              <span className="text-[10px] font-mono font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                {safePmRoutine.length} Steps
              </span>
            </div>

            <div className="space-y-3">
              {safePmRoutine.map((step) => (
                <div key={step.step} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">
                      Step {step.step} • {step.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{step.name}</h4>
                  <p className="text-[11px] text-slate-600">{step.purpose}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(step.activeIngredients || []).map((ing, i) => (
                      <span key={i} className="text-[9px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-mono">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ingredient Insights & Expert Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900">
              🧪 Active Ingredient Compatibility Matrix
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Recommended Active Biomolecules:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {safeRecommended.map((ing, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Formulations to Minimize / Avoid:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {safeAvoid.map((ing, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900">
              💡 Clinical Lifestyle Tips
            </h3>
            <div className="space-y-2.5">
              {safeExpertTips.map((tip, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Multi-Step Quiz
  return (
    <div className="border border-rose-100 bg-white p-6 sm:p-8 rounded-3xl shadow-xs space-y-6">
      {/* Header */}
      <div className="border-b border-rose-100 pb-6">
        <div className="flex items-center gap-2 text-rose-600 mb-1">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-mono font-bold uppercase tracking-widest">Diagnostic Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-slate-900">
          Skin Diagnostic Quiz
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Step-by-step clinical evaluation. Answer to dynamically calculate your cellular hydration, lipid barrier, and custom routine.
        </p>

        {/* Steps Progress Indicator */}
        <div className="flex items-center justify-between mt-6 max-w-2xl">
          {[
            { step: 1, label: "Skin Type" },
            { step: 2, label: "Concerns" },
            { step: 3, label: "Sensitivity & Climate" },
            { step: 4, label: "Lifestyle" },
            { step: 5, label: "Review & Build" }
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(item.step)}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all cursor-pointer ${
                  currentStep === item.step 
                    ? "bg-rose-500 border-rose-500 text-white shadow-sm" 
                    : currentStep > item.step 
                      ? "bg-slate-900 border-slate-900 text-white" 
                      : "border-slate-200 text-slate-400 bg-white hover:border-slate-300"
                }`}
              >
                {currentStep > item.step ? "✓" : item.step}
              </button>
              <span className={`text-xs font-medium hidden md:inline ${currentStep === item.step ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Skin Type */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-slate-900">
              1. What is your biological skin type?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select the option that best reflects your bare skin a few hours after cleansing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {skinTypesList.map((st) => (
              <button
                key={st.name}
                onClick={() => setSkinType(st.name)}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex gap-3.5 cursor-pointer ${
                  skinType === st.name 
                    ? "border-rose-500 bg-rose-50/50 text-slate-900 shadow-sm" 
                    : "border-slate-200 bg-white hover:border-rose-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span className="text-2xl sm:text-3xl">{st.icon}</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{st.name} Skin</h4>
                  <p className="text-xs text-slate-500 mt-1 font-normal leading-normal">{st.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Concerns */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-slate-900">
              2. What active skin concerns would you like to target?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select all that apply. Multiple options are encouraged for precise formulation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {concernsList.map((item) => {
              const isSelected = concerns.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleConcern(item.id)}
                  className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                    isSelected 
                      ? "border-rose-500 bg-rose-50/50 text-slate-900 shadow-sm" 
                      : "border-slate-200 bg-white hover:border-rose-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.label}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-normal leading-normal">{item.desc}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ml-3 ${
                    isSelected ? "bg-rose-500 border-rose-500 text-white" : "border-slate-300"
                  }`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: Sensitivities & Climate */}
      {currentStep === 3 && (
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-3">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-semibold text-slate-900">
                3. How sensitive is your facial skin?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Rate frequency of burning, stinging, or flushing when trying new actives.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sensitivityList.map((sen) => (
                <button
                  key={sen}
                  onClick={() => setSensitivity(sen)}
                  className={`py-3.5 text-center text-xs font-semibold rounded-2xl border transition-all cursor-pointer ${
                    sensitivity === sen 
                      ? "border-rose-500 bg-rose-50 text-rose-700 font-bold shadow-xs" 
                      : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-slate-50"
                  }`}
                >
                  {sen}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-rose-100 pt-6">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-semibold text-slate-900">
                4. What is your local climate?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Atmospheric humidity directly determines whether you need light gel or occlusive hydration.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {climatesList.map((clm) => (
                <button
                  key={clm}
                  onClick={() => setClimate(clm)}
                  className={`py-3.5 px-2 text-center text-xs font-semibold rounded-2xl border transition-all cursor-pointer ${
                    climate === clm 
                      ? "border-rose-500 bg-rose-50 text-rose-700 font-bold shadow-xs" 
                      : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-slate-50"
                  }`}
                >
                  {clm}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Lifestyle Profile */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-slate-900">
              5. Select your daily lifestyle factors
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Identifies external stressors impacting your natural cellular turnover.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lifestyleList.map((life) => {
              const isSelected = lifestyle.includes(life);
              return (
                <button
                  key={life}
                  onClick={() => handleToggleLifestyle(life)}
                  className={`p-4 rounded-2xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                    isSelected 
                      ? "border-rose-500 bg-rose-50/50 text-slate-900 shadow-xs" 
                      : "border-slate-200 bg-white hover:border-rose-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="text-xs font-medium text-slate-800">{life}</span>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-rose-500 border-rose-500 text-white" : "border-slate-300"
                  }`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: Review & Build */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-slate-900">
              6. Review Your Skincare Profile Parameters
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Confirm your choices before calculating your clinical diagnostic report.</p>
          </div>

          <div className="p-5 rounded-2xl bg-rose-50/30 border border-rose-100 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-rose-100">
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">Skin Phenotype</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{skinType}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">Sensitivity</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{sensitivity}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">Climate</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{climate}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400">Target Concerns</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{(concerns || []).length} Selected</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Selected Concerns:</p>
              <div className="flex flex-wrap gap-1.5">
                {(concerns || []).length > 0 ? (
                  (concerns || []).map(c => {
                    const label = concernsList.find(item => item.id === c)?.label || c;
                    return (
                      <span key={c} className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                        {label}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">No specific concerns selected (General maintenance)</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Lifestyle Stressors:</p>
              <div className="flex flex-wrap gap-1.5">
                {(lifestyle || []).length > 0 ? (
                  (lifestyle || []).map(l => (
                    <span key={l} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-lg font-medium">
                      {l}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">None selected</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-rose-100">
        <button
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className={`px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs sm:text-sm transition-all ${
            currentStep === 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          Back
        </button>

        {currentStep < 5 ? (
          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            id="btn-analyze-build-routine"
            onClick={runSkinScanner}
            className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Analyze &amp; Build Routine
          </button>
        )}
      </div>
    </div>
  );
}

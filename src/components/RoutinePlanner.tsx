import React, { useState, useMemo, useEffect } from "react";
import { 
  Sun, 
  Moon, 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  ChevronUp, 
  ChevronDown, 
  ShieldAlert,
  Info,
  Layers,
  ArrowRight,
  Package,
  Bell,
  BellRing,
  BellOff,
  Clock,
  X
} from "lucide-react";
import { RoutineStep, SkincareProduct, RoutineReminderSettings } from "../types";
import { CURATED_PRODUCTS } from "../data/skincareData";
import { 
  loadUserReminderSettings, 
  saveUserReminderSettings, 
  sendTestNotification, 
  requestNotificationPermission, 
  formatTimeTo12Hour, 
  getNotificationPermissionStatus,
  DEFAULT_REMINDER_SETTINGS 
} from "../lib/reminderService";

interface RoutinePlannerProps {
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
  onAddStep: (regime: "AM" | "PM", step: Omit<RoutineStep, "step">) => void;
  onRemoveStep: (regime: "AM" | "PM", index: number) => void;
  onToggleComplete: (regime: "AM" | "PM", index: number) => void;
  onNavigate?: (tab: string) => void;
  user?: any;
}

// Additional popular products for the library (Minimalist, The Ordinary, CeraVe, Cosrx, etc.)
const EXTENDED_LIBRARY_PRODUCTS: {
  id: string;
  name: string;
  brand: string;
  category: "Cleanser" | "Toner" | "Serum" | "Moisturizer" | "Sunscreen" | "Mask";
  activeIngredients: string[];
  purpose: string;
  instructions: string;
}[] = [
  {
    id: "lib-1",
    name: "10% Niacinamide Face Serum",
    brand: "Minimalist",
    category: "Serum",
    activeIngredients: ["Niacinamide (10%)", "Zinc PCA", "EUK-134"],
    purpose: "Reduces sebum, fades acne marks, and refines enlarged pores.",
    instructions: "Apply 2-3 drops after cleansing and toning. Tap lightly."
  },
  {
    id: "lib-2",
    name: "Salicylic Acid 2% Face Serum",
    brand: "Minimalist",
    category: "Serum",
    activeIngredients: ["Salicylic Acid (2%)", "Oligopeptide-10"],
    purpose: "Deep pore exfoliation, controls acne flares and dissolves sebum.",
    instructions: "Apply 2-3 drops on clean, dry skin. Start 2x/week."
  },
  {
    id: "lib-3",
    name: "Hydrating Facial Cleanser",
    brand: "CeraVe",
    category: "Cleanser",
    activeIngredients: ["Ceramides (1, 3, 6-II)", "Hyaluronic Acid", "MVE Technology"],
    purpose: "Gentle, non-foaming lotion cleanser that restores the natural skin barrier.",
    instructions: "Wet skin with lukewarm water. Massage cleanser in circles, then rinse."
  },
  {
    id: "lib-4",
    name: "Hyaluronic Acid 2% + B5",
    brand: "The Ordinary",
    category: "Serum",
    activeIngredients: ["Hyaluronic Acid", "Pro-Vitamin B5 (Panthenol)"],
    purpose: "Multi-depth hydration support with next-generation hyaluronic acid.",
    instructions: "Apply a few drops to damp face morning and night before creams."
  },
  {
    id: "lib-5",
    name: "SPF 50 PA++++ Light Fluid Sunscreen",
    brand: "Minimalist",
    category: "Sunscreen",
    activeIngredients: ["Uvinul A Plus", "Tinosorb S", "Octinoxate"],
    purpose: "Broad spectrum protection with zero white cast and lightweight finish.",
    instructions: "Apply generously on face and neck 15 minutes before sun exposure."
  },
  {
    id: "lib-6",
    name: "Advanced Snail 96 Mucin Power Essence",
    brand: "COSRX",
    category: "Toner",
    activeIngredients: ["Snail Secretion Filtrate (96%)", "Sodium Hyaluronate"],
    purpose: "Replenishes skin barrier, provides intense nourishment and glass-skin glow.",
    instructions: "Apply after cleansing and toning. Pat gently for full absorption."
  },
  {
    id: "lib-7",
    name: "Relief Sun : Rice + Probiotics (SPF50+ PA++++)",
    brand: "Beauty of Joseon",
    category: "Sunscreen",
    activeIngredients: ["Rice Extract (30%)", "Grain Fermented Extracts"],
    purpose: "Calming, moisturizing organic sunscreen with a soft cream texture.",
    instructions: "Evenly spread generous amount over areas prone to sun exposure."
  },
  {
    id: "lib-8",
    name: "AHA 30% + BHA 2% Peeling Solution",
    brand: "The Ordinary",
    category: "Serum",
    activeIngredients: ["Glycolic Acid", "Lactic Acid", "Salicylic Acid (2%)"],
    purpose: "10-minute exfoliating facial for deep clarity, texture smoothing, and radiance.",
    instructions: "Apply to dry skin. Leave on for no more than 10 minutes. Use PM only, 1x/week."
  },
  {
    id: "lib-9",
    name: "Granactive Retinoid 2% Emulsion",
    brand: "The Ordinary",
    category: "Serum",
    activeIngredients: ["Granactive Retinoid (2%)", "Bisabolol"],
    purpose: "Targets signs of aging and fine lines without the irritation of direct retinol.",
    instructions: "Apply a small amount to clean skin in PM only. Follow with moisturizer."
  },
  {
    id: "lib-10",
    name: "Moisturizing Cream with Ceramides",
    brand: "CeraVe",
    category: "Moisturizer",
    activeIngredients: ["Essential Ceramides", "Hyaluronic Acid", "Petrolatum"],
    purpose: "Rich, non-greasy fast-absorbing cream for 24-hour barrier lock hydration.",
    instructions: "Apply liberally as often as needed or after serums."
  },
  {
    id: "lib-11",
    name: "BHA Blackhead Power Liquid",
    brand: "COSRX",
    category: "Toner",
    activeIngredients: ["Betaine Salicylate (4%)", "Willow Bark Water"],
    purpose: "Clears congested pores, dissolves sebum buildup, and smooths skin texture.",
    instructions: "Pump onto cotton pad or hands and swipe across face avoiding eye area."
  },
  {
    id: "lib-12",
    name: "Vitamin C 16% + Ferulic Acid Serum",
    brand: "Minimalist",
    category: "Serum",
    activeIngredients: ["Ethyl Ascorbic Acid (16%)", "Ferulic Acid", "Fullerenes"],
    purpose: "Potent brightening antioxidant serum to fade hyperpigmentation and sun damage.",
    instructions: "Apply 2-3 drops in morning after toner. Follow with broad spectrum SPF."
  }
];

export default function RoutinePlanner({
  amRoutine = [],
  pmRoutine = [],
  onAddStep,
  onRemoveStep,
  onToggleComplete,
  onNavigate,
  user
}: RoutinePlannerProps) {
  const [activeRegime, setActiveRegime] = useState<"AM" | "PM">("AM");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Routine Reminders State & Modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<RoutineReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderPermission, setReminderPermission] = useState(getNotificationPermissionStatus());
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderToast, setReminderToast] = useState<{ show: boolean; msg: string; isError?: boolean }>({ show: false, msg: "" });

  useEffect(() => {
    loadUserReminderSettings(user?.uid).then((settings) => {
      setReminderSettings(settings);
      setReminderPermission(getNotificationPermissionStatus());
    });

    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setReminderSettings(e.detail);
      } else {
        loadUserReminderSettings(user?.uid).then(setReminderSettings);
      }
      setReminderPermission(getNotificationPermissionStatus());
    };

    window.addEventListener("ng-reminder-settings-updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("ng-reminder-settings-updated", handleSettingsUpdated);
    };
  }, [user?.uid]);

  const handleToggleMorning = async () => {
    const nextVal = !reminderSettings.morningReminderEnabled;
    const updated = { ...reminderSettings, morningReminderEnabled: nextVal };
    setReminderSettings(updated);
    if (nextVal && reminderPermission !== "granted") {
      const p = await requestNotificationPermission();
      setReminderPermission(p);
      setReminderSettings(prev => ({ ...prev, notificationPermission: p }));
    }
  };

  const handleToggleEvening = async () => {
    const nextVal = !reminderSettings.eveningReminderEnabled;
    const updated = { ...reminderSettings, eveningReminderEnabled: nextVal };
    setReminderSettings(updated);
    if (nextVal && reminderPermission !== "granted") {
      const p = await requestNotificationPermission();
      setReminderPermission(p);
      setReminderSettings(prev => ({ ...prev, notificationPermission: p }));
    }
  };

  const handleSaveReminders = async () => {
    setReminderSaving(true);
    try {
      await saveUserReminderSettings(user?.uid, reminderSettings);
      setReminderToast({ show: true, msg: "Reminder settings saved successfully! ✨", isError: false });
    } catch {
      setReminderToast({ show: true, msg: "Failed to save reminder settings.", isError: true });
    } finally {
      setReminderSaving(false);
      setTimeout(() => setReminderToast({ show: false, msg: "" }), 3500);
    }
  };

  const handleTestNotification = async () => {
    const res = await sendTestNotification();
    setReminderPermission(getNotificationPermissionStatus());
    setReminderToast({ show: true, msg: res.message, isError: !res.sent });
    setTimeout(() => setReminderToast({ show: false, msg: "" }), 4000);
  };

  // Custom step modal / form state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Serum");
  const [customPurpose, setCustomPurpose] = useState("");
  const [customActives, setCustomActives] = useState("");

  const currentRoutine = (activeRegime === "AM" ? amRoutine : pmRoutine) || [];

  // Combine curated products with extended library products
  const allLibraryProducts = useMemo(() => {
    const list: typeof EXTENDED_LIBRARY_PRODUCTS = [...EXTENDED_LIBRARY_PRODUCTS];

    // Add CURATED_PRODUCTS if not already in list
    CURATED_PRODUCTS.forEach(p => {
      if (!list.some(item => item.name.toLowerCase() === p.name.toLowerCase())) {
        list.push({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          activeIngredients: p.ingredients,
          purpose: p.description.slice(0, 100) + "...",
          instructions: p.howToUse
        });
      }
    });

    return list;
  }, []);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return allLibraryProducts.filter((prod) => {
      const matchesSearch = 
        (prod.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.activeIngredients || []).some(i => (i || "").toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "All" || (prod.category || "").toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [allLibraryProducts, searchQuery, selectedCategory]);

  // Handle adding product from library
  const handleAddProduct = (prod: typeof EXTENDED_LIBRARY_PRODUCTS[0]) => {
    onAddStep(activeRegime, {
      category: prod.category,
      name: prod.name,
      purpose: prod.purpose,
      instructions: prod.instructions,
      activeIngredients: prod.activeIngredients || [],
      completed: false
    });

    setAddedToast(`Added "${prod.name}" to ${activeRegime} Routine`);
    setTimeout(() => {
      setAddedToast(null);
    }, 3000);
  };

  // Handle custom product submission
  const handleAddCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddStep(activeRegime, {
      category: customCategory,
      name: customBrand ? `${customBrand} - ${customName}` : customName,
      purpose: customPurpose || `Targeted ${customCategory} treatment`,
      instructions: "Apply according to routine order.",
      activeIngredients: customActives ? customActives.split(",").map(s => s.trim()).filter(Boolean) : [],
      completed: false
    });

    setCustomBrand("");
    setCustomName("");
    setCustomPurpose("");
    setCustomActives("");
    setShowCustomModal(false);

    setAddedToast(`Added custom step to ${activeRegime} Routine`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  // Routine agent analysis & validation checks
  const routineAnalysis = useMemo(() => {
    const safeRoutine = Array.isArray(currentRoutine) ? currentRoutine : [];
    const hasCleanser = safeRoutine.some(s => (s.category || "").toLowerCase().includes("cleanser"));
    const hasSunscreen = safeRoutine.some(s => (s.category || "").toLowerCase().includes("sunscreen"));
    const hasMoisturizer = safeRoutine.some(s => (s.category || "").toLowerCase().includes("moisturizer") || (s.category || "").toLowerCase().includes("cream"));
    const hasRetinol = safeRoutine.some(s => 
      (s.name || "").toLowerCase().includes("retinol") || 
      (s.name || "").toLowerCase().includes("retinoid") || 
      (s.activeIngredients || []).some(i => (i || "").toLowerCase().includes("retinol"))
    );
    const hasVitC = safeRoutine.some(s => 
      (s.name || "").toLowerCase().includes("vitamin c") || 
      (s.name || "").toLowerCase().includes("ascorbic") ||
      (s.activeIngredients || []).some(i => (i || "").toLowerCase().includes("vitamin c"))
    );
    const hasAHA_BHA = safeRoutine.some(s => 
      (s.name || "").toLowerCase().includes("salicylic") || 
      (s.name || "").toLowerCase().includes("aha") || 
      (s.name || "").toLowerCase().includes("bha") || 
      (s.name || "").toLowerCase().includes("peeling") ||
      (s.activeIngredients || []).some(i => (i || "").toLowerCase().includes("salicylic") || (i || "").toLowerCase().includes("glycolic"))
    );

    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (activeRegime === "AM" && !hasSunscreen && safeRoutine.length > 0) {
      warnings.push("Missing Sunscreen: Morning routines require broad-spectrum SPF 30+ to prevent UV damage and photo-aging.");
    }

    if (activeRegime === "AM" && hasRetinol) {
      warnings.push("Retinol in AM: Retinoids degrade in sunlight and increase UV sensitivity. Best used in Evening (PM) routine.");
    }

    if (hasRetinol && hasAHA_BHA) {
      warnings.push("Active Ingredient Overlap: Combining direct Retinol with AHA/BHA exfoliants in the same routine may compromise the lipid barrier. Alternate nights.");
    }

    if (hasCleanser && hasMoisturizer) {
      recommendations.push("Optimal Barrier Base: Cleanser and barrier moisturizer sequence confirmed.");
    }

    if (activeRegime === "AM" && hasVitC && hasSunscreen) {
      recommendations.push("Synergistic Shield: Vitamin C + Sunscreen provides enhanced environmental antioxidant photoprotection.");
    }

    return {
      warnings,
      recommendations,
      stepCount: currentRoutine.length
    };
  }, [currentRoutine, activeRegime]);

  const categoryFilters = ["All", "Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans animate-fade-in">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-rose-600 tracking-tight flex items-center justify-center gap-2">
          <span>🧴</span> Routine Builder
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Build and validate your AM/PM skincare routine with the Routine Agent
        </p>
      </div>

      {/* Skincare Routine Reminders Quick-Access Banner */}
      <div className="rounded-2xl bg-white border border-rose-100 p-4 shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-3xs">
            <BellRing className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Skincare Routine Reminders</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                reminderSettings.morningReminderEnabled || reminderSettings.eveningReminderEnabled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
                {reminderSettings.morningReminderEnabled || reminderSettings.eveningReminderEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {reminderSettings.morningReminderEnabled ? `🌞 Morning: ${formatTimeTo12Hour(reminderSettings.morningReminderTime)}` : "🌞 Morning: Off"}
              {" • "}
              {reminderSettings.eveningReminderEnabled ? `🌙 Evening: ${formatTimeTo12Hour(reminderSettings.eveningReminderTime)}` : "🌙 Evening: Off"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleTestNotification}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-xs font-semibold cursor-pointer transition-all shadow-3xs flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Test Alert</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReminderModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer transition-all shadow-3xs flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Configure Reminders</span>
          </button>
        </div>
      </div>

      {/* Reminder Toast Feedback */}
      {reminderToast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs sm:text-sm animate-fade-in ${
          reminderToast.isError
            ? "bg-rose-900 text-white border-rose-700"
            : "bg-slate-900/95 text-white border-rose-500/30 backdrop-blur-md"
        }`}>
          {reminderToast.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{reminderToast.msg}</span>
        </div>
      )}

      {/* Quick Reminder Settings Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-rose-100/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                  <BellRing className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900">Routine Reminders</h3>
                  <p className="text-[11px] text-slate-500">Circadian timing for AM & PM care</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Permission status alert */}
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              reminderPermission === "granted"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : reminderPermission === "denied"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              <div className="flex items-center gap-2">
                {reminderPermission === "granted" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {reminderPermission === "granted" 
                    ? "Browser notifications enabled" 
                    : reminderPermission === "denied" 
                    ? "Notifications blocked in browser" 
                    : "Browser permission required"}
                </span>
              </div>
              {reminderPermission !== "granted" && (
                <button
                  type="button"
                  onClick={async () => {
                    const p = await requestNotificationPermission();
                    setReminderPermission(p);
                  }}
                  className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Enable
                </button>
              )}
            </div>

            {/* Morning Setting */}
            <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🌞</span> Morning Routine (AM)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reminderSettings.morningReminderEnabled}
                    onChange={handleToggleMorning}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Alert time:</span>
                <input 
                  type="time" 
                  value={reminderSettings.morningReminderTime}
                  onChange={(e) => setReminderSettings(prev => ({ ...prev, morningReminderTime: e.target.value }))}
                  disabled={!reminderSettings.morningReminderEnabled}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-mono font-bold text-slate-800 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Evening Setting */}
            <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🌙</span> Evening Routine (PM)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reminderSettings.eveningReminderEnabled}
                    onChange={handleToggleEvening}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Alert time:</span>
                <input 
                  type="time" 
                  value={reminderSettings.eveningReminderTime}
                  onChange={(e) => setReminderSettings(prev => ({ ...prev, eveningReminderTime: e.target.value }))}
                  disabled={!reminderSettings.eveningReminderEnabled}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-mono font-bold text-slate-800 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-xs font-semibold cursor-pointer shadow-3xs"
              >
                Test Alert
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleSaveReminders();
                    setShowReminderModal(false);
                  }}
                  disabled={reminderSaving}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer shadow-3xs"
                >
                  {reminderSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AM / PM Regime Toggle Pills */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setActiveRegime("AM")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeRegime === "AM"
              ? "bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-600 text-white shadow-md shadow-rose-500/20 scale-105"
              : "bg-white text-slate-700 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30"
          }`}
        >
          <span>🌞</span>
          <span>Morning (AM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRegime("PM")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeRegime === "PM"
              ? "bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-600 text-white shadow-md shadow-rose-500/20 scale-105"
              : "bg-white text-slate-700 border border-emerald-600/60 hover:border-emerald-600 hover:bg-emerald-50/30"
          }`}
        >
          <span>🌙</span>
          <span>Evening (PM)</span>
        </button>
      </div>

      {/* Toast feedback */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl border border-rose-500/30 flex items-center gap-3 text-xs sm:text-sm animate-fade-in">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </span>
          <span>{addedToast}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Routine Timeline & Validation */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span>{activeRegime === "AM" ? "🌞" : "🌙"}</span>
              <span>{activeRegime === "AM" ? "Morning Routine" : "Evening Routine"}</span>
              {currentRoutine.length > 0 && (
                <span className="text-xs font-mono bg-rose-100 text-rose-700 font-semibold px-2.5 py-0.5 rounded-full">
                  {currentRoutine.length} {currentRoutine.length === 1 ? "Product" : "Products"}
                </span>
              )}
            </h2>

            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Product</span>
            </button>
          </div>

          {/* Routine Agent Insights Banner */}
          {routineAnalysis.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs text-amber-900 animate-fade-in">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Routine Agent Safety Alert</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-amber-800/90 leading-relaxed">
                {(routineAnalysis.warnings || []).map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {routineAnalysis.recommendations.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1 text-xs text-emerald-900 animate-fade-in flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-emerald-800">Routine Synergy: </span>
                <span>{(routineAnalysis.recommendations || []).join(" ")}</span>
              </div>
            </div>
          )}

          {/* Routine Steps List / Empty State */}
          {(!currentRoutine || currentRoutine.length === 0) ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 mx-auto bg-rose-50 rounded-2xl flex items-center justify-center text-3xl shadow-xs border border-rose-100">
                🧴
              </div>
              <div className="space-y-1">
                <p className="text-base sm:text-lg font-medium text-slate-700 font-serif">
                  No products in your {activeRegime === "AM" ? "morning" : "evening"} routine yet.
                </p>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select products from the library on the right, or generate a custom regimen:
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate("analyzer")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Take Skin Quiz to Auto-Build Routine
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {(currentRoutine || []).map((step, idx) => (
                <div
                  key={`routine-step-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-rose-300 p-4 sm:p-5 shadow-xs transition-all duration-200 flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    {/* Step indicator */}
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 font-serif font-bold text-sm flex items-center justify-center shrink-0 border border-rose-100">
                      {idx + 1}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100/70 text-rose-700 capitalize">
                          {step.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Step {idx + 1} of {currentRoutine.length}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {step.name}
                      </h3>

                      {step.purpose && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {step.purpose}
                        </p>
                      )}

                      {Array.isArray(step.activeIngredients) && step.activeIngredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {step.activeIngredients.map((ing, iIdx) => (
                            <span 
                              key={iIdx}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions (Delete step) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRemoveStep(activeRegime, idx)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove product from routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Layering Guide Footer */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-800">Dermatologist Layering Order: </span>
              <p className="text-slate-500 leading-relaxed">
                Cleanser → Toner / Essence → Water-Based Serums → Treatments → Eye Cream → Moisturizer → Sunscreen (AM) / Face Oil (PM).
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Product Library */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span>📦</span>
              <span>Product Library</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {filteredProducts.length} Items
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categoryFilters.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Library Cards */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                No products found matching "{searchQuery}".
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const isAlreadyInRoutine = currentRoutine.some(
                  s => s.name.toLowerCase() === prod.name.toLowerCase()
                );

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 p-4 shadow-xs transition-all duration-200 flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
                        {prod.brand}
                      </p>
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {prod.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-100/70 text-rose-700 capitalize">
                          {prod.category.toLowerCase()}
                        </span>
                        {prod.activeIngredients[0] && (
                          <span className="text-[11px] text-slate-500 truncate">
                            • {prod.activeIngredients[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add button */}
                    <button
                      type="button"
                      onClick={() => handleAddProduct(prod)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        isAlreadyInRoutine
                          ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                          : "bg-gradient-to-r from-rose-500 to-emerald-600 hover:from-rose-600 hover:to-emerald-700 text-white shadow-rose-500/20 hover:scale-105"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAlreadyInRoutine ? "+ Add Again" : "+ Add"}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Custom Product Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-rose-100 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                <span>✨</span> Add Custom Product to {activeRegime} Routine
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomProduct} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Brand Name (Optional)</label>
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="e.g. Minimalist, CeraVe, Cosrx"
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Centella Calming Serum"
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                  >
                    <option value="Cleanser">Cleanser</option>
                    <option value="Toner">Toner</option>
                    <option value="Serum">Serum</option>
                    <option value="Moisturizer">Moisturizer</option>
                    <option value="Sunscreen">Sunscreen</option>
                    <option value="Mask">Mask / Treatment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Active Actives</label>
                  <input
                    type="text"
                    value={customActives}
                    onChange={(e) => setCustomActives(e.target.value)}
                    placeholder="e.g. Centella, Zinc"
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="e.g. Soothes redness and repairs barrier"
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-pink-600"
                >
                  Add to Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

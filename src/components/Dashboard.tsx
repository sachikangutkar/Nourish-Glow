import React, { useState, useEffect } from "react";
import { 
  Sun, 
  CloudRain, 
  Wind, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Droplets, 
  ShieldAlert, 
  Moon,
  Info,
  Flame,
  Award,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Scan,
  FlaskConical,
  ShoppingBag,
  Clock,
  Stethoscope,
  Heart,
  Star,
  ArrowRight,
  Tag,
  ShieldCheck
} from "lucide-react";
import { RoutineStep, DailyLog, SkinAnalysis, VisionScanResult } from "../types";
import { formatINR, calculateDiscountPercent } from "../lib/formatters";
import { CURATED_PRODUCTS } from "../data/skincareData";
import { formatTimeTo12Hour, loadUserReminderSettings, sendTestNotification } from "../lib/reminderService";

interface DashboardProps {
  user: { displayName: string; email: string; photoURL?: string; uid: string } | null;
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
  onToggleAMStep: (index: number) => void;
  onTogglePMStep: (index: number) => void;
  streak: number;
  logs: DailyLog[];
  setActiveTab: (tab: string) => void;
  activeAnalysis?: SkinAnalysis | null;
  visionScanResult?: VisionScanResult | null;
}

export default function Dashboard({ 
  user,
  amRoutine = [], 
  pmRoutine = [], 
  onToggleAMStep, 
  onTogglePMStep, 
  streak = 0,
  logs = [],
  setActiveTab,
  activeAnalysis,
  visionScanResult
}: DashboardProps) {
  // Environmental simulation states
  const [climate, setClimate] = useState<"sunny" | "dry" | "humid" | "cold">("sunny");
  const [uvIndex, setUvIndex] = useState(6); // scale 1-11
  const [pollution, setPollution] = useState<"Low" | "Moderate" | "High">("Moderate");
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [showNotificationSuccess, setShowNotificationSuccess] = useState(false);

  // Active Daily Routine regime & live reminder settings
  const [activeRoutineRegime, setActiveRoutineRegime] = useState<"AM" | "PM">("AM");
  const [reminderSettings, setReminderSettings] = useState<any>(null);

  useEffect(() => {
    loadUserReminderSettings(user?.uid).then(setReminderSettings);
    const handleUpdate = (e: any) => {
      if (e.detail) setReminderSettings(e.detail);
      else loadUserReminderSettings(user?.uid).then(setReminderSettings);
    };
    window.addEventListener("ng-reminder-settings-updated", handleUpdate);
    return () => window.removeEventListener("ng-reminder-settings-updated", handleUpdate);
  }, [user?.uid]);

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [exploreCategory, setExploreCategory] = useState<string>("All");

  const heroSlides = [
    {
      id: "vision",
      badge: "AI-Powered Skincare Intelligence",
      titlePrefix: "Discover Your Perfect ",
      titleHighlight: "Skincare",
      highlightStyle: "text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-700 to-emerald-600",
      description: "Five intelligent agents analyze ingredients, detect conflicts, and build routines personalized to your unique skin.",
      primaryCta: { label: "🧪 Take the Skin Quiz", tab: "analyzer", isGradient: true },
      secondaryCta: { label: "Explore Products →", tab: "catalog" },
      bgGradient: "from-rose-100/70 via-pink-50/80 to-amber-50/60",
      accentPill: "bg-rose-500/10 text-rose-700 border-rose-200",
      targetTab: "vision"
    },
    {
      id: "diagnostic",
      badge: "Clinical Diagnostic Agent",
      titlePrefix: "Precision AI ",
      titleHighlight: "Formulation",
      highlightStyle: "text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600",
      description: "Custom multi-parameter skin barrier assessment calculating pH tolerance, lipid depletion, and sensitivity index.",
      primaryCta: { label: "✨ Start Diagnostic", tab: "analyzer", isGradient: true },
      secondaryCta: { label: "View AM/PM Routine →", tab: "routine" },
      bgGradient: "from-pink-100/70 via-rose-50/80 to-purple-50/60",
      accentPill: "bg-pink-500/10 text-pink-700 border-pink-200",
      targetTab: "analyzer"
    },
    {
      id: "dermconsult",
      badge: "Certified Clinical Care",
      titlePrefix: "Board-Certified ",
      titleHighlight: "Dermatologists",
      highlightStyle: "text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600",
      description: "Direct clinical consultations and live video appointments with licensed practitioners for targeted medical skincare.",
      primaryCta: { label: "🩺 Book Consultation", tab: "dermconsult", isGradient: true },
      secondaryCta: { label: "Ingredient Lab →", tab: "lab" },
      bgGradient: "from-emerald-100/70 via-teal-50/80 to-sky-50/60",
      accentPill: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
      targetTab: "dermconsult"
    },
    {
      id: "routine",
      badge: "Circadian Chronobiology",
      titlePrefix: "Personalized AM & PM ",
      titleHighlight: "Routines",
      highlightStyle: "text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-600",
      description: "Synchronize your skin's biological cellular rhythm with timed active layering and environmental weather shields.",
      primaryCta: { label: "⏰ Plan Your Routine", tab: "routine", isGradient: true },
      secondaryCta: { label: "Progress Journal →", tab: "journal" },
      bgGradient: "from-sky-100/70 via-indigo-50/80 to-rose-50/60",
      accentPill: "bg-sky-500/10 text-sky-700 border-sky-200",
      targetTab: "routine"
    },
    {
      id: "catalog",
      badge: "Clean Botanical Actives",
      titlePrefix: "Science-Backed ",
      titleHighlight: "Formulas",
      highlightStyle: "text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600",
      description: "Clinically tested, clean botanical cleansers, niacinamide serums, and ceramide lipid barrier moisturizers.",
      primaryCta: { label: "🛍️ Shop Glow Catalog", tab: "catalog", isGradient: true },
      secondaryCta: { label: "Vision Skin Scan →", tab: "vision" },
      bgGradient: "from-amber-100/70 via-rose-50/80 to-pink-50/60",
      accentPill: "bg-amber-500/10 text-amber-700 border-amber-200",
      targetTab: "catalog"
    },
    {
      id: "lab",
      badge: "Molecular Interaction Matrix",
      titlePrefix: "Ingredient Conflict ",
      titleHighlight: "Checker",
      highlightStyle: "text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600",
      description: "Verify safety conflicts between Vitamin C, Retinol, and chemical exfoliants (AHA/BHA) before applying to your face.",
      primaryCta: { label: "🔬 Open Ingredient Lab", tab: "lab", isGradient: true },
      secondaryCta: { label: "Start Skin Diagnostic →", tab: "analyzer" },
      bgGradient: "from-teal-100/70 via-cyan-50/80 to-emerald-50/60",
      accentPill: "bg-teal-500/10 text-teal-700 border-teal-200",
      targetTab: "lab"
    }
  ];

  // Auto-advance slides every 5.5 seconds unless hovered/paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, heroSlides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  // Note: Skincare routine reminders and notifications are managed globally by RoutineReminderManager in App.tsx

  // Streak preservation calculation
  const getLastLogTime = () => {
    if (!logs || !Array.isArray(logs) || logs.length === 0) return null;
    const validLogs = logs.filter(l => l && l.loggedAt);
    if (validLogs.length === 0) return null;
    const times = validLogs.map(l => new Date(l.loggedAt).getTime());
    return new Date(Math.max(...times));
  };

  const lastLog = getLastLogTime();
  const hoursSinceLastLog = lastLog 
    ? (Date.now() - lastLog.getTime()) / (1000 * 60 * 60)
    : 48; // Assume 48 hours to prompt first entry if no logs

  const isStreakAtRisk = hoursSinceLastLog > 24;

  // Request native browser notifications permission
  const handleRequestNotificationPermission = () => {
    if (!("Notification" in window)) {
      alert("Browser notifications are not supported by your current browser.");
      return;
    }

    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      if (permission === "granted") {
        setShowNotificationSuccess(true);
        setTimeout(() => setShowNotificationSuccess(false), 4000);
        new Notification("Nourish Glow", {
          body: "Notifications enabled! We'll keep you updated on your daily skincare streak.",
        });
      }
    });
  };

  // Trigger high-priority streak notification on mount if permission granted
  useEffect(() => {
    if (isStreakAtRisk && typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Streak Warning! ⚠️", {
        body: `It's been ${Math.floor(hoursSinceLastLog)} hours since your last skincare log. Maintain your daily streak!`,
        tag: "streak-warning",
        requireInteraction: true
      });
    }
  }, [isStreakAtRisk, hoursSinceLastLog]);

  // Calculations for progress
  const safeAm = Array.isArray(amRoutine) ? amRoutine : [];
  const safePm = Array.isArray(pmRoutine) ? pmRoutine : [];
  const totalAM = safeAm.length;
  const completedAM = safeAm.filter(s => s && s.completed).length;
  const totalPM = safePm.length;
  const completedPM = safePm.filter(s => s && s.completed).length;
  
  const totalSteps = totalAM + totalPM;
  const completedSteps = completedAM + completedPM;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Dynamic recommendations based on environment selection
  const getEnvironmentalAdvice = () => {
    switch (climate) {
      case "sunny":
        return {
          title: "Intense UV Shielding Required",
          desc: "Apply SPF 50+ mineral protection. Ultraviolet rays trigger melanin production and collagen degradation today.",
          icon: Sun,
          color: "text-natural-terracotta bg-natural-terracotta/5 border-natural-terracotta/20"
        };
      case "dry":
        return {
          title: "Transepidermal Water Loss Warning",
          desc: "Low relative humidity is actively pulling moisture from your dermis. Double-apply your Ceramide hydration complex.",
          icon: Droplets,
          color: "text-natural-clay bg-natural-clay/5 border-natural-clay/20"
        };
      case "humid":
        return {
          title: "Sebum Regulation Prompt",
          desc: "High humidity may trigger hyperactive oil glands. Use lighter, oil-free water gels and ensure thorough deep cleanses.",
          icon: CloudRain,
          color: "text-natural-sage bg-natural-sage/5 border-natural-sage/20"
        };
      case "cold":
        return {
          title: "Lipid Barrier Defence Mode",
          desc: "Cold winds narrow blood vessels and strip natural oils. Avoid chemical peels today; focus strictly on lipid restoration.",
          icon: Wind,
          color: "text-natural-text-secondary bg-natural-card border-natural-border"
        };
    }
  };

  const advice = getEnvironmentalAdvice();
  const EnvIcon = advice.icon;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Animated SakuraSkin-Style Hero Carousel */}
      <div 
        className="relative overflow-hidden rounded-3xl border border-rose-200/70 shadow-sm transition-all duration-700 bg-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Dynamic Background Gradient with Soft Blossom Ambient Tone */}
        <div className={`absolute inset-0 bg-gradient-to-br ${heroSlides[currentSlide].bgGradient} transition-all duration-700`} />
        
        {/* Floating Sakura Petals & Soft Bokeh Layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Petal 1 */}
          <div className="absolute -top-4 left-[10%] w-4 h-6 bg-gradient-to-br from-rose-300/60 to-pink-400/40 rounded-full rounded-tr-none rotate-12 blur-[0.5px] animate-pulse" />
          {/* Petal 2 */}
          <div className="absolute top-1/4 left-[85%] w-5 h-7 bg-gradient-to-br from-pink-300/50 to-rose-400/30 rounded-full rounded-bl-none -rotate-45 blur-[0.5px]" />
          {/* Petal 3 */}
          <div className="absolute top-3/4 left-[15%] w-3 h-5 bg-gradient-to-br from-rose-200/60 to-pink-300/40 rounded-full rounded-tl-none rotate-45" />
          {/* Petal 4 */}
          <div className="absolute top-1/3 left-[45%] w-4 h-6 bg-gradient-to-br from-pink-200/40 to-rose-300/30 rounded-full rounded-br-none -rotate-12" />
          {/* Petal 5 */}
          <div className="absolute bottom-6 right-[20%] w-5 h-7 bg-gradient-to-br from-rose-300/50 to-pink-400/30 rounded-full rounded-tr-none rotate-30" />

          {/* Gentle Bloom Glow Orbs */}
          <div className="absolute -right-24 -top-24 w-80 h-80 bg-rose-300/25 rounded-full blur-3xl" />
          <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-pink-300/25 rounded-full blur-3xl" />
        </div>

        {/* Carousel Content Container */}
        <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 md:py-20 max-w-4xl mx-auto text-center flex flex-col items-center">
          
          {/* Top Italic Sub-Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-rose-200/80 shadow-xs mb-4 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs sm:text-sm font-serif italic text-emerald-800 tracking-wide font-medium">
              {heroSlides[currentSlide].badge}
            </span>
          </div>

          {/* Main Display Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-rose-900 tracking-tight leading-[1.18] transition-all duration-500">
            {heroSlides[currentSlide].titlePrefix}
            <span className={heroSlides[currentSlide].highlightStyle}>
              {heroSlides[currentSlide].titleHighlight}
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-base md:text-lg text-slate-700/90 mt-4 sm:mt-5 max-w-2xl font-sans leading-relaxed transition-all duration-500">
            {heroSlides[currentSlide].description}
          </p>

          {/* Action Button Pills (like uploaded image) */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-7 sm:mt-8">
            <button
              onClick={() => setActiveTab(heroSlides[currentSlide].primaryCta.tab)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-600 text-white text-sm font-semibold shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>{heroSlides[currentSlide].primaryCta.label}</span>
            </button>

            <button
              onClick={() => setActiveTab(heroSlides[currentSlide].secondaryCta.tab)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-rose-700 text-sm font-medium border border-rose-200 shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-sm"
            >
              <span>{heroSlides[currentSlide].secondaryCta.label}</span>
            </button>
          </div>
        </div>

        {/* Carousel Navigation Left Arrow */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-rose-700 border border-rose-200/80 shadow-md flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 transition-all z-20"
        >
          <ChevronLeft className="w-5 h-5 text-rose-600" />
        </button>

        {/* Carousel Navigation Right Arrow */}
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-rose-700 border border-rose-200/80 shadow-md flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 transition-all z-20"
        >
          <ChevronRight className="w-5 h-5 text-rose-600" />
        </button>

        {/* Carousel Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-rose-100">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                currentSlide === idx
                  ? "w-6 h-2 bg-gradient-to-r from-rose-500 to-emerald-500"
                  : "w-2 h-2 bg-rose-300/70 hover:bg-rose-400"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 6 Quick Action Feature Modules (Home Navigation Grid) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            Core Intelligence Modules
          </h2>
          <span className="text-xs text-slate-500">Tap to launch</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveTab("vision")}
            className="group p-4 rounded-2xl bg-white hover:bg-rose-50/80 border border-rose-100 hover:border-rose-300 transition-all text-left shadow-xs hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
              <Scan className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">Vision Scan</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">Facial AI Scan</p>
          </button>

          <button
            onClick={() => setActiveTab("analyzer")}
            className="group p-4 rounded-2xl bg-white hover:bg-rose-50/80 border border-rose-100 hover:border-rose-300 transition-all text-left shadow-xs hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">Skin Diagnostic</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">AI Skin Quiz</p>
          </button>

          <button
            onClick={() => setActiveTab("dermconsult")}
            className="group p-4 rounded-2xl bg-white hover:bg-rose-50/80 border border-rose-100 hover:border-rose-300 transition-all text-left shadow-xs hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
              <Stethoscope className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">Derm Consult</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">Clinical Doctors</p>
          </button>

          <button
            onClick={() => setActiveTab("routine")}
            className="group p-4 rounded-2xl bg-white hover:bg-rose-50/80 border border-rose-100 hover:border-rose-300 transition-all text-left shadow-xs hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">Routine Planner</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">AM / PM Steps</p>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className="group p-4 rounded-2xl bg-white hover:bg-rose-50/80 border border-rose-100 hover:border-rose-300 transition-all text-left shadow-xs hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">Glow Catalog</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">Botanical Shop</p>
          </button>

          <button
            onClick={() => setActiveTab("lab")}
            className="group p-4 rounded-2xl bg-white hover:bg-rose-50/80 border border-rose-100 hover:border-rose-300 transition-all text-left shadow-xs hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-500 text-white flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-110 transition-transform">
              <FlaskConical className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">Ingredient Lab</p>
            <p className="text-[11px] text-slate-500 line-clamp-1">Conflict Matrix</p>
          </button>
        </div>
      </div>

      {/* Personalized Skin Health & Diagnostic Status (Real User-Specific State) */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 shadow-xs space-y-6">
        {activeAnalysis || visionScanResult ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm">
                  {activeAnalysis?.skinScore ?? visionScanResult?.overallDermalHealth ?? 85}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                      Your Skin Health Biomarkers
                    </h2>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      Active Profile
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user?.displayName ? `${user.displayName}'s ` : ""}Diagnostic Profile • {visionScanResult?.detectedSkinType || "Combination"} Skin Type
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("analyzer")}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  Retake Diagnostic Quiz
                </button>
                <button
                  onClick={() => setActiveTab("routine")}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  View My Routine
                </button>
              </div>
            </div>

            {/* Biomarker Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Hydration Level</span>
                  <span className="font-mono font-bold text-rose-700">
                    {activeAnalysis?.metrics?.hydration ?? (visionScanResult?.zones?.length ? Math.round(visionScanResult.zones.reduce((acc, z) => acc + (z.hydrationScore || 0), 0) / visionScanResult.zones.length) : 78)}%
                  </span>
                </div>
                <div className="w-full bg-rose-200/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${activeAnalysis?.metrics?.hydration ?? (visionScanResult?.zones?.length ? Math.round(visionScanResult.zones.reduce((acc, z) => acc + (z.hydrationScore || 0), 0) / visionScanResult.zones.length) : 78)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Lipid Barrier</span>
                  <span className="font-mono font-bold text-amber-700">
                    {activeAnalysis?.metrics?.barrier ?? 82}%
                  </span>
                </div>
                <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${activeAnalysis?.metrics?.barrier ?? 82}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Sebum Balance</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {activeAnalysis?.metrics?.sebum ?? 65}%
                  </span>
                </div>
                <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${activeAnalysis?.metrics?.sebum ?? 65}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Clarity Index</span>
                  <span className="font-mono font-bold text-purple-700">
                    {activeAnalysis?.metrics?.clarity ?? (visionScanResult?.zones?.length ? Math.round(visionScanResult.zones.reduce((acc, z) => acc + (100 - (z.rednessScore || 0)), 0) / visionScanResult.zones.length) : 88)}%
                  </span>
                </div>
                <div className="w-full bg-purple-200/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full rounded-full transition-all duration-700" 
                    style={{ width: `${activeAnalysis?.metrics?.clarity ?? (visionScanResult?.zones?.length ? Math.round(visionScanResult.zones.reduce((acc, z) => acc + (100 - (z.rednessScore || 0)), 0) / visionScanResult.zones.length) : 88)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Targeted Actives / Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-slate-700">
                  <strong>Clinical Summary:</strong> {activeAnalysis?.summary || "Targeted formulation with ceramides and niacinamide to restore optimal epidermal barrier integrity."}
                </span>
              </div>
              <button
                onClick={() => setActiveTab("lab")}
                className="text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
              >
                Inspect INCI Actives →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Personalized Skin Intelligence
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                {user?.displayName ? `Welcome, ${user.displayName} ✨` : "Welcome to Nourish Glow ✨"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                No diagnostic biomarker data recorded for your account yet. Complete our 2-minute clinical quiz or launch a facial vision scan to unlock your personalized skin score, customized AM/PM routine, and targeted ingredient matrix.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                id="dashboard-take-quiz-cta"
                onClick={() => setActiveTab("analyzer")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Take the Skin Quiz
              </button>
              <button
                id="dashboard-start-vision-cta"
                onClick={() => setActiveTab("vision")}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Scan className="w-4 h-4" />
                Start Vision Scan
              </button>
              <button
                onClick={() => setActiveTab("routine")}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 border border-rose-200/80"
              >
                <Clock className="w-4 h-4" />
                View Daily Routine
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Today's Active Skincare Routine & Reminders Card */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/70 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Today's Skincare Routine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
              Daily Regimen &amp; Circadian Reminders
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Check off your daily steps and keep your routine streak active
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* AM / PM Toggle Pills */}
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveRoutineRegime("AM")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeRoutineRegime === "AM"
                    ? "bg-white text-rose-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🌞</span> <span>Morning (AM)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRoutineRegime("PM")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeRoutineRegime === "PM"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🌙</span> <span>Evening (PM)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("routine")}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all shadow-3xs cursor-pointer hidden sm:inline-flex items-center gap-1"
            >
              <span>Full Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Routine Reminders Live Status Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-rose-50/70 via-pink-50/50 to-amber-50/50 border border-rose-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-white shadow-3xs text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-slate-800">Circadian Reminder Alert:</span>
              <span className="text-slate-600 ml-1.5 font-mono text-[11px]">
                {activeRoutineRegime === "AM" 
                  ? (reminderSettings?.morningReminderEnabled ? `🌞 ${formatTimeTo12Hour(reminderSettings.morningReminderTime)} (Active)` : "🌞 Morning Off")
                  : (reminderSettings?.eveningReminderEnabled ? `🌙 ${formatTimeTo12Hour(reminderSettings.eveningReminderTime)} (Active)` : "🌙 Evening Off")
                }
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => sendTestNotification()}
              className="px-3 py-1 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 text-[11px] font-semibold cursor-pointer shadow-3xs flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-rose-500" />
              <span>Test Alert</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("routine")}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer shadow-3xs"
            >
              Configure
            </button>
          </div>
        </div>

        {/* Routine Steps List */}
        <div className="space-y-2.5">
          {(activeRoutineRegime === "AM" ? amRoutine : pmRoutine).length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
              No products added to this routine yet. Tap below to build your regimen.
            </div>
          ) : (
            (activeRoutineRegime === "AM" ? amRoutine : pmRoutine).map((step, idx) => (
              <div
                key={idx}
                onClick={() => activeRoutineRegime === "AM" ? onToggleAMStep(idx) : onTogglePMStep(idx)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group ${
                  step.completed 
                    ? "bg-slate-50/80 border-slate-200/80 text-slate-400" 
                    : "bg-white hover:bg-rose-50/40 border-slate-200/90 hover:border-rose-200 shadow-3xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                    step.completed
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-white border-slate-300 text-transparent group-hover:border-rose-400"
                  }`}>
                    <CheckCircle2 className="w-4 h-4 fill-current" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full uppercase tracking-wider font-semibold ${
                        step.completed ? "bg-slate-200 text-slate-500" : "bg-rose-100/70 text-rose-700"
                      }`}>
                        Step {idx + 1} • {step.category}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm font-bold truncate mt-0.5 ${
                      step.completed ? "line-through text-slate-400" : "text-slate-800 group-hover:text-rose-600"
                    }`}>
                      {step.name}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline">
                  {step.completed ? "Completed" : "Tap to complete"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Mobile Link to Routine Planner */}
        <div className="pt-1 flex sm:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("routine")}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open Full Routine Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Personalized Care: What's Your Skin Concern? */}
      <div className="rounded-3xl bg-white border border-rose-100/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold mb-2">
            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
            Personalized Care
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            What's Your Skin Concern?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
            Select a concern to find targeted products &amp; AI-optimized regimens
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {[
            { id: "acne", label: "Acne & Blemishes", emoji: "🔴", desc: "Salicylic Acid, Niacinamide", tab: "catalog" },
            { id: "dryness", label: "Dryness & Dehydration", emoji: "🏜️", desc: "Hyaluronic Acid, Ceramides", tab: "catalog" },
            { id: "aging", label: "Anti-Aging & Fine Lines", emoji: "⏳", desc: "Retinol, Peptides, Matrixyl", tab: "catalog" },
            { id: "dark_spots", label: "Dark Spots & Pigment", emoji: "🟤", desc: "Alpha Arbutin, Vitamin C", tab: "catalog" },
            { id: "sensitivity", label: "Sensitivity & Redness", emoji: "🌿", desc: "Centella, Azelaic Acid", tab: "catalog" },
            { id: "oily", label: "Oily & Congested Skin", emoji: "💧", desc: "Zinc PCA, BHA Toner", tab: "catalog" },
            { id: "dullness", label: "Dullness & Radiance", emoji: "✨", desc: "Glycolic Acid, Licorice", tab: "catalog" },
            { id: "texture", label: "Rough Texture & Pores", emoji: "🪨", desc: "Lactic Acid, PHA Peel", tab: "catalog" },
          ].map((concern) => (
            <button
              key={concern.id}
              onClick={() => setActiveTab(concern.tab)}
              className="p-4 rounded-2xl bg-rose-50/40 hover:bg-rose-50 border border-rose-100 hover:border-rose-300 transition-all text-left group shadow-2xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform select-none">
                  {concern.emoji}
                </span>
                <p className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  {concern.label}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-mono line-clamp-1">
                {concern.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Powered by Science: Real Results, Real Confidence (from SakuraSkin reference) */}
      <div className="rounded-3xl bg-gradient-to-br from-white via-rose-50/20 to-emerald-50/20 border border-rose-100 p-6 sm:p-10 shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <span className="text-xs font-serif italic text-emerald-700 font-semibold tracking-wider uppercase block mb-1">
            Powered by Science
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-slate-900 tracking-tight">
            Real Results, <span className="text-emerald-700 italic font-serif">Real Confidence</span>
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-rose-400 to-emerald-500 mx-auto my-3 rounded-full" />
          <p className="text-xs sm:text-sm text-slate-600">
            Our AI-powered analysis helps you build the perfect routine for radiant, healthy skin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          {/* Left: Beauty Model Card with Floating Accuracy Badge */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-rose-200/80 bg-rose-100 aspect-4/3 sm:aspect-square flex items-center justify-center">
              {/* Aesthetic Beauty Illustration & Photography Placeholder */}
              <img 
                src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80" 
                alt="Radiant healthy skincare" 
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              
              {/* Floating 98% Accuracy Rate Pill Badge */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-emerald-100 text-center animate-fade-in">
                <span className="text-2xl font-bold text-emerald-600 block leading-none font-serif">98%</span>
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Accuracy Rate</span>
              </div>

              {/* Bottom Subtle Overlay Text */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-semibold drop-shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Clinical Botanical Bio-Compatibility
                </p>
              </div>
            </div>
          </div>

          {/* Right: Feature Cards (Ingredient Intelligence, Smart Recommendations, Continuous Tracking) */}
          <div className="lg:col-span-7 space-y-4">
            <div 
              onClick={() => setActiveTab("lab")}
              className="p-5 sm:p-6 rounded-2xl bg-white/90 hover:bg-white border border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-emerald-200">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-emerald-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                    Ingredient Intelligence
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-mono font-medium">INCI Parser</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Every product is decoded by our Formulation Agent — analyzing INCI lists, flagging conflicts, and identifying synergies between active ingredients.
                  </p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("analyzer")}
              className="p-5 sm:p-6 rounded-2xl bg-white/90 hover:bg-white border border-rose-100 hover:border-rose-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-rose-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-rose-900 group-hover:text-rose-700 transition-colors flex items-center gap-2">
                    Smart Recommendations
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-mono font-medium">AI Mapping</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Our Skin Analyzer maps your unique profile — skin type, concerns, sensitivities — to precisely the right ingredients and products.
                  </p>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("routine")}
              className="p-5 sm:p-6 rounded-2xl bg-white/90 hover:bg-white border border-amber-100 hover:border-amber-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-amber-200">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-amber-900 group-hover:text-amber-700 transition-colors flex items-center gap-2">
                    Continuous Progress Tracking
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-mono font-medium">Daily Streak</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Monitor skin barrier recovery, hydration indexes, and transformation milestones in real-time with durable cloud sync.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Science Behind Beauty: Build Your Perfect Routine */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-md">
        {/* Glow Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs font-serif italic text-rose-300 tracking-wide uppercase block">
            The Science Behind Beauty
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight">
            Build Your Perfect Routine
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Our Routine Agent intelligently orders your products, detects inter-product conflicts, and alerts you to missing steps. Say goodbye to guesswork — embrace skincare backed by AI precision.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-rose-200 font-medium">
              🌅 AM + PM Routines
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-emerald-200 font-medium">
              🧠 Smart Ordering
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-amber-200 font-medium">
              🛡️ Conflict Detection
            </span>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setActiveTab("routine")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Build My Routine →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Under the Hood: How Our Agents Work Together */}
      <div className="rounded-3xl bg-white border border-rose-100 p-6 sm:p-10 shadow-xs space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-serif italic text-rose-600 font-semibold tracking-wide uppercase block mb-1">
            Under the Hood
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            How Our Agents Work Together
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
            Five specialized artificial intelligence engines collaborating to give you flawless skincare
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Agent 1 */}
          <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100 hover:border-rose-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-3 shadow-xs text-lg">
              🧪
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Formulation Agent</h3>
            <p className="text-xs text-rose-700 font-semibold mb-2">Cosmetic Chemist AI</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Acts as your personal cosmetic chemist. Parses INCI lists and cross-references ingredient interactions, flagging conflicts and synergies.
            </p>
          </div>

          {/* Agent 2 */}
          <div className="p-5 rounded-2xl bg-sky-50/40 border border-sky-100 hover:border-sky-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center mb-3 shadow-xs text-lg">
              🔍
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Scraper Agent</h3>
            <p className="text-xs text-sky-700 font-semibold mb-2">INCI Fetcher</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Searches the web for product listings, fetching exact INCI ingredient lists from brands like Minimalist, The Ordinary, and CeraVe.
            </p>
          </div>

          {/* Agent 3 */}
          <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center mb-3 shadow-xs text-lg">
              🧠
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Skin Analyzer</h3>
            <p className="text-xs text-purple-700 font-semibold mb-2">Personalized Recommendations</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Analyzes your unique skin profile — type, concerns, allergies — and maps them to the perfect active ingredients and products.
            </p>
          </div>

          {/* Agent 4 */}
          <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-xs text-lg">
              🧴
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Routine Agent</h3>
            <p className="text-xs text-emerald-700 font-semibold mb-2">Smart Routine Builder</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Builds and validates AM/PM skincare routines. Smart ordering, conflict detection between products, and missing step alerts.
            </p>
          </div>

          {/* Agent 5 */}
          <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-100 hover:border-amber-300 transition-all md:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-xs text-lg">
              💸
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Dupe Finder</h3>
            <p className="text-xs text-amber-700 font-semibold mb-2">Budget-Friendly Alternatives</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compares ingredient overlap between products to find affordable alternatives. Same ingredients, lower price tag.
            </p>
          </div>
        </div>
      </div>

      {/* Loved by Skincare Enthusiasts: What Our Users Say */}
      <div className="rounded-3xl bg-rose-50/30 border border-rose-100 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-serif italic text-rose-600 font-semibold tracking-wide uppercase block mb-1">
            Loved by Skincare Enthusiasts
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            What Our Users Say
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real stories of radiant skin transformations powered by Nourish Glow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Review 1 */}
          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1 text-sm">
                {"★".repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Nourish Glow completely transformed my routine! The AI detected a conflict between my vitamin C and niacinamide that I never knew about. My skin has never looked better."
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-rose-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                PS
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Priya S.</p>
                <p className="text-[10px] text-rose-600 font-medium">Skincare Enthusiast</p>
              </div>
            </div>
          </div>

          {/* Review 2 */}
          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1 text-sm">
                {"★".repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "The dupe finder saved me thousands of rupees! I found an affordable alternative to my expensive serum with 90% ingredient overlap. Absolute game-changer."
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-rose-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                AP
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Ananya Patel</p>
                <p className="text-[10px] text-emerald-600 font-medium">Beauty Blogger</p>
              </div>
            </div>
          </div>

          {/* Review 3 */}
          <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex text-amber-400 gap-1 text-sm">
                {"★".repeat(5)}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "As someone studying skin science, I'm impressed by how accurately the formulation agent analyzes ingredient interactions. This is real cosmetic chemistry made accessible."
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-rose-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                MK
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Meera Krishnan</p>
                <p className="text-[10px] text-purple-600 font-medium">Dermatology Student</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Skincare Products Section */}
      <section id="dashboard-explore-products-section" aria-label="Explore Skincare Products" className="rounded-3xl bg-white border border-rose-100/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-rose-100/70 pb-5">
          <div>
            <div className="flex items-center gap-2 text-rose-600 mb-1.5">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Curated Formulations & Clean Actives</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Explore Skincare Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Dermatologist-tested cleansers, barrier repair moisturizers, active serums, and broad-spectrum sunscreens tailored for cellular skin health.
            </p>
          </div>

          <button
            type="button"
            id="dashboard-view-all-products-btn"
            onClick={() => setActiveTab("catalog")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-bold transition-all shadow-3xs cursor-pointer shrink-0"
          >
            <span>View Full Catalog & Dupes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Cleanser", "Serum", "Moisturizer", "Sunscreen"].map((cat) => (
            <button
              key={cat}
              type="button"
              id={`explore-cat-${cat.toLowerCase()}`}
              onClick={() => setExploreCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                exploreCategory === cat
                  ? "bg-slate-900 text-white shadow-3xs"
                  : "bg-slate-100/80 text-slate-700 hover:bg-slate-200 border border-transparent"
              }`}
            >
              {cat === "All" ? "All Products" : `${cat}s`}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CURATED_PRODUCTS.filter(p => exploreCategory === "All" || p.category === exploreCategory)
            .slice(0, 6)
            .map((prod) => {
              const discount = calculateDiscountPercent(prod.mrp, prod.price);
              return (
                <div
                  key={prod.id}
                  id={`explore-card-${prod.id}`}
                  className="group rounded-2xl bg-[#FCFAF8] border border-rose-100/80 p-4 hover:border-rose-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Image Thumbnail Container */}
                    <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-rose-50/40 border border-rose-100/60 flex items-center justify-center">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-200/80 shadow-3xs">
                        {prod.category}
                      </span>
                      {discount > 0 && (
                        <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-3xs">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{prod.brand}</p>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors mt-0.5">
                        {prod.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center text-amber-500">
                          <Star className="h-3 w-3 fill-amber-500" />
                          <span className="text-[11px] font-bold ml-1 text-slate-800 font-mono">{prod.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500">Derm Vetted</span>
                      </div>
                    </div>

                    {/* Actives Chips */}
                    <div className="flex flex-wrap gap-1">
                      {prod.ingredients.slice(0, 2).map((ing, i) => (
                        <span key={i} className="text-[10px] bg-white border border-rose-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="pt-3 mt-3 border-t border-rose-100/70 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold font-mono text-slate-900">{formatINR(prod.price)}</span>
                        {prod.mrp > prod.price && (
                          <span className="text-[11px] font-mono text-slate-400 line-through">{formatINR(prod.mrp)}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      id={`explore-btn-${prod.id}`}
                      onClick={() => setActiveTab("catalog")}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Dupe Finder Callout Footer */}
        <div className="rounded-2xl bg-gradient-to-r from-rose-50/70 via-amber-50/50 to-emerald-50/60 border border-rose-100 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-3xs">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Looking for Budget-Friendly Skincare Dupes?
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Compare luxury cult favorites against molecularly identical alternatives formulated with the same active ingredients.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="explore-open-dupes-btn"
            onClick={() => setActiveTab("catalog")}
            className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50/80 border border-rose-200 text-slate-800 text-xs font-bold transition-all shadow-3xs cursor-pointer whitespace-nowrap"
          >
            Find Affordable Dupes →
          </button>
        </div>
      </section>
    </div>
  );
}

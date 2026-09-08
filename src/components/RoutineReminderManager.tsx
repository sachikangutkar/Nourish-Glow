import React, { useState, useEffect, useRef } from "react";
import { 
  BellRing, 
  Sun, 
  Moon, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  X, 
  ArrowRight, 
  Check, 
  Volume2
} from "lucide-react";
import { RoutineReminderSettings, RoutineStep } from "../types";
import { 
  DEFAULT_REMINDER_SETTINGS, 
  loadUserReminderSettings, 
  normalizeTime, 
  playReminderChime, 
  sendMorningReminder, 
  sendEveningReminder, 
  formatTimeTo12Hour 
} from "../lib/reminderService";

interface RoutineReminderManagerProps {
  user?: any;
  amRoutine?: RoutineStep[];
  pmRoutine?: RoutineStep[];
  onNavigate?: (tab: string, replace?: boolean, section?: any) => void;
  onCompleteRoutine?: (regime: "AM" | "PM") => void;
}

interface ActiveReminder {
  type: "AM" | "PM" | "TEST";
  title: string;
  greeting: string;
  message: string;
  routine: RoutineStep[];
  timeFormatted: string;
}

export default function RoutineReminderManager({
  user,
  amRoutine = [],
  pmRoutine = [],
  onNavigate,
  onCompleteRoutine
}: RoutineReminderManagerProps) {
  const [settings, setSettings] = useState<RoutineReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [completedCelebration, setCompletedCelebration] = useState(false);

  // Keep track of fired minutes to prevent repeated alerts within the same minute
  const lastFiredRef = useRef<{ am: string; pm: string }>({ am: "", pm: "" });

  // 1. Load user-specific reminder settings on mount or user switch
  useEffect(() => {
    let isMounted = true;
    loadUserReminderSettings(user?.uid).then((loaded) => {
      if (isMounted) setSettings(loaded);
    });
    return () => { isMounted = false; };
  }, [user?.uid]);

  // 2. Listen for live updates broadcast across the app when settings change
  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
      } else {
        loadUserReminderSettings(user?.uid).then(setSettings);
      }
    };

    const handleTriggerTest = (e: any) => {
      const regime = e?.detail?.regime || "AM";
      const targetRoutine = regime === "PM" ? pmRoutine : amRoutine;
      
      playReminderChime();
      setActiveReminder({
        type: "TEST",
        title: regime === "PM" ? "Evening Routine Reminder (Test Alert)" : "Morning Routine Reminder (Test Alert)",
        greeting: regime === "PM" ? "Good evening! 🌙 Time to unwind & repair" : "Good morning! 🌞 Wake up & protect skin barrier",
        message: "This is your scheduled circadian skincare routine reminder. Your skin barrier is ready for nourishment!",
        routine: targetRoutine.length > 0 ? targetRoutine : (regime === "PM" ? pmRoutine : amRoutine),
        timeFormatted: formatTimeTo12Hour(regime === "PM" ? settings.eveningReminderTime : settings.morningReminderTime)
      });
    };

    window.addEventListener("ng-reminder-settings-updated", handleSettingsUpdated);
    window.addEventListener("ng-trigger-test-reminder", handleTriggerTest);
    window.addEventListener("storage", handleSettingsUpdated);

    return () => {
      window.removeEventListener("ng-reminder-settings-updated", handleSettingsUpdated);
      window.removeEventListener("ng-trigger-test-reminder", handleTriggerTest);
      window.removeEventListener("storage", handleSettingsUpdated);
    };
  }, [user?.uid, amRoutine, pmRoutine, settings]);

  // 3. High-precision continuous background loop (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // If user snoozed the reminder, do not trigger until snooze expires
      if (snoozedUntil && Date.now() < snoozedUntil) {
        return;
      }

      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, "0");
      const currentMin = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHour}:${currentMin}`;
      const todayKey = now.toISOString().split("T")[0]; // YYYY-MM-DD

      const normalizedCurrent = normalizeTime(currentTimeStr);
      const normalizedMorning = normalizeTime(settings.morningReminderTime);
      const normalizedEvening = normalizeTime(settings.eveningReminderTime);

      // Check Morning Reminder
      if (settings.morningReminderEnabled && normalizedCurrent === normalizedMorning) {
        const fireKey = `${todayKey}_${normalizedMorning}`;
        if (lastFiredRef.current.am !== fireKey) {
          lastFiredRef.current.am = fireKey;
          
          playReminderChime();
          setActiveReminder({
            type: "AM",
            title: "Morning Routine Reminder 🌞",
            greeting: "Good morning! Time to protect your skin barrier",
            message: "Start your day fresh! Wash away overnight oils and shield your complexion against UV stress and dehydration.",
            routine: amRoutine,
            timeFormatted: formatTimeTo12Hour(settings.morningReminderTime)
          });

          // Dispatch native browser notification if allowed
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            sendMorningReminder(amRoutine);
          }
        }
      }

      // Check Evening Reminder
      if (settings.eveningReminderEnabled && normalizedCurrent === normalizedEvening) {
        const fireKey = `${todayKey}_${normalizedEvening}`;
        if (lastFiredRef.current.pm !== fireKey) {
          lastFiredRef.current.pm = fireKey;

          playReminderChime();
          setActiveReminder({
            type: "PM",
            title: "Evening Routine Reminder 🌙",
            greeting: "Good evening! End your day with restorative care",
            message: "It's time to cleanse away impurities, replenish moisture, and repair skin cells overnight.",
            routine: pmRoutine,
            timeFormatted: formatTimeTo12Hour(settings.eveningReminderTime)
          });

          // Dispatch native browser notification if allowed
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            sendEveningReminder(pmRoutine);
          }
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [settings, amRoutine, pmRoutine, snoozedUntil]);

  // Handle Mark Routine Complete action
  const handleMarkComplete = () => {
    if (!activeReminder) return;
    const regime = activeReminder.type === "PM" ? "PM" : "AM";
    if (onCompleteRoutine) {
      onCompleteRoutine(regime);
    }
    setCompletedCelebration(true);
    playReminderChime();

    setTimeout(() => {
      setCompletedCelebration(false);
      setActiveReminder(null);
    }, 2000);
  };

  // Handle Snooze action (5 minutes)
  const handleSnooze = () => {
    setSnoozedUntil(Date.now() + 5 * 60 * 1000);
    setActiveReminder(null);
  };

  // Handle Start Routine action
  const handleStartRoutine = () => {
    const isPM = activeReminder?.type === "PM";
    setActiveReminder(null);
    if (onNavigate) {
      onNavigate("routine");
    }
    // Also scroll or deep link to routine
    window.location.hash = "routine";
  };

  if (!activeReminder) return null;

  const isPM = activeReminder.type === "PM";
  const displayRoutine = activeReminder.routine && activeReminder.routine.length > 0 
    ? activeReminder.routine 
    : (isPM ? pmRoutine : amRoutine);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all duration-300 ${
        isPM 
          ? "bg-gradient-to-b from-[#0F172A] to-[#1E1B4B] text-white border-indigo-500/40 shadow-indigo-900/30" 
          : "bg-white text-slate-800 border-rose-200 shadow-rose-500/20"
      }`}>
        {/* Glowing Ambient Top Orb */}
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isPM ? "bg-indigo-500" : "bg-rose-400"
        }`} />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveReminder(null)}
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors cursor-pointer ${
            isPM ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          }`}
          title="Dismiss reminder"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Icon & Time */}
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-2xl animate-bounce duration-1000 ${
            isPM 
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-400/30 shadow-indigo-950" 
              : "bg-gradient-to-br from-amber-100 to-rose-100 text-amber-600 border border-amber-200 shadow-rose-100"
          }`}>
            {isPM ? <Moon className="w-7 h-7 text-indigo-300" /> : <Sun className="w-7 h-7 text-amber-500" />}
          </div>

          <div className="space-y-1 flex-1 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isPM 
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-400/30" 
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {isPM ? "🌙 Circadian PM Alert" : "🌞 Circadian AM Alert"}
              </span>

              <span className={`text-[11px] font-mono flex items-center gap-1 ${
                isPM ? "text-indigo-200/80" : "text-slate-500"
              }`}>
                <Clock className="w-3 h-3" />
                <span>{activeReminder.timeFormatted}</span>
              </span>
            </div>

            <h3 className={`text-xl sm:text-2xl font-serif font-bold ${
              isPM ? "text-white" : "text-slate-900"
            }`}>
              {activeReminder.title}
            </h3>
          </div>
        </div>

        {/* Friendly Message */}
        <div className="mt-4 space-y-1">
          <p className={`text-sm font-semibold ${isPM ? "text-indigo-200" : "text-rose-600"}`}>
            {activeReminder.greeting}
          </p>
          <p className={`text-xs leading-relaxed ${isPM ? "text-slate-300" : "text-slate-600"}`}>
            {activeReminder.message}
          </p>
        </div>

        {/* Routine Steps Preview */}
        <div className={`mt-5 p-4 rounded-2xl border space-y-2.5 ${
          isPM 
            ? "bg-slate-900/60 border-indigo-500/20" 
            : "bg-slate-50 border-slate-200/80"
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isPM ? "text-slate-300" : "text-slate-700"}>
              Connected {isPM ? "Evening" : "Morning"} Routine ({displayRoutine.length} Steps):
            </span>
            <span className="text-[11px] text-emerald-500 font-mono font-bold flex items-center gap-1">
              <Volume2 className="w-3 h-3 animate-pulse" />
              Chime Active
            </span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {displayRoutine.map((step, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                  isPM 
                    ? "bg-white/5 hover:bg-white/10 text-slate-200" 
                    : "bg-white hover:bg-rose-50/50 text-slate-800 border border-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                    isPM ? "bg-indigo-500/30 text-indigo-300" : "bg-rose-100 text-rose-700"
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="truncate font-medium">{step.name}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                  isPM ? "bg-indigo-950 text-indigo-300 border border-indigo-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {step.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Celebration State when Routine is Completed */}
        {completedCelebration ? (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-center gap-2 text-sm font-bold animate-bounce shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
            <span>Routine Completed! Great job glowing today! ✨</span>
          </div>
        ) : (
          /* Action Buttons */
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleStartRoutine}
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-600 hover:from-rose-600 hover:to-emerald-700 text-white text-xs font-bold shadow-lg shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Start Routine</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleMarkComplete}
              className={`w-full sm:w-auto py-3 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                isPM 
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20" 
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Mark Done</span>
            </button>

            <button
              type="button"
              onClick={handleSnooze}
              className={`w-full sm:w-auto py-3 px-4 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isPM 
                  ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze (5m)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

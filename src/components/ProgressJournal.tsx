import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  Trash2, 
  Check, 
  Calendar, 
  TrendingUp, 
  Heart, 
  Smile, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from "recharts";
import { DailyLog } from "../types";

interface ProgressJournalProps {
  logs: DailyLog[];
  onAddLog: (log: Omit<DailyLog, "id" | "loggedAt">) => void;
  onRemoveLog: (id: string) => void;
}

const FEEL_OPTIONS: { emoji: "😫" | "😟" | "😐" | "😊" | "🤩"; label: string; score: number }[] = [
  { emoji: "😫", label: "Very Bad", score: 1 },
  { emoji: "😟", label: "Bad", score: 2 },
  { emoji: "😐", label: "Neutral", score: 3 },
  { emoji: "😊", label: "Good", score: 4 },
  { emoji: "🤩", label: "Great", score: 5 },
];

const AVAILABLE_CONCERNS = [
  "breakout",
  "dryness",
  "oiliness",
  "redness",
  "irritation",
  "flaking",
  "tightness",
  "smooth"
];

export default function ProgressJournal({ logs, onAddLog, onRemoveLog }: ProgressJournalProps) {
  const [selectedFeel, setSelectedFeel] = useState<typeof FEEL_OPTIONS[0]>(FEEL_OPTIONS[3]); // Default 😊 Good
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Format today's date in "Wednesday, September 2" style
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }, []);

  const todayIso = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const toggleConcern = (concern: string) => {
    if (selectedConcerns.includes(concern)) {
      setSelectedConcerns(selectedConcerns.filter(c => c !== concern));
    } else {
      setSelectedConcerns([...selectedConcerns, concern]);
    }
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    onAddLog({
      date: todayIso,
      formattedDate: todayFormatted,
      skinRating: selectedFeel.score,
      emoji: selectedFeel.emoji,
      feelLabel: selectedFeel.label,
      concerns: selectedConcerns,
      notes: notes.trim(),
      amCompleted: true,
      pmCompleted: false,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);

    // Reset notes or keep for today
    setNotes("");
  };

  // Prepare chart data from logs (sorted chronologically)
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    // Sort oldest first for trend display
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.map((log) => {
      // Map 1-10 to 1-5 if legacy data exists
      let score = log.skinRating;
      if (score > 5) {
        score = Math.round(score / 2);
      }
      
      const dateObj = new Date(log.date);
      const shortDate = isNaN(dateObj.getTime())
        ? log.date
        : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        date: shortDate,
        fullDate: log.formattedDate || log.date,
        score: score,
        emoji: log.emoji || (score >= 5 ? "🤩" : score >= 4 ? "😊" : score >= 3 ? "😐" : score >= 2 ? "😟" : "😫"),
        concerns: log.concerns || [],
        notes: log.notes
      };
    });
  }, [logs]);

  // Calculate stats
  const averageScore = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, curr) => acc + curr.score, 0);
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-fade-in font-sans">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <span className="text-rose-500">🌸</span> Skin Diary
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
          Track your skin's journey — all data stays private on your device
        </p>
      </div>

      {/* Today's Entry Form Card */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-[0_4px_25px_rgba(244,63,94,0.06)] p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100/80 pb-4">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <span>Today's Entry —</span>
            <span className="text-rose-600">{todayFormatted}</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-rose-50 px-3 py-1 rounded-full w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            <span>Private Local Storage</span>
          </span>
        </div>

        {/* Feedback banner */}
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-3 h-3" />
            </span>
            <span>Entry saved successfully! Your daily skin score trend has been updated. 🌸</span>
          </div>
        )}

        <form onSubmit={handleSaveEntry} className="space-y-6">
          {/* Section 1: How does your skin feel? */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              How does your skin feel?
            </label>
            <div className="grid grid-cols-5 gap-2 sm:gap-4 max-w-md">
              {FEEL_OPTIONS.map((opt) => {
                const isSelected = selectedFeel.emoji === opt.emoji;
                return (
                  <button
                    key={opt.emoji}
                    type="button"
                    onClick={() => setSelectedFeel(opt)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-rose-50/80 border-rose-400 scale-105 shadow-sm shadow-rose-200/50"
                        : "bg-white border-slate-200 hover:border-rose-200 hover:bg-slate-50/60"
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl filter drop-shadow-xs transition-transform hover:scale-110">
                      {opt.emoji}
                    </span>
                    <span className={`text-[11px] sm:text-xs mt-1.5 font-medium ${
                      isSelected ? "text-rose-600 font-semibold" : "text-slate-500"
                    }`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Skin concerns today */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Skin concerns today
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CONCERNS.map((concern) => {
                const isSelected = selectedConcerns.includes(concern);
                return (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleConcern(concern)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer capitalize border ${
                      isSelected
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-xs shadow-rose-300"
                        : "bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/30"
                    }`}
                  >
                    {concern}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How's your skin today? Any new products tried?"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 transition-all resize-none"
            />
          </div>

          {/* Save Button */}
          <div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-sm rounded-2xl shadow-md shadow-rose-500/25 hover:shadow-rose-500/35 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Save Entry 🌸</span>
            </button>
          </div>
        </form>
      </div>

      {/* 📊 Skin Score Trend Section */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-[0_4px_25px_rgba(244,63,94,0.06)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-rose-100/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
              Skin Score Trend
            </h2>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                Avg Score: <strong className="text-rose-600">{averageScore}/5</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                Entries: <strong className="text-slate-700">{chartData.length}</strong>
              </span>
            </div>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-rose-50/30 rounded-2xl border border-dashed border-rose-200">
            <span className="text-3xl">📈</span>
            <p className="text-sm font-medium text-slate-600">
              Start logging daily to see your skin score trend!
            </p>
            <p className="text-xs text-slate-400">
              Log your feeling above to plot your skin harmony timeline.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: "#64748b", fontSize: 11 }} 
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                    tick={{ fill: "#64748b", fontSize: 11 }} 
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-rose-200 shadow-lg text-xs space-y-1">
                            <p className="font-semibold text-slate-900 flex items-center justify-between gap-3">
                              <span>{data.fullDate}</span>
                              <span className="text-base">{data.emoji}</span>
                            </p>
                            <p className="text-rose-600 font-medium">Skin Score: {data.score}/5</p>
                            {data.concerns && data.concerns.length > 0 && (
                              <p className="text-slate-500 text-[11px]">
                                Concerns: {data.concerns.join(", ")}
                              </p>
                            )}
                            {data.notes && (
                              <p className="text-slate-600 italic text-[11px] max-w-xs border-t border-slate-100 pt-1 mt-1">
                                "{data.notes}"
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#scoreGradient)" 
                    dot={{ fill: "#f43f5e", r: 4, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
              <span>Scale: 1 (😫 Very Bad) to 5 (🤩 Great)</span>
              <span>Daily Skin Health Plot</span>
            </div>
          </div>
        )}
      </div>

      {/* 📅 Past Entries Section */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-[0_4px_25px_rgba(244,63,94,0.06)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-rose-100/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
              Past Entries
            </h2>
          </div>
          {logs && logs.length > 0 && (
            <span className="text-xs font-mono text-slate-400">
              {logs.length} Total {logs.length === 1 ? "Log" : "Logs"}
            </span>
          )}
        </div>

        {!logs || logs.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-600">
              No diary entries yet. Start tracking today!
            </p>
            <p className="text-xs text-slate-400">
              Your logged entries will appear here chronologically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const feelEmoji = log.emoji || (log.skinRating >= 5 ? "🤩" : log.skinRating >= 4 ? "😊" : log.skinRating >= 3 ? "😐" : log.skinRating >= 2 ? "😟" : "😫");
              const feelLabel = log.feelLabel || (log.skinRating >= 5 ? "Great" : log.skinRating >= 4 ? "Good" : log.skinRating >= 3 ? "Neutral" : log.skinRating >= 2 ? "Bad" : "Very Bad");
              const displayDate = log.formattedDate || log.date;

              return (
                <div 
                  key={log.id} 
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-150 hover:border-rose-200 hover:bg-rose-50/10 transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" title={feelLabel}>
                        {feelEmoji}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {displayDate}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Felt {feelLabel} • Skin Score: {log.skinRating > 5 ? Math.round(log.skinRating/2) : log.skinRating}/5
                        </p>
                      </div>
                    </div>

                    {/* Concerns */}
                    {log.concerns && log.concerns.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {log.concerns.map((concern, idx) => (
                          <span 
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-100/70 text-rose-700 capitalize"
                          >
                            {concern}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {log.notes && (
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-150/80 leading-relaxed italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <div className="self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => onRemoveLog(log.id)}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { 
  Tv, 
  Wifi, 
  BatteryCharging, 
  Flame, 
  Sun, 
  Droplets, 
  Zap, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Radio, 
  Sparkles, 
  Wind, 
  Power,
  RotateCw,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import { SmartMirrorConfig, RoutineStep } from "../types";

interface SmartMirrorIoTProps {
  user?: { displayName: string; email: string; photoURL?: string; uid: string } | null;
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
}

export default function SmartMirrorIoT({ 
  user, 
  amRoutine = [], 
  pmRoutine = [] 
}: SmartMirrorIoTProps) {
  // Mirror IoT configuration state
  const [config, setConfig] = useState<SmartMirrorConfig>({
    deviceId: "GlowMirror-IoT-X7",
    deviceName: "Bathroom Master Vanity Mirror",
    isConnected: true,
    batteryLevel: 94,
    wifiSignal: "Strong",
    firmwareVersion: "v2.8.4-LTS",
    lightTemperatureK: 4500, // Kelvin scale
    lightBrightnessPercent: 80,
    antiFogHeatingEnabled: true,
    autoDisplayRoutine: true,
    proximitySensorEnabled: true,
    environmentSensors: {
      humidityPercent: 62,
      temperatureC: 22.5,
      uvIndex: 4,
      waterTdsPpm: 145 // Total Dissolved Solids
    },
    lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeMirrorMode, setActiveMirrorMode] = useState<"AM" | "PM" | "STANDBY">("AM");
  const [glassTheme, setGlassTheme] = useState<"warm-natural" | "obsidian-dark">("warm-natural");
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  const currentRoutine = (activeMirrorMode === "AM" ? amRoutine : pmRoutine) || [];

  const triggerManualSync = () => {
    setIsSyncing(true);
    setSyncStatusMessage("Broadcasting IoT payload over WebSocket mesh...");
    setTimeout(() => {
      setConfig(prev => ({
        ...prev,
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setIsSyncing(false);
      setSyncStatusMessage("Mirror glass display updated successfully!");
      setTimeout(() => setSyncStatusMessage(null), 3000);
    }, 1200);
  };

  const toggleAntiFog = () => {
    setConfig(prev => ({ ...prev, antiFogHeatingEnabled: !prev.antiFogHeatingEnabled }));
  };

  const toggleProximity = () => {
    setConfig(prev => ({ ...prev, proximitySensorEnabled: !prev.proximitySensorEnabled }));
  };

  const handleLightTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, lightTemperatureK: Number(e.target.value) }));
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, lightBrightnessPercent: Number(e.target.value) }));
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="border border-natural-border bg-natural-white p-8 rounded-3xl shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-natural-sage mb-2">
            <Radio className="h-5 w-5 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest">IoT Hardware Node</span>
          </div>
          <h2 className="text-3xl font-serif font-medium tracking-tight text-natural-text-primary">
            Smart Mirror IoT Integration
          </h2>
          <p className="text-sm text-natural-text-secondary mt-1 max-w-2xl">
            Seamlessly pair your bathroom vanity mirror with Nourish Glow. Broadcast step-by-step skincare routines directly onto smart mirror glass, adjust LED color temperatures, and track ambient environment telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerManualSync}
            disabled={isSyncing}
            className="px-5 py-3 bg-natural-sage hover:bg-natural-sage-hover text-natural-white rounded-2xl font-semibold text-xs transition-all shadow-3xs cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing IoT..." : "Sync Mirror HUD"}
          </button>
        </div>
      </div>

      {/* Sync Banner notification */}
      {syncStatusMessage && (
        <div className="p-4 bg-natural-sage-light border border-natural-sage/30 rounded-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-natural-sage" />
          <p className="text-xs font-medium text-natural-text-primary">{syncStatusMessage}</p>
        </div>
      )}

      {/* Main Grid: Device Telemetry & Live Mirror Glass Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Device Status & Telemetry */}
        <div className="lg:col-span-5 space-y-6">
          {/* Device Connection Info Card */}
          <div className="border border-natural-border bg-natural-white p-6 rounded-3xl shadow-3xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-natural-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-natural-sage/10 text-natural-sage flex items-center justify-center">
                  <Tv className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-natural-text-primary">{config.deviceName}</h3>
                  <p className="text-xs font-mono text-natural-text-secondary">{config.deviceId}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-mono font-bold border border-emerald-200">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                ONLINE
              </div>
            </div>

            {/* Status Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-natural-card/50 rounded-2xl border border-natural-border/50">
                <div className="flex items-center gap-2 text-natural-text-secondary text-xs">
                  <Wifi className="h-3.5 w-3.5 text-natural-sage" />
                  <span>Wi-Fi Signal</span>
                </div>
                <p className="text-sm font-bold text-natural-text-primary mt-1 font-mono">{config.wifiSignal} (-54 dBm)</p>
              </div>

              <div className="p-3.5 bg-natural-card/50 rounded-2xl border border-natural-border/50">
                <div className="flex items-center gap-2 text-natural-text-secondary text-xs">
                  <BatteryCharging className="h-3.5 w-3.5 text-natural-sage" />
                  <span>Battery Reserve</span>
                </div>
                <p className="text-sm font-bold text-natural-text-primary mt-1 font-mono">{config.batteryLevel}% (AC Powered)</p>
              </div>

              <div className="p-3.5 bg-natural-card/50 rounded-2xl border border-natural-border/50">
                <div className="flex items-center gap-2 text-natural-text-secondary text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-natural-sage" />
                  <span>Firmware</span>
                </div>
                <p className="text-sm font-bold text-natural-text-primary mt-1 font-mono">{config.firmwareVersion}</p>
              </div>

              <div className="p-3.5 bg-natural-card/50 rounded-2xl border border-natural-border/50">
                <div className="flex items-center gap-2 text-natural-text-secondary text-xs">
                  <Clock className="h-3.5 w-3.5 text-natural-sage" />
                  <span>Last Sync</span>
                </div>
                <p className="text-sm font-bold text-natural-text-primary mt-1 font-mono">{config.lastSyncedAt}</p>
              </div>
            </div>
          </div>

          {/* Environmental Sensors Telemetry */}
          <div className="border border-natural-border bg-natural-white p-6 rounded-3xl shadow-3xs space-y-4">
            <h3 className="text-sm font-serif font-medium text-natural-text-primary flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-natural-sage" />
                Bathroom Environment Telemetry
              </span>
              <span className="text-[10px] font-mono text-natural-text-secondary">IoT Live Sensors</span>
            </h3>

            <div className="space-y-3">
              {/* Humidity */}
              <div className="flex items-center justify-between p-3 bg-natural-card/40 rounded-2xl border border-natural-border/40">
                <div className="flex items-center gap-3">
                  <Droplets className="h-4 w-4 text-natural-clay" />
                  <div>
                    <p className="text-xs font-semibold text-natural-text-primary">Relative Humidity</p>
                    <p className="text-[10px] text-natural-text-secondary">Optimal range for hydration</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-natural-text-primary">{config.environmentSensors.humidityPercent}%</span>
              </div>

              {/* Temperature */}
              <div className="flex items-center justify-between p-3 bg-natural-card/40 rounded-2xl border border-natural-border/40">
                <div className="flex items-center gap-3">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold text-natural-text-primary">Ambient Temperature</p>
                    <p className="text-[10px] text-natural-text-secondary">Bathroom climate</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-natural-text-primary">{config.environmentSensors.temperatureC}°C</span>
              </div>

              {/* UV Index */}
              <div className="flex items-center justify-between p-3 bg-natural-card/40 rounded-2xl border border-natural-border/40">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-xs font-semibold text-natural-text-primary">Window UV Index</p>
                    <p className="text-[10px] text-natural-text-secondary">Sun protection indicator</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-amber-600">{config.environmentSensors.uvIndex} (Moderate)</span>
              </div>

              {/* Water TDS */}
              <div className="flex items-center justify-between p-3 bg-natural-card/40 rounded-2xl border border-natural-border/40">
                <div className="flex items-center gap-3">
                  <Droplets className="h-4 w-4 text-indigo-400" />
                  <div>
                    <p className="text-xs font-semibold text-natural-text-primary">Tap Water TDS</p>
                    <p className="text-[10px] text-natural-text-secondary">Water hardness check</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm text-natural-text-primary">{config.environmentSensors.waterTdsPpm} PPM</span>
              </div>
            </div>
          </div>

          {/* IoT Hardware Lighting & Glass Controls */}
          <div className="border border-natural-border bg-natural-white p-6 rounded-3xl shadow-3xs space-y-6">
            <h3 className="text-sm font-serif font-medium text-natural-text-primary flex items-center gap-2">
              <Sliders className="h-4 w-4 text-natural-sage" />
              Mirror Glass & Light Controls
            </h3>

            {/* Light Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-natural-text-primary">LED Color Temperature</span>
                <span className="font-mono font-bold text-natural-sage">{config.lightTemperatureK}K</span>
              </div>
              <input 
                type="range" 
                min="2700" 
                max="6500" 
                step="100"
                value={config.lightTemperatureK}
                onChange={handleLightTempChange}
                className="w-full accent-natural-sage cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-natural-text-secondary font-mono">
                <span>2700K Warm</span>
                <span>4500K Daylight</span>
                <span>6500K Cool</span>
              </div>
            </div>

            {/* Brightness Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-natural-text-primary">LED Glass Brightness</span>
                <span className="font-mono font-bold text-natural-sage">{config.lightBrightnessPercent}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={config.lightBrightnessPercent}
                onChange={handleBrightnessChange}
                className="w-full accent-natural-sage cursor-pointer"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-natural-card/50 rounded-2xl border border-natural-border/50">
                <div className="flex items-center gap-3">
                  <Wind className="h-4 w-4 text-natural-sage" />
                  <div>
                    <p className="text-xs font-semibold text-natural-text-primary">Anti-Fog Heating Element</p>
                    <p className="text-[10px] text-natural-text-secondary">Defog glass automatically</p>
                  </div>
                </div>
                <button
                  onClick={toggleAntiFog}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                    config.antiFogHeatingEnabled ? "bg-natural-sage" : "bg-natural-border"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full bg-natural-white shadow-3xs transition-transform ${
                    config.antiFogHeatingEnabled ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-natural-card/50 rounded-2xl border border-natural-border/50">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-natural-sage" />
                  <div>
                    <p className="text-xs font-semibold text-natural-text-primary">Proximity Motion Sensor</p>
                    <p className="text-[10px] text-natural-text-secondary">Turn on glass HUD upon approach</p>
                  </div>
                </div>
                <button
                  onClick={toggleProximity}
                  className={`h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer relative ${
                    config.proximitySensorEnabled ? "bg-natural-sage" : "bg-natural-border"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full bg-natural-white shadow-3xs transition-transform ${
                    config.proximitySensorEnabled ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Smart Mirror Glass HUD Simulator */}
        <div className="lg:col-span-7 space-y-6">
          {/* Glass Theme Selector */}
          <div className="flex items-center justify-between bg-natural-white border border-natural-border p-3 rounded-2xl shadow-3xs">
            <span className="text-xs font-serif font-medium text-natural-text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-natural-sage" />
              Mirror Glass Finish Theme:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setGlassTheme("warm-natural")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  glassTheme === "warm-natural"
                    ? "bg-natural-sage text-natural-white shadow-3xs"
                    : "bg-natural-card text-natural-text-secondary hover:text-natural-text-primary"
                }`}
              >
                Warm Natural Glass (Site Theme)
              </button>
              <button
                type="button"
                onClick={() => setGlassTheme("obsidian-dark")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  glassTheme === "obsidian-dark"
                    ? "bg-slate-900 text-white shadow-3xs"
                    : "bg-natural-card text-natural-text-secondary hover:text-natural-text-primary"
                }`}
              >
                Twilight Obsidian
              </button>
            </div>
          </div>

          <div className={`border-2 p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden min-h-[600px] flex flex-col justify-between transition-all duration-300 ${
            glassTheme === "warm-natural"
              ? "border-natural-border bg-natural-white text-natural-text-primary"
              : "border-slate-800 bg-slate-950 text-white"
          }`}>
            {/* Ambient Lighting Edge Glow reflection preview */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-25 transition-all duration-300"
              style={{
                boxShadow: `inset 0 0 90px 25px ${
                  config.lightTemperatureK < 3500 
                    ? "rgba(200, 125, 85, 0.35)" 
                    : config.lightTemperatureK > 5500 
                      ? "rgba(120, 134, 107, 0.35)" 
                      : "rgba(217, 119, 6, 0.3)"
                }`
              }}
            />

            {/* Mirror Top HUD Bar */}
            <div className={`relative z-10 flex justify-between items-start pb-6 border-b ${
              glassTheme === "warm-natural" ? "border-natural-border" : "border-white/10"
            }`}>
              <div>
                <p className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                  glassTheme === "warm-natural" ? "text-natural-sage" : "text-emerald-400"
                }`}>
                  <span className={`h-2 w-2 rounded-full animate-ping ${
                    glassTheme === "warm-natural" ? "bg-natural-sage" : "bg-emerald-400"
                  }`} />
                  SMART MIRROR GLASS HUD ACTIVE
                </p>
                <h3 className={`text-2xl font-serif font-medium tracking-tight mt-1 ${
                  glassTheme === "warm-natural" ? "text-natural-text-primary" : "text-white"
                }`}>
                  Good Morning, {user ? user.displayName.split(" ")[0] : "Guest"} ✨
                </h3>
              </div>

              <div className="text-right font-mono">
                <p className="text-2xl font-bold tracking-tight">08:45 AM</p>
                <p className={`text-xs ${glassTheme === "warm-natural" ? "text-natural-text-secondary" : "text-white/60"}`}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Mirror Mode Selector */}
            <div className={`relative z-10 my-6 flex justify-between items-center p-2 rounded-2xl border ${
              glassTheme === "warm-natural" ? "bg-natural-card/80 border-natural-border" : "bg-white/5 border-white/10"
            }`}>
              <span className={`text-xs font-mono pl-2 ${
                glassTheme === "warm-natural" ? "text-natural-text-secondary" : "text-white/70"
              }`}>DISPLAY MODE:</span>
              <div className="flex gap-1.5">
                {(["AM", "PM", "STANDBY"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActiveMirrorMode(mode)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeMirrorMode === mode 
                        ? glassTheme === "warm-natural"
                          ? "bg-natural-sage text-natural-white shadow-3xs"
                          : "bg-emerald-500 text-slate-950 shadow-md" 
                        : glassTheme === "warm-natural"
                          ? "hover:bg-natural-white text-natural-text-secondary"
                          : "hover:bg-white/10 text-white/70"
                    }`}
                  >
                    {mode} Routine
                  </button>
                ))}
              </div>
            </div>

            {/* Routine Steps Overlay Display */}
            <div className="relative z-10 flex-1 space-y-4 py-4">
              <div className={`flex justify-between items-center text-xs font-mono ${
                glassTheme === "warm-natural" ? "text-natural-text-secondary" : "text-white/60"
              }`}>
                <span>ROUTINE STEPS SYNCED</span>
                <span>STEP 1 OF {(currentRoutine || []).length}</span>
              </div>

              <div className="space-y-3">
                {(currentRoutine || []).map((step, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      idx === 0 
                        ? glassTheme === "warm-natural"
                          ? "bg-natural-sage-light border-natural-sage/40 text-natural-text-primary shadow-xs scale-[1.01]"
                          : "bg-white/15 border-emerald-400/50 text-white shadow-lg scale-[1.01]" 
                        : glassTheme === "warm-natural"
                          ? "bg-natural-card/50 border-natural-border/60 text-natural-text-secondary opacity-75"
                          : "bg-white/5 border-white/10 text-white/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-7 w-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                          idx === 0 
                            ? glassTheme === "warm-natural" ? "bg-natural-sage text-natural-white" : "bg-emerald-400 text-slate-950"
                            : glassTheme === "warm-natural" ? "bg-natural-border/60 text-natural-text-primary" : "bg-white/10 text-white"
                        }`}>
                          {step.step}
                        </div>
                        <div>
                          <h4 className={`text-sm font-semibold tracking-tight ${
                            glassTheme === "warm-natural" ? "text-natural-text-primary" : "text-white"
                          }`}>{step.category} — {step.name}</h4>
                          <p className={`text-xs mt-0.5 ${
                            glassTheme === "warm-natural" ? "text-natural-text-secondary" : "text-white/70"
                          }`}>{step.instructions}</p>
                        </div>
                      </div>
                      {idx === 0 && (
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                          glassTheme === "warm-natural"
                            ? "bg-natural-sage text-natural-white border-natural-sage"
                            : "bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
                        }`}>
                          Active Step
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mirror Glass Bottom Environmental Telemetry HUD */}
            <div className={`relative z-10 pt-6 border-t grid grid-cols-4 gap-4 text-center font-mono ${
              glassTheme === "warm-natural" ? "border-natural-border" : "border-white/10"
            }`}>
              <div className={`p-3 rounded-2xl border ${
                glassTheme === "warm-natural" ? "bg-natural-card/70 border-natural-border" : "bg-white/5 border-white/10"
              }`}>
                <p className={`text-[10px] ${glassTheme === "warm-natural" ? "text-natural-text-secondary" : "text-white/50"}`}>HUMIDITY</p>
                <p className={`text-sm font-bold mt-0.5 ${glassTheme === "warm-natural" ? "text-natural-text-primary" : "text-white"}`}>{config.environmentSensors.humidityPercent}%</p>
              </div>
              <div className={`p-3 rounded-2xl border ${
                glassTheme === "warm-natural" ? "bg-natural-card/70 border-natural-border" : "bg-white/5 border-white/10"
              }`}>
                <p className={`text-[10px] ${glassTheme === "warm-natural" ? "text-natural-text-secondary" : "text-white/50"}`}>TEMP</p>
                <p className={`text-sm font-bold mt-0.5 ${glassTheme === "warm-natural" ? "text-natural-text-primary" : "text-white"}`}>{config.environmentSensors.temperatureC}°C</p>
              </div>
              <div className={`p-3 rounded-2xl border ${
                glassTheme === "warm-natural" ? "bg-natural-card/70 border-natural-border" : "bg-white/5 border-white/10"
              }`}>
                <p className={`text-[10px] ${glassTheme === "warm-natural" ? "text-natural-text-secondary" : "text-white/50"}`}>UV INDEX</p>
                <p className="text-sm font-bold text-natural-terracotta mt-0.5">{config.environmentSensors.uvIndex}</p>
              </div>
              <div className={`p-3 rounded-2xl border ${
                glassTheme === "warm-natural" ? "bg-natural-card/70 border-natural-border" : "bg-white/5 border-white/10"
              }`}>
                <p className={`text-[10px] ${glassTheme === "warm-natural" ? "text-natural-text-secondary" : "text-white/50"}`}>LED TEMP</p>
                <p className={`text-sm font-bold mt-0.5 ${glassTheme === "warm-natural" ? "text-natural-text-primary" : "text-white"}`}>{config.lightTemperatureK}K</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

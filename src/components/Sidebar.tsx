import React from "react";
import { 
  Sparkles, 
  Home, 
  Calendar, 
  Clock, 
  ShoppingBag, 
  FlaskConical, 
  BookOpen,
  ChevronRight,
  User,
  Heart,
  LogOut,
  LogIn,
  CloudLightning,
  CloudCheck,
  Scan,
  Tv,
  Stethoscope
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  streak: number;
  user: {
    displayName: string;
    email: string;
    photoURL?: string;
  } | null;
  onLogin: () => void;
  onLogout: () => void;
  isCloudSynced: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, streak, user, onLogin, onLogout, isCloudSynced }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, desc: "Overview & Daily Goals" },
    { id: "analyzer", label: "Skin Diagnostic", icon: Sparkles, desc: "Personalized Skin Scan" },
    { id: "vision", label: "Vision Skin Scan", icon: Scan, desc: "AI Facial Image Upload" },
    { id: "smartmirror", label: "Smart Mirror IoT", icon: Tv, desc: "Bathroom HUD & Telemetry" },
    { id: "dermconsult", label: "Derm Consultation", icon: Stethoscope, desc: "Certified Doctors & Chat" },
    { id: "routine", label: "Routine Planner", icon: Clock, desc: "AM & PM Schedules" },
    { id: "catalog", label: "Glow Catalog", icon: ShoppingBag, desc: "Curated Skincare Shop" },
    { id: "lab", label: "Ingredient Lab", icon: FlaskConical, desc: "Science & Layering" },
    { id: "journal", label: "Progress Journal", icon: BookOpen, desc: "Selfie Logs & Charts" },
    { id: "account", label: "My Account", icon: User, desc: "Sync & Credentials" },
  ];

  return (
    <aside id="app-sidebar" className="w-80 border-r border-natural-border bg-natural-card flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-natural-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-natural-sage flex items-center justify-center shadow-sm">
            <Heart className="h-4.5 w-4.5 text-natural-white fill-natural-white/25" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-medium tracking-tight text-natural-text-primary">
              Nourish Glow
            </h1>
            <p className="text-[10px] font-mono text-natural-text-secondary uppercase tracking-widest">
              Routine Optimizer
            </p>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left group ${
                isActive
                  ? "bg-natural-sage/10 border-l-4 border-natural-sage text-natural-text-primary font-medium"
                  : "text-natural-text-secondary hover:text-natural-text-primary hover:bg-natural-bg"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-natural-sage" : "text-natural-text-secondary/50 group-hover:text-natural-text-primary"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium tracking-tight">{item.label}</p>
                <p className="text-[11px] text-natural-text-secondary/70 font-normal leading-tight">{item.desc}</p>
              </div>
              <ChevronRight className={`h-4 w-4 text-natural-text-secondary/65 transition-transform ${isActive ? "opacity-100 translate-x-1" : "opacity-0"}`} />
            </button>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-5 border-t border-natural-border bg-natural-card/50">
        {user ? (
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName} 
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover border border-natural-border-dark shadow-3xs cursor-pointer hover:border-natural-sage transition-all"
                onClick={() => setActiveTab("account")}
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-full bg-natural-bg flex items-center justify-center border border-natural-border-dark shadow-3xs cursor-pointer hover:border-natural-sage transition-all"
                onClick={() => setActiveTab("account")}
              >
                <User className="h-5 w-5 text-natural-text-secondary" />
              </div>
            )}
            
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setActiveTab("account")}>
              <p className="text-sm font-medium text-natural-text-primary truncate hover:text-natural-sage transition-all">{user.displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isCloudSynced ? (
                  <>
                    <CloudCheck className="h-3 w-3 text-natural-sage" />
                    <span className="text-[10px] text-natural-sage font-mono font-semibold uppercase tracking-wider">Cloud Backup</span>
                  </>
                ) : (
                  <>
                    <CloudLightning className="h-3 w-3 text-natural-text-secondary/60" />
                    <span className="text-[10px] text-natural-text-secondary/60 font-mono font-semibold uppercase tracking-wider">Local Account</span>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="p-2 text-natural-text-secondary/60 hover:text-natural-terracotta hover:bg-natural-bg rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setActiveTab("account")}
            className="w-full py-2.5 px-4 bg-natural-sage hover:bg-natural-sage-hover text-natural-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-3xs cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            Sign In for Cloud Sync
          </button>
        )}
      </div>
    </aside>
  );
}

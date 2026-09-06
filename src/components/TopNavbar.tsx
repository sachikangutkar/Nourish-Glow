import React, { useState } from "react";
import { 
  Sparkles, 
  Home, 
  Clock, 
  ShoppingBag, 
  FlaskConical, 
  BookOpen, 
  User, 
  Scan, 
  Stethoscope,
  Heart,
  Menu,
  X,
  LogIn,
  LogOut,
  ChevronDown
} from "lucide-react";

interface TopNavbarProps {
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
  cartCount?: number;
}

export default function TopNavbar({
  activeTab,
  setActiveTab,
  streak,
  user,
  onLogin,
  onLogout,
  isCloudSynced,
  cartCount = 0
}: TopNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: Home },
    { id: "analyzer", label: "Skin Diagnostic", shortLabel: "Diagnostic", icon: Sparkles },
    { id: "vision", label: "Vision Skin Scan", shortLabel: "Vision Scan", icon: Scan },
    { id: "dermconsult", label: "Derm Consultation", shortLabel: "Derm Consult", icon: Stethoscope },
    { id: "routine", label: "Routine Planner", shortLabel: "Routine", icon: Clock },
    { id: "catalog", label: "Glow Catalog", shortLabel: "Catalog", icon: ShoppingBag },
    { id: "lab", label: "Ingredient Lab", shortLabel: "Lab", icon: FlaskConical },
    { id: "journal", label: "Progress Journal", shortLabel: "Journal", icon: BookOpen },
    { id: "account", label: "My Account", shortLabel: "Account", icon: User },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-[0_4px_20px_rgba(244,63,94,0.04)] transition-all">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => handleNavClick("dashboard")}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0 select-none py-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:scale-105 group-hover:shadow-rose-500/35 transition-all duration-300 border border-white/60 p-2 text-white">
              {/* Heart Symbol */}
              <Heart className="w-5 h-5 text-white fill-white drop-shadow-xs" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-xl tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">
                  Nourish Glow
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-semibold tracking-wider">
                  AI Skincare
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-sans tracking-wide">
                AI Dermatology &amp; Routine Intelligence
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Horizontal Above Grid) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`top-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm shadow-rose-500/25 font-semibold"
                      : "text-slate-600 hover:text-rose-600 hover:bg-rose-50/70"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Glow Shop Quick Access */}
            <button
              onClick={() => handleNavClick("catalog")}
              className={`relative p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors ${
                activeTab === "catalog" ? "bg-rose-50 text-rose-600" : ""
              }`}
              title="Skincare Catalog"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Dropdown / Auth Pill & Quick Logout */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-rose-200/80 bg-white hover:bg-rose-50/50 transition-all shadow-sm cursor-pointer"
                  >
                    <span className="text-xs font-medium text-slate-700 max-w-[90px] truncate hidden sm:inline">
                      {user.displayName ? user.displayName.split(" ")[0] : "Account"}
                    </span>
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "User"} 
                        className="w-7 h-7 rounded-full object-cover border border-rose-200" 
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-400 to-pink-400 text-white flex items-center justify-center text-xs font-bold">
                        {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-rose-100 py-2 z-50 animate-fade-in">
                        <div className="px-4 py-2.5 border-b border-rose-50">
                          <p className="text-xs font-semibold text-slate-800">{user.displayName || "User Profile"}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            handleNavClick("account");
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-rose-500" />
                          My Account &amp; Settings
                        </button>
                        <button
                          onClick={() => {
                            handleNavClick("routine");
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                          Saved AM/PM Routines
                        </button>
                        <div className="border-t border-rose-50 my-1"></div>
                        <button
                          onClick={() => {
                            onLogout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          Log Out
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-medium cursor-pointer transition-colors shadow-3xs"
                  title="Log Out of your account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick("account")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold hover:opacity-95 shadow-sm shadow-rose-500/20 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl lg:hidden text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-nav Secondary Ribbon for Mid Screens (Tablets / Laptops) */}
      <div className="hidden md:flex lg:hidden bg-white/95 border-t border-rose-100/60 px-4 py-1.5 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-rose-500 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-rose-100 bg-white/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3 shadow-xl animate-slide-up">
          {/* Mobile User Profile or Sign-in Header */}
          {user ? (
            <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-rose-300 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user.displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-100/70 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-rose-50/50 border border-rose-200/60 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-800">Welcome to Nourish Glow</p>
                <p className="text-[11px] text-slate-500">Sign in to sync your routines & records</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleNavClick("account");
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          <div className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold shadow-sm"
                      : "text-slate-700 hover:bg-rose-50 hover:text-rose-600"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-rose-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {user && (
            <div className="pt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out from Nourish Glow</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

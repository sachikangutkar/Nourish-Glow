import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag, 
  Heart, 
  Stethoscope, 
  MapPin, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Check, 
  Plus, 
  Edit3, 
  Trash2, 
  Sun, 
  Moon, 
  FileText, 
  TrendingUp, 
  Camera, 
  Star, 
  ExternalLink, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Truck,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  PhoneCall,
  Globe,
  DollarSign,
  FileCheck2,
  X,
  ArrowLeft,
  LogIn,
  BellRing,
  BellOff,
  CheckCircle2
} from "lucide-react";
import { RoutineStep, DailyLog, PaymentCard, RoutineReminderSettings } from "../types";
import { formatINR } from "../lib/formatters";
import { formatAuthError } from "../lib/firebase";
import { 
  loadUserReminderSettings, 
  saveUserReminderSettings, 
  requestNotificationPermission, 
  sendTestNotification, 
  formatTimeTo12Hour,
  getNotificationPermissionStatus,
  isNotificationSupported,
  DEFAULT_REMINDER_SETTINGS
} from "../lib/reminderService";

// Assets
import sakuraCleanserImg from "../assets/images/sakura_cleanser_1788363415868.jpg";
import riceWaterTonerImg from "../assets/images/rice_water_toner_1788363432197.jpg";
import niacinamideSerumImg from "../assets/images/niacinamide_serum_1788363448115.jpg";
import ceramideMoisturizerImg from "../assets/images/ceramide_moisturizer_1788363476285.jpg";
import spf50SunscreenImg from "../assets/images/spf50_sunscreen_1788363504723.jpg";
import salicylicGelImg from "../assets/images/salicylic_acid_gel_1784479829189.jpg";
import hyaluronicSerumImg from "../assets/images/hyaluronic_serum_1788363576969.jpg";
import vitaminCSerumImg from "../assets/images/vitamin_c_serum_1788363632044.jpg";
import centellaAmpouleImg from "../assets/images/centella_ampoule_1788363605370.jpg";
import berryLipMaskImg from "../assets/images/berry_lip_mask_1788363716379.jpg";

import drAnanyaImg from "../assets/images/dr_ananya_sen_1788366790248.jpg";
import drRohanImg from "../assets/images/dr_rohan_mehta_1788366808892.jpg";
import drPriyaImg from "../assets/images/dr_priya_nair_1788366830734.jpg";

interface AccountViewProps {
  user: { displayName: string; email: string; photoURL?: string; uid: string } | null;
  isCloudSynced?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onCustomUserLogin?: (email: string, pass: string) => void;
  onEmailSignUp?: (email: string, pass: string, name: string) => Promise<any>;
  onEmailSignIn?: (email: string, pass: string) => Promise<any>;
  onPasswordReset?: (email: string) => Promise<void>;
  amRoutine?: RoutineStep[];
  pmRoutine?: RoutineStep[];
  logs?: DailyLog[];
  paymentCards: PaymentCard[];
  onAddPaymentCard: (card: Omit<PaymentCard, "id">) => void;
  onDeletePaymentCard: (id: string) => void;
  onSetDefaultPaymentCard: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
  initialSection?: MenuSection;
}

export type MenuSection = 
  | "profile"
  | "skin-profile"
  | "routine"
  | "routine-reminders"
  | "progress"
  | "orders"
  | "saved"
  | "consultations"
  | "addresses"
  | "notifications"
  | "settings"
  | "help";

export default function AccountView({
  user,
  isCloudSynced,
  onLogin,
  onLogout,
  onCustomUserLogin,
  onEmailSignUp,
  onEmailSignIn,
  onPasswordReset,
  amRoutine,
  pmRoutine,
  logs,
  paymentCards,
  onAddPaymentCard,
  onDeletePaymentCard,
  onSetDefaultPaymentCard,
  onNavigateTab,
  initialSection
}: AccountViewProps) {
  // Navigation State
  const [activeSection, setActiveSection] = useState<MenuSection>(initialSection || "profile");

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Auth State for logged out view
  const [authTab, setAuthTab] = useState<"signin" | "register">("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // 1. Profile State (Personal data starts empty and scopes to logged-in user)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.displayName || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileDob, setProfileDob] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // 2. Skin Profile State
  const [skinType, setSkinType] = useState("Combination");
  const [mainConcern, setMainConcern] = useState("Hydration & Glow");
  const [skinSensitivity, setSkinSensitivity] = useState("Low");
  const [ageGroup, setAgeGroup] = useState("25-34");
  const [skinProfileSaveSuccess, setSkinProfileSaveSuccess] = useState(false);

  // 5. Orders State (user-scoped, starts empty)
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<any | null>(null);

  // 6. Saved Products State (starts empty)
  const [savedProducts, setSavedProducts] = useState<any[]>([]);

  // 7. Consultations State (user-scoped, starts empty)
  const [consultations, setConsultations] = useState<any[]>([]);

  // 8. Addresses State (user-scoped, starts empty)
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    mobileNumber: "",
    houseFlat: "",
    streetArea: "",
    city: "",
    state: "Maharashtra",
    pinCode: "",
    isDefault: false
  });

  // 9. Notifications State
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    appointmentReminders: true,
    routineReminders: true,
    productUpdates: false,
    offers: true
  });

  // Skincare Routine Reminders State (Strict User Isolation)
  const [reminders, setReminders] = useState<RoutineReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSaveToast, setReminderSaveToast] = useState<{ show: boolean; msg: string; isError?: boolean }>({ show: false, msg: "" });
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<{ show: boolean; msg: string; isError?: boolean }>({ show: false, msg: "" });
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "default" | "unsupported">(getNotificationPermissionStatus());

  // 10. Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // 11. FAQ State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Synchronize with user-scoped LocalStorage on mount or when user changes
  useEffect(() => {
    // Always load user-isolated reminder settings
    loadUserReminderSettings(user?.uid).then((settings) => {
      setReminders(settings);
      setPermissionStatus(getNotificationPermissionStatus());
    });

    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setReminders(e.detail);
      } else {
        loadUserReminderSettings(user?.uid).then(setReminders);
      }
      setPermissionStatus(getNotificationPermissionStatus());
    };

    window.addEventListener("ng-reminder-settings-updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("ng-reminder-settings-updated", handleSettingsUpdated);
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user || !user.uid) {
      setProfileName("");
      setProfileEmail("");
      setProfilePhone("");
      setProfileDob("");
      setProfileGender("");
      setOrders([]);
      setSavedProducts([]);
      setConsultations([]);
      setAddresses([]);
      return;
    }

    const uid = user.uid;
    setProfileName(user.displayName || "");
    setProfileEmail(user.email || "");

    try {
      const savedProfile = localStorage.getItem(`glow_sense_${uid}_profile`);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setProfileName(parsed.name);
        if (parsed.email) setProfileEmail(parsed.email);
        if (parsed.phone) setProfilePhone(parsed.phone);
        if (parsed.dob) setProfileDob(parsed.dob);
        if (parsed.gender) setProfileGender(parsed.gender);
      }
    } catch (e) {
      console.warn("Could not load user profile from storage", e);
    }

    try {
      const savedSkinProfile = localStorage.getItem(`glow_sense_${uid}_skin_profile`);
      if (savedSkinProfile) {
        const parsed = JSON.parse(savedSkinProfile);
        if (parsed.skinType) setSkinType(parsed.skinType);
        if (parsed.mainConcern) setMainConcern(parsed.mainConcern);
        if (parsed.skinSensitivity) setSkinSensitivity(parsed.skinSensitivity);
        if (parsed.ageGroup) setAgeGroup(parsed.ageGroup);
      }
    } catch (e) {
      console.warn("Could not load skin profile from storage", e);
    }

    try {
      const storedOrders = localStorage.getItem(`glow_sense_${uid}_orders`);
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders);
        }
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn("Could not load stored orders from storage", e);
    }

    try {
      const storedSaved = localStorage.getItem(`glow_sense_${uid}_saved`);
      if (storedSaved) {
        const parsed = JSON.parse(storedSaved);
        if (Array.isArray(parsed)) setSavedProducts(parsed);
      } else {
        setSavedProducts([]);
      }
    } catch (e) {
      console.warn("Could not load saved products", e);
    }

    try {
      const storedConsultations = localStorage.getItem(`glow_sense_${uid}_consultations`);
      if (storedConsultations) {
        const parsed = JSON.parse(storedConsultations);
        if (Array.isArray(parsed)) setConsultations(parsed);
      } else {
        setConsultations([]);
      }
    } catch (e) {
      console.warn("Could not load consultations", e);
    }

    try {
      const storedAddresses = localStorage.getItem(`glow_sense_${uid}_addresses`);
      if (storedAddresses) {
        const parsed = JSON.parse(storedAddresses);
        if (Array.isArray(parsed)) setAddresses(parsed);
      } else {
        setAddresses([]);
      }
    } catch (e) {
      console.warn("Could not load addresses", e);
    }
  }, [user?.uid, user?.displayName, user?.email]);

  // Skincare Routine Reminder Actions
  const handleToggleMorningReminder = async () => {
    const nextVal = !reminders.morningReminderEnabled;
    const updated = { ...reminders, morningReminderEnabled: nextVal };
    setReminders(updated);
    if (nextVal && permissionStatus !== "granted") {
      const p = await requestNotificationPermission();
      setPermissionStatus(p);
      setReminders(prev => ({ ...prev, notificationPermission: p }));
    }
  };

  const handleToggleEveningReminder = async () => {
    const nextVal = !reminders.eveningReminderEnabled;
    const updated = { ...reminders, eveningReminderEnabled: nextVal };
    setReminders(updated);
    if (nextVal && permissionStatus !== "granted") {
      const p = await requestNotificationPermission();
      setPermissionStatus(p);
      setReminders(prev => ({ ...prev, notificationPermission: p }));
    }
  };

  const handleRequestPermission = async () => {
    const p = await requestNotificationPermission();
    setPermissionStatus(p);
    setReminders(prev => ({ ...prev, notificationPermission: p }));
    if (p === "granted") {
      setTestNotificationFeedback({
        show: true,
        msg: "Notifications enabled! 🔔 Your browser will remind you at your scheduled routine times.",
        isError: false
      });
      setTimeout(() => setTestNotificationFeedback({ show: false, msg: "" }), 5000);
    } else if (p === "denied") {
      setTestNotificationFeedback({
        show: true,
        msg: "Notifications are blocked. Please enable notifications from your browser site settings.",
        isError: true
      });
    }
  };

  const handleSaveReminders = async () => {
    setReminderSaving(true);
    try {
      const res = await saveUserReminderSettings(user?.uid, reminders);
      if (res.success) {
        setReminderSaveToast({
          show: true,
          msg: "Routine reminder settings saved successfully! ✨",
          isError: false
        });
      } else {
        setReminderSaveToast({
          show: true,
          msg: res.error || "Failed to save settings.",
          isError: true
        });
      }
    } catch (err: any) {
      setReminderSaveToast({
        show: true,
        msg: err?.message || "An error occurred while saving reminder settings.",
        isError: true
      });
    } finally {
      setReminderSaving(false);
      setTimeout(() => setReminderSaveToast({ show: false, msg: "" }), 4000);
    }
  };

  const handleSendTestNotification = async () => {
    const res = await sendTestNotification();
    setPermissionStatus(getNotificationPermissionStatus());
    setTestNotificationFeedback({
      show: true,
      msg: res.message,
      isError: !res.sent
    });
    setTimeout(() => setTestNotificationFeedback({ show: false, msg: "" }), 6000);
  };

  // Profile actions
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingProfile(false);
    setProfileSaveSuccess(true);
    if (user?.uid) {
      try {
        localStorage.setItem(`glow_sense_${user.uid}_profile`, JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          dob: profileDob,
          gender: profileGender
        }));
      } catch (err) {
        console.warn("Failed to persist profile", err);
      }
    }
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  // Skin Profile actions
  const handleUpdateSkinProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSkinProfileSaveSuccess(true);
    if (user?.uid) {
      try {
        localStorage.setItem(`glow_sense_${user.uid}_skin_profile`, JSON.stringify({
          skinType,
          mainConcern,
          skinSensitivity,
          ageGroup
        }));
      } catch (err) {
        console.warn("Failed to persist skin profile", err);
      }
    }
    setTimeout(() => setSkinProfileSaveSuccess(false), 3000);
  };

  // Address actions
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: profileName || "",
      mobileNumber: profilePhone || "",
      houseFlat: "",
      streetArea: "",
      city: "",
      state: "Maharashtra",
      pinCode: "",
      isDefault: addresses.length === 0
    });
    setShowAddAddressModal(true);
  };

  const handleOpenEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      mobileNumber: addr.mobileNumber,
      houseFlat: addr.houseFlat,
      streetArea: addr.streetArea,
      city: addr.city,
      state: addr.state,
      pinCode: addr.pinCode,
      isDefault: addr.isDefault
    });
    setShowAddAddressModal(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.houseFlat || !addressForm.city || !addressForm.pinCode) {
      return;
    }

    let updated: any[] = [];
    if (editingAddressId) {
      updated = addresses.map(addr => {
        if (addr.id === editingAddressId) {
          return { ...addr, ...addressForm };
        }
        if (addressForm.isDefault) {
          return { ...addr, isDefault: false };
        }
        return addr;
      });
    } else {
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...addressForm
      };
      if (addressForm.isDefault) {
        updated = [...addresses.map(a => ({ ...a, isDefault: false })), newAddr];
      } else {
        updated = [...addresses, newAddr];
      }
    }
    setAddresses(updated);
    if (user?.uid) {
      try {
        localStorage.setItem(`glow_sense_${user.uid}_addresses`, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to save addresses", e);
      }
    }
    setShowAddAddressModal(false);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    if (user?.uid) {
      try {
        localStorage.setItem(`glow_sense_${user.uid}_addresses`, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to delete address", e);
      }
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    setAddresses(updated);
    if (user?.uid) {
      try {
        localStorage.setItem(`glow_sense_${user.uid}_addresses`, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to set default address", e);
      }
    }
  };

  // Saved Products action
  const handleRemoveSavedProduct = (id: string) => {
    const updated = savedProducts.filter(p => p.id !== id);
    setSavedProducts(updated);
    if (user?.uid) {
      try {
        localStorage.setItem(`glow_sense_${user.uid}_saved`, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to remove saved product", e);
      }
    }
  };

  const [existingEmailInUse, setExistingEmailInUse] = useState<string | null>(null);

  // Auth Submit for Logged Out View
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setExistingEmailInUse(null);
    setAuthLoading(true);

    try {
      if (authTab === "register") {
        if (onEmailSignUp) {
          await onEmailSignUp(authEmail, authPassword, authName);
        } else if (onCustomUserLogin) {
          onCustomUserLogin(authName || "Skincare User", authEmail);
        }
        setAuthSuccess("Account created successfully! Welcome to Nourish Glow.");
      } else {
        if (onEmailSignIn) {
          await onEmailSignIn(authEmail, authPassword);
        } else if (onCustomUserLogin) {
          onCustomUserLogin(authEmail.split("@")[0], authEmail);
        }
        setAuthSuccess("Welcome back!");
      }
    } catch (err: any) {
      const formatted = formatAuthError(err);
      setAuthError(formatted.message);
      if (formatted.isEmailInUse) {
        setExistingEmailInUse(authEmail);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const displayName = user?.displayName || profileName || (user?.email ? user.email.split("@")[0] : "Skincare Member");

  // If user is not authenticated, display a clean, secure Sign In / Register view
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-8 px-4 animate-fade-in space-y-6">
        <button
          type="button"
          onClick={() => onNavigateTab ? onNavigateTab("dashboard") : window.history.back()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto shadow-3xs">
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-semibold text-slate-800 tracking-tight">
              {authTab === "signin" ? "Welcome to Nourish Glow" : "Create Your Account"}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {authTab === "signin" 
                ? "Sign in to securely access your skincare routines, tracked analyses, and private orders." 
                : "Create an isolated account to start tracking your skin health safely."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-2xl text-xs font-medium">
            <button
              type="button"
              onClick={() => { setAuthTab("signin"); setAuthError(null); setExistingEmailInUse(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${authTab === "signin" ? "bg-white text-slate-800 shadow-3xs font-semibold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab("register"); setAuthError(null); setExistingEmailInUse(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${authTab === "register" ? "bg-white text-slate-800 shadow-3xs font-semibold" : "text-slate-500 hover:text-slate-800"}`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 text-xs text-rose-700">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{authError}</span>
              </div>
              {existingEmailInUse && (
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-rose-900">Sign in with this email?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("signin");
                      setAuthEmail(existingEmailInUse);
                      setAuthError(null);
                      setExistingEmailInUse(null);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-700">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authTab === "register" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{authTab === "signin" ? "Sign In" : "Create Account"}</span>
                </>
              )}
            </button>
          </form>

          {onLogin && (
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                disabled={googleLoading}
                onClick={async () => {
                  setGoogleLoading(true);
                  setAuthError(null);
                  setExistingEmailInUse(null);
                  try {
                    await onLogin();
                  } catch (e: any) {
                    const formatted = formatAuthError(e);
                    setAuthError(formatted.message);
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                className="w-full mt-2 py-2.5 bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-60 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-3xs"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4L1.9 7C.7 9.4 0 12 0 14.7s.7 5.3 1.9 7.7l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16.4C3.7 20.2 7.5 23.5 12 23.5z"/>
                  </svg>
                )}
                <span>{googleLoading ? "Connecting with Google..." : "Continue with Google"}</span>
              </button>
              {googleLoading && (
                <p className="mt-1.5 text-[10px] text-center text-amber-600 animate-pulse">
                  Please select your Google account in the popup window
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Strict data isolation: your analysis & orders are private to you.</span>
          </div>
        </div>
      </div>
    );
  }

  // Menu Items List for Desktop Left Menu and Mobile selector
  const menuItems: { id: MenuSection; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "skin-profile", label: "Skin Profile", icon: <Sparkles className="w-4 h-4" /> },
    { id: "routine", label: "My Routine", icon: <Sun className="w-4 h-4" /> },
    { id: "routine-reminders", label: "Routine Reminders", icon: <BellRing className="w-4 h-4" /> },
    { id: "progress", label: "Skin Progress", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "orders", label: "My Orders", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "saved", label: "Saved Products", icon: <Heart className="w-4 h-4" /> },
    { id: "consultations", label: "Consultations", icon: <Stethoscope className="w-4 h-4" /> },
    { id: "addresses", label: "Addresses", icon: <MapPin className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    { id: "help", label: "Help & Support", icon: <HelpCircle className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16">
      
      {/* ========================================================================= */}
      {/* TOP HEADER SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab("dashboard") : window.history.back()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200/80"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <span className="text-xs font-semibold tracking-wider uppercase text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 inline-block">
                Nourish Glow Account
              </span>
              {isCloudSynced ? (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Cloud Synced</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Sandbox Mode</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-slate-800 tracking-tight">
              Your Account
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your profile, skincare routines, orders, and skin progress in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-rose-50/70 border border-rose-100 px-4 py-3 rounded-2xl shrink-0">
              <div className="w-10 h-10 rounded-full bg-white border border-rose-200 flex items-center justify-center text-rose-500 font-bold font-serif shadow-3xs text-base">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-400">Welcome</p>
                <h3 className="text-sm font-semibold text-slate-800">Hello, {displayName}</h3>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-3 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-100 bg-rose-50 border border-rose-200 flex items-center gap-1.5 cursor-pointer shadow-3xs transition-colors shrink-0"
                title="Log Out of your account"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <button 
            type="button"
            onClick={() => setActiveSection("orders")}
            className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 hover:border-rose-300 hover:bg-rose-50/30 transition-all text-left group cursor-pointer shadow-3xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-rose-100/60 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <span className="text-2xl font-serif font-bold text-slate-800">{orders.length}</span>
            </div>
            <p className="text-xs font-semibold text-slate-700">Orders</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {orders.length === 0 ? "No orders placed" : `${orders.length} order(s)`}
            </p>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSection("consultations")}
            className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 hover:border-rose-300 hover:bg-rose-50/30 transition-all text-left group cursor-pointer shadow-3xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-rose-100/60 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Stethoscope className="w-4 h-4" />
              </span>
              <span className="text-2xl font-serif font-bold text-slate-800">{consultations.length}</span>
            </div>
            <p className="text-xs font-semibold text-slate-700">Consultations</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {consultations.length === 0 ? "No sessions booked" : `${consultations.length} session(s)`}
            </p>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSection("saved")}
            className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 hover:border-rose-300 hover:bg-rose-50/30 transition-all text-left group cursor-pointer shadow-3xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-rose-100/60 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Heart className="w-4 h-4" />
              </span>
              <span className="text-2xl font-serif font-bold text-slate-800">{savedProducts.length}</span>
            </div>
            <p className="text-xs font-semibold text-slate-700">Saved Products</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {savedProducts.length === 0 ? "Wishlist empty" : `${savedProducts.length} in wishlist`}
            </p>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSection("progress")}
            className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 hover:border-rose-300 hover:bg-rose-50/30 transition-all text-left group cursor-pointer shadow-3xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-rose-100/60 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <FileText className="w-4 h-4" />
              </span>
              <span className="text-2xl font-serif font-bold text-slate-800">{logs?.length || 0}</span>
            </div>
            <p className="text-xs font-semibold text-slate-700">Skin Reports</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {logs?.length ? `${logs.length} logged entries` : "No entries yet"}
            </p>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN LAYOUT (DESKTOP: Left Menu + Right Content) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MOBILE NAVIGATION SELECTOR */}
        <div className="lg:hidden col-span-1 bg-white border border-rose-100 rounded-2xl p-2 overflow-x-auto scrollbar-none shadow-3xs flex gap-1.5">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSection === item.id 
                  ? "bg-rose-500 text-white shadow-3xs font-semibold" 
                  : "bg-transparent text-slate-600 hover:bg-rose-50/50"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* DESKTOP LEFT MENU */}
        <div className="hidden lg:block lg:col-span-3 bg-white border border-rose-100/80 rounded-3xl p-4 shadow-3xs space-y-1.5 sticky top-24">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Account Menu
          </div>

          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                activeSection === item.id 
                  ? "bg-rose-500 text-white shadow-3xs font-semibold" 
                  : "text-slate-700 hover:bg-rose-50/60 hover:text-rose-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={activeSection === item.id ? "text-white" : "text-rose-500"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeSection === item.id ? "text-white" : "text-slate-300"}`} />
            </button>
          ))}

          {/* Simple Security Notice */}
          <div className="pt-4 mt-2 border-t border-rose-100/80 px-3 pb-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Your account information is stored securely.</span>
            </div>
          </div>

          {/* Log Out Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/70 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="lg:col-span-9 space-y-6">

          {/* ========================================================================= */}
          {/* SECTION 1: PROFILE */}
          {/* ========================================================================= */}
          {activeSection === "profile" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/60 pb-5">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-slate-800">My Profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your personal details and contact information.</p>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {profileSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Full Name</label>
                      <input 
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Email Address</label>
                      <input 
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                      <input 
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Date of Birth (Optional)</label>
                      <input 
                        type="date"
                        value={profileDob}
                        onChange={(e) => setProfileDob(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">Gender (Optional)</label>
                      <select
                        value={profileGender}
                        onChange={(e) => setProfileGender(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-rose-100">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70">
                    <p className="text-[11px] text-slate-400 font-medium">Name</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{profileName}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70">
                    <p className="text-[11px] text-slate-400 font-medium">Email</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{profileEmail}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70">
                    <p className="text-[11px] text-slate-400 font-medium">Mobile Number</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{profilePhone}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70">
                    <p className="text-[11px] text-slate-400 font-medium">Date of Birth</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{profileDob || "Not specified"}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 sm:col-span-2">
                    <p className="text-[11px] text-slate-400 font-medium">Gender</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{profileGender}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: MY SKIN PROFILE */}
          {/* ========================================================================= */}
          {activeSection === "skin-profile" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="border-b border-rose-100/60 pb-5">
                <h2 className="text-xl font-serif font-semibold text-slate-800">My Skin Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">Customize your skin characteristics to get tailored product recommendations.</p>
              </div>

              {skinProfileSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Skin profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleUpdateSkinProfile} className="space-y-6">
                {/* Skin Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Skin Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {["Oily", "Dry", "Combination", "Normal", "Sensitive"].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSkinType(type)}
                        className={`py-3 px-3 rounded-2xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          skinType === type 
                            ? "bg-rose-500 text-white border-rose-500 font-semibold shadow-3xs" 
                            : "bg-[#FCFAF8] border-rose-100 text-slate-700 hover:border-rose-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Skin Concern */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Main Skin Concern</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {["Acne", "Dark Spots", "Dryness", "Redness", "Large Pores", "Uneven Skin Tone"].map(concern => (
                      <button
                        key={concern}
                        type="button"
                        onClick={() => setMainConcern(concern)}
                        className={`py-3 px-3 rounded-2xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          mainConcern === concern 
                            ? "bg-rose-500 text-white border-rose-500 font-semibold shadow-3xs" 
                            : "bg-[#FCFAF8] border-rose-100 text-slate-700 hover:border-rose-300"
                        }`}
                      >
                        {concern}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skin Sensitivity */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Skin Sensitivity</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {["Low", "Medium", "High"].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSkinSensitivity(level)}
                        className={`py-3 px-3 rounded-2xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          skinSensitivity === level 
                            ? "bg-rose-500 text-white border-rose-500 font-semibold shadow-3xs" 
                            : "bg-[#FCFAF8] border-rose-100 text-slate-700 hover:border-rose-300"
                        }`}
                      >
                        {level} Sensitivity
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Group */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Age Group</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {["Under 18", "18-24", "25-34", "35-44", "45+"].map(age => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setAgeGroup(age)}
                        className={`py-3 px-3 rounded-2xl text-xs font-medium border text-center transition-all cursor-pointer ${
                          ageGroup === age 
                            ? "bg-rose-500 text-white border-rose-500 font-semibold shadow-3xs" 
                            : "bg-[#FCFAF8] border-rose-100 text-slate-700 hover:border-rose-300"
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-rose-100">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Update Skin Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: MY SKIN ROUTINE */}
          {/* ========================================================================= */}
          {activeSection === "routine" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/60 pb-5">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-slate-800">My Skin Routine</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your saved morning and night skincare routine.</p>
                </div>

                <div className="flex gap-2">
                  {onNavigateTab && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("routine")}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Routine</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("routine")}
                        className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <span>View Routine</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Routine Reminders Status Callout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/80 gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-3xs">
                    <BellRing className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800">Skincare Routine Reminders</p>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        reminders.morningReminderEnabled || reminders.eveningReminderEnabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {reminders.morningReminderEnabled || reminders.eveningReminderEnabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {reminders.morningReminderEnabled ? `🌞 Morning: ${formatTimeTo12Hour(reminders.morningReminderTime)}` : "🌞 Morning: Off"}
                      {" • "}
                      {reminders.eveningReminderEnabled ? `🌙 Evening: ${formatTimeTo12Hour(reminders.eveningReminderTime)}` : "🌙 Evening: Off"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSection("routine-reminders")}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold cursor-pointer shrink-0 transition-all shadow-3xs self-start sm:self-auto"
                >
                  Configure Reminders →
                </button>
              </div>

              {/* Morning Routine */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <Sun className="w-5 h-5" />
                  <h3 className="font-semibold text-sm text-slate-800">Morning Routine</h3>
                  <span className="text-xs text-slate-400 font-normal">({amRoutine.length || 3} steps)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex gap-3.5 items-start">
                    <img src={sakuraCleanserImg} alt="Cleanser" className="w-14 h-14 rounded-xl object-cover border border-rose-100 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Step 1 • Cleanse</span>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">Sakura Hydrating Foam Cleanser</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">Wash face with lukewarm water and gently pat dry.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex gap-3.5 items-start">
                    <img src={niacinamideSerumImg} alt="Serum" className="w-14 h-14 rounded-xl object-cover border border-rose-100 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Step 2 • Serum</span>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">10% Niacinamide + Zinc Serum</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">Apply 3-4 drops evenly on face for oil balance.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex gap-3.5 items-start">
                    <img src={spf50SunscreenImg} alt="Sunscreen" className="w-14 h-14 rounded-xl object-cover border border-rose-100 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Step 3 • Protect</span>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">SPF 50+ Invisible Sun Shield</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">Apply 2 finger lengths 15 mins before sun exposure.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Night Routine */}
              <div className="space-y-4 pt-4 border-t border-rose-100/70">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Moon className="w-5 h-5" />
                  <h3 className="font-semibold text-sm text-slate-800">Night Routine</h3>
                  <span className="text-xs text-slate-400 font-normal">({pmRoutine.length || 3} steps)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex gap-3.5 items-start">
                    <img src={riceWaterTonerImg} alt="Toner" className="w-14 h-14 rounded-xl object-cover border border-rose-100 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Step 1 • Tone</span>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">Rice Water Barrier Glow Toner</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">Pat gently with hands across face and neck.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex gap-3.5 items-start">
                    <img src={hyaluronicSerumImg} alt="Serum" className="w-14 h-14 rounded-xl object-cover border border-rose-100 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Step 2 • Hydrate</span>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">Hyaluronic Acid Hydration Drops</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">Apply onto damp skin to lock in deep moisture.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex gap-3.5 items-start">
                    <img src={ceramideMoisturizerImg} alt="Moisturizer" className="w-14 h-14 rounded-xl object-cover border border-rose-100 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Step 3 • Repair</span>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">Ceramide Moisture Barrier Cream</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">Smooth evenly over face as final nighttime step.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: SKIN PROGRESS */}
          {/* ========================================================================= */}
          {activeSection === "progress" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/60 pb-5">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-slate-800">My Skin Progress</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Simple overview of your skin improvements and scan history.</p>
                </div>

                <div className="flex gap-2">
                  {onNavigateTab && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("analyzer")}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Skin Reports</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab("journal")}
                        className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <span>View Progress</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 text-center">
                  <span className="text-xs text-slate-400 font-medium">Latest Skin Score</span>
                  <div className="text-3xl font-serif font-bold text-rose-600 mt-1">88 / 100</div>
                  <span className="inline-block mt-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    +12 points from last month
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 text-center">
                  <span className="text-xs text-slate-400 font-medium">Skin Barrier Health</span>
                  <div className="text-3xl font-serif font-bold text-slate-800 mt-1">Healthy</div>
                  <span className="inline-block mt-1 text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                    Optimal Hydration
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 text-center">
                  <span className="text-xs text-slate-400 font-medium">Daily Streak</span>
                  <div className="text-3xl font-serif font-bold text-amber-600 mt-1">14 Days</div>
                  <span className="inline-block mt-1 text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    Consistent Routine
                  </span>
                </div>
              </div>

              {/* Scan History and Reports */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-slate-800">Skin Scan History & Previous Reports</h3>
                
                <div className="space-y-2.5">
                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100/60 text-rose-600 flex items-center justify-center font-bold font-serif">
                        88
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">Routine Checkup Scan</h4>
                        <p className="text-[11px] text-slate-500">28 Aug 2026 • Barrier repair: +25% • Redness decreased</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-rose-600 self-start sm:self-center">Report Available</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100/60 text-rose-600 flex items-center justify-center font-bold font-serif">
                        82
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">Mid-Month Hydration Scan</h4>
                        <p className="text-[11px] text-slate-500">14 Aug 2026 • Moisture retention: Good • Pores: Normal</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-rose-600 self-start sm:self-center">Report Available</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100/60 text-rose-600 flex items-center justify-center font-bold font-serif">
                        76
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">Initial Skin Scan</h4>
                        <p className="text-[11px] text-slate-500">01 Aug 2026 • Baseline skin diagnosis</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-rose-600 self-start sm:self-center">Report Available</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 5: MY ORDERS */}
          {/* ========================================================================= */}
          {activeSection === "orders" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="border-b border-rose-100/60 pb-5">
                <h2 className="text-xl font-serif font-semibold text-slate-800">My Orders</h2>
                <p className="text-xs text-slate-500 mt-0.5">Track and view your recent skincare purchases.</p>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <ShoppingBag className="w-8 h-8 mx-auto text-rose-300" />
                  <p className="text-sm font-medium text-slate-600">No orders placed yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">When you purchase dermatologist-recommended skincare products, your orders and live tracking will appear here.</p>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("catalog")}
                      className="mt-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Explore Skincare Catalog</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="p-5 rounded-2xl bg-[#FCFAF8] border border-rose-100/80 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold font-mono text-slate-800">Order #{order.id}</span>
                          <span className="text-xs text-slate-400">• {order.date}</span>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border self-start sm:self-center ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-rose-100 shrink-0" />
                              <div>
                                <h4 className="text-xs font-semibold text-slate-800">{item.name}</h4>
                                <p className="text-[11px] text-slate-400">Qty: {item.quantity} × {formatINR(item.price)}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold font-mono text-slate-800">
                              {formatINR(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-rose-100/60">
                        <div>
                          <span className="text-xs text-slate-500">Total Amount: </span>
                          <span className="text-sm font-bold font-mono text-slate-900">{formatINR(order.total)}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForTracking(order)}
                            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Track Order</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForTracking(order)}
                            className="px-3.5 py-1.5 bg-white border border-rose-200 text-slate-700 hover:bg-rose-50 rounded-xl text-xs font-medium cursor-pointer"
                          >
                            View Order
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 6: SAVED PRODUCTS */}
          {/* ========================================================================= */}
          {activeSection === "saved" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-rose-100/60 pb-5">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-slate-800">Saved Products</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Skincare items you have saved for later ({savedProducts.length} items).</p>
                </div>
              </div>

              {savedProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Heart className="w-8 h-8 mx-auto text-rose-300" />
                  <p className="text-sm font-medium text-slate-600">No saved products yet</p>
                  <p className="text-xs text-slate-400">Browse our skincare catalog to save products you love.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {savedProducts.map(product => (
                    <div key={product.id} className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/80 flex flex-col justify-between space-y-3">
                      <div className="space-y-2.5">
                        <div className="relative">
                          <img src={product.image} alt={product.name} className="w-full h-36 rounded-xl object-cover border border-rose-100" />
                          <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-500 flex items-center gap-1 shadow-3xs">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {product.rating}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-medium">{product.category}</span>
                          <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 mt-0.5">{product.name}</h4>
                          <p className="text-sm font-bold font-mono text-slate-900 mt-1">{formatINR(product.price)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-rose-100/60">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab("catalog");
                          }}
                          className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSavedProduct(product.id)}
                          className="p-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-xl cursor-pointer transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 7: MY CONSULTATIONS */}
          {/* ========================================================================= */}
          {activeSection === "consultations" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/60 pb-5">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-slate-800">My Consultations</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your booked and completed dermatologist sessions.</p>
                </div>

                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab("dermconsult")}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer flex items-center gap-1.5 self-start"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book New Consultation</span>
                  </button>
                )}
              </div>

              {consultations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Stethoscope className="w-8 h-8 mx-auto text-rose-300" />
                  <p className="text-sm font-medium text-slate-600">No consultations booked yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Connect directly with certified dermatologists for personalized diagnosis, prescription regimens, and skin advice.</p>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("dermconsult")}
                      className="mt-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Find a Dermatologist</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {consultations.map(c => (
                    <div key={c.id} className="p-5 rounded-2xl bg-[#FCFAF8] border border-rose-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img src={c.image} alt={c.doctorName} className="w-14 h-14 rounded-2xl object-cover border border-rose-100 shrink-0 shadow-3xs" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-800">{c.doctorName}</h4>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.statusColor}`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-xs text-rose-500 font-medium mt-0.5">{c.doctorQualification}</p>
                          <p className="text-[11px] text-slate-500">{c.doctorRole} • {c.doctorLocation}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 font-medium">
                            <span>📅 {c.date}</span>
                            <span>⏰ {c.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab("dermconsult");
                          }}
                          className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          View Consultation
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab("dermconsult");
                          }}
                          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer"
                        >
                          Book Again
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 8: ADDRESSES */}
          {/* ========================================================================= */}
          {activeSection === "addresses" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/60 pb-5">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-slate-800">Delivery Addresses</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your shipping addresses for quick delivery in India.</p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer flex items-center gap-1.5 self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <MapPin className="w-8 h-8 mx-auto text-rose-300" />
                  <p className="text-sm font-medium text-slate-600">No saved addresses</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Add your home or office address for fast checkout and delivery updates across India.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="mt-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div 
                      key={addr.id} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        addr.isDefault 
                          ? "bg-rose-50/40 border-rose-300 shadow-3xs" 
                          : "bg-[#FCFAF8] border-rose-100/80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-slate-800">{addr.fullName}</h4>
                          {addr.isDefault ? (
                            <span className="text-[10px] font-bold uppercase bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-3xs">
                              Default Address
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[11px] text-rose-600 hover:underline cursor-pointer font-medium"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {addr.houseFlat}, {addr.streetArea}<br />
                          {addr.city}, {addr.state} - {addr.pinCode}<br />
                          India
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-2 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-rose-500" />
                          {addr.mobileNumber}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-rose-100/60">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(addr)}
                          className="px-3 py-1.5 bg-white border border-rose-200 text-slate-700 hover:bg-rose-50 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 9: NOTIFICATIONS */}
          {/* ========================================================================= */}
          {activeSection === "notifications" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="border-b border-rose-100/60 pb-5">
                <h2 className="text-xl font-serif font-semibold text-slate-800">Notifications</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose which updates and alerts you want to receive.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Order Updates</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Receive updates on your order packing, shipping, and delivery.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifications.orderUpdates}
                      onChange={() => setNotifications(prev => ({ ...prev, orderUpdates: !prev.orderUpdates }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Appointment Reminders</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Get reminded before your upcoming dermatologist consultations.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifications.appointmentReminders}
                      onChange={() => setNotifications(prev => ({ ...prev, appointmentReminders: !prev.appointmentReminders }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-800">Skincare Routine Reminders</h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          reminders.morningReminderEnabled || reminders.eveningReminderEnabled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {reminders.morningReminderEnabled || reminders.eveningReminderEnabled ? "Active" : "Off"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Daily morning and evening alerts for your skincare routine.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={reminders.morningReminderEnabled || reminders.eveningReminderEnabled}
                        onChange={async () => {
                          const nextVal = !(reminders.morningReminderEnabled || reminders.eveningReminderEnabled);
                          const updated = { 
                            ...reminders, 
                            morningReminderEnabled: nextVal, 
                            eveningReminderEnabled: nextVal 
                          };
                          setReminders(updated);
                          if (nextVal && permissionStatus !== "granted") {
                            const p = await requestNotificationPermission();
                            setPermissionStatus(p);
                            setReminders(prev => ({ ...prev, notificationPermission: p }));
                          }
                          await saveUserReminderSettings(user?.uid, updated);
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                    </label>
                  </div>

                  <div className="pt-2.5 border-t border-rose-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-[11px] text-slate-600">
                      <span>🌞 AM: <strong className="font-mono text-slate-800">{reminders.morningReminderEnabled ? formatTimeTo12Hour(reminders.morningReminderTime) : "Disabled"}</strong></span>
                      <span>•</span>
                      <span>🌙 PM: <strong className="font-mono text-slate-800">{reminders.eveningReminderEnabled ? formatTimeTo12Hour(reminders.eveningReminderTime) : "Disabled"}</strong></span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSection("routine-reminders")}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Configure Times & Test Alerts</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">New Product Updates</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Be the first to know about new skincare launches and formulas.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifications.productUpdates}
                      onChange={() => setNotifications(prev => ({ ...prev, productUpdates: !prev.productUpdates }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Offers & Discounts</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Exclusive seasonal discounts, combo offers, and rewards.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifications.offers}
                      onChange={() => setNotifications(prev => ({ ...prev, offers: !prev.offers }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION: ROUTINE REMINDERS & NOTIFICATIONS */}
          {/* ========================================================================= */}
          {activeSection === "routine-reminders" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100/60 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
                      <BellRing className="w-4 h-4" />
                    </span>
                    <h2 className="text-xl font-serif font-semibold text-slate-800">Routine Reminders</h2>
                    <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                      Circadian Alerts
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schedule personalized browser notifications for your morning and evening skincare routines.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-xl">
                    {user?.displayName ? `${user.displayName}'s Settings` : "User-Isolated Storage"}
                  </span>
                </div>
              </div>

              {/* Status & Feedback Toasts */}
              {reminderSaveToast.show && (
                <div className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs animate-fade-in ${
                  reminderSaveToast.isError 
                    ? "bg-rose-50 border-rose-200 text-rose-800" 
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}>
                  {reminderSaveToast.isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-medium">{reminderSaveToast.msg}</span>
                </div>
              )}

              {testNotificationFeedback.show && (
                <div className={`p-4 rounded-2xl border flex items-center gap-2.5 text-xs animate-fade-in ${
                  testNotificationFeedback.isError 
                    ? "bg-amber-50 border-amber-200 text-amber-900" 
                    : "bg-purple-50 border-purple-200 text-purple-900"
                }`}>
                  {testNotificationFeedback.isError ? (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  )}
                  <span>{testNotificationFeedback.msg}</span>
                </div>
              )}

              {/* Overall Status Banner (Requirement 6) */}
              <div className="rounded-2xl bg-gradient-to-r from-rose-50/80 via-pink-50/60 to-amber-50/70 border border-rose-100 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-mono">Current Reminder Status</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-800 pt-0.5">
                      {/* Morning Indicator */}
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-rose-100 shadow-3xs">
                        <span>🔔</span>
                        <span>Morning Reminder:</span>
                        {reminders.morningReminderEnabled ? (
                          <span className="text-emerald-600 font-mono font-bold">Enabled — {formatTimeTo12Hour(reminders.morningReminderTime)}</span>
                        ) : (
                          <span className="text-slate-400 font-mono">Disabled</span>
                        )}
                      </div>

                      {/* Evening Indicator */}
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-rose-100 shadow-3xs">
                        <span>🌙</span>
                        <span>Evening Reminder:</span>
                        {reminders.eveningReminderEnabled ? (
                          <span className="text-indigo-600 font-mono font-bold">Enabled — {formatTimeTo12Hour(reminders.eveningReminderTime)}</span>
                        ) : (
                          <span className="text-slate-400 font-mono">Disabled</span>
                        )}
                      </div>

                      {!reminders.morningReminderEnabled && !reminders.eveningReminderEnabled && (
                        <span className="text-xs text-slate-500 italic flex items-center gap-1">
                          <span>🔕</span> Reminders Disabled
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-slate-800 hover:text-rose-700 text-xs font-semibold transition-all shadow-3xs cursor-pointer shrink-0 self-start sm:self-center"
                    title="Test immediate notification delivery in your browser"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>Send Test Notification</span>
                  </button>
                </div>
              </div>

              {/* Notification Permission Status Card (Requirement 4 & 11) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FCFAF8] border border-rose-100/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      permissionStatus === "granted"
                        ? "bg-emerald-100 text-emerald-700"
                        : permissionStatus === "denied"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {permissionStatus === "granted" ? (
                        <Check className="w-4 h-4" />
                      ) : permissionStatus === "denied" ? (
                        <BellOff className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-800">Browser Notification Permission</h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          permissionStatus === "granted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : permissionStatus === "denied"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {permissionStatus === "granted" 
                            ? "Notifications enabled" 
                            : permissionStatus === "denied" 
                            ? "Permission blocked" 
                            : "Permission required"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {permissionStatus === "granted" && "Your browser is fully authorized to display scheduled routine alerts. Clicking an alert will open your skincare routine directly."}
                        {permissionStatus === "denied" && "Notifications are blocked. Please enable notifications from your browser settings (click the lock/controls icon next to the address bar)."}
                        {permissionStatus === "default" && "Browser permission has not yet been granted. Click below to authorize alerts so you never miss a step."}
                        {permissionStatus === "unsupported" && "Notifications are not supported by this browser. Please use a supported browser and allow notifications."}
                      </p>
                    </div>
                  </div>

                  {permissionStatus !== "granted" && permissionStatus !== "unsupported" && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-3xs self-start sm:self-center shrink-0"
                    >
                      Enable Notifications
                    </button>
                  )}
                </div>
              </div>

              {/* Reminder Controls Grid: Morning & Evening */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Morning Routine Card */}
                <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  reminders.morningReminderEnabled 
                    ? "bg-white border-rose-200 shadow-3xs" 
                    : "bg-[#FAF8F6] border-slate-200/80 opacity-80"
                }`}>
                  <div className="flex items-center justify-between border-b border-rose-100/70 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">Morning Routine Reminder</h3>
                        <p className="text-[10px] text-slate-500">Wake up & protect skin barrier</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={reminders.morningReminderEnabled}
                        onChange={handleToggleMorningReminder}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                    </label>
                  </div>

                  {/* Morning Time Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Preferred Morning Time</span>
                      <span className="font-mono text-[11px] text-rose-600 font-bold">
                        {formatTimeTo12Hour(reminders.morningReminderTime)}
                      </span>
                    </label>
                    <input 
                      type="time" 
                      value={reminders.morningReminderTime}
                      onChange={(e) => setReminders(prev => ({ ...prev, morningReminderTime: e.target.value }))}
                      disabled={!reminders.morningReminderEnabled}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-[#FCFAF8] text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-rose-500 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                    />
                  </div>

                  {/* Connected AM Routine Steps */}
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-[11px] space-y-1.5">
                    <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <span>🧴</span>
                      <span>Connected AM Routine:</span>
                      <span className="font-normal text-amber-800">
                        {amRoutine && amRoutine.length > 0 ? `${amRoutine.length} steps configured` : "Default morning essentials"}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-600 italic">
                      {amRoutine && amRoutine.length > 0
                        ? amRoutine.map(s => s.name).slice(0, 3).join(" • ") + (amRoutine.length > 3 ? "..." : "")
                        : "Sakura Hydrating Cleanser • Rice Water Toner • SPF 50"}
                    </p>
                    <div className="pt-1.5 border-t border-amber-100 text-[10px] text-slate-500">
                      <strong>Notification Message:</strong> "Good morning! 🌞 It's time for your Nourish Glow morning skincare routine."
                    </div>
                  </div>
                </div>

                {/* 2. Evening Routine Card */}
                <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  reminders.eveningReminderEnabled 
                    ? "bg-white border-rose-200 shadow-3xs" 
                    : "bg-[#FAF8F6] border-slate-200/80 opacity-80"
                }`}>
                  <div className="flex items-center justify-between border-b border-rose-100/70 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        <Moon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">Evening Routine Reminder</h3>
                        <p className="text-[10px] text-slate-500">Night repair & deep hydration</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={reminders.eveningReminderEnabled}
                        onChange={handleToggleEveningReminder}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                    </label>
                  </div>

                  {/* Evening Time Picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Preferred Evening Time</span>
                      <span className="font-mono text-[11px] text-indigo-600 font-bold">
                        {formatTimeTo12Hour(reminders.eveningReminderTime)}
                      </span>
                    </label>
                    <input 
                      type="time" 
                      value={reminders.eveningReminderTime}
                      onChange={(e) => setReminders(prev => ({ ...prev, eveningReminderTime: e.target.value }))}
                      disabled={!reminders.eveningReminderEnabled}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-[#FCFAF8] text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-rose-500 disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                    />
                  </div>

                  {/* Connected PM Routine Steps */}
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] space-y-1.5">
                    <p className="font-semibold text-indigo-900 flex items-center gap-1.5">
                      <span>🌙</span>
                      <span>Connected PM Routine:</span>
                      <span className="font-normal text-indigo-800">
                        {pmRoutine && pmRoutine.length > 0 ? `${pmRoutine.length} steps configured` : "Default evening repair"}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-600 italic">
                      {pmRoutine && pmRoutine.length > 0
                        ? pmRoutine.map(s => s.name).slice(0, 3).join(" • ") + (pmRoutine.length > 3 ? "..." : "")
                        : "Sakura Hydrating Cleanser • Ceramide Moisturizer"}
                    </p>
                    <div className="pt-1.5 border-t border-indigo-100 text-[10px] text-slate-500">
                      <strong>Notification Message:</strong> "Good evening! 🌙 It's time for your Nourish Glow evening skincare routine."
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Save */}
              <div className="pt-4 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Settings belong strictly to your logged-in profile.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>Send Test Notification</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveReminders}
                    disabled={reminderSaving}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-xl text-xs font-semibold shadow-3xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {reminderSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Reminder Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Browser Architecture Note (Requirement 10) */}
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 flex items-start gap-3 text-[11px] text-amber-900 leading-relaxed">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Browser Delivery Note:</p>
                  <p className="text-slate-600 mt-0.5">
                    Local web notifications run reliably while Nourish Glow is open in your browser or running in a background tab. To ensure you receive timely notifications, keep a Nourish Glow browser tab open or install it to your device home screen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 10: SETTINGS */}
          {/* ========================================================================= */}
          {activeSection === "settings" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="border-b border-rose-100/60 pb-5">
                <h2 className="text-xl font-serif font-semibold text-slate-800">Settings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage your account credentials, regional preferences, and privacy.</p>
              </div>

              {passwordChangeSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Change Password */}
                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Change Password</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Keep your account safe by updating your password regularly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordChangeModal(true)}
                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer self-start sm:self-center"
                  >
                    Change Password
                  </button>
                </div>

                {/* Email Notifications */}
                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Email Notifications</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Receive skincare receipts and booking confirmations via email.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={emailNotifications}
                      onChange={() => setEmailNotifications(!emailNotifications)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
                  </label>
                </div>

                {/* Language (India) */}
                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-rose-500" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Language</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Primary language for your experience.</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-white border border-rose-200 px-3 py-1.5 rounded-xl">
                    English
                  </span>
                </div>

                {/* Currency (India) */}
                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-rose-500" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Currency</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Default billing and product currency.</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-white border border-rose-200 px-3 py-1.5 rounded-xl font-mono">
                    ₹ INR (Indian Rupee)
                  </span>
                </div>

                {/* Privacy & Terms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-rose-500" />
                      Privacy Policy
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      We protect your personal data. We never sell your skin logs or health entries to third parties.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-rose-500" />
                      Terms & Conditions
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Read our simple terms regarding consultations, product orders, and shipping guidelines.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 11: HELP & SUPPORT */}
          {/* ========================================================================= */}
          {activeSection === "help" && (
            <div className="bg-white border border-rose-100/80 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6 animate-fade-in">
              <div className="border-b border-rose-100/60 pb-5">
                <h2 className="text-xl font-serif font-semibold text-slate-800">Help & Support</h2>
                <p className="text-xs text-slate-500 mt-0.5">Quick answers, order assistance, and customer support.</p>
              </div>

              {/* Quick Contact Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800">Order Help</h4>
                  <p className="text-[11px] text-slate-400">Track shipments & returns</p>
                  <button 
                    type="button"
                    onClick={() => setActiveSection("orders")}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer inline-block mt-1"
                  >
                    View Orders →
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800">Product Help</h4>
                  <p className="text-[11px] text-slate-400">Ingredient & routine advice</p>
                  <button 
                    type="button"
                    onClick={() => { if (onNavigateTab) onNavigateTab("catalog"); }}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer inline-block mt-1"
                  >
                    Browse Catalog →
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#FCFAF8] border border-rose-100/70 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800">Consultation Help</h4>
                  <p className="text-[11px] text-slate-400">Dermatologist sessions</p>
                  <button 
                    type="button"
                    onClick={() => { if (onNavigateTab) onNavigateTab("dermconsult"); }}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer inline-block mt-1"
                  >
                    Go to Consultations →
                  </button>
                </div>
              </div>

              {/* Frequently Asked Questions */}
              <div className="space-y-3 pt-2">
                <h3 className="font-semibold text-sm text-slate-800">Frequently Asked Questions</h3>

                <div className="space-y-2.5">
                  {[
                    {
                      q: "How fast is delivery within India?",
                      a: "Standard delivery takes 2 to 4 business days across major Indian cities (Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Pune) and 3 to 6 days for other regions."
                    },
                    {
                      q: "How do I choose the right products for my skin type?",
                      a: "You can update your skin type in 'My Skin Profile' or use the AI Skin Scanner in our top menu to get automatic product suggestions."
                    },
                    {
                      q: "How do online dermatologist consultations work?",
                      a: "You choose a verified dermatologist, select a convenient date and time, and connect over video call or chat to receive tailored skincare guidance."
                    },
                    {
                      q: "Can I return or exchange a product?",
                      a: "Unopened products can be returned within 7 days of delivery. For damaged or defective items, please contact support immediately."
                    }
                  ].map((faq, idx) => (
                    <div 
                      key={idx} 
                      className="border border-rose-100/80 rounded-2xl bg-[#FCFAF8] overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                        className="w-full p-4 text-left font-semibold text-xs text-slate-800 flex items-center justify-between cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {openFaqIndex === idx ? (
                          <ChevronUp className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {openFaqIndex === idx && (
                        <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-rose-100/60 pt-2 bg-white">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Support */}
              <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Need more assistance?</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Our skincare customer support team is available Monday to Saturday, 9 AM to 7 PM IST.</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="mailto:support@nourishglow.in"
                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Support</span>
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ADDRESS */}
      {/* ========================================================================= */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4">
              <h3 className="text-lg font-serif font-semibold text-slate-800">
                {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddAddressModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input 
                  type="text"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  placeholder="e.g. Full Name"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Mobile Number (10 Digits)</label>
                <input 
                  type="text"
                  value={addressForm.mobileNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, mobileNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">House / Flat Number & Building</label>
                <input 
                  type="text"
                  value={addressForm.houseFlat}
                  onChange={(e) => setAddressForm({ ...addressForm, houseFlat: e.target.value })}
                  placeholder="e.g. Flat 101, Sunshine Heights"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Street / Area</label>
                <input 
                  type="text"
                  value={addressForm.streetArea}
                  onChange={(e) => setAddressForm({ ...addressForm, streetArea: e.target.value })}
                  placeholder="e.g. MG Road, Indiranagar"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input 
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">PIN Code</label>
                  <input 
                    type="text"
                    value={addressForm.pinCode}
                    onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    placeholder="e.g. 400050"
                    maxLength={6}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">State</label>
                <select
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                </select>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox"
                  id="default-address-check"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded border-rose-200 text-rose-500 focus:ring-rose-500 h-4 w-4"
                />
                <label htmlFor="default-address-check" className="text-xs text-slate-600 cursor-pointer">
                  Make this my default delivery address
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-rose-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRACK ORDER DETAILS */}
      {/* ========================================================================= */}
      {selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4">
              <div>
                <h3 className="text-base font-serif font-semibold text-slate-800">
                  Track Order #{selectedOrderForTracking.id}
                </h3>
                <p className="text-xs text-slate-400">Placed on {selectedOrderForTracking.date}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedOrderForTracking(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Status Stepper */}
              <div className="space-y-3 py-2">
                {[
                  { label: "Order Placed", done: true, time: "28 Aug, 10:30 AM" },
                  { label: "Packed in Warehouse", done: true, time: "28 Aug, 04:15 PM" },
                  { label: "Shipped via BlueDart", done: true, time: "29 Aug, 09:00 AM" },
                  { label: "Out for Delivery", done: selectedOrderForTracking.status === "Out for Delivery" || selectedOrderForTracking.status === "Delivered", time: "30 Aug, 08:30 AM" },
                  { label: "Delivered", done: selectedOrderForTracking.status === "Delivered", time: "30 Aug, 02:45 PM" }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}>
                        {step.done ? "✓" : idx + 1}
                      </span>
                      {idx < 4 && <div className={`w-0.5 h-6 ${step.done ? "bg-emerald-500" : "bg-slate-200"}`} />}
                    </div>
                    <div>
                      <h4 className={`text-xs font-semibold ${step.done ? "text-slate-800" : "text-slate-400"}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-slate-400">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-1.5">
                <span className="text-[11px] text-slate-500">Delivery Address:</span>
                <p className="text-xs font-medium text-slate-800">
                  {selectedOrderForTracking?.shippingAddress?.street 
                    ? `${selectedOrderForTracking.shippingAddress.street}, ${selectedOrderForTracking.shippingAddress.city}, ${selectedOrderForTracking.shippingAddress.state} - ${selectedOrderForTracking.shippingAddress.pinCode}`
                    : addresses.find(a => a.isDefault)?.houseFlat 
                      ? `${addresses.find(a => a.isDefault)?.houseFlat}, ${addresses.find(a => a.isDefault)?.streetArea}, ${addresses.find(a => a.isDefault)?.city}`
                      : "Registered Delivery Address on Account"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderForTracking(null)}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-3xs"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHANGE PASSWORD */}
      {/* ========================================================================= */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4">
              <h3 className="text-base font-serif font-semibold text-slate-800">
                Change Password
              </h3>
              <button 
                type="button" 
                onClick={() => setShowPasswordChangeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setShowPasswordChangeModal(false);
              setPasswordChangeSuccess(true);
              setTimeout(() => setPasswordChangeSuccess(false), 3000);
            }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Current Password</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-rose-200 bg-[#FCFAF8] text-slate-800 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-rose-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-3xs cursor-pointer"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

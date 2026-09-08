import React, { useState, useEffect } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import TopNavbar from "./components/TopNavbar";
import Dashboard from "./components/Dashboard";
import AIAnalyzer from "./components/AIAnalyzer";
import RoutinePlanner from "./components/RoutinePlanner";
import ProductCatalog from "./components/ProductCatalog";
import IngredientLab from "./components/IngredientLab";
import ProgressJournal from "./components/ProgressJournal";
import AccountView, { MenuSection } from "./components/AccountView";
import ComputerVisionScan from "./components/ComputerVisionScan";
import SmartMirrorIoT from "./components/SmartMirrorIoT";
import DermConsultation from "./components/DermConsultation";
import RoutineReminderManager from "./components/RoutineReminderManager";
import { RoutineStep, SkinAnalysis, DailyLog, SkincareProduct, PaymentCard, VisionScanResult } from "./types";
import { getUserItem, setUserItem } from "./lib/userStorage";
import { 
  db, 
  auth, 
  isFirebaseReady, 
  loginWithGoogle, 
  logoutUser, 
  signUpWithEmail,
  signInWithEmail,
  sendPasswordReset,
  handleFirestoreError, 
  OperationType 
} from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

// High-quality initial AM steps matching the premium "Nourish Glow Essentials" line
const INITIAL_AM_ROUTINE: RoutineStep[] = [
  {
    step: 1,
    category: "Cleanser",
    name: "Sakura Hydrating Cleanser",
    purpose: "Gentle morning cleanse to wash away overnight impurities without dehydrating cells.",
    instructions: "Apply to damp skin, massage lightly in circles for 30s, rinse with tepid water.",
    activeIngredients: ["Sakura Flower Extract", "Hyaluronic Acid", "Centella Asiatica"],
    completed: true
  },
  {
    step: 2,
    category: "Toner",
    name: "Rice Water Toner",
    purpose: "Instantly balance epidermal pH and infuse light, nourishing hydration.",
    instructions: "Pat 3-4 drops directly onto face and neck until dry.",
    activeIngredients: ["Fermented Rice Filtrate", "Cherry Blossom Extract"],
    completed: true
  },
  {
    step: 3,
    category: "Treatment Serum",
    name: "Niacinamide Serum",
    purpose: "Soothes redness, targets pores, and fortifies the delicate lipid barrier.",
    instructions: "Smooth 3 drops over the face. Tap lightly.",
    activeIngredients: ["Niacinamide (10%)", "Zinc PCA"],
    completed: false
  },
  {
    step: 4,
    category: "Sunscreen",
    name: "SPF 50 Sunscreen",
    purpose: "Ultimate shield against UV degradation, sunspots, and environmental pollutants.",
    instructions: "Apply 2 finger lengths evenly over face and ears as the absolute final step.",
    activeIngredients: ["Zinc Oxide (12%)", "Niacinamide (2%)"],
    completed: false
  }
];

// High-quality initial PM steps
const INITIAL_PM_ROUTINE: RoutineStep[] = [
  {
    step: 1,
    category: "Cleanser",
    name: "Sakura Hydrating Cleanser",
    purpose: "Double cleanse to completely clear away stubborn mineral sunscreen and daily dirt.",
    instructions: "Massage for 45 seconds concentrating on clogged pore areas. Rinse completely.",
    activeIngredients: ["Sakura Flower Extract", "Centella Asiatica"],
    completed: false
  },
  {
    step: 2,
    category: "Moisturizer",
    name: "Ceramide Moisturizer",
    purpose: "Deep overnight lipid nourishment to rebuild cracked skin structures.",
    instructions: "Apply nickel-sized amount in upward sweeps. Massage into neck.",
    activeIngredients: ["Ceramides", "Squalane", "Cholesterol"],
    completed: false
  }
];

// Initial historical progress logs to pre-populate charts with stunning graphs
const INITIAL_LOGS: DailyLog[] = [
  {
    id: "log-1",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    skinRating: 6,
    waterIntake: 5,
    sleepHours: 5.5,
    stressLevel: "High",
    notes: "Late night studying. Skin feels slightly rough and dehydrated. Localized T-zone flaking present.",
    amCompleted: true,
    pmCompleted: true,
    selfieUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300",
    loggedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-2",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    skinRating: 7,
    waterIntake: 7,
    sleepHours: 7,
    stressLevel: "Medium",
    notes: "Adherent to my Sakura Toner. Noticeable reduction in forehead redness. Elasticity is improving.",
    amCompleted: true,
    pmCompleted: true,
    selfieUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
    loggedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-3",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    skinRating: 8,
    waterIntake: 9,
    sleepHours: 8,
    stressLevel: "Low",
    notes: "Excellent sleep. The Ceramide Repair Cream is really sealing moisture overnight. No rough patches today!",
    amCompleted: true,
    pmCompleted: true,
    selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    loggedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
   }
];

const INITIAL_CARDS: PaymentCard[] = [
  {
    id: "card-1",
    cardholderName: "Primary Cardholder",
    cardNumber: "•••• •••• •••• 4242",
    expiryDate: "12/28",
    cardBrand: "Visa",
    isDefault: true,
    billingZip: "10001"
  }
];

const VALID_TABS = ["dashboard", "analyzer", "vision", "smartmirror", "dermconsult", "routine", "catalog", "lab", "journal", "account"];

const getInitialTab = (): string => {
  if (typeof window !== "undefined") {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (VALID_TABS.includes(hash)) {
      return hash;
    }
  }
  return "dashboard";
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [streak, setStreak] = useState<number>(3);
  const [amRoutine, setAmRoutine] = useState<RoutineStep[]>(INITIAL_AM_ROUTINE);
  const [pmRoutine, setPmRoutine] = useState<RoutineStep[]>(INITIAL_PM_ROUTINE);
  const [logs, setLogs] = useState<DailyLog[]>(INITIAL_LOGS);
  const [activeAnalysis, setActiveAnalysis] = useState<SkinAnalysis | null>(null);
  const [visionScanResult, setVisionScanResult] = useState<VisionScanResult | null>(null);
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>(INITIAL_CARDS);

  // Authentication State
  const [user, setUser] = useState<{ displayName: string; email: string; photoURL?: string; uid: string } | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Sync diagnostic and scan data whenever user changes
  useEffect(() => {
    if (user?.uid) {
      const savedAnalysis = getUserItem<SkinAnalysis | null>(user.uid, "analysis", null);
      const savedScan = getUserItem<VisionScanResult | null>(user.uid, "vision_scan", null);
      setActiveAnalysis(savedAnalysis);
      setVisionScanResult(savedScan);
    } else {
      setActiveAnalysis(null);
      setVisionScanResult(null);
    }
  }, [user?.uid]);

  // Browser History & Navigation Synchronization (handles Browser Back & Forward)
  useEffect(() => {
    const initial = getInitialTab();
    window.history.replaceState({ tab: initial }, "", `#${initial}`);

    const handlePopState = (event: PopStateEvent) => {
      const stateTab = event.state?.tab;
      const hash = window.location.hash.replace("#", "").toLowerCase();
      const targetTab = stateTab || (VALID_TABS.includes(hash) ? hash : "dashboard");
      setActiveTab(targetTab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Sync data to localStorage for real-time offline persistence
  useEffect(() => {
    try {
      const savedAM = localStorage.getItem("glow_sense_am_routine");
      const savedPM = localStorage.getItem("glow_sense_pm_routine");
      const savedLogs = localStorage.getItem("glow_sense_logs");
      const savedStreak = localStorage.getItem("glow_sense_streak");
      const savedAnalysis = localStorage.getItem("glow_sense_analysis");
      const savedCards = localStorage.getItem("glow_sense_payment_cards");

      if (savedAM) {
        const parsed = JSON.parse(savedAM);
        if (Array.isArray(parsed)) setAmRoutine(parsed);
      }
      if (savedPM) {
        const parsed = JSON.parse(savedPM);
        if (Array.isArray(parsed)) setPmRoutine(parsed);
      }
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) setLogs(parsed);
      }
      if (savedStreak) setStreak(Number(savedStreak) || 0);
      if (savedAnalysis) {
        const parsed = JSON.parse(savedAnalysis);
        if (parsed && typeof parsed === "object") setActiveAnalysis(parsed);
      }
      if (savedCards) {
        const parsed = JSON.parse(savedCards);
        if (Array.isArray(parsed)) setPaymentCards(parsed);
      }
      const savedUser = localStorage.getItem("glow_sense_user");
      if (savedUser && !isFirebaseReady) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.uid) {
            setUser(parsed);
          }
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.warn("Failed to load local storage state:", e);
    }
  }, []);


  // Firebase auth state subscription
  useEffect(() => {
    if (isFirebaseReady && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userObj = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Enthusiast",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || undefined
          };
          setUser(userObj);
          setIsCloudSynced(true);
          await loadUserData(firebaseUser.uid);
        } else {
          setUser(null);
          setIsCloudSynced(false);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Fetch or Seed user-isolated Firestore collections
  const loadUserData = async (uid: string) => {
    if (!isFirebaseReady || !db) return;
    try {
      const amSnap = await getDocs(collection(db, "users", uid, "routines", "AM", "steps"));
      const amData: RoutineStep[] = (amSnap?.docs || []).map(d => d.data() as RoutineStep);
      
      const pmSnap = await getDocs(collection(db, "users", uid, "routines", "PM", "steps"));
      const pmData: RoutineStep[] = (pmSnap?.docs || []).map(d => d.data() as RoutineStep);
      
      const logSnap = await getDocs(collection(db, "users", uid, "logs"));
      const logData: DailyLog[] = (logSnap?.docs || []).map(d => d.data() as DailyLog);

      const cardSnap = await getDocs(collection(db, "users", uid, "paymentCards"));
      const cardData: PaymentCard[] = (cardSnap?.docs || []).map(d => d.data() as PaymentCard);

      // Always ensure root user document exists in users collection
      await setDoc(doc(db, "users", uid), {
        uid,
        updatedAt: new Date().toISOString(),
        cloudSync: true
      }, { merge: true }).catch(e => console.warn("User root doc write:", e));

      if (amSnap.empty && pmSnap.empty && logSnap.empty) {
        // Seed initial default documents for new user
        await Promise.all([
          ...INITIAL_AM_ROUTINE.map((s, idx) =>
            setDoc(doc(db, "users", uid, "routines", "AM", "steps", `step-${idx}`), s).catch(e => console.warn("Seed AM step error:", e))
          ),
          ...INITIAL_PM_ROUTINE.map((s, idx) =>
            setDoc(doc(db, "users", uid, "routines", "PM", "steps", `step-${idx}`), s).catch(e => console.warn("Seed PM step error:", e))
          ),
          ...INITIAL_LOGS.map((l) =>
            setDoc(doc(db, "users", uid, "logs", l.id), l).catch(e => console.warn("Seed log error:", e))
          ),
          ...INITIAL_CARDS.map((c) =>
            setDoc(doc(db, "users", uid, "paymentCards", c.id), c).catch(e => console.warn("Seed card error:", e))
          )
        ]);

        setAmRoutine(INITIAL_AM_ROUTINE);
        setPmRoutine(INITIAL_PM_ROUTINE);
        setLogs(INITIAL_LOGS);
        setPaymentCards(INITIAL_CARDS);
      } else {
        if (amData.length > 0) setAmRoutine(amData.sort((a, b) => a.step - b.step));
        if (pmData.length > 0) setPmRoutine(pmData.sort((a, b) => a.step - b.step));
        if (logData.length > 0) setLogs(logData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        if (cardData.length > 0) setPaymentCards(cardData);
      }
    } catch (err) {
      console.warn("Failed to load user cloud data from Firestore:", err);
    }
  };

  // Firebase Firestore write sync wrappers (Conforming strictly to Section 3 instructions)
  const syncStepToCloud = async (regime: "AM" | "PM", step: RoutineStep, index: number) => {
    if (!user || !auth?.currentUser || auth.currentUser.uid !== user.uid || !isFirebaseReady || !db) return;
    const path = `users/${user.uid}/routines/${regime}/steps/step-${index}`;
    try {
      await setDoc(doc(db, "users", user.uid, "routines", regime, "steps", `step-${index}`), step);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteStepFromCloud = async (regime: "AM" | "PM", index: number) => {
    if (!user || !auth?.currentUser || auth.currentUser.uid !== user.uid || !isFirebaseReady || !db) return;
    const path = `users/${user.uid}/routines/${regime}/steps/step-${index}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "routines", regime, "steps", `step-${index}`));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const syncLogToCloud = async (log: DailyLog) => {
    if (!user || !auth?.currentUser || auth.currentUser.uid !== user.uid || !isFirebaseReady || !db) return;
    const path = `users/${user.uid}/logs/${log.id}`;
    try {
      await setDoc(doc(db, "users", user.uid, "logs", log.id), log);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteLogFromCloud = async (logId: string) => {
    if (!user || !auth?.currentUser || auth.currentUser.uid !== user.uid || !isFirebaseReady || !db) return;
    const path = `users/${user.uid}/logs/${logId}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "logs", logId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const syncCardToCloud = async (card: PaymentCard) => {
    if (!user || !auth?.currentUser || auth.currentUser.uid !== user.uid || !isFirebaseReady || !db) return;
    const path = `users/${user.uid}/paymentCards/${card.id}`;
    try {
      await setDoc(doc(db, "users", user.uid, "paymentCards", card.id), card);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteCardFromCloud = async (cardId: string) => {
    if (!user || !auth?.currentUser || auth.currentUser.uid !== user.uid || !isFirebaseReady || !db) return;
    const path = `users/${user.uid}/paymentCards/${cardId}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "paymentCards", cardId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleLogin = async () => {
    try {
      const authenticatedUser = await loginWithGoogle();
      const userObj = {
        uid: authenticatedUser.uid,
        displayName: authenticatedUser.displayName || "Enthusiast",
        email: authenticatedUser.email || "",
        photoURL: authenticatedUser.photoURL || undefined
      };
      setUser(userObj);
      localStorage.setItem("glow_sense_user", JSON.stringify(userObj));
      setIsCloudSynced(isFirebaseReady);
      await loadUserData(authenticatedUser.uid);
    } catch (err: any) {
      console.warn("Google authentication notice:", err?.message || err);
      throw err;
    }
  };

  const handleEmailSignUp = async (email: string, pass: string, name: string) => {
    try {
      const firebaseUser: any = await signUpWithEmail(email, pass, name);
      const userObj = {
        uid: firebaseUser.uid,
        displayName: name || firebaseUser.displayName || email.split("@")[0],
        email: firebaseUser.email || email,
        photoURL: firebaseUser.photoURL || undefined
      };
      setUser(userObj);
      localStorage.setItem("glow_sense_user", JSON.stringify(userObj));
      setIsCloudSynced(isFirebaseReady);
      await loadUserData(firebaseUser.uid);
    } catch (err: any) {
      console.warn("Email signup notice:", err?.message || err);
      throw err;
    }
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    try {
      const firebaseUser: any = await signInWithEmail(email, pass);
      const userObj = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || email.split("@")[0],
        email: firebaseUser.email || email,
        photoURL: firebaseUser.photoURL || undefined
      };
      setUser(userObj);
      localStorage.setItem("glow_sense_user", JSON.stringify(userObj));
      setIsCloudSynced(isFirebaseReady);
      await loadUserData(firebaseUser.uid);
    } catch (err: any) {
      console.warn("Email signin notice:", err?.message || err);
      throw err;
    }
  };

  const handlePasswordReset = async (email: string) => {
    await sendPasswordReset(email);
  };

  const handleLogout = async () => {
    try {
      const currentUid = user?.uid;
      await logoutUser();
      setUser(null);
      setIsCloudSynced(false);
      setStreak(0);
      setAmRoutine(INITIAL_AM_ROUTINE);
      setPmRoutine(INITIAL_PM_ROUTINE);
      setLogs([]);
      setPaymentCards(INITIAL_CARDS);
      
      // Clear global routine & streak keys
      localStorage.removeItem("glow_sense_user");
      localStorage.removeItem("glow_sense_streak");
      localStorage.removeItem("glow_sense_am_routine");
      localStorage.removeItem("glow_sense_pm_routine");
      localStorage.removeItem("glow_sense_logs");
      localStorage.removeItem("glow_sense_user_session");

      // Invalidate all cached data for the current user to prevent cross-user data exposure
      if (currentUid) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.includes(currentUid) || key.startsWith("glow_sense_session_"))) {
            localStorage.removeItem(key);
          }
        }
      }
      sessionStorage.clear();

      // Replace current history entry with public landing/dashboard
      window.history.replaceState({ tab: "dashboard" }, "", "#dashboard");
      setActiveTab("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.warn("Sign out finished with local cleanup:", err);
      setUser(null);
      localStorage.removeItem("glow_sense_user");
      setIsCloudSynced(false);
    }
  };

  const handleCustomUserLogin = (name: string, email: string) => {
    const customUser = {
      uid: "custom-guest-user",
      displayName: name,
      email: email
    };
    setUser(customUser);
    setIsCloudSynced(false);
  };

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Check-off items directly on Dashboard
  const handleToggleAMStep = (idx: number) => {
    const updated = (amRoutine || []).map((s, i) => i === idx ? { ...s, completed: !s.completed } : s);
    setAmRoutine(updated);
    saveToStorage("glow_sense_am_routine", updated);
    
    // Sync to cloud
    if (updated[idx]) {
      syncStepToCloud("AM", updated[idx], idx);
    }
  };

  const handleTogglePMStep = (idx: number) => {
    const updated = (pmRoutine || []).map((s, i) => i === idx ? { ...s, completed: !s.completed } : s);
    setPmRoutine(updated);
    saveToStorage("glow_sense_pm_routine", updated);

    // Sync to cloud
    if (updated[idx]) {
      syncStepToCloud("PM", updated[idx], idx);
    }
  };

  // Adopt routine from Diagnostic Report
  const handleAdoptRoutine = (analysis: SkinAnalysis) => {
    if (analysis.amRoutine && Array.isArray(analysis.amRoutine)) {
      setAmRoutine(analysis.amRoutine);
      saveToStorage("glow_sense_am_routine", analysis.amRoutine);
      analysis.amRoutine.forEach((s, idx) => syncStepToCloud("AM", s, idx));
    }
    if (analysis.pmRoutine && Array.isArray(analysis.pmRoutine)) {
      setPmRoutine(analysis.pmRoutine);
      saveToStorage("glow_sense_pm_routine", analysis.pmRoutine);
      analysis.pmRoutine.forEach((s, idx) => syncStepToCloud("PM", s, idx));
    }
    setActiveAnalysis(analysis);
    setActiveTab("dashboard");
    saveToStorage("glow_sense_analysis", analysis);
  };

  // Planner actions
  const handleAddStep = (regime: "AM" | "PM", stepData: Omit<RoutineStep, "step">) => {
    const target = regime === "AM" ? (amRoutine || []) : (pmRoutine || []);
    const newStep: RoutineStep = {
      ...stepData,
      step: target.length + 1
    };
    const updated = [...target, newStep];
    const idx = target.length;
    
    if (regime === "AM") {
      setAmRoutine(updated);
      saveToStorage("glow_sense_am_routine", updated);
    } else {
      setPmRoutine(updated);
      saveToStorage("glow_sense_pm_routine", updated);
    }

    // Sync step to cloud
    syncStepToCloud(regime, newStep, idx);
  };

  const handleRemoveStep = (regime: "AM" | "PM", index: number) => {
    const target = regime === "AM" ? (amRoutine || []) : (pmRoutine || []);
    const filtered = target
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, step: idx + 1 })); // Recalculate step integers
    
    if (regime === "AM") {
      setAmRoutine(filtered);
      saveToStorage("glow_sense_am_routine", filtered);
    } else {
      setPmRoutine(filtered);
      saveToStorage("glow_sense_pm_routine", filtered);
    }

    // Delete step from cloud and re-sync full array to preserve order indexes
    deleteStepFromCloud(regime, target.length - 1);
    filtered.forEach((s, idx) => syncStepToCloud(regime, s, idx));
  };

  const handleToggleStepComplete = (regime: "AM" | "PM", index: number) => {
    if (regime === "AM") {
      handleToggleAMStep(index);
    } else {
      handleTogglePMStep(index);
    }
  };

  const handleCompleteAllSteps = (regime: "AM" | "PM") => {
    if (regime === "AM") {
      const updated = (amRoutine || []).map(s => ({ ...s, completed: true }));
      setAmRoutine(updated);
      saveToStorage("glow_sense_am_routine", updated);
      updated.forEach((s, idx) => syncStepToCloud("AM", s, idx));
    } else {
      const updated = (pmRoutine || []).map(s => ({ ...s, completed: true }));
      setPmRoutine(updated);
      saveToStorage("glow_sense_pm_routine", updated);
      updated.forEach((s, idx) => syncStepToCloud("PM", s, idx));
    }
  };

  // Catalog integrations
  const handleAddProductToRoutine = (regime: "AM" | "PM", product: SkincareProduct) => {
    handleAddStep(regime, {
      category: product.category,
      name: `${product.brand} - ${product.name}`,
      purpose: product.benefits[0] || product.description,
      instructions: product.howToUse,
      activeIngredients: product.ingredients,
      completed: false
    });
  };

  // Journal actions
  const handleAddLog = (newLogData: Omit<DailyLog, "id" | "loggedAt">) => {
    const newLog: DailyLog = {
      ...newLogData,
      id: `log-${Date.now()}`,
      loggedAt: new Date().toISOString()
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    saveToStorage("glow_sense_logs", updated);

    // Increment streak on logging
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem("glow_sense_streak", String(newStreak));

    // Sync log to cloud
    syncLogToCloud(newLog);
  };

  const handleRemoveLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    saveToStorage("glow_sense_logs", updated);

    // Delete log from cloud
    deleteLogFromCloud(id);
  };

  const handleAddPaymentCard = (card: Omit<PaymentCard, "id">) => {
    const newCard: PaymentCard = {
      ...card,
      id: `card-${Date.now()}`
    };
    let updated = [...paymentCards];
    if (newCard.isDefault) {
      updated = updated.map(c => ({ ...c, isDefault: false }));
    }
    updated.push(newCard);
    setPaymentCards(updated);
    saveToStorage("glow_sense_payment_cards", updated);
    syncCardToCloud(newCard);
  };

  const handleDeletePaymentCard = (id: string) => {
    const cardToDelete = paymentCards.find(c => c.id === id);
    let updated = paymentCards.filter(c => c.id !== id);
    if (cardToDelete?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    setPaymentCards(updated);
    saveToStorage("glow_sense_payment_cards", updated);
    deleteCardFromCloud(id);
  };

  const handleSetDefaultPaymentCard = (id: string) => {
    const updated = paymentCards.map(c => ({
      ...c,
      isDefault: c.id === id
    }));
    setPaymentCards(updated);
    saveToStorage("glow_sense_payment_cards", updated);
    updated.forEach(c => syncCardToCloud(c));
  };


  const [accountSection, setAccountSection] = useState<MenuSection>("profile");

  const handleNavigateTab = (tab: string, replace: boolean = false, section?: MenuSection) => {
    if (section && tab === "account") {
      setAccountSection(section);
    }
    if (tab === activeTab && (!section || tab !== "account")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setActiveTab(tab);
    if (replace) {
      window.history.replaceState({ tab }, "", `#${tab}`);
    } else {
      window.history.pushState({ tab }, "", `#${tab}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F8] text-slate-800 font-sans antialiased selection:bg-rose-500/20 selection:text-rose-950 flex flex-col">
      {/* Top Navigation Bar with all tabs (SakuraSkin Layout) */}
      <TopNavbar 
        activeTab={activeTab} 
        setActiveTab={handleNavigateTab} 
        streak={streak} 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isCloudSynced={isCloudSynced}
      />

      {/* Main Full-Width Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Visible Back Button on all sub-pages for clear browser/page navigation */}
        {activeTab !== "dashboard" && (
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              id="back-to-dashboard-btn"
              onClick={() => handleNavigateTab("dashboard")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 bg-white border border-rose-200/80 hover:border-rose-300 shadow-3xs transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-rose-500" />
              <span>Back to Dashboard</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400 capitalize hidden sm:inline">
              Nourish Glow / {activeTab}
            </span>
          </div>
        )}

        {activeTab === "dashboard" && (
          <Dashboard 
            user={user}
            amRoutine={amRoutine} 
            pmRoutine={pmRoutine} 
            onToggleAMStep={handleToggleAMStep} 
            onTogglePMStep={handleTogglePMStep} 
            streak={streak} 
            logs={logs}
            setActiveTab={handleNavigateTab}
            activeAnalysis={activeAnalysis}
            visionScanResult={visionScanResult}
          />
        )}

        {activeTab === "analyzer" && (
          <AIAnalyzer 
            onAdoptRoutine={handleAdoptRoutine} 
            currentAnalysis={activeAnalysis} 
            user={user}
            onAnalysisComplete={(analysis) => {
              setActiveAnalysis(analysis);
              if (user?.uid) {
                setUserItem(user.uid, "skin_analysis", analysis);
              }
            }}
          />
        )}

        {activeTab === "vision" && (
          <ComputerVisionScan 
            onAdoptRoutine={handleAdoptRoutine}
            user={user}
            onNavigateToCatalog={() => handleNavigateTab("products")}
            onScanComplete={(scan) => {
              setVisionScanResult(scan);
              if (user?.uid) {
                setUserItem(user.uid, "vision_scan_result", scan);
              }
            }}
          />
        )}

        {activeTab === "smartmirror" && (
          <SmartMirrorIoT 
            user={user}
            amRoutine={amRoutine}
            pmRoutine={pmRoutine}
          />
        )}

        {activeTab === "dermconsult" && (
          <DermConsultation 
            onNavigate={handleNavigateTab}
            user={user}
          />
        )}

        {activeTab === "routine" && (
          <RoutinePlanner 
            amRoutine={amRoutine} 
            pmRoutine={pmRoutine} 
            onAddStep={handleAddStep} 
            onRemoveStep={handleRemoveStep} 
            onToggleComplete={handleToggleStepComplete} 
            onNavigate={handleNavigateTab}
            user={user}
          />
        )}

        {activeTab === "catalog" && (
          <ProductCatalog 
            onAddProductToRoutine={handleAddProductToRoutine} 
            paymentCards={paymentCards}
            onAddPaymentCard={handleAddPaymentCard}
            currentUser={user}
          />
        )}

        {activeTab === "lab" && (
          <IngredientLab />
        )}

        {activeTab === "journal" && (
          <ProgressJournal 
            logs={logs} 
            onAddLog={handleAddLog} 
            onRemoveLog={handleRemoveLog} 
          />
        )}

        {activeTab === "account" && (
          <AccountView 
            user={user}
            isCloudSynced={isCloudSynced}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onCustomUserLogin={handleEmailSignIn as any}
            onEmailSignUp={handleEmailSignUp}
            onEmailSignIn={handleEmailSignIn}
            onPasswordReset={handlePasswordReset}
            amRoutine={amRoutine}
            pmRoutine={pmRoutine}
            logs={logs}
            paymentCards={paymentCards}
            onAddPaymentCard={handleAddPaymentCard}
            onDeletePaymentCard={handleDeletePaymentCard}
            onSetDefaultPaymentCard={handleSetDefaultPaymentCard}
            onNavigateTab={handleNavigateTab}
            initialSection={accountSection}
          />
        )}
      </main>

      {/* Multi-Column Nourish Glow AI Skincare Footer */}
      <footer className="border-t border-rose-200/80 bg-white/90 backdrop-blur-md pt-12 pb-8 mt-16 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-rose-100">
            {/* Brand column */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center p-1.5 shadow-xs">
                  <Heart className="w-4 h-4 fill-white text-white" />
                </span>
                <span className="text-xl font-bold font-serif text-slate-900 tracking-tight">Nourish Glow</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
                AI-powered multi-agent skincare recommender system. Analyze ingredients, find dupes, build routines, and discover your perfect skincare match.
              </p>
            </div>

            {/* Quick Links column */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button"
                    onClick={() => handleNavigateTab("analyzer")} 
                    className="hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>🧪</span> <span>Skin Quiz</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => handleNavigateTab("catalog")} 
                    className="hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>🛍️</span> <span>Products &amp; Catalog</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => handleNavigateTab("lab")} 
                    className="hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>🔬</span> <span>Ingredient Lab</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => handleNavigateTab("routine")} 
                    className="hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>🧴</span> <span>Routine Builder</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => handleNavigateTab("journal")} 
                    className="hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>📓</span> <span>Skin Diary</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => handleNavigateTab("dermconsult")} 
                    className="hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>🩺</span> <span>Derm Consult</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Our Agents column */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Our Agents</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateTab("lab")}
                    className="flex items-start gap-1.5 text-left hover:text-rose-600 transition-colors cursor-pointer group"
                  >
                    <span className="shrink-0">🧪</span>
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-rose-600">Formulation Agent</span>
                      <span className="text-slate-500"> — Cosmetic Chemist AI</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateTab("lab")}
                    className="flex items-start gap-1.5 text-left hover:text-rose-600 transition-colors cursor-pointer group"
                  >
                    <span className="shrink-0">🔍</span>
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-rose-600">Scraper Agent</span>
                      <span className="text-slate-500"> — INCI Fetcher</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateTab("analyzer")}
                    className="flex items-start gap-1.5 text-left hover:text-rose-600 transition-colors cursor-pointer group"
                  >
                    <span className="shrink-0">🧠</span>
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-rose-600">Skin Analyzer</span>
                      <span className="text-slate-500"> — Personalized Recommendations</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateTab("routine")}
                    className="flex items-start gap-1.5 text-left hover:text-rose-600 transition-colors cursor-pointer group"
                  >
                    <span className="shrink-0">🧴</span>
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-rose-600">Routine Agent</span>
                      <span className="text-slate-500"> — Smart Routine Builder</span>
                    </div>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigateTab("catalog")}
                    className="flex items-start gap-1.5 text-left hover:text-rose-600 transition-colors cursor-pointer group"
                  >
                    <span className="shrink-0">💸</span>
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-rose-600">Dupe Finder</span>
                      <span className="text-slate-500"> — Budget-Friendly Alternatives</span>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Medical Disclaimer Banner */}
          <div id="footer-medical-disclaimer" className="mt-8 pt-6 border-t border-rose-100 text-center text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
            <p className="font-semibold text-slate-700 mb-1">Medical &amp; Clinical Information Disclaimer</p>
            <p>
              The skincare recommendations, ingredient analyses, and cosmetic insights provided by Nourish Glow are for educational and informational purposes only. They do not constitute medical advice, clinical diagnosis, or medical treatment plans. Always consult a licensed dermatologist, physician, or certified healthcare provider for medical skin conditions, persistent rashes, severe acne, or atypical dermal changes.
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>Made with ❤️🌿 by Nourish Glow Team • Multi-Agent Skincare Intelligence</p>
            <p className="text-[11px] font-mono text-slate-400">© 2026 Nourish Glow AI • Clinical Cosmetic Chemistry</p>
          </div>
        </div>
      </footer>

      {/* Global Routine Reminder Engine & In-App Notification Modal */}
      <RoutineReminderManager 
        user={user}
        amRoutine={amRoutine}
        pmRoutine={pmRoutine}
        onNavigate={handleNavigateTab}
        onCompleteRoutine={handleCompleteAllSteps}
      />
    </div>
  );
}

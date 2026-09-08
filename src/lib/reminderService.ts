import { RoutineReminderSettings, RoutineStep } from "../types";
import { getUserItem, setUserItem } from "./userStorage";
import { db, isFirebaseReady } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const DEFAULT_REMINDER_SETTINGS: RoutineReminderSettings = {
  morningReminderEnabled: true,
  morningReminderTime: "08:00",
  eveningReminderEnabled: true,
  eveningReminderTime: "21:00",
  notificationPermission: typeof window !== "undefined" && "Notification" in window 
    ? (Notification.permission as any) 
    : "unsupported"
};

/**
 * Checks whether Notification API is supported by the current browser.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Returns current notification permission: "granted", "denied", "default", or "unsupported".
 */
export function getNotificationPermissionStatus(): "granted" | "denied" | "default" | "unsupported" {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission as "granted" | "denied" | "default";
}

/**
 * Registers the Service Worker for reliable notification handling & background clicks.
 */
export async function registerReminderServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return registration;
  } catch (err) {
    console.warn("ServiceWorker registration note:", err);
    return null;
  }
}

/**
 * Requests browser notification permission and registers the Service Worker.
 */
export async function requestNotificationPermission(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await registerReminderServiceWorker();
    }
    return permission as "granted" | "denied" | "default";
  } catch (err) {
    console.warn("Error requesting notification permission:", err);
    return getNotificationPermissionStatus();
  }
}

/**
 * Formats a 24-hour time string ("08:00", "21:30") to standard 12-hour display ("8:00 AM", "9:30 PM").
 */
export function formatTimeTo12Hour(timeStr: string): string {
  if (!timeStr || !timeStr.includes(":")) return timeStr || "--:--";
  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  if (isNaN(hour)) return timeStr;

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

/**
 * Loads user-scoped reminder settings.
 * Pulls from Firestore `users/{uid}/settings/reminders` if user is authenticated and cloud sync is available,
 * and seamlessly synchronizes with user-isolated local storage.
 */
export async function loadUserReminderSettings(uid?: string | null): Promise<RoutineReminderSettings> {
  const localFallback = getUserItem<RoutineReminderSettings>(
    uid,
    "reminders",
    { ...DEFAULT_REMINDER_SETTINGS, notificationPermission: getNotificationPermissionStatus() }
  );

  if (!uid || !isFirebaseReady || !db) {
    return localFallback;
  }

  try {
    const reminderDocRef = doc(db, "users", uid, "settings", "reminders");
    const snap = await getDoc(reminderDocRef);
    if (snap.exists()) {
      const data = snap.data() as RoutineReminderSettings;
      const merged: RoutineReminderSettings = {
        ...localFallback,
        ...data,
        notificationPermission: getNotificationPermissionStatus()
      };
      // Keep local user storage in sync
      setUserItem(uid, "reminders", merged);
      return merged;
    }
  } catch (err) {
    console.warn("Note reading reminder settings from Firestore (using local cache):", err);
  }

  return localFallback;
}

/**
 * Normalizes time string to 24-hour HH:MM format ("8:00" -> "08:00")
 */
export function normalizeTime(t?: string): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length < 2) return t.trim();
  const h = parts[0].trim().padStart(2, "0");
  const m = parts[1].trim().slice(0, 2).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Synthesizes a soothing melodic 3-tone notification chime using Web Audio API
 */
export function playReminderChime(): void {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    
    // Gentle melodic 3-tone chime (F5 -> A5 -> C6)
    const tones = [698.46, 880.00, 1046.50];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.7);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.7);
    });
  } catch (err) {
    console.warn("Audio chime playback note:", err);
  }
}

/**
 * Dispatches a client event to trigger the live in-app notification popup immediately
 */
export function dispatchTriggerTestReminder(regime: "AM" | "PM" = "AM"): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ng-trigger-test-reminder", { detail: { regime } }));
  }
}

/**
 * Saves user-scoped reminder settings to both Firestore and user-isolated localStorage.
 */
export async function saveUserReminderSettings(
  uid: string | null | undefined,
  settings: RoutineReminderSettings
): Promise<{ success: boolean; error?: string }> {
  const payload: RoutineReminderSettings = {
    ...settings,
    notificationPermission: getNotificationPermissionStatus(),
    updatedAt: new Date().toISOString()
  };

  // Always save to user-isolated storage first
  setUserItem(uid, "reminders", payload);

  // Broadcast event so any active timer loop updates its schedule immediately
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ng-reminder-settings-updated", { detail: payload }));
  }

  // If user is authenticated and Firestore is ready, sync to cloud
  if (uid && isFirebaseReady && db) {
    try {
      const reminderDocRef = doc(db, "users", uid, "settings", "reminders");
      await setDoc(reminderDocRef, payload, { merge: true });
    } catch (err: any) {
      console.warn("Failed saving reminder settings to Firestore:", err);
      return { success: false, error: err?.message || "Failed to sync to cloud database." };
    }
  }

  return { success: true };
}

/**
 * Dispatches a native browser notification, utilizing the Service Worker when available
 * or falling back to window.Notification with interactive deep linking to `#routine`.
 */
export async function showSkincareNotification(options: {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn("Notifications not supported in this browser.");
    return false;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission is not granted.");
    return false;
  }

  const { title, body, tag = "nourish-glow-reminder", url = "/#routine" } = options;

  // Try Service Worker registration first (standard modern PWA method)
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          tag,
          icon: "/icon-192.svg",
          badge: "/icon-192.svg",
          data: { url }
        } as any);
        return true;
      }
    } catch (swErr) {
      console.warn("ServiceWorker notification failed, falling back to window Notification:", swErr);
    }
  }

  // Fallback to standard window Notification API
  try {
    const notif = new Notification(title, {
      body,
      tag,
      icon: "/icon-192.svg"
    });

    notif.onclick = () => {
      window.focus();
      if (url.includes("#")) {
        const hash = url.split("#")[1];
        window.location.hash = hash;
      }
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn("window.Notification invocation note:", err);
    return false;
  }
}

/**
 * Sends a test notification immediately so teachers and evaluators can verify functionality.
 * Plays the chime, displays the in-app popup modal, and triggers browser push notifications.
 */
export async function sendTestNotification(): Promise<{ sent: boolean; message: string }> {
  // Always trigger sound chime and in-app popup regardless of desktop browser permission
  playReminderChime();
  dispatchTriggerTestReminder("AM");

  if (!isNotificationSupported()) {
    return {
      sent: true,
      message: "Test reminder fired! In-app notification card & sound chime active."
    };
  }

  if (Notification.permission === "denied") {
    return {
      sent: true,
      message: "In-app reminder alert & chime active! (Browser desktop alerts are blocked in site settings)."
    };
  }

  if (Notification.permission === "default") {
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      return {
        sent: true,
        message: "In-app reminder alert & chime active! Click 'Enable' if you also want desktop OS push notifications."
      };
    }
  }

  const success = await showSkincareNotification({
    title: "Nourish Glow ✨",
    body: "This is a test reminder. Your skincare notifications and circadian routines are working!",
    tag: "test-reminder",
    url: "/#routine"
  });

  return {
    sent: true,
    message: success 
      ? "Test alert fired! In-app notification card, sound chime, and desktop notification sent."
      : "In-app test notification fired with audio chime!"
  };
}

/**
 * Generates and dispatches morning skincare routine notification.
 */
export async function sendMorningReminder(amRoutine?: RoutineStep[]): Promise<boolean> {
  let body = "Good morning! 🌞 It's time for your Nourish Glow morning skincare routine. Take care of your skin today!";
  if (amRoutine && amRoutine.length > 0) {
    const preview = amRoutine.slice(0, 2).map(s => s.name).join(", ");
    body = `Good morning! 🌞 It's time for your Nourish Glow morning routine (${amRoutine.length} steps: ${preview}${amRoutine.length > 2 ? '...' : ''}). Take care of your skin today!`;
  }

  return showSkincareNotification({
    title: "Nourish Glow ✨",
    body,
    tag: "morning-reminder",
    url: "/#routine"
  });
}

/**
 * Generates and dispatches evening skincare routine notification.
 */
export async function sendEveningReminder(pmRoutine?: RoutineStep[]): Promise<boolean> {
  let body = "Good evening! 🌙 It's time for your Nourish Glow evening skincare routine. End your day with your skincare routine. 🌙";
  if (pmRoutine && pmRoutine.length > 0) {
    const preview = pmRoutine.slice(0, 2).map(s => s.name).join(", ");
    body = `Good evening! 🌙 It's time for your Nourish Glow evening routine (${pmRoutine.length} steps: ${preview}${pmRoutine.length > 2 ? '...' : ''}). End your day with your skincare routine. 🌙`;
  }

  return showSkincareNotification({
    title: "Nourish Glow ✨",
    body,
    tag: "evening-reminder",
    url: "/#routine"
  });
}

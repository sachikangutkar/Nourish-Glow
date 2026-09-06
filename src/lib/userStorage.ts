/**
 * User-Scoped Storage Utility for Nourish Glow
 * Ensures strict state isolation between different user accounts.
 * Prevents newly registered or logged-in users from seeing other users' diagnostic data.
 */

export interface UserSession {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isGuest?: boolean;
}

const STORAGE_PREFIX = "nourish_glow";

/**
 * Returns the scoped storage key for a specific user ID
 */
export function getUserStorageKey(uid: string | null | undefined, key: string): string {
  if (!uid) {
    return `${STORAGE_PREFIX}_anon_${key}`;
  }
  return `${STORAGE_PREFIX}_user_${uid}_${key}`;
}

/**
 * Get item from user-scoped storage with fallback
 */
export function getUserItem<T>(uid: string | null | undefined, key: string, fallback: T): T {
  try {
    const storageKey = getUserStorageKey(uid, key);
    const item = localStorage.getItem(storageKey);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse user item for key: ${key}`, error);
    return fallback;
  }
}

/**
 * Set item in user-scoped storage
 */
export function setUserItem<T>(uid: string | null | undefined, key: string, value: T): void {
  try {
    const storageKey = getUserStorageKey(uid, key);
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save user item for key: ${key}`, error);
  }
}

/**
 * Remove an item from user-scoped storage
 */
export function removeUserItem(uid: string | null | undefined, key: string): void {
  try {
    const storageKey = getUserStorageKey(uid, key);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn(`Failed to remove user item for key: ${key}`, error);
  }
}

/**
 * Clears any remaining legacy un-scoped global keys from previous runs
 */
export function cleanupLegacyGlobalData(): void {
  try {
    const legacyKeys = [
      "glow_sense_analysis",
      "glow_sense_am_routine",
      "glow_sense_pm_routine",
      "glow_sense_logs",
      "glow_sense_streak",
      "glow_sense_payment_cards",
      "nourish_glow_am_enabled",
      "nourish_glow_pm_enabled"
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Legacy cleanup warning:", e);
  }
}

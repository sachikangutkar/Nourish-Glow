import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  query,
  where,
  orderBy,
  getDocFromServer,
  Firestore
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Standard Operation Types for error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global Firebase Instance Variables
let app;
let db: Firestore | null = null;
let auth: any = null;
let isFirebaseReady = false;

// Attempt initialization
try {
  if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "") {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== ""
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    auth = getAuth(app);
    isFirebaseReady = true;
    console.log("Firebase Skincare Sync engine successfully initialized with active cloud configuration.");
  } else {
    console.warn("No active Firebase configuration detected. Defaulting to local sandbox synchronization.");
  }
} catch (e) {
  console.warn("Firebase startup note. Operating in sandbox local-cache mode.", e);
}

// Standard Firestore Connection Test (Mandated in Firebase manual)
if (isFirebaseReady && db) {
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db!, "test", "connection"));
      console.log("Firestore connection test passed.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.warn("Firestore client is operating offline/cached.");
      } else {
        console.warn("Firestore connection check note:", error);
      }
    }
  };
  testConnection();
}

/**
 * Custom Error Handler to conform strictly to JSON format defined in Firebase guidelines.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Logged: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Formats raw Firebase authentication errors into clear, user-friendly messages.
 */
export function formatAuthError(err: any): { code: string; message: string; isEmailInUse?: boolean } {
  const code = err?.code || "";
  const rawMsg = err?.message || String(err || "");
  
  if (code === "auth/invalid-api-key" || rawMsg.includes("invalid-api-key") || rawMsg.includes("YOUR_API_KEY")) {
    return {
      code: "auth/invalid-api-key",
      message: "Please replace the placeholder values in firebase-applet-config.json with your actual Firebase API keys from Firebase Console."
    };
  }
  if (code === "auth/operation-not-allowed" || rawMsg.includes("auth/operation-not-allowed")) {
    return {
      code: "auth/operation-not-allowed",
      message: "Email/Password sign-in is currently unavailable for this Firebase project. Please click 'Continue with Google' to sign in with your Google account."
    };
  }
  if (code === "auth/user-not-found" || rawMsg.includes("auth/user-not-found")) {
    return {
      code: "auth/user-not-found",
      message: "No account found with this email. Please create an account."
    };
  }
  if (
    code === "auth/wrong-password" || 
    code === "auth/invalid-credential" || 
    rawMsg.includes("auth/wrong-password") || 
    rawMsg.includes("auth/invalid-credential")
  ) {
    return {
      code: "auth/invalid-credential",
      message: "Incorrect email or password. Please try again."
    };
  }
  if (code === "auth/invalid-email" || rawMsg.includes("auth/invalid-email")) {
    return {
      code: "auth/invalid-email",
      message: "Please enter a valid email address."
    };
  }
  if (code === "auth/email-already-in-use" || rawMsg.includes("auth/email-already-in-use")) {
    return {
      code: "auth/email-already-in-use",
      message: "An account with this email already exists. Please sign in instead.",
      isEmailInUse: true
    };
  }
  if (
    code === "auth/popup-closed-by-user" || 
    code === "auth/cancelled-popup-request" || 
    rawMsg.includes("popup-closed-by-user") || 
    rawMsg.includes("cancelled-popup-request")
  ) {
    return {
      code: "auth/popup-closed-by-user",
      message: "Sign-in popup was closed. Please try again or use email sign-in."
    };
  }
  if (code === "auth/popup-blocked" || rawMsg.includes("popup-blocked")) {
    return {
      code: "auth/popup-blocked",
      message: "Popup was blocked by your browser. Please allow popups for this page or try email sign-in."
    };
  }
  if (code === "auth/network-request-failed" || rawMsg.includes("network-request-failed")) {
    return {
      code: "auth/network-request-failed",
      message: "Network error. Please check your internet connection."
    };
  }
  if (code === "auth/account-exists-with-different-credential" || rawMsg.includes("account-exists-with-different-credential")) {
    return {
      code: "auth/account-exists-with-different-credential",
      message: "An account already exists with this email address using a different sign-in method."
    };
  }

  const cleaned = rawMsg.replace(/^Firebase:\s*Error\s*\(auth\/[^)]+\)\.?\s*/i, "").trim();
  return {
    code: code || "auth/unknown",
    message: cleaned || "An authentication error occurred. Please try again."
  };
}

// Authentication Helpers
export async function signUpWithEmail(email: string, pass: string, name: string) {
  if (!isFirebaseReady || !auth) {
    const customErr: any = new Error("Firebase Authentication is not configured.");
    customErr.code = "auth/operation-not-allowed";
    throw customErr;
  }
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && credential.user) {
    await updateProfile(credential.user, { displayName: name });
  }
  return credential.user;
}

export async function signInWithEmail(email: string, pass: string) {
  if (!isFirebaseReady || !auth) {
    const customErr: any = new Error("Firebase Authentication is not configured.");
    customErr.code = "auth/operation-not-allowed";
    throw customErr;
  }
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

export async function sendPasswordReset(email: string) {
  if (isFirebaseReady && auth) {
    await sendPasswordResetEmail(auth, email);
  }
}

export async function loginWithGoogle() {
  if (!isFirebaseReady || !auth) {
    const customErr: any = new Error("Firebase Authentication is not configured.");
    customErr.code = "auth/operation-not-allowed";
    throw customErr;
  }

  try {
    const provider = new GoogleAuthProvider();
    // Allow the user to select their Google account each time
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    console.warn("Google popup authentication note:", err?.message || err);
    throw err;
  }
}

export async function logoutUser() {
  if (isFirebaseReady && auth) {
    await signOut(auth);
  }
}

// Export references
export { db, auth, isFirebaseReady };

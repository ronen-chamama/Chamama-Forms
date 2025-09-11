// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET!,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// חשוב: מטפל בשגיאות WebChannel 400 ומסנן undefined
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true,
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, process.env.NEXT_PUBLIC_FUNCTIONS_REGION || "us-central1");

// אמולטורים — רק אם גם מוגדר USE_EMU=true וגם באמת רצים על localhost
const useEmu = process.env.NEXT_PUBLIC_USE_EMU === "true";
const isLocalhost = typeof window !== "undefined" && location.hostname === "localhost";

if (useEmu && isLocalhost) {
  try { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); } catch {}
  try { connectFirestoreEmulator(db, "127.0.0.1", 8080); } catch {}
  try { connectStorageEmulator(storage, "127.0.0.1", 9199); } catch {}
  try { connectFunctionsEmulator(functions, "127.0.0.1", 5001); } catch {}
}

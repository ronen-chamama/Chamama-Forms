import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// חשוב: אזור תואם ל-export של הפונקציה
export const functions = getFunctions(app, "us-central1");

// חיבור אמולטורים לוקאלית
const useEmu = process.env.NEXT_PUBLIC_USE_EMU === "true";

if (useEmu) {
  try { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); } catch {}
  try { connectFirestoreEmulator(db, "127.0.0.1", 8080); } catch {}
  try { connectStorageEmulator(storage, "127.0.0.1", 9199); } catch {}
  try {
    // עדיף להשתמש באותו instance שיש לך כבר
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  } catch {}
}

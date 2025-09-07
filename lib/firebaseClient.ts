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
const isLocalHost =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(location.hostname);

if (isLocalHost) {
  // Auth (שקט בלי אזהרות "שמירת סיסמאות" וכו')
  try { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); } catch {}

  // Firestore / Storage
  try { connectFirestoreEmulator(db, "127.0.0.1", 8080); } catch {}
  try { connectStorageEmulator(storage, "127.0.0.1", 9199); } catch {}

  // Functions — חשוב: אותו region כמו בפרויקט (שנה אם אתה לא ב-us-central1)
  try {
    // אם כבר יצרת somewhere const functions = getFunctions(app, "us-central1"), השתמש בו
    const fns = getFunctions(/* app */ undefined as any, "us-central1");
    connectFunctionsEmulator(fns, "127.0.0.1", 5001);
  } catch {}
}

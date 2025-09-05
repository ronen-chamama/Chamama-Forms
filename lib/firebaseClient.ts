// lib/firebaseClient.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// --- אבחון: ודא שמשתני הסביבה קיימים (גם בשרת של Next וגם בדפדפן) ---
const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
};

// נבדוק את כל המפתחות החיוניים ונזרוק שגיאה ברורה אם חסר משהו:
const missing = Object.entries(cfg).filter(([_, v]) => !v).map(([k]) => k);
if (missing.length) {
  // חשוב: ההודעה תופיע במסוף וגם תעצור את הייבוא בצורה ברורה
  throw new Error(
    "Firebase env missing: " + missing.join(", ") +
    ". ודא שיש קובץ .env.local בשורש הפרויקט עם NEXT_PUBLIC_FB_* אמיתיים, ואתחל מחדש את dev."
  );
}

const firebaseConfig = cfg as {
  apiKey: string; authDomain: string; projectId: string; storageBucket: string; appId: string;
};

let app: FirebaseApp;
try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
} catch (e) {
  // לוג מועיל לאבחון
  // eslint-disable-next-line no-console
  console.error("Firebase initializeApp failed. projectId:", firebaseConfig.projectId, e);
  throw e;
}

export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);


// חיבור לאמולטורים בלוקאל
if (typeof window !== "undefined" && location.hostname === "localhost") {
  try { connectAuthEmulator(auth, "http://localhost:9099"); } catch {}
  try { connectFirestoreEmulator(db, "localhost", 8080); } catch {}
  try { connectStorageEmulator(storage, "localhost", 9199); } catch {}
  try { connectFunctionsEmulator(functions, "localhost", 5001); } catch {}
}



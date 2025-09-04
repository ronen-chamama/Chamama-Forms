// lib/firebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const app = getApps().length ? getApps()[0] : initializeApp({ /* ...env... */ });
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

if (typeof window !== "undefined" && location.hostname === "localhost") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
  } catch {}
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch {}
  try {
    connectStorageEmulator(storage, "localhost", 9199);
  } catch {}
}
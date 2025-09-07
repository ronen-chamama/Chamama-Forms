"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/");
    });
    return () => unsub();
  }, [router]);

  async function loginWithGoogle() {
    setErr(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
                                         
    } catch (e: any) {
      const code = e?.code || "";
      if (code === "permission-denied" || code === "auth/permission-denied") {
        setErr("אין לך הרשאה להיכנס. פנה/י למנהל להוספה לרשימת מורשים.");
      } else if (code === "auth/popup-closed-by-user") {
        setErr("החלון נסגר לפני סיום ההתחברות.");
      } else {
        setErr("התחברות עם Google נכשלה. נסו שוב.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-neutral-50">
      {                                 }
      <section className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 md:p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            <Image
              src="/branding/logo-squer-color.png"
              alt="לוגו תיכון החממה"
              width={96}
              height={96}
              priority
              className="rounded-xl"
            />
            <h1 className="text-2xl font-semibold text-neutral-900">ברוכ.ה הבא.ה</h1>
            <p className="text-sm text-neutral-500">התחברות למערכת הטפסים</p>
          </div>

          {                         }
          {err && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
              {err}
            </div>
          )}

          {                                                                        }
          <button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full h-11 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 inline-flex items-center justify-center gap-2"
          >
            {                                    }
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.7 3.4-5.5 3.4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.7C16.9 2.9 14.7 2 12 2 6.9 2 2.7 6.2 2.7 11.3S6.9 20.7 12 20.7c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.2H12z"/>
            </svg>
            {loading ? "מתחבר…" : "התחברות עם Google"}
          </button>

          <p className="mt-6 text-center text-sm text-neutral-500">
            לא מצליח.ה להתחבר? חפש.י את טל, אור או רונן.
          </p>
        </div>
      </section>

      {                                         }
      <section className="hidden md:flex relative items-center justify-center bg-neutral-900 text-white">
        <div className="max-w-sm text-center">
          <div className="border-2 border-dashed border-white/30 rounded-2xl p-8">
            <p className="text-lg mb-2">אזור תמונה</p>
            <p className="text-sm text-white/70">
              כאן נוסיף בהמשך תמונת השראה/איור (AI או סטוק).
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

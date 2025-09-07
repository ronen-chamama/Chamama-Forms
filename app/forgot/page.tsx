"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebaseClient";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // אימיילים בעברית
    try { auth.languageCode = "he"; } catch {}

    // ניקוי הודעות כשמשנים אימייל
    setMsg(null);
  }, [email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      // שליחת מייל איפוס
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found") setMsg("לא נמצא משתמש עם כתובת דוא\"ל זו.");
      else if (code === "auth/invalid-email") setMsg("כתובת דוא\"ל לא תקינה.");
      else setMsg("אירעה שגיאה בשליחת המייל. נסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-dvh grid md:grid-cols-2">
      {/* עמודה שמאלית – פלייסהולדר לתמונה/איור */}
      <div className="hidden md:block bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100" />

      {/* עמודה ימנית – טופס */}
      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* לוגו מעל הטופס */}
          <div className="mb-6">
            <div className="relative w-[160px] h-[36px]">
              <Image
                src="/branding/logo-banner-color.png"
                alt="תיכון החממה"
                fill
                sizes="160px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold mb-1">איפוס סיסמה</h1>
            <p className="text-sm text-neutral-600 mb-4">
              הזינו את כתובת הדוא״ל שלכם ונשלח קישור לאיפוס סיסמה.
            </p>

            {sent ? (
              <div className="rounded-xl border border-green-200 bg-green-50 text-green-800 px-3 py-2 text-sm">
                נשלח קישור לאיפוס סיסמה ל-{email}. בדקו את תיבת הדוא״ל (יתכן שגם בספאם).
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-sm text-neutral-700">דוא״ל</span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border border-neutral-300 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="name@example.com"
                  />
                </label>

                {msg && (
                  <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
                    {msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 h-11 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-50"
                >
                  {loading ? "שולח…" : "שליחת קישור איפוס"}
                </button>
              </form>
            )}

            <div className="mt-4 text-sm">
              <Link href="/login" className="text-sky-700 hover:underline">
                חזרה למסך ההתחברות
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

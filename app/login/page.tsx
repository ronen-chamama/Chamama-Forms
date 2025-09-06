"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/");
    });
    return () => unsub();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      router.replace("/");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-neutral-50">
      {/* ימין: כרטיס התחברות עם לוגו */}
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

          <form onSubmit={onSubmit} className="space-y-4">
            {err && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
                {err}
              </div>
            )}

            <div className="grid gap-1">
              <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                אימייל
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-neutral-900 outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="name@school.org"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                סיסמה
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                dir="ltr"
                className="h-11 rounded-lg border border-neutral-300 bg-white px-3 text-neutral-900 outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 select-none">
                <input type="checkbox" className="accent-sky-600 size-4" />
                לזכור אותי
              </label>
              <a href="/reset" className="text-sky-600 hover:underline">
                שכחתי סיסמה
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
            >
              {loading ? "נכנס..." : "כניסה"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
          לא מצליח.ה להתחבר?  חפש.י את טל, אור או רונן .
          </p>
        </div>
      </section>

      {/* שמאל: placeholder לתמונה/איור עתידי */}
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

"use client";

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

  // אם כבר מחוברים — לעבור ל־/forms
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
      router.replace("/"); // ← היה /app
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-lg bg-white p-6">
        <h1 className="text-xl font-semibold text-center">כניסה</h1>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <input
          className="w-full border rounded p-2"
          placeholder="אימייל"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          dir="ltr"
        />
        <input
          className="w-full border rounded p-2"
          placeholder="סיסמה"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          dir="ltr"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 text-white py-2 disabled:opacity-50"
        >
          {loading ? "נכנס..." : "כניסה"}
        </button>
      </form>
    </main>
  );
}

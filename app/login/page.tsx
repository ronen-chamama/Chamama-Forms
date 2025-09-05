"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [msg,setMsg]=useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  // אם כבר מחוברים — ננווט מיד
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        const next = searchParams.get("next") || "/app"; // ברירת מחדל
        router.replace(next);
      }
    });
    return () => unsub();
  }, [router, searchParams]);

  async function onLogin(e:any){
    e.preventDefault();
    setMsg("");
    try{
      await signInWithEmailAndPassword(auth,email,password);
      const next = searchParams.get("next") || "/app"; // אם מגיעים עם next=?ננווט אליו
      router.replace(next);
    }catch(err:any){
      setMsg(err.message);
    }
  }

  async function onReset(){
    if(!email){ setMsg("נא להקליד אימייל"); return; }
    try{ await sendPasswordResetEmail(auth,email); setMsg("נשלח מייל איפוס סיסמה"); }
    catch(err:any){ setMsg(err.message); }
  }

  return (
    <main dir="rtl" className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">התחברות</h1>
      <form onSubmit={onLogin} className="flex flex-col gap-3">
        <input placeholder="אימייל" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2" />
        <input placeholder="סיסמה" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2" />
        <button className="border p-2">כניסה</button>
      </form>
      <button onClick={onReset} className="underline mt-3">שכחתי סיסמה</button>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
    </main>
  );
}

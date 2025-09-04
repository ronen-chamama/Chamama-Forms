"use client";
import { useEffect, useState } from "react";
import SignaturePad from "@/components/SignaturePad";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { saveSignaturePng } from "@/lib/saveSignaturePng";

export default function DemoSignaturePage() {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(""); const [fileUrl, setFileUrl] = useState("");

  useEffect(()=>{ const u = onAuthStateChanged(auth,(x)=>{ setUser(x); if(!x) location.href="/login"; }); return ()=>u(); },[]);
  async function handleSave(dataUrl:string){ if(!user) return; setMsg(""); setSaving(true);
    try{ const {url}=await saveSignaturePng(user.uid,dataUrl); setFileUrl(url); setMsg("✅ נשמר ב-Storage"); }catch(e:any){ setMsg("שגיאה: "+(e?.message||e)); }finally{ setSaving(false); } }

  return (
    <main dir="rtl" className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">דמו שמירת חתימה</h1>
      <SignaturePad onSave={handleSave}/>
      <div className="mt-3 text-sm">{saving ? "שומר..." : msg}</div>
      {fileUrl && <div className="mt-4"><a className="text-blue-600 underline" href={fileUrl} target="_blank">פתח קובץ</a><div className="border mt-2 p-2"><img src={fileUrl} alt="חתימה" className="max-w-full"/></div></div>}
    </main>
  );
}

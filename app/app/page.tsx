"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function AppHome() {
  const [uid, setUid] = useState<string>("");
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) location.href = "/login";
      else setUid(u.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const qy = query(collection(db, "forms"), where("ownerUid", "==", uid));
      const snap = await getDocs(qy);
      setForms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [uid]);

  return (
    <main dir="rtl" className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl mb-4">הטפסים שלי</h1>
      <a className="border p-2 inline-block mb-4" href="/app/forms/new">+ טופס חדש</a>
      <ul className="space-y-2">
        {forms.map((f) => (
          <li key={f.id} className="border p-2 rounded flex justify-between">
            <div>{f.title || "ללא כותרת"}</div>
            <div className="space-x-2 space-x-reverse">
              <a className="underline" href={`/app/forms/${f.id}/edit`}>עריכה</a>
              <a className="underline" href={`/app/forms/${f.id}/submissions`}>הגשות</a>
              <a className="underline" href={`/f/${f.id}`}>קישור להורה</a>
            </div>
          </li>
        ))}
        {forms.length === 0 && <li className="text-sm text-gray-500">אין טפסים עדיין.</li>}
      </ul>
    </main>
  );
}

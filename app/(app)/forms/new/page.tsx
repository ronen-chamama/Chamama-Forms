"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function NewFormPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("טוען…");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // אם לא מחוברים – העבר לכניסה ואז חזור לכאן
        router.replace("/login?next=/app/forms/new");
        return;
      }
      try {
        setMsg("יוצר טופס חדש…");
        const ref = await addDoc(collection(db, "forms"), {
          ownerUid: user.uid,
          title: "טופס חדש",
          targetGroups: [],
          notifyStaffEmails: [],
          schema: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        router.replace(`/forms/${ref.id}/edit`);
      } catch (e: any) {
        console.error(e);
        setMsg("שגיאה ביצירת טופס: " + (e?.message || e));
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <main dir="rtl" className="p-6">
      {msg}
    </main>
  );
}

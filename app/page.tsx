"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import DeleteFormButton from "@/components/DeleteFormButton";

type FormDoc = {
  id: string;
  title?: string;
  ownerUid: string;
  submissionCount?: number;
};

export default function FormsIndexPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string>("");
  const [forms, setForms] = useState<FormDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // חובה להיות מחובר
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
      else setUid(u.uid);
    });
    return () => unsub();
  }, [router]);

  // משיכת הטפסים של המשתמש
  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "forms"), where("ownerUid", "==", uid));
        const snap = await getDocs(q);
        setForms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  function copyLink(id: string) {
    const url = `${location.origin}/f/${id}`;
    navigator.clipboard.writeText(url).then(() => alert("הקישור הועתק ללוח"));
  }

  async function createNew() {
    const docRef = await addDoc(collection(db, "forms"), {
      ownerUid: uid,
      title: "טופס חדש",
      targetGroups: [],
      notifyStaffEmails: [],
      schema: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    router.push(`/forms/${docRef.id}/edit`);
  }

  return (
    <main dir="rtl" className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">הטפסים שלי</h1>
        <button className="rounded bg-blue-600 text-white px-3 py-2" onClick={createNew}>
          + טופס חדש
        </button>
      </div>

      {loading ? (
        <div>טוען…</div>
      ) : forms.length === 0 ? (
        <div className="text-gray-600">אין טפסים עדיין.</div>
      ) : (
        <ul className="space-y-2">
          {forms.map((f) => (
            <li key={f.id} className="border rounded p-3 bg-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">{f.title || "(ללא כותרת)"}</div>
                <div className="text-xs text-gray-500">התקבלו: {f.submissionCount || 0}</div>
              </div>
              <div className="flex items-center gap-4">
                <a className="underline" href={`/forms/${f.id}/edit`}>עריכה</a>
                <button type="button" className="underline" onClick={() => copyLink(f.id)}>
                  העתק קישור להורה
                </button>
                <DeleteFormButton
                  formId={f.id}
                  formTitle={f.title}
                  onDeleted={() => setForms((prev) => prev.filter((x) => x.id !== f.id))}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

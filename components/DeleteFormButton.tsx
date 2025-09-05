"use client";

import { useState } from "react";
import { db, storage } from "@/lib/firebaseClient";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { ref as sref, deleteObject } from "firebase/storage";

type Props = {
  formId: string;
  formTitle?: string;
  onDeleted?: () => void; // כדי לעדכן את הרשימה UI אחרי מחיקה
};

async function deleteFormDeep(formId: string) {
  // מחיקת כל ההגשות
  const subsSnap = await getDocs(collection(db, "forms", formId, "submissions"));
  for (const d of subsSnap.docs) {
    const data = d.data() as any;
    const urls = [data?.signatureUrl, data?.pdfUrl].filter(Boolean) as string[];

    // מחיקת קבצים ב-Storage אם יש URL
    for (const url of urls) {
      try {
        // ref תומך גם ב-https/gs URLs
        const fileRef = sref(storage, url);
        await deleteObject(fileRef);
      } catch (e) {
        // לא מפילים מחיקה בגלל כשל במחיקת קובץ; מדפיסים אזהרה
        console.warn("Storage delete failed (ignored):", url, e);
      }
    }

    // מחיקת מסמך ההגשה
    await deleteDoc(doc(db, "forms", formId, "submissions", d.id));
  }

  // לבסוף – מחיקת מסמך הטופס
  await deleteDoc(doc(db, "forms", formId));
}

export default function DeleteFormButton({ formId, formTitle, onDeleted }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const name = formTitle?.trim() || formId;
    const ok = confirm(`למחוק את הטופס "${name}"? הפעולה אינה ניתנת לשחזור.`);
    if (!ok) return;

    try {
      setBusy(true);
      await deleteFormDeep(formId);
      onDeleted?.();
    } catch (e: any) {
      alert("מחיקה נכשלה: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="text-red-600 hover:text-red-700 disabled:opacity-50 underline"
      title="מחק טופס"
    >
      {busy ? "מוחק…" : "מחק"}
    </button>
  );
}

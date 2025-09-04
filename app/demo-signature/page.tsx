"use client";

import { useEffect, useState } from "react";
import SignaturePad from "@/components/SignaturePad"; // זה הקומפוננטה שכתבת
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { saveSignaturePng } from "@/lib/saveSignaturePng";

export default function DemoSignaturePage() {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        // אין משתמש מחובר — נעביר למסך התחברות
        window.location.href = "/login";
      }
    });
    return () => unsub();
  }, []);

  async function handleSave(dataUrl: string) {
    if (!user) return; // הגנה כפולה
    setMsg("");
    setSaving(true);
    try {
      const { url } = await saveSignaturePng(user.uid, dataUrl);
      setFileUrl(url);
      setMsg("✅ החתימה נשמרה בהצלחה ב-Storage");
    } catch (err: any) {
      setMsg("שגיאה בשמירה: " + (err?.message || err?.toString?.() || "unknown"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">דמו שמירת חתימה ל-Storage</h1>

      <p className="text-sm text-gray-600 mb-4">
        התחבר/י ואז חתמי/ה בקנבס. לחיצה על "שמור חתימה" תעלה את התמונה ל-Firebase Storage.
      </p>

      <SignaturePad onSave={handleSave} />

      <div className="mt-4">
        <button disabled className="border p-2 rounded bg-gray-50">
          {saving ? "שומר..." : "—"}
        </button>
      </div>

      {msg && <p className="mt-3 text-sm">{msg}</p>}

      {fileUrl && (
        <div className="mt-4 space-y-2">
          <a href={fileUrl} target="_blank" className="text-blue-600 underline">
            פתח/י את הקובץ ב-Storage
          </a>
          <div className="border rounded p-2">
            <img src={fileUrl} alt="חתימה שנשמרה" className="max-w-full" />
          </div>
        </div>
      )}
    </main>
  );
}

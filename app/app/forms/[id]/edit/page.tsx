"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseClient";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import RichTextEditor from "@/components/RichTextEditor"; // גרסת Quill שנתנו קודם
import OptionsEditor from "@/components/OptionsEditor";   // עורך אפשרויות שנתנו קודם

// ---- טיפוסים ----
type FieldType =
  | "text"        // שדה טקסט קצר
  | "textarea"    // טקסט ארוך
  | "parentName"  // שם ההורה
  | "number"      // מספר בלבד
  | "phone"       // טלפון
  | "email"       // דוא"ל
  | "consent"     // צ'קבוקס עם תיאור
  | "select"      // בחירה מרשימה
  | "radio"       // בחירה (אחת)
  | "checkbox"    // בחירה מרובה
  | "signature";  // חתימה

type Field = {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[];
  description?: string; // לשדה הסכמה
};

// ---- עזר ----
function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function EditFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [schema, setSchema] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // התחברות חובה
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) location.href = "/login";
    });
    return () => unsub();
  }, []);

  // טעינת טופס
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "forms", id));
        const data = snap.data() as any;
        if (!cancelled) {
          setTitle(data?.title || "");
          setDescriptionHtml(data?.descriptionHtml || "");
          setSchema((data?.schema || []) as Field[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // הוספת שדה חדש
  function addField(type: FieldType) {
    const base: Field = { id: uid(), type, label: "", required: false };
    switch (type) {
      case "text": base.label = "שדה טקסט"; break;
      case "textarea": base.label = "איזור טקסט"; break;
      case "parentName": base.label = "שם ההורה"; break;
      case "number": base.label = "מספר"; break;
      case "phone": base.label = "טלפון"; break;
      case "email": base.label = "דוא\"ל"; break;
      case "consent": base.label = "הסכמה"; base.description = "אני מאשר/ת ..."; break;
      case "select": base.label = "בחירה מרשימה"; base.options = []; break;
      case "radio": base.label = "בחירה"; base.options = []; break;
      case "checkbox": base.label = "בחירה מרובה"; base.options = []; break;
      case "signature": base.label = "חתימה"; break;
    }
    setSchema((prev) => [...prev, base]);
  }

  function updateField(index: number, patch: Partial<Field>) {
    setSchema((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    setSchema((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    try {
      setSaving(true);
      await updateDoc(doc(db, "forms", id), {
        title,
        descriptionHtml, // תיאור ה-WYSIWYG נשמר כאן
        schema,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  }

  function openPreview() {
    window.open(`/f/${id}`, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <main dir="rtl" className="p-6 max-w-6xl mx-auto">
        טוען…
      </main>
    );
  }

  return (
    <main dir="rtl" className="p-6 max-w-6xl mx-auto">
      {/* כותרת ושורת פעולות */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className="border p-2 rounded flex-1 text-xl"
          placeholder="כותרת הטופס (נשמר גם כשם הטופס)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button onClick={save} className="border p-2 rounded" disabled={saving}>
          {saving ? "שומר…" : "שמור"}
        </button>
        <button onClick={openPreview} className="border p-2 rounded">
          תצוגה להורה
        </button>
      </div>

      {/* תיאור הטופס - WYSIWYG */}
      <div className="mb-6">
        <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} />
      </div>

      {/* שני טורים: רכיבים (ימין) + קנבס (שמאל) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* קנבס (שמאל) */}
        <section className="lg:col-span-2 lg:order-1 space-y-3">
          <ul className="space-y-3">
            {schema.length === 0 && (
              <li className="text-gray-500">טרם הוספת שדות. הוסף רכיבים מהצד הימני.</li>
            )}
            {schema.map((f, idx) => (
              <li key={f.id} className="border rounded p-3 bg-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs border px-2 py-1 rounded">{f.type}</span>

                  <input
                    className="border p-1 flex-1 min-w-[200px]"
                    value={f.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    placeholder="כותרת שדה"
                  />

                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={!!f.required}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                    />
                    נדרש
                  </label>

                  <button
                    type="button"
                    className="text-red-600"
                    onClick={() => removeField(idx)}
                  >
                    מחק
                  </button>
                </div>

                {/* שדות עם אפשרויות */}
                {["select", "radio", "checkbox"].includes(f.type) && (
                  <div className="mt-2">
                    <OptionsEditor
                      title="אפשרויות לבחירה"
                      value={f.options ?? []}
                      onChange={(opts) => updateField(idx, { options: opts })}
                    />
                  </div>
                )}

                {/* שדה הסכמה: תיאור */}
                {f.type === "consent" && (
                  <textarea
                    className="border p-2 w-full mt-2 rounded"
                    placeholder="תוכן ההסכמה שיוצג ליד הצ'קבוקס"
                    value={f.description || ""}
                    onChange={(e) => updateField(idx, { description: e.target.value })}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* רכיבי הטופס (ימין) — ללא 'שם חניכ.ה' וללא 'קבוצה' */}
        <aside className="lg:col-span-1 lg:order-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="border p-2 rounded" onClick={() => addField("text")}>שדה טקסט</button>
            <button className="border p-2 rounded" onClick={() => addField("textarea")}>איזור טקסט</button>

            <button className="border p-2 rounded" onClick={() => addField("parentName")}>שם ההורה</button>
            <button className="border p-2 rounded" onClick={() => addField("number")}>שדה מספר</button>

            <button className="border p-2 rounded" onClick={() => addField("phone")}>טלפון</button>
            <button className="border p-2 rounded" onClick={() => addField("email")}>דוא"ל</button>

            <button className="border p-2 rounded" onClick={() => addField("consent")}>הסכמה</button>
            <button className="border p-2 rounded" onClick={() => addField("select")}>בחירה מרשימה</button>

            <button className="border p-2 rounded" onClick={() => addField("radio")}>בחירה (radio)</button>
            <button className="border p-2 rounded" onClick={() => addField("checkbox")}>בחירה מרובה</button>

            <button className="border p-2 rounded" onClick={() => addField("signature")}>חתימה</button>
          </div>
        </aside>
      </div>
    </main>
  );
}

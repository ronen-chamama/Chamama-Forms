"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, functions } from "@/lib/firebaseClient";
import {
  doc, getDoc, collection, getDocs, query as fsQuery, where, limit,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { GROUPS } from "@/components/constants";
import SignaturePad from "@/components/SignaturePad";

type FieldType =
  | "text" | "textarea" | "parentName"
  | "number" | "phone" | "email"
  | "consent" | "select" | "radio" | "checkbox"
  | "signature";

type Field = {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[];
  description?: string;
};

type FormDoc = {
  title?: string;
  descriptionHtml?: string;
  schema?: Field[];
  notifyEmails?: string[];
  publicId?: string;
};

export default function ParentFormPage() {
  const { id: incomingId } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormDoc | null>(null);
  const [schema, setSchema] = useState<Field[]>([]);
  const [resolvedFormId, setResolvedFormId] = useState<string>(incomingId); // נטען/נעדכן אחרי פולבאק
  const [msg, setMsg] = useState<string>("");

  // תשובות — כולל שני השדות הקבועים מראש
  const [answers, setAnswers] = useState<Record<string, any>>({
    studentName: "",
    group: "",
  });
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // טען טופס (מנסה קודם לפי מזהה מסמך; אם לא נמצא – מחפש לפי publicId)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // ניסיון ישיר כמסמך
        let snap = await getDoc(doc(db, "forms", incomingId));
        let formIdToUse = incomingId;

        if (!snap.exists()) {
          // חיפוש לפי publicId
          const qs = await getDocs(
            fsQuery(
              collection(db, "forms"),
              where("publicId", "==", incomingId),
              limit(1)
            )
          );
          if (!qs.empty) {
            snap = qs.docs[0];
            formIdToUse = snap.id;
          }
        }

        if (!snap.exists()) {
          setForm(null);
          setSchema([]);
          return;
        }

        const data = (snap.data() || {}) as FormDoc;
        setForm(data);
        setSchema((data.schema || []) as Field[]);
        setResolvedFormId(formIdToUse);
      } finally {
        setLoading(false);
      }
    })();
  }, [incomingId]);

  // מזהים לשדות מיוחדים (לטלפון/מייל) לטובת ולידציה
  const phoneFieldId = useMemo(
    () => schema.find((f) => f.type === "phone")?.id,
    [schema]
  );
  const emailFieldId = useMemo(
    () => schema.find((f) => f.type === "email")?.id,
    [schema]
  );

  // האם יש שדה חתימה חובה בסכימה
  const signatureRequired = useMemo(
    () => schema.some((f) => f.type === "signature" && f.required),
    [schema]
  );

  function setAns(key: string, val: any) {
    setAnswers((a) => ({ ...a, [key]: val }));
  }

  function toggleCheckboxArray(fieldId: string, val: string, checked: boolean) {
    setAnswers((a) => {
      const arr: string[] = Array.isArray(a[fieldId]) ? a[fieldId] : [];
      const next = checked ? Array.from(new Set([...arr, val])) : arr.filter((x) => x !== val);
      return { ...a, [fieldId]: next };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    // ולידציה בסיסית
    if (!answers.studentName?.trim()) return setMsg("נא למלא את שם החניכ.ה");
    if (!answers.group) return setMsg("נא לבחור קבוצה");

    if (emailFieldId && answers[emailFieldId]) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(answers[emailFieldId]));
      if (!ok) return setMsg("כתובת אימייל לא תקינה");
    }
    if (phoneFieldId && answers[phoneFieldId]) {
      const ok = /^[0-9+\-\s()]{7,}$/.test(String(answers[phoneFieldId]));
      if (!ok) return setMsg("מספר טלפון לא תקין");
    }

    // חובה: שדות הנדרשים בסכמה
    const missingRequired = schema.filter((f) => f.required).some((f) => {
      const v = answers[f.id];
      if (f.type === "checkbox") return !Array.isArray(v) || v.length === 0;
      if (f.type === "consent") return v !== true;
      if (f.type === "signature") return false; // נטפל בזה בנפרד
      return v == null || String(v).trim() === "";
    });
    if (missingRequired) return setMsg("יש למלא את כל השדות המסומנים כחובה");

    if (signatureRequired && !signatureDataUrl) {
      return setMsg("נדרשת חתימה");
    }

    try {
      setSending(true);
      const fn = httpsCallable(functions, "submitFormToDrive");
      await fn({
        formId: resolvedFormId,        // תומך בגרסת הפונקציה הקיימת
        publicId: incomingId,          // ואם עדכנת לפולבאק בצד השרת — אז גם זה קיים
        answers,
        signatureDataUrl: signatureDataUrl || null,
      });
      router.replace(`/f/${incomingId}/thanks`);
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || err?.code || "אירעה שגיאה בשליחה");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <main dir="rtl" className="p-6 max-w-3xl mx-auto">טוען…</main>;
  }
  if (!form) {
    return <main dir="rtl" className="p-6 max-w-3xl mx-auto">הטופס לא נמצא.</main>;
  }

  return (
    <main dir="rtl" className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">{form.title || "טופס"}</h1>

      {form.descriptionHtml && (
        <div
          className="prose prose-sm max-w-none mb-6"
          // אם תרצה סינון ל-HTML שמודבק מוורד, נוסיף בהמשך sanitizer
          dangerouslySetInnerHTML={{ __html: form.descriptionHtml }}
        />
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* 1) שם החניכ.ה (חובה) */}
        <div className="border rounded p-3 bg-white">
          <div className="text-sm mb-1">
            שם החניכ.ה <span className="text-red-600">*</span>
          </div>
          <input
            className="border p-2 w-full rounded"
            value={answers.studentName || ""}
            onChange={(e) => setAns("studentName", e.target.value)}
            required
          />
        </div>

        {/* 2) קבוצה בחממה (חובה) */}
        <div className="border rounded p-3 bg-white">
          <div className="text-sm mb-1">
            קבוצה בחממה <span className="text-red-600">*</span>
          </div>
          <select
            className="border p-2 w-full rounded"
            value={answers.group || ""}
            onChange={(e) => setAns("group", e.target.value)}
            required
          >
            <option value="">בחר/י קבוצה…</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* שאר השדות מה־schema */}
        {schema.map((f) => (
          <div key={f.id} className="border rounded p-3 bg-white">
            <div className="text-sm mb-1">
              {f.label} {f.required && <span className="text-red-600">*</span>}
            </div>

            {f.type === "text" && (
              <input
                className="border p-2 w-full rounded"
                value={answers[f.id] || ""}
                onChange={(e) => setAns(f.id, e.target.value)}
                required={f.required}
              />
            )}

            {f.type === "textarea" && (
              <textarea
                className="border p-2 w-full rounded"
                value={answers[f.id] || ""}
                onChange={(e) => setAns(f.id, e.target.value)}
                required={f.required}
                rows={4}
              />
            )}

            {f.type === "parentName" && (
              <input
                className="border p-2 w-full rounded"
                value={answers[f.id] || ""}
                onChange={(e) => setAns(f.id, e.target.value)}
                placeholder="שם ההורה"
                required={f.required}
              />
            )}

            {f.type === "number" && (
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={answers[f.id] ?? ""}
                onChange={(e) => setAns(f.id, e.target.value)}
                required={f.required}
              />
            )}

            {f.type === "phone" && (
              <input
                type="tel"
                inputMode="tel"
                className="border p-2 w-full rounded"
                value={answers[f.id] || ""}
                onChange={(e) => setAns(f.id, e.target.value)}
                placeholder="למשל: 050-1234567"
                required={f.required}
              />
            )}

            {f.type === "email" && (
              <input
                type="email"
                className="border p-2 w-full rounded"
                value={answers[f.id] || ""}
                onChange={(e) => setAns(f.id, e.target.value)}
                placeholder="name@example.com"
                required={f.required}
              />
            )}

            {f.type === "consent" && (
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={!!answers[f.id]}
                  onChange={(e) => setAns(f.id, e.target.checked)}
                  required={f.required}
                />
                <span className="text-sm leading-6">
                  {f.description || "אני מאשר/ת..."}
                </span>
              </label>
            )}

            {f.type === "select" && (
              <select
                className="border p-2 w-full rounded"
                value={answers[f.id] || ""}
                onChange={(e) => setAns(f.id, e.target.value)}
                required={f.required}
              >
                <option value="">בחר/י…</option>
                {(f.options || []).map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {f.type === "radio" && (
              <div className="flex flex-col gap-1">
                {(f.options || []).map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={f.id}
                      checked={answers[f.id] === opt}
                      onChange={() => setAns(f.id, opt)}
                      required={f.required && i === 0 && !answers[f.id]}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {f.type === "checkbox" && (
              <div className="flex flex-col gap-1">
                {(f.options || []).map((opt, i) => {
                  const checked = Array.isArray(answers[f.id]) && answers[f.id].includes(opt);
                  return (
                    <label key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleCheckboxArray(f.id, opt, e.target.checked)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {f.type === "signature" && (
              <SignaturePad onChange={(dataUrl) => setSignatureDataUrl(dataUrl)} />
            )}
          </div>
        ))}

        {msg && <div className="text-red-600">{msg}</div>}

        <button
          type="submit"
          className="border p-2 rounded"
          disabled={sending}
        >
          {sending ? "שולח…" : "שלח"}
        </button>
      </form>
    </main>
  );
}

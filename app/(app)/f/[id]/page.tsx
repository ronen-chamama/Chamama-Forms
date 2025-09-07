"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { db, functions } from "@/lib/firebaseClient";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query as fsQuery,
  where,
  limit,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { GROUPS } from "@/components/constants";
import SignaturePad from "@/components/SignaturePad";

type FieldType =
  | "text"
  | "textarea"
  | "parentName"
  | "number"
  | "phone"
  | "email"
  | "consent"
  | "select"
  | "radio"
  | "checkbox"
  | "checkboxes" // ← תמיכה גם בשם הזה
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
  const [resolvedFormId, setResolvedFormId] = useState<string>(incomingId);
  const [msg, setMsg] = useState<string>("");

  // תשובות — כולל שני השדות הקבועים מראש
  const [answers, setAnswers] = useState<Record<string, any>>({
    studentName: "",
    group: "",
  });
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // טען טופס (מזהה מסמך → publicId)
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let snap = await getDoc(doc(db, "forms", incomingId));
        let formIdToUse = incomingId;

        if (!snap.exists()) {
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
      const next = checked
        ? Array.from(new Set([...arr, val]))
        : arr.filter((x) => x !== val);
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
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(answers[emailFieldId])
      );
      if (!ok) return setMsg("כתובת אימייל לא תקינה");
    }
    if (phoneFieldId && answers[phoneFieldId]) {
      const ok = /^[0-9+\-\s()]{7,}$/.test(String(answers[phoneFieldId]));
      if (!ok) return setMsg("מספר טלפון לא תקין");
    }

    // חובה: שדות הנדרשים בסכמה (כולל בחירה מרובה)
    const missingRequired = schema
      .filter((f) => f.required)
      .some((f) => {
        const v = answers[f.id];
        if (f.type === "checkbox" || f.type === "checkboxes") {
          return !Array.isArray(v) || v.length === 0;
        }
        if (f.type === "consent") return v !== true;
        if (f.type === "signature") return false; // נבדק בנפרד
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
        formId: resolvedFormId,
        publicId: incomingId,
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

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-6 sm:px-8 py-8">
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="h-40 md:h-56 bg-neutral-200 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-6 w-2/3 bg-neutral-200 animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-neutral-200 animate-pulse rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl px-6 sm:px-8 py-8">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center text-neutral-700">
          הטופס לא נמצא.
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-6 sm:px-8 py-8">
      {/* Hero – תואם לעריכת הטופס: פלייסהולדר + לוגו */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="relative">
          <div className="h-40 md:h-56 bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200" />
          <div className="absolute top-2 left-2 opacity-80">
            <div className="relative w-[120px] h-[28px]">
              <Image
                src="/branding/logo-banner-color.png"
                alt=""
                fill
                sizes="120px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 border-t border-neutral-200">
          <h1 className="text-2xl font-semibold">{form.title || "טופס"}</h1>

          {form.descriptionHtml ? (
            <div
              className="prose prose-neutral rtl:text-right max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:font-semibold prose-h2:text-xl prose-h3:text-lg"
              style={{ direction: "rtl" }}
              dangerouslySetInnerHTML={{ __html: form.descriptionHtml }}
            />
          ) : null}
        </div>
      </div>

      {/* טופס מילוי */}
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {/* שדות מערכת קבועים */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldText
              label="שם החניכ.ה"
              required
              value={answers.studentName || ""}
              onChange={(v) => setAns("studentName", v)}
              placeholder="שם פרטי ומשפחה"
            />
            <FieldSelect
              label="קבוצה בחממה"
              required
              options={GROUPS}
              value={answers.group || ""}
              onChange={(v) => setAns("group", v)}
            />
          </div>
        </div>

        {/* שדות מהסכמה */}
        {schema.map((f) => (
          <div
            key={f.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <div className="text-sm text-neutral-700 mb-2">
              {f.label} {f.required && <span className="text-red-600">*</span>}
            </div>

            {f.type === "text" && (
              <FieldText
                label=""
                value={answers[f.id] || ""}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
              />
            )}

            {f.type === "textarea" && (
              <FieldTextarea
                label=""
                value={answers[f.id] || ""}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
              />
            )}

            {f.type === "parentName" && (
              <FieldText
                label=""
                value={answers[f.id] || ""}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
                placeholder="שם ההורה"
              />
            )}

            {f.type === "number" && (
              <FieldText
                label=""
                inputType="number"
                value={answers[f.id] ?? ""}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
              />
            )}

            {f.type === "phone" && (
              <FieldText
                label=""
                inputType="tel"
                value={answers[f.id] || ""}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
                placeholder="למשל: 050-1234567"
              />
            )}

            {f.type === "email" && (
              <FieldText
                label=""
                inputType="email"
                value={answers[f.id] || ""}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
                placeholder="name@example.com"
              />
            )}

            {f.type === "consent" && (
              <FieldConsent
                description={f.description || "אני מאשר/ת..."}
                value={!!answers[f.id]}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
              />
            )}

            {f.type === "select" && (
              <FieldSelect
                label=""
                options={f.options || []}
                value={answers[f.id] || ""}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
              />
            )}

            {f.type === "radio" && (
              <FieldRadio
                options={f.options || []}
                value={answers[f.id] || ""}
                onChange={(v) => setAns(f.id, v)}
                required={f.required}
                name={f.id}
              />
            )}

            {(f.type === "checkbox" || f.type === "checkboxes") && (
              <FieldCheckboxes
                options={f.options || []}
                value={Array.isArray(answers[f.id]) ? answers[f.id] : []}
                onChange={(arr) => setAns(f.id, arr)}
              />
            )}

            {f.type === "signature" && (
              <div className="space-y-2">
                <SignaturePad onChange={(dataUrl) => setSignatureDataUrl(dataUrl)} />
                {f.required && !signatureDataUrl ? (
                  <div className="text-xs text-neutral-500">
                    יש למלא חתימה כדי להמשיך
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {msg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
            {msg}
          </div>
        ) : null}

        <div className="pt-2">
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-50"
            disabled={sending}
          >
            {sending ? "שולח…" : "שליחה"}
          </button>
        </div>
      </form>
    </main>
  );
}

/* ---------- Field components (מעוצבים בקו העיצובי) ---------- */

function FieldText({
  label,
  placeholder,
  required,
  value,
  onChange,
  inputType = "text",
}: {
  label?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  inputType?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="grid gap-1.5">
      {label ? (
        <span className="text-sm text-neutral-700">
          {label} {required ? <span className="text-red-600">*</span> : null}
        </span>
      ) : null}
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-neutral-300 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
    </label>
  );
}

function FieldTextarea({
  label,
  placeholder,
  required,
  value,
  onChange,
}: {
  label?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      {label ? (
        <span className="text-sm text-neutral-700">
          {label} {required ? <span className="text-red-600">*</span> : null}
        </span>
      ) : null}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={4}
        className="rounded-xl border border-neutral-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
    </label>
  );
}

function FieldSelect({
  label,
  required,
  options = [],
  value,
  onChange,
}: {
  label?: string;
  required?: boolean;
  options?: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      {label ? (
        <span className="text-sm text-neutral-700">
          {label} {required ? <span className="text-red-600">*</span> : null}
        </span>
      ) : null}
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-11 rounded-xl border border-neutral-300 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        <option value="" disabled>
          בחרו…
        </option>
        {options.map((o, i) => (
          <option key={i} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldRadio({
  options = [],
  value,
  onChange,
  required,
  name,
}: {
  options?: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  name: string;
}) {
  return (
    <fieldset className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o, i) => (
          <label key={i} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={name}
              checked={value === o}
              onChange={() => onChange(o)}
              required={required && i === 0 && !value}
              className="accent-sky-600"
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FieldCheckboxes({
  options = [],
  value = [],
  onChange,
}: {
  options?: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string, checked: boolean) {
    const set = new Set(value);
    if (checked) set.add(opt);
    else set.delete(opt);
    onChange(Array.from(set));
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o, i) => {
        const checked = value.includes(o);
        return (
          <label key={i} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => toggle(o, e.target.checked)}
              className="accent-sky-600"
            />
            <span>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

function FieldConsent({
  description,
  required,
  value,
  onChange,
}: {
  description: string;
  required?: boolean;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        required={required && !value}
        className="accent-sky-600 mt-1"
      />
      <span>
        {description} {required ? <span className="text-red-600">*</span> : null}
      </span>
    </label>
  );
}

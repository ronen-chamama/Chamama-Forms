"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

/* ---------- Rich Text (נקי) ---------- */
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-28 rounded-xl border border-neutral-300 bg-neutral-50 animate-pulse" />
  ),
});

/* ---------- Types ---------- */
type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "phone"
  | "email"
  | "consent"
  | "select"
  | "radio"
  | "checkboxes"
  | "signature";

type FormField = {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

type FormDoc = {
  title: string;
  description?: string; // HTML
  fields: FormField[];
  ownerUid?: string;
  publicId?: string;
};

/* ---------- Helpers ---------- */
function typeLabel(t: FieldType) {
  switch (t) {
    case "text": return "טקסט";
    case "textarea": return "תיבת טקסט";
    case "number": return "מספר";
    case "phone": return "טלפון";
    case "email": return "דוא״ל";
    case "consent": return "אישור/הסכמה";
    case "select": return "בחירה מרשימה";
    case "radio": return "בחירה אחת";
    case "checkbox": return "בחירה מרובה";
    case "checkboxes": return "בחירה מרובה";
    case "signature": return "חתימה";
  }
}

/** הסרת undefined מכל עומק */
function compactDeep<T>(val: T): T {
  if (Array.isArray(val)) {
    return val
      .filter((x) => x !== undefined)
      .map((x: any) =>
        typeof x === "object" && x !== null ? compactDeep(x) : x
      ) as any;
  }
  if (val && typeof val === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(val as any)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        out[k] = v
          .filter((x) => x !== undefined)
          .map((x: any) =>
            typeof x === "object" && x !== null ? compactDeep(x) : x
          );
      } else if (v && typeof v === "object") {
        const nested = compactDeep(v as any);
        if (Object.keys(nested).length > 0) out[k] = nested;
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  return val;
}

/** המרה מ"סכימה ישנה" לשדה חדש */
function schemaItemToField(s: any): FormField {
  const id =
    (s && typeof s.id === "string" && s.id) ||
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2));
  const typeMap: Record<string, FieldType> = {
    text: "text",
    textarea: "textarea",
    number: "number",
    phone: "phone",
    email: "email",
    consent: "consent",
    select: "select",
    radio: "radio",
    checkboxes: "checkboxes",
    signature: "signature",
  };
  const t = typeMap[s?.type] || "text";
  const options = Array.isArray(s?.options)
    ? s.options.filter((o: any) => typeof o === "string" && o.trim() !== "")
    : undefined;
  const placeholder =
    typeof s?.placeholder === "string" && s.placeholder.trim() !== ""
      ? s.placeholder
      : undefined;
  const required = s?.required ? true : undefined;

  return {
    id,
    type: t,
    label: typeof s?.label === "string" ? s.label : "",
    required,
    options,
    placeholder,
  };
}

/** המרה לשכבת תאימות ישנה ("schema") */
function fieldToLegacySchemaItem(f: FormField) {
  return compactDeep({
    id: f.id,
    type: f.type,
    label: f.label || "",
    required: f.required ? true : undefined,
    options:
      (f.type === "select" || f.type === "radio" || f.type === "checkboxes") &&
      Array.isArray(f.options) &&
      f.options.length
        ? f.options
        : undefined,
    placeholder:
      (f.type === "text" || f.type === "textarea") && f.placeholder
        ? f.placeholder
        : undefined,
  });
}

/** ניקוי שדה לשמירה */
function sanitizeField(f: FormField): FormField {
  const isChoice =
    f.type === "select" || f.type === "radio" || f.type === "checkboxes";
  const options =
    isChoice && Array.isArray(f.options)
      ? f.options.filter((o) => typeof o === "string" && o.trim() !== "")
      : undefined;

  const cleaned: FormField = {
    id:
      f.id ||
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)),
    type: f.type,
    label: f.label || "",
    required: f.required ? true : undefined, // לא נשמור false
    placeholder:
      f.placeholder && f.placeholder.trim() !== "" ? f.placeholder : undefined,
    options: options && options.length ? options : undefined,
  };
  return compactDeep(cleaned);
}

/** ניקוי טופס לשמירה, וייצור תואמי legacy */
function buildPayloadForSave(form: FormDoc, user?: User | null) {
  const cleanedFields = Array.isArray(form.fields)
    ? form.fields.map(sanitizeField)
    : [];

  const legacySchema = cleanedFields.map(fieldToLegacySchemaItem);

  const desc = typeof form.description === "string" ? form.description : "";

  const payload: any = {
    title: form.title || "",
    description: desc,            // החדש
    descriptionHtml: desc,        // התאמה לישן
    fields: cleanedFields,        // החדש
    formFields: cleanedFields,    // תאימות
    items: cleanedFields,         // תאימות
    schema: legacySchema,         // הישן
    updatedAt: Date.now(),
  };
  if (form.ownerUid || user?.uid) payload.ownerUid = form.ownerUid || user?.uid;
  if (form.publicId) payload.publicId = form.publicId;

  return compactDeep(payload);
}

/* =================================================================== */

export default function EditFormPage() {
  const params = useParams<{ id: string }>();
  const formId = params?.id;

  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  /* ---------- טעינה: קורא מכל הפורמטים ומנרמל ---------- */
  useEffect(() => {
    if (!user || !formId) return;
    const db = getFirestore();

    (async () => {
      setLoading(true);
      // forms/{id} תחילה
      let snap = await getDoc(doc(db, "forms", formId));
      if (!snap.exists()) {
        // גיבוי: users/{uid}/forms/{id}
        snap = await getDoc(doc(db, "users", user.uid, "forms", formId));
      }

      if (snap.exists()) {
        const data = snap.data() as any;

        // fields ← formFields ← items ← schema
        let loadedFields: FormField[] = [];
        if (Array.isArray(data.fields) && data.fields.length) {
          loadedFields = data.fields as FormField[];
        } else if (Array.isArray(data.formFields) && data.formFields.length) {
          loadedFields = data.formFields as FormField[];
        } else if (Array.isArray(data.items) && data.items.length) {
          loadedFields = data.items as FormField[];
        } else if (Array.isArray(data.schema) && data.schema.length) {
          loadedFields = (data.schema as any[]).map(schemaItemToField);
        }

        const loadedDesc =
          typeof data.description === "string"
            ? data.description
            : typeof data.descriptionHtml === "string"
            ? data.descriptionHtml
            : "";

        setForm({
          title: typeof data.title === "string" ? data.title : "ללא כותרת",
          description: loadedDesc,
          fields: loadedFields,
          ownerUid:
            typeof data.ownerUid === "string" ? data.ownerUid : user.uid,
          publicId:
            typeof data.publicId === "string" ? data.publicId : undefined,
        });
      } else {
        setForm({
          title: "ללא כותרת",
          description: "",
          fields: [],
          ownerUid: user.uid,
        });
      }

      setLoading(false);
    })();
  }, [user, formId]);

  const db = useMemo(() => getFirestore(), []);
  const formsRef = useMemo(
    () => (formId ? doc(db, "forms", formId) : null),
    [db, formId]
  );
  const userFormsRef = useMemo(
    () => (user && formId ? doc(db, "users", user.uid, "forms", formId) : null),
    [db, user, formId]
  );

  /* ---------- שמירה: כותב לכל הפורמטים + formsPublic ---------- */
  async function saveForm() {
    if (!form || !formId) return;
    setSaving(true);
    try {
      // הגדרת publicId עקבי
      const pubId =
        (form.publicId && form.publicId.trim()) || formId;

      const payloadBase = { ...form, publicId: pubId };
      const payload = buildPayloadForSave(payloadBase, user);

      // ל־forms/{id}
      if (formsRef) await setDoc(formsRef, payload, { merge: true });
      // ל־users/{uid}/forms/{id}
      if (userFormsRef) await setDoc(userFormsRef, payload, { merge: true });
      // גם לאוסף הציבורי — למקרה שדף ההורים קורא משם
      const publicRef = doc(getFirestore(), "formsPublic", pubId);
      await setDoc(publicRef, payload, { merge: true });

      setForm((prev) =>
        prev ? { ...prev, ...payload, publicId: pubId } : prev
      );
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Drag & Drop ---------- */
  function addFieldAt(type: FieldType, index: number) {
    if (!form) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const baseLabel: Record<FieldType, string> = {
      text: "טקסט",
      textarea: "תיבת טקסט",
      number: "מספר",
      phone: "טלפון",
      email: "דוא״ל",
      consent: "אישור והסכמה",
      select: "בחירה מרשימה",
      radio: "בחירה אחת",
      checkboxes: "בחירה מרובה",
      signature: "חתימה",
    };
    const f: FormField = { id, type, label: baseLabel[type], required: false };
    const arr = [...form.fields];
    const i = Math.max(0, Math.min(index, arr.length));
    arr.splice(i, 0, f);
    setForm({ ...form, fields: arr });
  }

  const [dragKind, setDragKind] = useState<
    null | { from: "palette"; ftype: FieldType } | { from: "field"; id: string }
  >(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const isDragging = Boolean(dragKind);

  function handleDropAt(index: number, e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!form || !dragKind) return;

    if (dragKind.from === "palette") {
      addFieldAt(dragKind.ftype, index);
    } else {
      const arr = [...form.fields];
      const fromIdx = arr.findIndex((x) => x.id === dragKind.id);
      if (fromIdx < 0) return;
      const [it] = arr.splice(fromIdx, 1);
      const toIdx = index <= fromIdx ? index : index - 1;
      arr.splice(Math.max(0, Math.min(toIdx, arr.length)), 0, it);
      setForm({ ...form, fields: arr });
    }

    setDragKind(null);
    setOverIndex(null);
  }

  if (loading || !form) {
    return (
      <main className="mx-auto max-w-7xl px-6 sm:px-8 py-8">
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="h-32 md:h-40 bg-neutral-200 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-1/2 bg-neutral-200 animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-neutral-200 animate-pulse rounded" />
          </div>
        </div>
      </main>
    );
  }

  const pubId = (form.publicId && form.publicId.trim()) || formId;
  const liveUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${pubId}`
      : "";

  return (
  <main className="mx-auto max-w-7xl px-6 sm:px-8 py-8" dir="rtl">
    {/* כפתור חזרה לטפסים שלי */}
    <div className="mb-4 flex justify-end">
      <Link
        href="/"
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-neutral-300 bg-white text-sm hover:bg-neutral-50"
      >
        <span aria-hidden>↩︎</span>
        <span>חזרה לטפסים שלי</span>
      </Link>
    </div>
      {/* ===== Hero קטן + טייטל/תיאור ===== */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="relative">
          <div className="h-32 md:h-40 bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200" />
          <div className="absolute top-2 left-2 opacity-80">
            <div className="relative w-[120px] h-[28px]">
              <Image
                src="/branding/logo-banner-color.png"
                alt=""
                fill
                sizes="120px"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 border-t border-neutral-200">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-12 w-full rounded-xl border border-neutral-300 px-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="כותרת הטופס"
          />

          <div className="mt-3 rounded-xl border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-sky-400">
            <RichTextEditor
              value={form.description || ""}
              onChange={(html: string) => setForm({ ...form, description: html })}
              placeholder="תיאור קצר (אפשר להדביק טקסט עשיר/קישורים)"
              className="min-h-[140px]"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            {liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-10 px-3 rounded-xl border border-neutral-200 bg-white text-sm hover:bg-neutral-50"
                title="פתיחת תצוגת הטופס בחלון חדש"
              >
                <span aria-hidden>👁️</span>
                <span>תצוגה</span>
              </a>
            ) : (
              <span />
            )}

            <button
              onClick={saveForm}
              disabled={saving}
              className="h-10 px-5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
            >
              {saving ? "שומר..." : "שמירה"}
            </button>
          </div>
        </div>
      </div>

      {/* ===== שני טורים: ימין רכיבים | שמאל שדות ===== */}
      <div className="mt-8 grid grid-cols-1 gap-8 md:[grid-template-columns:320px_minmax(0,1fr)]">
        {/* ימני: רכיבי הטופס */}
        <aside className="md:pt-2">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-base font-semibold mb-3">רכיבי טופס</h2>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    "text",
                    "textarea",
                    "number",
                    "phone",
                    "email",
                    "consent",
                    "select",
                    "radio",
                    "checkboxes",
                    "signature",
                  ] as FieldType[]
                ).map((t) => (
                  <PaletteItem
                    key={t}
                    label={typeLabel(t)!}
                    onClick={() => addFieldAt(t, form.fields.length)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", `palette:${t}`);
                      e.dataTransfer.effectAllowed = "copyMove";
                      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
                      setDragKind({ from: "palette", ftype: t });
                    }}
                    onDragEnd={() => {
                      setDragKind(null);
                      setOverIndex(null);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* שמאלי: שדות הטופס */}
        <section>
          <div
            className="grid gap-3"
            onDragOver={(e) => {
              if (dragKind) {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
              }
            }}
          >
            {form.fields.length === 0 ? (
              <EmptyDropZone
                isDragging={isDragging}
                active={overIndex === 0}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setOverIndex(0);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(0);
                }}
                onDrop={(e) => handleDropAt(0, e)}
              />
            ) : (
              <>
                {/* Drop בתחילת הרשימה */}
                <DropSlot
                  visible={!!dragKind}
                  active={overIndex === 0}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setOverIndex(0);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => handleDropAt(0, e)}
                />

                {form.fields.map((f, idx) => (
                  <div key={f.id}>
                    <FieldCard
                      field={f}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", `field:${f.id}`);
                        e.dataTransfer.effectAllowed = "move";
                        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
                        setDragKind({ from: "field", id: f.id });
                      }}
                      onDragEnd={() => {
                        setDragKind(null);
                        setOverIndex(null);
                      }}
                      onChange={(patch) => {
                        setForm({
                          ...form,
                          fields: form.fields.map((x) =>
                            x.id === f.id ? { ...x, ...patch } : x
                          ),
                        });
                      }}
                      onRemove={() => {
                        setForm({
                          ...form,
                          fields: form.fields.filter((x) => x.id !== f.id),
                        });
                      }}
                    />

                    {/* Drop בין idx ל־idx+1 */}
                    <DropSlot
                      visible={!!dragKind}
                      active={overIndex === idx + 1}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setOverIndex(idx + 1);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => handleDropAt(idx + 1, e)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------- UI subcomponents ---------- */

function PaletteItem({
  label,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  label: string;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="h-10 rounded-lg border border-neutral-300 bg-white text-sm hover:bg-neutral-50 cursor-grab active:cursor-grabbing"
      title={label}
    >
      {label}
    </button>
  );
}

function EmptyDropZone({
  isDragging,
  active,
  onDragEnter,
  onDragOver,
  onDrop,
}: {
  isDragging: boolean;
  active: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop(e);
      }}
      className={[
        "rounded-2xl border p-8 text-center transition-all",
        active
          ? "border-sky-500 bg-sky-50"
          : "border-dashed border-neutral-300 bg-white",
      ].join(" ")}
    >
      <div className="text-neutral-600">
        {isDragging
          ? "שחררו כאן להוספת רכיב ראשון"
          : "גררו רכיבים מהצד הימני או לחצו כדי להוסיף."}
      </div>
    </div>
  );
}

function DropSlot({
  visible,
  active,
  onDragEnter,
  onDragOver,
  onDrop,
}: {
  visible: boolean;
  active: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.stopPropagation();
        onDrop(e);
      }}
      className={[
        "w-full transition-all rounded-md",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
        "h-5 md:h-6",
        active
          ? "bg-sky-400/30 border border-dashed border-sky-500"
          : "bg-neutral-300/30 border border-dashed border-neutral-300",
      ].join(" ")}
    />
  );
}

function FieldCard({
  field,
  draggable,
  onDragStart,
  onDragEnd,
  onChange,
  onRemove,
}: {
  field: FormField;
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
}) {
  const isChoice =
    field.type === "select" || field.type === "radio" || field.type === "checkboxes";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* אזור גרירה: הכותרת */}
      <div
        className="flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing select-none"
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button,input,textarea,label,select")) {
            e.stopPropagation();
          }
        }}
      >
        <div className="text-sm text-neutral-600">
          סוג שדה: <span className="font-medium text-neutral-800">{typeLabel(field.type)}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="h-8 px-3 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
          title="מחיקת שדה"
        >
          מחיקה
        </button>
      </div>

      {/* גוף הכרטיס — אין ממנו גרירה */}
      <div
        className="mt-3 grid gap-3"
        onMouseDown={(e) => e.stopPropagation()}
        onDragStart={(e) => e.stopPropagation()}
      >
        <div className="grid items-center gap-2 md:grid-cols-[140px_minmax(0,1fr)_auto]">
          <label className="text-sm text-neutral-600">תווית</label>
          <input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="h-10 rounded-lg border border-neutral-300 px-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="שם השדה"
          />
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700 justify-self-end">
            <input
              type="checkbox"
              checked={!!field.required}
              onChange={(e) => onChange({ required: e.target.checked })}
              className="accent-sky-600 size-4"
            />
            שדה חובה
          </label>
        </div>

        {(field.type === "text" || field.type === "textarea") && (
          <div className="grid items-center gap-2 md:grid-cols-[140px_minmax(0,1fr)]">
            <label className="text-sm text-neutral-600">Placeholder</label>
            <input
              value={field.placeholder || ""}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              className="h-10 rounded-lg border border-neutral-300 px-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="לדוגמה: כתבו תשובה קצרה..."
            />
          </div>
        )}

        {isChoice && (
          <ChoiceEditor
            options={field.options || []}
            onChange={(opts) => onChange({ options: opts })}
          />
        )}
      </div>
    </div>
  );
}

function ChoiceEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  const list = Array.isArray(options) ? options : [];
  function set(i: number, val: string) {
    const arr = [...list];
    arr[i] = val;
    onChange(arr);
  }
  function add() {
    onChange([...list, `אפשרות ${list.length + 1}`]);
  }
  function remove(i: number) {
    const arr = [...list];
    arr.splice(i, 1);
    onChange(arr);
  }
  return (
    <div className="grid gap-2">
      <div className="text-sm text-neutral-600">אפשרויות</div>
      {list.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={opt}
            onChange={(e) => set(i, e.target.value)}
            className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            onClick={() => remove(i)}
            className="h-10 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
            title="הסר אפשרות"
          >
            הסר
          </button>
        </div>
      ))}
      <div>
        <button
          onClick={add}
          className="h-10 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
        >
          הוסף אפשרות
        </button>
      </div>
    </div>
  );
}

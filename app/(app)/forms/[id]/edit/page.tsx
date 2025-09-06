"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

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
  description?: string;
  fields: FormField[];
  ownerUid?: string;
  publicId?: string;
};

/* ---------- Helpers (global) ---------- */
function typeLabel(t: FieldType) {
  switch (t) {
    case "text": return "טקסט";
    case "textarea": return "תיאור ארוך";
    case "number": return "מספר";
    case "phone": return "טלפון";
    case "email": return "דוא״ל";
    case "consent": return "אישור/הסכמה";
    case "select": return "בחירה מרשימה";
    case "radio": return "בחירה אחת";
    case "checkboxes": return "רשימת סימון";
    case "signature": return "חתימה";
  }
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

  useEffect(() => {
    if (!user || !formId) return;
    const db = getFirestore();

    (async () => {
      setLoading(true);
      // /forms/{id}
      let snap = await getDoc(doc(db, "forms", formId));
      if (!snap.exists()) {
        // /users/{uid}/forms/{id}
        snap = await getDoc(doc(db, "users", user.uid, "forms", formId));
      }
      if (snap.exists()) {
        const data = snap.data() as any;
        setForm({
          title: data.title ?? "ללא כותרת",
          description: data.description ?? "",
          fields: Array.isArray(data.fields) ? (data.fields as FormField[]) : [],
          ownerUid: data.ownerUid ?? user.uid,
          publicId: data.publicId,
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
  const formDocRefPrimary = useMemo(
    () => (formId ? doc(db, "forms", formId) : null),
    [db, formId]
  );
  const formDocRefFallback = useMemo(
    () => (user && formId ? doc(db, "users", user.uid, "forms", formId) : null),
    [db, user, formId]
  );

  async function saveForm() {
    if (!form || !formId) return;
    setSaving(true);
    try {
      if (formDocRefPrimary) {
        const payload = { ...form, updatedAt: Date.now() };
        try {
          await updateDoc(formDocRefPrimary, payload as any);
        } catch {
          await setDoc(formDocRefPrimary, payload as any, { merge: true });
        }
      }
    } catch {
      if (formDocRefFallback) {
        const payload = { ...form, updatedAt: Date.now() };
        try {
          await updateDoc(formDocRefFallback, payload as any);
        } catch {
          await setDoc(formDocRefFallback, payload as any, { merge: true });
        }
      }
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Add field at specific index ---------- */
  function addFieldAt(type: FieldType, index: number) {
    if (!form) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const baseLabel: Record<FieldType, string> = {
      text: "טקסט",
      textarea: "תיאור ארוך",
      number: "מספר",
      phone: "טלפון",
      email: "דוא״ל",
      consent: "אישור והסכמה",
      select: "בחירה מרשימה",
      radio: "בחירה אחת",
      checkboxes: "רשימת סימון",
      signature: "חתימה",
    };
    const f: FormField = {
      id,
      type,
      label: baseLabel[type],
      required: false,
      options: ["select", "radio", "checkboxes"].includes(type)
        ? ["אפשרות 1", "אפשרות 2"]
        : undefined,
    };
    const arr = [...form.fields];
    const i = Math.max(0, Math.min(index, arr.length));
    arr.splice(i, 0, f);
    setForm({ ...form, fields: arr });
  }

  /* ---------- Drag & Drop state ---------- */
  const [dragKind, setDragKind] = useState<
    null | { from: "palette"; ftype: FieldType } | { from: "field"; id: string }
  >(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

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

  return (
    <main className="mx-auto max-w-7xl px-6 sm:px-8 py-8">
      {/* ===== Hero קטן + טייטל/תיאור (מלא רוחב) ===== */}
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

          {/* Rich Text — עטיפה נקייה בלי “כיעור” */}
          <div className="mt-3 rounded-xl border border-neutral-300 bg-white focus-within:ring-2 focus-within:ring-sky-400">
            <RichTextEditor
              value={form.description || ""}
              onChange={(html: string) => setForm({ ...form, description: html })}
              placeholder="תיאור קצר (אפשר להדביק טקסט עשיר/קישורים)"
              // במידה והקומפוננטה תומכת:
              className="min-h-[120px]"
            />
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={saveForm}
              disabled={saving}
              className="h-11 px-5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
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
              // ⬇️ כשהרשימה ריקה — ה־Placeholder עצמו מקבל Drop (אינדקס 0)
              <EmptyDropZone
                dragging={!!dragKind}
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
  dragging,
  active,
  onDragEnter,
  onDragOver,
  onDrop,
}: {
  dragging: boolean;
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
        {dragging ? "שחררו כאן להוספת רכיב ראשון" : "גררו רכיבים מהצד הימני או לחצו כדי להוסיף."}
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
      {/* כותרת הכרטיס — מכאן מתחילים לגרור (בלי ידית ייעודית) */}
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

      {/* גוף הכרטיס — אין ממנו גרירה כדי לא להפריע להקלדה/קליקים */}
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
  function set(i: number, val: string) {
    const arr = [...options];
    arr[i] = val;
    onChange(arr);
  }
  function add() {
    onChange([...options, `אפשרות ${options.length + 1}`]);
  }
  function remove(i: number) {
    const arr = [...options];
    arr.splice(i, 1);
    onChange(arr);
  }
  return (
    <div className="grid gap-2">
      <div className="text-sm text-neutral-600">אפשרויות</div>
      {options.map((opt, i) => (
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

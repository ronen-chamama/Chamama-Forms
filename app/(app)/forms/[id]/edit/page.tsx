"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { auth, db, functions } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { COPY } from "@/lib/copy";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import RichTextEditor from "@/components/RichTextEditor";

/* ======================= Types ======================= */

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
  description?: string;             
};

type FormDoc = {
  title: string;
  description?: string;                           
  schema: FormField[];                        
  publicId?: string;
  ownerUid?: string;
  createdAt?: any;
  updatedAt?: number;
  submissionCount?: number;
  heroUrl?: string;
};

/* ======================= Utils ======================= */

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function typeLabel(t: FieldType) {
  switch (t) {
    case "text":
      return "טקסט";
    case "textarea":
      return "תיאור ארוך";
    case "number":
      return "מספר";
    case "phone":
      return "טלפון";
    case "email":
      return "דוא״ל";
    case "consent":
      return "אישור והסכמה";
    case "select":
      return "בחירה מרשימה";
    case "radio":
      return "בחירה אחת";
    case "checkboxes":
      return "בחירה מרובה";
    case "signature":
      return "חתימה";
  }
}

function normalizeToSchema(data: any): FormField[] {
                                                      
  if (Array.isArray(data?.schema) && data.schema.length) return data.schema as FormField[];
  if (Array.isArray(data?.fields) && data.fields.length) return data.fields as FormField[];
  if (Array.isArray(data?.formFields) && data.formFields.length) return data.formFields as FormField[];
  if (Array.isArray(data?.items) && data.items.length) return data.items as FormField[];
  return [];
}

function cloneDeep<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

                                              
function buildPayloadForSave(base: FormDoc, user: User | null): any {
  const ownerUid = user?.uid || base.ownerUid || "";
  const now = Date.now();
  const schema: FormField[] = Array.isArray(base.schema) ? base.schema : [];

                                                   
  const fields = schema;
  const formFields = schema;
  const items = schema;

  return {
    title: base.title || "ללא כותרת",
    description: base.description || "",
    schema,
    fields,
    formFields,
    items,
    ownerUid,
    submissionCount: base.submissionCount || 0,
    publicId: (base.publicId && base.publicId.trim()) || undefined,
    heroUrl: base.heroUrl || "",
    createdAt: base.createdAt || new Date(),
    updatedAt: now,
  };
}

/* ======================= Component ======================= */

export default function EditFormPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);

              
  const [form, setForm] = useState<FormDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

                   
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const savedSnapshotRef = useRef<string>("");                               
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

                                           
  const [generatingHero, setGeneratingHero] = useState(false);
  const lastGeneratedTitleRef = useRef<string>("");

                
  const [dragKind, setDragKind] = useState<null | { kind: "palette"; ftype: FieldType } | { kind: "reorder"; index: number }>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

                
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

                                                                                              
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const dbi = getFirestore();
        let snap = await getDoc(doc(dbi, "forms", id));
        let usedId = id;

        if (!snap.exists() && user?.uid) {
          const alt = await getDoc(doc(dbi, "users", user.uid, "forms", id));
          if (alt.exists()) {
            snap = alt;
            usedId = alt.id;
          }
        }

        if (!snap.exists()) {
          const q = query(collection(dbi, "forms"), where("publicId", "==", id));
          const qs = await getDocs(q);
          if (!qs.empty) {
            snap = qs.docs[0];
            usedId = qs.docs[0].id;
          }
        }

        if (!snap.exists()) {
          setForm({
            title: "ללא כותרת",
            description: "",
            schema: [],
            publicId: id,
            ownerUid: user?.uid,
            heroUrl: "",
          });
          savedSnapshotRef.current = "";                       
          lastGeneratedTitleRef.current = "";
        } else {
          const data = snap.data() as any;
          const formDoc: FormDoc = {
            title: data.title || "ללא כותרת",
            description: data.description || data.descriptionHtml || "",
            schema: normalizeToSchema(data),
            publicId: data.publicId || usedId,
            ownerUid: data.ownerUid || user?.uid,
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || Date.now(),
            submissionCount: data.submissionCount || 0,
            heroUrl: data.heroUrl || "",
          };
          setForm(formDoc);
          savedSnapshotRef.current = JSON.stringify(formDoc);
          if (formDoc.heroUrl && formDoc.title) {
            lastGeneratedTitleRef.current = formDoc.title.trim();
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.uid]);

  /* ======================= Save Logic ======================= */

  async function saveForm(opts?: { autosave?: boolean }) {
    if (!form) return;
    const isAuto = !!opts?.autosave;

    const dbi = getFirestore();
    const base = cloneDeep(form);
    const pubId = (base.publicId && base.publicId.trim()) || id;
    const currentTitle = (base.title || "").trim();
    const hadHero = !!base.heroUrl;

    const payload = buildPayloadForSave({ ...base, publicId: pubId }, user);

    if (isAuto) setAutoSaving(true);
    else setSaving(true);

    try {
                           
      await setDoc(doc(dbi, "forms", id), payload, { merge: true });

                                       
      const uid = user?.uid;
      if (uid) {
        await setDoc(doc(dbi, "users", uid, "forms", id), payload, { merge: true });
      }

                                                     
      await setDoc(doc(dbi, "formsPublic", pubId), payload, { merge: true });

      setLastSavedAt(Date.now());
      savedSnapshotRef.current = JSON.stringify({ ...form, publicId: pubId });
      setForm((prev) => (prev ? { ...prev, publicId: pubId } : prev));

                                                 
      if (!isAuto && currentTitle) {
        const titleChangedSinceGeneration =
          currentTitle !== lastGeneratedTitleRef.current;

        if (!hadHero || titleChangedSinceGeneration) {
          setGeneratingHero(true);
          try {
            const gen = httpsCallable(functions, "generateFormHero");
            const res = await gen({ formId: id, title: currentTitle });
            const heroUrl = (res.data as any)?.heroUrl;
            if (heroUrl) {
              setForm((f) => (f ? { ...f, heroUrl } : f));
              lastGeneratedTitleRef.current = currentTitle;
            }
          } catch (e) {
            console.warn("hero generation failed", e);
          } finally {
            setGeneratingHero(false);
          }
        }
      }
    } finally {
      if (isAuto) setAutoSaving(false);
      else setSaving(false);
    }
  }

                                         
  useEffect(() => {
    if (!form) return;

    const currentSnapshot = JSON.stringify(form);
    if (!savedSnapshotRef.current) {
      savedSnapshotRef.current = currentSnapshot;
      return;
    }
    if (savedSnapshotRef.current === currentSnapshot) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (savedSnapshotRef.current !== JSON.stringify(form)) {
                                         
        saveForm({ autosave: true });
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  /* ======================= Field operations ======================= */

  function addField(ftype: FieldType, atIndex: number | null = null) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = cloneDeep(prev);
      const f: FormField = {
        id: newId(),
        type: ftype,
        label: typeLabel(ftype),
        required: ftype === "consent" ? true : false,                            
        options:
          ftype === "radio" || ftype === "select" || ftype === "checkboxes"
            ? ["אפשרות 1", "אפשרות 2"]
            : undefined,
        description: ftype === "consent" ? "אני מאשר/ת..." : undefined,
      };
      if (atIndex == null || atIndex < 0 || atIndex > next.schema.length) {
        next.schema.push(f);
      } else {
        next.schema.splice(atIndex, 0, f);
      }
      return next;
    });
  }

  function updateField(fieldId: string, patch: Partial<FormField>) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = cloneDeep(prev);
      const idx = next.schema.findIndex((x) => x.id === fieldId);
      if (idx >= 0) {
        next.schema[idx] = { ...next.schema[idx], ...patch };
      }
      return next;
    });
  }

  function removeField(fieldId: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = cloneDeep(prev);
      next.schema = next.schema.filter((x) => x.id !== fieldId);
      return next;
    });
  }

  function moveField(from: number, to: number) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = cloneDeep(prev);
      const item = next.schema.splice(from, 1)[0];
      next.schema.splice(to, 0, item);
      return next;
    });
  }

  /* ======================= DnD handlers ======================= */

                      
  function onPaletteDragStart(ftype: FieldType) {
    setDragKind({ kind: "palette", ftype });
  }

                                                                         
  function onFieldDragStart(index: number) {
    setDragKind({ kind: "reorder", index });
  }

  function clearDrag() {
    setDragKind(null);
    setOverIndex(null);
  }

  /* ======================= Render ======================= */

  if (loading || !form) {
    return (
      <main className="mx-auto max-w-7xl px-6 sm:px-8 py-8" dir="rtl">
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="h-40 bg-neutral-200 animate-pulse" />
          <div className="p-6">
            טוען…
          </div>
        </div>
      </main>
    );
  }

  const liveUrl = form.publicId ? `/f/${form.publicId}` : `/f/${id}`;

  return (
    <main className="mx-auto max-w-7xl px-6 sm:px-8 py-8" dir="rtl">
      {                }
      <div className="mb-4 flex justify-end">
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-neutral-300 bg-white text-sm hover:bg-neutral-50"
        >
          <span aria-hidden>↩︎</span>
          <span>חזרה לטפסים שלי</span>
        </Link>
      </div>

      {              }
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
          {                                    }
          <div className="grid gap-4">
            {                 }
            <label className="grid gap-1.5">
              <span className="text-sm text-neutral-700">{COPY.editPage.titleLabel}</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
                className="h-11 rounded-xl border border-neutral-300 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder={COPY.editPage.titlePlaceholder}
              />
            </label>

            {                 }
            <div className="grid gap-1.5">
              <span className="text-sm text-neutral-700">{COPY.editPage.descLabel}</span>
              <RichTextEditor
                value={form.description || ""}
                onChange={(html) => setForm((f) => (f ? { ...f, description: html } : f))}
                placeholder={COPY.editPage.descPlaceholder}
              />
            </div>
          </div>

          {                  }
          <div className="mt-3 flex items-center justify-between gap-3">
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

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 min-w-[8ch] text-center">
                {saving || autoSaving
                  ? "שומר…"
                  : lastSavedAt
                  ? "נשמר אוטומטית"
                  : ""}
              </span>
              <button
                onClick={() => saveForm({ autosave: false })}
                disabled={saving || generatingHero}
                className="h-10 px-5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
              >
                {generatingHero ? "יוצר תמונה…" : saving ? "שומר..." : "שמירה"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {                      }
      <div className="mt-8 grid grid-cols-1 gap-8 md:[grid-template-columns:300px_minmax(0,1fr)]">
        {                               }
        <aside className="md:sticky md:top-16 lg:top-25 md:self-start">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4
                  md:max-h-[calc(100dvh-4rem)] lg:max-h-[calc(100dvh-5rem)] overflow-auto">
            <h3 className="text-sm font-semibold mb-3">{COPY.editPage.paletteTitle}</h3>
            <div className="grid gap-2">
              {(["text","textarea","number","phone","email","select","radio","checkboxes","consent","signature"] as FieldType[]).map((t) => (
                <div
                  key={t}
                  draggable
                  onDragStart={() => onPaletteDragStart(t)}
                  onDragEnd={clearDrag}
                  onClick={() => addField(t, form.schema.length)}
                  className="cursor-grab active:cursor-grabbing rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                  title={COPY.editPage.emptyDropHintIdle}
                >
                  {typeLabel(t)}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {                                         }
        <section>
          <div
            className="rounded-2xl border border-neutral-200 bg-white p-4"
            onDragOver={(e) => {
              e.preventDefault();
                                                                 
              if (form.schema.length === 0) setOverIndex(0);
            }}
            onDragLeave={(e) => {
                                          
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                setOverIndex(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();

                                                                            
              const insideEmptyDZ = (e.target as HTMLElement)?.closest('[data-dropzone-empty="true"]');
              if (insideEmptyDZ) {
                clearDrag();
                return;
              }

              if (!dragKind) return;

              if (dragKind.kind === "palette") {
                const idx = overIndex == null ? form.schema.length : overIndex;
                addField(dragKind.ftype, idx);
              } else if (dragKind.kind === "reorder") {
                const from = dragKind.index;
                let to = overIndex == null ? form.schema.length : overIndex;
                if (to > from) to = to - 1;
                if (to < 0) to = 0;
                if (to > form.schema.length - 1) to = form.schema.length - 1;
                if (from !== to) moveField(from, to);
              }
              clearDrag();
            }}
          >
            <h3 className="text-sm font-semibold mb-3">שדות הטופס</h3>

            {                              }
            {form.schema.length === 0 ? (
              <EmptyDropZone
                active={overIndex === 0}
                isDragging={!!dragKind}
                onDragEnter={() => setOverIndex(0)}
                onDragOver={() => setOverIndex(0)}
                onDrop={() => {
                  if (dragKind?.kind === "palette") addField(dragKind.ftype, 0);
                  clearDrag();
                }}
              />
            ) : (
              <div className="grid gap-4">
                {form.schema.map((field, index) => (
                  <div key={field.id}>
                    {                                      }
                    {overIndex === index && (
                      <InsertMarker />
                    )}

                    <FieldCard
                      field={field}
                      index={index}
                      onChange={(patch) => updateField(field.id, patch)}
                      onRemove={() => removeField(field.id)}
                      onDragStart={() => onFieldDragStart(index)}
                      onDragEnd={clearDrag}
                      onDragOverTop={() => setOverIndex(index)}
                      onDragOverBottom={() => setOverIndex(index + 1)}
                    />

                    {                                       }
                    {index === form.schema.length - 1 && overIndex === form.schema.length && (
                      <InsertMarker />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ======================= UI subcomponents ======================= */

function EmptyDropZone({
  isDragging,
  active,
  onDragEnter,
  onDragOver,
  onDrop,
}: {
  isDragging: boolean;
  active: boolean;
  onDragEnter: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  return (
    <div
      data-dropzone-empty="true"
      className={[
        "grid place-items-center rounded-xl border-2 border-dashed p-8 transition-colors",
        active ? "border-sky-400 bg-sky-50/50" : "border-neutral-300 bg-neutral-50/50",
      ].join(" ")}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();                           
        onDragEnter();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();                           
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();                        
        onDrop();
      }}
    >
      <div className="text-neutral-600 text-sm">
        {isDragging ? "שחררו כאן כדי להוסיף שדה" : "גררו רכיבים מהצד הימני לתוך האזור הזה"}
      </div>
    </div>
  );
}

function InsertMarker() {
  return (
    <div className="h-6 -mt-1 -mb-1">
      <div className="h-[2px] bg-sky-500 rounded-full" />
    </div>
  );
}

function FieldCard({
  field,
  index,
  onChange,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOverTop,
  onDragOverBottom,
}: {
  field: FormField;
  index: number;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverTop: () => void;
  onDragOverBottom: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white p-4 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        onDragStart();
                                             
        if (e.dataTransfer) e.dataTransfer.setData("text/plain", String(index));
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) onDragOverTop();
        else onDragOverBottom();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-neutral-600">
          סוג שדה:{" "}
          <span className="font-medium text-neutral-800">{typeLabel(field.type)}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="h-8 px-3 rounded-lg bg-red-500 text-white  text-sm hover:bg-red-600"
        >
          מחיקה
        </button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm text-neutral-700">תווית</span>
          <input
            value={field.label || ""}
            onChange={(e) => onChange({ label: e.target.value })}
            className="h-10 rounded-lg border border-neutral-300 px-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder={typeLabel(field.type)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => onChange({ required: e.target.checked })}
            className="accent-sky-600"
          />
          <span>חובה</span>
        </label>
      </div>

      {                                       }
      {field.type === "consent" && (
        <label className="mt-3 grid gap-1.5">
          <span className="text-sm text-neutral-700">תיאור ההסכמה</span>
          <input
            value={field.description || ""}
            onChange={(e) => onChange({ description: e.target.value })}
            className="h-10 rounded-lg border border-neutral-300 px-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="אני מאשר/ת…"
          />
        </label>
      )}

      {(field.type === "text" ||
        field.type === "textarea" ||
        field.type === "number" ||
        field.type === "phone" ||
        field.type === "email") && (
        <label className="mt-3 grid gap-1.5">
          <span className="text-sm text-neutral-700">Placeholder</span>
          <input
            value={field.placeholder || ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            className="h-10 rounded-lg border border-neutral-300 px-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="(לא חובה)"
          />
        </label>
      )}

      {(field.type === "select" || field.type === "radio" || field.type === "checkboxes") && (
        <OptionsEditor
          options={Array.isArray(field.options) ? field.options : []}
          onChange={(opts) => onChange({ options: opts })}
        />
      )}
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  const [local, setLocal] = useState<string[]>(options.length ? options : ["אפשרות 1", "אפשרות 2"]);

  useEffect(() => {
    setLocal(options.length ? options : ["אפשרות 1", "אפשרות 2"]);
  }, [options]);

  function setAt(i: number, val: string) {
    const next = [...local];
    next[i] = val;
    setLocal(next);
    onChange(next.filter((o) => o.trim() !== ""));
  }
  function add() {
    const next = [...local, `אפשרות ${local.length + 1}`];
    setLocal(next);
    onChange(next);
  }
  function remove(i: number) {
    const next = local.filter((_, idx) => idx !== i);
    setLocal(next);
    onChange(next);
  }

  return (
    <div className="mt-3">
      <div className="text-sm font-medium text-neutral-700 mb-2">אפשרויות</div>
      <div className="grid gap-2">
        {local.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={opt}
              onChange={(e) => setAt(i, e.target.value)}
              className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="h-10 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
            >
              הסר
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={add}
            className="h-10 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
          >
            הוספת אפשרות
          </button>
        </div>
      </div>
    </div>
  );
}

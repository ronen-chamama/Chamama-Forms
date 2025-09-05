"use client";

import { useEffect, useState, Fragment } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebaseClient";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import RichTextEditor from "@/components/RichTextEditor";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---------------------- טיפוסים ---------------------- */
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
  | "signature"
  | "richtext";

type Field = {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[];
  description?: string;
};

/* ---------------------- עזרים ---------------------- */
function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createBaseField(type: FieldType): Field {
  const base: Field = { id: uid(), type, label: "", required: false };
  switch (type) {
    case "text": base.label = "שדה טקסט"; break;
    case "textarea": base.label = "איזור טקסט"; break;
    case "parentName": base.label = "שם ההורה"; break;
    case "number": base.label = "מספר"; break;
    case "phone": base.label = "טלפון"; break;
    case "email": base.label = 'דוא"ל'; break;
    case "consent": base.label = "הסכמה"; base.description = "אני מאשר/ת ..."; break;
    case "select": base.label = "בחירה מרשימה"; base.options = []; break;
    case "radio": base.label = "בחירה"; base.options = []; break;
    case "checkbox": base.label = "בחירה מרובה"; base.options = []; break;
    case "signature": base.label = "חתימה"; break;
    case "richtext": base.label = "טקסט עשיר"; break;
    default: base.label = "שדה";
  }
  return base;
}

/* ---------------------- קומפוננטות עזר ---------------------- */
function SortableFieldRow({
  field,
  onUpdate,
  onDelete,
}: {
  field: Field;
  onUpdate: (patch: Partial<Field>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: "white",
  };

  return (
    <li ref={setNodeRef} style={style} className="border p-2 rounded bg-white">
      <div className="flex gap-2 items-center">
        <button
          type="button"
          className="px-2 py-1 border rounded cursor-grab select-none"
          {...attributes}
          {...listeners}
          title="גרור לשינוי סדר"
        >
          ⠿
        </button>

        <span className="text-xs px-2 py-1 border rounded">{field.type}</span>

        <input
          className="border p-1 flex-1"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />

        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
          />
          נדרש
        </label>

        <button type="button" className="text-red-600" onClick={onDelete}>
          מחק
        </button>
      </div>

      {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
        <div className="mt-2">
          <OptionsEditor
            value={field.options || []}
            onChange={(opts) => onUpdate({ options: opts })}
          />
        </div>
      )}

      {field.type === "consent" && (
        <textarea
          className="border p-2 w-full rounded mt-2"
          rows={3}
          placeholder="פירוט ההסכמה שיוצג להורים…"
          value={field.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
      )}
    </li>
  );
}

function OptionsEditor({ value, onChange }: { value: string[]; onChange: (next: string[]) => void; }) {
  const [input, setInput] = useState("");
  function addOpt() {
    const v = input.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setInput("");
  }
  function removeOpt(opt: string) { onChange(value.filter((x) => x !== opt)); }
  function renameOpt(i: number, txt: string) {
    const next = value.slice(); next[i] = txt; onChange(next.filter(Boolean));
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="border p-2 rounded flex-1"
          placeholder="הוספת אפשרות…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOpt()}
        />
        <button type="button" className="border px-3 rounded" onClick={addOpt}>הוסף</button>
      </div>
      <ul className="space-y-1">
        {value.map((opt, i) => (
          <li key={opt + i} className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">{i + 1}.</span>
            <input className="border p-1 rounded flex-1" value={opt} onChange={(e) => renameOpt(i, e.target.value)} />
            <button type="button" className="text-red-600" onClick={() => removeOpt(opt)}>מחק</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** droppable כשאין בכלל פריטים */
function EmptyCanvasDroppable({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: "canvas" });
  return (
    <div ref={setNodeRef} className={`rounded border-2 p-1 ${isOver ? "border-blue-400" : "border-dashed border-gray-300"}`}>
      {children}
    </div>
  );
}

/** דרופ־זון בקצה התחתון כדי שדרופ על הריק יוסיף בסוף */
function EndDropZone({ show }: { show: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "end" });
  return (
    <li ref={setNodeRef} className={`px-2 h-6 ${isOver ? "bg-blue-50" : ""}`}>
      {show && <div className="h-0.5 bg-blue-500 rounded-full my-1" />}
    </li>
  );
}

/** פריט פאלאט: גם גריר, גם לחיץ */
function DraggablePaletteItem({ type, label, onAdd }: { type: FieldType; label: string; onAdd: (t: FieldType) => void; }) {
  const id = `palette:${type}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data: { from: "palette", type } });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <button
      ref={setNodeRef as any}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onAdd(type)}
      style={style}
      className="border p-2 rounded bg-white"
      title="לחץ להוספה או גרור אל אזור הטופס"
    >
      {label}
    </button>
  );
}

/* ---------------------- העמוד ---------------------- */
export default function EditFormPage() {
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [schema, setSchema] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // אינדקס ההכנסה (לפני מי מכניסים)
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (!u) location.href = "/login"; });
    return () => unsub();
  }, []);

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
    return () => { cancelled = true; };
  }, [id]);

  function addField(type: FieldType) { setSchema((prev) => [...prev, createBaseField(type)]); }
  function insertFieldAt(type: FieldType, index: number) {
    const field = createBaseField(type);
    setSchema((prev) => {
      const i = Math.max(0, Math.min(index, prev.length));
      return [...prev.slice(0, i), field, ...prev.slice(i)];
    });
  }
  function updateField(index: number, patch: Partial<Field>) {
    setSchema((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }
  function removeField(index: number) { setSchema((prev) => prev.filter((_, i) => i !== index)); }

  async function save() {
    try {
      setSaving(true);
      await updateDoc(doc(db, "forms", id), { title, descriptionHtml, schema, updatedAt: serverTimestamp() });
    } finally { setSaving(false); }
  }
  function openPreview() { window.open(`/f/${id}`, "_blank", "noopener,noreferrer"); }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(_: DragStartEvent) { setDropIndex(null); }

  function handleDragOver(e: DragOverEvent) {
    const { over } = e;
    if (!over) { setDropIndex(null); return; }

    if (over.id === "canvas") { setDropIndex(0); return; }       // רשימה ריקה
    if (over.id === "end")    { setDropIndex(schema.length); return; } // דרופ בסוף

    // כשעובדים מול פריט — נכניס לפניו
    const overIdx = schema.findIndex((f) => f.id === String(over.id));
    setDropIndex(overIdx === -1 ? null : overIdx);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active } = e;
    const targetIndex = dropIndex;
    setDropIndex(null);
    if (targetIndex == null) return;

    const fromPalette = active.data?.current?.from === "palette";
    const paletteType = active.data?.current?.type as FieldType | undefined;

    if (fromPalette && paletteType) {
      insertFieldAt(paletteType, targetIndex);
      return;
    }

    const oldIndex = schema.findIndex((f) => f.id === String(active.id));
    if (oldIndex === -1) return;
    setSchema((items) => arrayMove(items, oldIndex, targetIndex));
  }

  if (loading) return <main dir="rtl" className="p-6 max-w-6xl mx-auto">טוען…</main>;

  return (
    <main dir="rtl" className="p-6 max-w-6xl mx-auto">
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
        <button onClick={openPreview} className="border p-2 rounded">תצוגה להורה</button>
      </div>

      <div className="mb-6">
        <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} />
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {/* שתי עמודות: משמאל קנבס (2/3), מימין ארגז (1/3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* קנבס */}
          <section className="sm:col-span-2 space-y-3">
            <h2 className="text-lg font-semibold mb-2">שדות הטופס</h2>

            {schema.length === 0 ? (
              <EmptyCanvasDroppable>
                <ul className="space-y-2 min-h-[120px] p-4 rounded bg-gray-50">
                  <li className="text-gray-500 text-sm border rounded bg-white p-4">
                    גרור/י רכיב מהצד הימני כדי להתחיל לבנות טופס.
                  </li>
                </ul>
              </EmptyCanvasDroppable>
            ) : (
              <SortableContext items={schema.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2 min-h-[120px] p-1 rounded bg-gray-50">
                  {/* קו הטלה לפני האיבר הראשון */}
                  {dropIndex === 0 && (
                    <li aria-hidden className="px-2">
                      <div className="h-0.5 bg-blue-500 rounded-full my-1" />
                    </li>
                  )}

                  {schema.map((f, idx) => (
                    <Fragment key={f.id}>
                      {/* קו הטלה לפני כל איבר שריחפנו מעליו */}
                      {dropIndex === idx && (
                        <li aria-hidden className="px-2">
                          <div className="h-0.5 bg-blue-500 rounded-full my-1" />
                        </li>
                      )}
                      <SortableFieldRow
                        field={f}
                        onUpdate={(patch) => updateField(idx, patch)}
                        onDelete={() => removeField(idx)}
                      />
                    </Fragment>
                  ))}

                  {/* קו/דרופ בסוף ממש */}
                  <EndDropZone show={dropIndex === schema.length} />
                </ul>
              </SortableContext>
            )}
          </section>

          {/* ארגז רכיבים */}
          <aside className="sm:col-span-1 space-y-2 sm:sticky sm:top-4 self-start">
            <h2 className="text-lg font-semibold mb-2">רכיבי טופס</h2>
            <div className="grid grid-cols-2 gap-2">
              <DraggablePaletteItem type="text" label="שדה טקסט" onAdd={addField} />
              <DraggablePaletteItem type="textarea" label="איזור טקסט" onAdd={addField} />
              <DraggablePaletteItem type="parentName" label="שם ההורה" onAdd={addField} />
              <DraggablePaletteItem type="number" label="שדה מספר" onAdd={addField} />
              <DraggablePaletteItem type="phone" label="טלפון" onAdd={addField} />
              <DraggablePaletteItem type="email" label='דוא"ל' onAdd={addField} />
              <DraggablePaletteItem type="consent" label="הסכמה" onAdd={addField} />
              <DraggablePaletteItem type="select" label="בחירה מרשימה" onAdd={addField} />
              <DraggablePaletteItem type="radio" label="בחירה (radio)" onAdd={addField} />
              <DraggablePaletteItem type="checkbox" label="בחירה מרובה" onAdd={addField} />
              <DraggablePaletteItem type="signature" label="חתימה" onAdd={addField} />
            </div>
          </aside>
        </div>
      </DndContext>
    </main>
  );
}

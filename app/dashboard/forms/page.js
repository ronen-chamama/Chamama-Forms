"use client";
import { useState } from "react";
import useUser from "../../../hooks/useUser";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from "@dnd-kit/core";
  import {
  SortableContext,
  useSortable,
  arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { db } from "../../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// שדות זמינים
const FIELD_TYPES = [
  { id: "text", label: "טקסט חופשי" },
  { id: "phone", label: "טלפון" },
  { id: "email", label: "אימייל" },
  { id: "signature", label: "חתימה" }
];

// רכיב לתיבת הכלים
function ToolboxItem({ field }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: `tool-${field.id}`,
      data: { from: "toolbox", field }
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    border: "1px solid #ccc",
    padding: 8
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      {field.label}
    </div>
  );
}

// רכיב לשדה בתוך הטופס
function FormField({ field }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #ccc",
    padding: 8,
    marginBottom: 5
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      {field.label}
    </div>
  );
}

export default function NewFormPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [fields, setFields] = useState([]);

  const sensors = useSensors(useSensor(PointerSensor));

  if (loading) return <p>טוען...</p>;
  if (!user) {
    router.push("/login");
    return null;
  }

  async function handleSave() {
    await addDoc(collection(db, "forms"), {
      owner: user.uid,
      title: "טופס ללא שם",
      fields
    });
    alert("הטופס נשמר!");
    router.push("/dashboard");
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    // גרירה מתיבת הכלים לאזור הטופס
    if (activeData?.from === "toolbox" && over.id === "form") {
      setFields([
        ...fields,
        { ...activeData.field, uid: Date.now().toString() }
      ]);
      return;
    }

    // שינוי סדר השדות בתוך הטופס
    const oldIndex = fields.findIndex((f) => f.uid === active.id);
    const newIndex = fields.findIndex((f) => f.uid === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setFields(arrayMove(fields, oldIndex, newIndex));
    }
  }

  return (
    <div dir="rtl">
      <h1>יצירת טופס חדש</h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* תיבת הכלים */}
        <SortableContext items={FIELD_TYPES.map((f) => `tool-${f.id}`)}>
          <div style={{ display: "flex", gap: 10 }}>
            {FIELD_TYPES.map((f) => (
              <ToolboxItem key={f.id} field={f} />
            ))}
          </div>
        </SortableContext>

        {/* אזור בניית הטופס */}
        <div
          id="form"
          style={{
            marginTop: 20,
            border: "1px dashed #aaa",
            minHeight: 200,
            padding: 10
          }}
        >
          <SortableContext items={fields.map((f) => f.uid)}>
            {fields.map((f) => (
              <FormField key={f.uid} field={f} />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      <button onClick={handleSave} style={{ marginTop: 20 }}>
        שמירה
      </button>
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  title?: string;
};

export default function OptionsEditor({ value, onChange, title = "אפשרויות" }: Props) {
  const lastInputRef = useRef<HTMLInputElement | null>(null);

  function addEmpty() {
    onChange([...(value || []), ""]);
    // פוקוס לשורה החדשה ב-tick הבא
    setTimeout(() => lastInputRef.current?.focus(), 0);
  }

  function updateAt(i: number, text: string) {
    const next = [...value];
    next[i] = text;
    onChange(next);
  }

  function removeAt(i: number) {
    const next = value.filter((_, idx) => idx !== i);
    onChange(next);
  }

  function cleanAndDedup(list: string[]) {
    const cleaned = list.map(s => s.trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
  }

  // אם נרצה לנקות כפילויות / ריקים אוטומטית כשהקומפוננטה נסגרת – אפשר להשאיר ככה
  useEffect(() => {
    // לא חובה; משאיר נקי בזמן אמת אם יש ריקים מרובים בסוף
    const trimmed = value.length > 1 && value[value.length - 1] === "" ? value.slice(0, -1) : value;
    if (trimmed !== value) onChange(trimmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div dir="rtl" className="space-y-2">
      <div className="font-medium">{title}</div>
      <div className="space-y-2">
        {(value || []).map((opt, i) => {
          const isLast = i === value.length - 1;
          return (
            <div key={i} className="flex items-center gap-2">
              <input
                ref={isLast ? lastInputRef : undefined}
                className="border rounded p-2 flex-1"
                placeholder={`אפשרות #${i + 1}`}
                value={opt}
                onChange={(e) => updateAt(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    // Enter מוסיף שורה חדשה אם הנוכחית לא ריקה; אחרת מתעלמים
                    if (value[i].trim()) addEmpty();
                  }
                }}
              />
              <button
                type="button"
                className="border rounded px-2 py-1"
                onClick={() => removeAt(i)}
                aria-label="מחק"
                title="מחק אפשרות"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={addEmpty}
        >
          +
        </button>

        {/* <button
          type="button"
          className="text-sm underline"
          onClick={() => onChange(cleanAndDedup(value))}
          title="נקה רווחים/כפילויות"
        >
          נקה כפילויות ורווחים
        </button> */}
      </div>
    </div>
  );
}

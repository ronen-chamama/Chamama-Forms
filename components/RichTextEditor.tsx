"use client";

import { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";


type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);

  // אתחול Quill חד-פעמי (רק בצד לקוח)
  useEffect(() => {
    let mounted = true;

    (async () => {
      // תמיכה גם אם המודול מחזיר default וגם אם לא
      const mod: any = await import("quill");
      const Quill = mod?.default ?? mod;
      if (!mounted || !hostRef.current || quillRef.current) return;

      const modules = {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }, { direction: "rtl" }],
          ["link"],
          ["clean"],
        ],
        clipboard: { matchVisual: false },
      };

      const formats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "bullet",
        "align",
        "direction",
        "link",
      ];

      const q = new Quill(hostRef.current, {
        theme: "snow",
        modules,
        formats,
        placeholder,
      });

      quillRef.current = q;

      // RTL + עברית
      q.root.setAttribute("dir", "rtl");
      q.root.setAttribute("lang", "he");

      // ערך התחלתי
      if (value) {
        q.clipboard.dangerouslyPasteHTML(value);
      }

      // שינויי טקסט → onChange
      const handler = () => onChange(q.root.innerHTML);
      q.on("text-change", handler);

      // ניקוי מאזינים ביציאה
      return () => {
        try { q.off("text-change", handler); } catch {}
      };
    })();

    return () => {
      mounted = false;
      quillRef.current = null;
    };
  }, []); // לאתחל פעם אחת

  // סינכרון ערך חיצוני → עורך, בלי למחוק בחירה
  useEffect(() => {
    const q = quillRef.current;
    if (!q || typeof value !== "string") return;

    const current = q.root.innerHTML;
    if (current === value) return;

    const sel = q.getSelection();
    q.clipboard.dangerouslyPasteHTML(value || "");
    if (sel) q.setSelection(sel);
  }, [value]);

  // עטיפה כדי לבודד את ה-CSS של Quill
  return (
    <div className="quill-wrap border rounded bg-white">
      <div ref={hostRef} />
      <style jsx>{`
        .quill-wrap :global(.ql-container) {
          min-height: 160px;
          border-top: 0;
        }
        .quill-wrap :global(.ql-toolbar) {
          border-bottom: 1px solid #e5e7eb; /* tailwind slate-200 */
        }
      `}</style>
    </div>
  );
}

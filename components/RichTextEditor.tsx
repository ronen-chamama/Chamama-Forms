"use client";
import { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";

type Props = { value: string; onChange: (html: string) => void; placeholder?: string };

export default function RichTextEditor({ value, onChange, placeholder = "תיאור הטופס…" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const lastHtmlRef = useRef<string>("");

  useEffect(() => {
    let disposed = false;
    (async () => {
      if (initializedRef.current || !containerRef.current) return;
      initializedRef.current = true;

      const Quill = (await import("quill")).default;

      // נוודא שהקונטיינר ריק לפני יצירה
      containerRef.current.innerHTML = "";
      const editorHost = document.createElement("div");
      containerRef.current.appendChild(editorHost);

      const modules = {
        toolbar: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }, { direction: "rtl" }],
          ["link", "clean"],
        ],
        clipboard: { matchVisual: true },
      };
      const formats = ["header","bold","italic","underline","strike","list","bullet","align","direction","link"];

      const q = new Quill(editorHost, { theme: "snow", modules, formats, placeholder });
      quillRef.current = q;
      q.root.setAttribute("dir", "rtl");

      if (value) {
        q.clipboard.dangerouslyPasteHTML(value);
        lastHtmlRef.current = q.root.innerHTML;
      }

      q.on("text-change", () => {
        if (disposed) return;
        const html = q.root.innerHTML;
        if (html !== lastHtmlRef.current) {
          lastHtmlRef.current = html;
          onChange(html);
        }
      });
    })();

    return () => {
      disposed = true;
    };
  }, []); // אתחול פעם אחת

  // סנכרון חיצוני
  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    if (value && value !== lastHtmlRef.current) {
      q.setContents([]);
      q.clipboard.dangerouslyPasteHTML(value);
      lastHtmlRef.current = q.root.innerHTML;
    }
  }, [value]);

  return <div ref={containerRef} className="bg-white rounded" />;
}

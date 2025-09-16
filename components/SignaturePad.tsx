"use client";
import React, { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePad({
  onChange,
  width = 500,   // נתייחס לזה כ-max width
  height = 180,  // גובה יחסי ל-width
}: {
  onChange: (dataUrl: string | null) => void;
  width?: number;   // מקסימום רוחב
  height?: number;  // הגובה יחסי לרוחב
}) {
  const ref = useRef<SignatureCanvas>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // יחס גובה/רוחב בסיסי לפי ברירת המחדל או ה-props
  const baseRatio = height / width;

  const [dims, setDims] = useState(() => {
    const w = width;
    const h = Math.max(100, Math.round(w * baseRatio));
    return { w, h };
  });

  // התאמה רספונסיבית לרוחב הקונטיינר + שחזור הקווים בעת שינוי גודל
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const containerW = Math.round(entry.contentRect.width);

      if (!containerW) return;

      const targetW = Math.min(containerW, width); // אל תעבור את ה-max
      if (Math.abs(targetW - dims.w) < 4) return;  // הימנע מעדכונים זעירים

      // שמור את הקווים לפני שינוי הגודל
      const strokes = ref.current?.toData() ?? [];

      // עדכן ממדים חדשים
      const newW = targetW;
      const newH = Math.max(100, Math.round(newW * baseRatio));
      setDims({ w: newW, h: newH });

      // שחזור הקווים אחרי שהקנבס ירונדר מחדש
      requestAnimationFrame(() => {
        try {
          if (strokes.length) {
            ref.current?.fromData(strokes);
          }
        } catch {
          // אם יש כשל בשחזור, נתעלם; המשתמש עדיין יכול להמשיך לחתום
        }
      });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [baseRatio, width, dims.w]);

  function handleEnd() {
    const data = ref.current?.toDataURL("image/png");
    onChange(data || null);
  }

  function clear() {
    ref.current?.clear();
    onChange(null);
  }

  return (
    <div className="space-y-2">
      {/* הקונטיינר שולט ברוחב בפועל; w-full על מובייל, מוגבל ל-max ב-desktop */}
      <div ref={wrapperRef} className="w-full max-w-[500px]">
        <SignatureCanvas
          ref={ref}
          penColor="black"
          onEnd={handleEnd}
          // חשוב: width/height של הקנבס (פיקסלים אמיתיים),
          // ובנוסף style כדי שהקנבס יימתח לרוחב הקונטיינר; h נשלט לפי dims.h
          canvasProps={{
            width: dims.w,
            height: dims.h,
            className: "rounded-2xl border border-neutral-200 bg-white p-4",
            style: {
              width: "100%",            // תופס את רוחב הקונטיינר
              height: `${dims.h}px`,    // גובה קבוע יחסי לרוחב
              touchAction: "none",      // ציור חלק בניידים (ללא גלילת דף)
            } as React.CSSProperties,
          }}
        />
      </div>

      <button
        type="button"
        onClick={clear}
        className="rounded border border-neutral-200 bg-white p-2"
      >
        נקה חתימה
      </button>
    </div>
  );
}

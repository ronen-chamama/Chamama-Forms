"use client";
import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePad({
  onChange,
  width = 500,
  height = 180,
}: {
  onChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}) {
  const ref = useRef<SignatureCanvas>(null);

  function handleEnd() {
    const data = ref.current?.toDataURL("image/png"); // חייב להחזיר data:image/png;base64,....
    onChange(data || null);
  }

  function clear() {
    ref.current?.clear();
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <SignatureCanvas
        ref={ref}
        penColor="black"
        onEnd={handleEnd}
        canvasProps={{ width, height, className: "border rounded bg-white" }}
      />
      <button type="button" onClick={clear} className="border px-3 py-1 rounded">
        נקה חתימה
      </button>
    </div>
  );
}

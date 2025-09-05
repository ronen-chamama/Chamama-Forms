"use client";
import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePad({ onChange }: { onChange: (dataUrl: string)=>void }) {
  const ref = useRef<SignatureCanvas>(null);

  function handleEnd() {
    try {
      const data = ref.current?.toDataURL("image/png");
      if (data && typeof onChange === "function") onChange(data);
    } catch (e) {
      console.error("Signature toDataURL failed:", e);
    }
  }

  function clear() {
    try {
      ref.current?.clear();
    } finally {
      if (typeof onChange === "function") onChange("");
    }
  }

  return (
    <div className="space-y-2">
      <SignatureCanvas
        ref={ref}
        penColor="black"
        onEnd={handleEnd}
        canvasProps={{ width: 500, height: 180, className: "border rounded" }}
      />
      <div className="flex gap-2">
        <button type="button" onClick={clear} className="border p-2">נקה</button>
      </div>
    </div>
  );
}

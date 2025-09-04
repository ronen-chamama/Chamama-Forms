"use client";
import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePad({ onSave }: { onSave: (dataUrl:string)=>void }) {
  const ref = useRef<SignatureCanvas>(null);
  return (
    <div className="space-y-2">
      <SignatureCanvas ref={ref} penColor="black" canvasProps={{width:500,height:180, className:"border rounded"}} />
      <div className="flex gap-2">
        <button onClick={()=>ref.current?.clear()} className="border p-2">נקה</button>
        <button onClick={()=>{ const data = ref.current?.toDataURL("image/png"); if(data) onSave(data); }} className="border p-2">שמור חתימה</button>
      </div>
    </div>
  );
}

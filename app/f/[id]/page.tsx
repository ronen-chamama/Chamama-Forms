"use client";
import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebaseClient";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import SignaturePad from "@/components/SignaturePad";

type Field = { id:string; type:string; label:string; options?:string[]; required?:boolean; };

export default function PublicForm({ params }: { params: { id: string } }) {
  const formId = params.id;
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState<any>(null);
  const [answers,setAnswers]=useState<Record<string,any>>({});
  const [sigData,setSigData]=useState<string>(""); const [msg,setMsg]=useState("");

  useEffect(()=>{ (async()=>{
    const snap=await getDoc(doc(db,"forms",formId));
    if(!snap.exists()) { setMsg("טופס לא נמצא"); setLoading(false); return; }
    const d=snap.data() as any; setForm(d); setLoading(false);
  })(); },[formId]);

  function renderField(f:Field){
    const v=answers[f.id]??"";
    if(f.type==="richtext"){ return <div className="p-2 border rounded bg-white" dangerouslySetInnerHTML={{__html: v || "<em>טקסט יוצג בעתיד (WYSIWYG)</em>"}}/>; }
    if(f.type==="text"){ return <input className="border p-2 w-full" value={v} onChange={e=>setAnswers(a=>({...a,[f.id]:e.target.value}))}/>; }
    if(f.type==="phone"){ return <input className="border p-2 w-full" inputMode="tel" value={v} onChange={e=>setAnswers(a=>({...a,[f.id]:e.target.value}))}/>; }
    if(f.type==="email"){ return <input className="border p-2 w-full" inputMode="email" value={v} onChange={e=>setAnswers(a=>({...a,[f.id]:e.target.value}))}/>; }
    if(f.type==="select"){ return <select className="border p-2 w-full" value={v} onChange={e=>setAnswers(a=>({...a,[f.id]:e.target.value}))}>
      <option value="">בחר/י</option>{(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}
    </select>; }
    if(f.type==="radio"){ return <div className="flex flex-wrap gap-3">{(f.options||[]).map(o=><label key={o} className="flex items-center gap-1"><input type="radio" checked={v===o} onChange={()=>setAnswers(a=>({...a,[f.id]:o}))}/>{o}</label>)}</div>; }
    if(f.type==="checkbox"){ const arr=new Set<string>(Array.isArray(v)?v:[]);
      return <div className="flex flex-wrap gap-3">{(f.options||[]).map(o=>{
        const checked=arr.has(o);
        return <label key={o} className="flex items-center gap-1">
          <input type="checkbox" checked={checked} onChange={(e)=>{
            const next=new Set(arr); e.target.checked?next.add(o):next.delete(o);
            setAnswers(a=>({...a,[f.id]:Array.from(next)}));
          }}/>{o}
        </label>;
      })}</div>;
    }
    if(f.type==="signature"){ return <SignaturePad onSave={(d)=>setSigData(d)}/>; }
    return <div className="text-sm text-gray-500">סוג שדה לא נתמך כרגע</div>;
  }

  async function onSubmit(){
    setMsg("");
    try{
      let signatureUrl = "";
      if(sigData){
        const r = ref(storage, `signatures/public/${formId}-${Date.now()}.png`);
        await uploadString(r, sigData, "data_url");
        signatureUrl = await getDownloadURL(r);
      }
      const subRef = await addDoc(collection(db,"forms",formId,"submissions"),{
        publicId: crypto.randomUUID(),
        answers, signatureUrl, status: "submitted",
        submittedAt: serverTimestamp()
      });
      setMsg("✅ הטופס נשלח בהצלחה");
    }catch(e:any){
      setMsg("שגיאה בשליחה: "+(e?.message||e));
    }
  }

  if(loading) return <main className="p-6">טוען…</main>;
  if(!form) return <main className="p-6">{msg||"טופס לא נמצא"}</main>;
  const fields: Field[] = form.schema || [];

  return (
    <main dir="rtl" className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl mb-4">{form.title||"טופס"}</h1>
      <div className="space-y-4">
        {fields.map(f=>(
          <div key={f.id} className="border p-3 rounded">
            <div className="font-medium mb-2">{f.label}</div>
            {renderField(f)}
          </div>
        ))}
        <div className="flex gap-2">
          <button className="border p-2" onClick={onSubmit}>שליחה</button>
          <button className="border p-2" onClick={()=>location.href="/"}>ביטול</button>
        </div>
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </div>
    </main>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
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
  const [sigData,setSigData]=useState<string>("");
  const [msg,setMsg]=useState(""); const [sent,setSent]=useState(false);

  useEffect(()=>{ (async()=>{
    const snap=await getDoc(doc(db,"forms",formId));
    if(!snap.exists()){ setMsg("טופס לא נמצא"); setLoading(false); return; }
    setForm(snap.data()); setLoading(false);
  })(); },[formId]);

  const fields: Field[] = useMemo(()=>form?.schema || [], [form]);
  const requiredIds = useMemo(()=>fields.filter(f=>f.required).map(f=>f.id), [fields]);
  const hasSignatureField = useMemo(()=>fields.some(f=>f.type==="signature"), [fields]);

  function renderField(f:Field){
    const v=answers[f.id]??(f.type==="checkbox"?[]:"");
    const label = <div className="font-medium mb-1">{f.label}{f.required && <span className="text-red-600"> *</span>}</div>;
    if(f.type==="richtext") return <div className="border p-2 rounded bg-white"><div className="prose" dangerouslySetInnerHTML={{__html: String(v||"")}}/></div>;
    if(f.type==="text") return <>{label}<input className="border p-2 w-full" value={v} onChange={e=>setAnswers(a=>({...a,[f.id]:e.target.value}))}/></>;
    if(f.type==="phone") return <>{label}<input className="border p-2 w-full" inputMode="tel" value={v} onChange={e=>setAnswers(a=>({...a,[f.id]:e.target.value}))}/></>;
    if(f.type==="email") return <>{label}<input className="border p-2 w-full" inputMode="email" value={v} onChange={e=>setAnswers(a=>({...a,[f.id]:e.target.value}))}/></>;
    if(f.type==="select") return <>{label}<select className="border p-2 w-full" value={v} onChange={e=>setAnswers(a=>({...a,[f.id]:e.target.value}))}><option value="">בחר/י</option>{(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select></>;
    if(f.type==="radio") return <>{label}<div className="flex flex-wrap gap-3">{(f.options||[]).map(o=><label key={o} className="flex items-center gap-1"><input type="radio" checked={v===o} onChange={()=>setAnswers(a=>({...a,[f.id]:o}))}/>{o}</label>)}</div></>;
    if(f.type==="checkbox"){ const set=new Set<string>(Array.isArray(v)?v:[]);
      return <>{label}<div className="flex flex-wrap gap-3">{(f.options||[]).map(o=>{
        const checked=set.has(o);
        return <label key={o} className="flex items-center gap-1"><input type="checkbox" checked={checked} onChange={e=>{
          const next=new Set(set); e.target.checked?next.add(o):next.delete(o);
          setAnswers(a=>({...a,[f.id]:Array.from(next)}));
        }}/>{o}</label>;
      })}</div></>;
    }
    if(f.type==="signature") return <>{label}<SignaturePad onSave={(d)=>setSigData(d)}/></>;
    return <div className="text-sm text-gray-500">סוג שדה לא נתמך</div>;
  }

  function validate(): string | null {
    for(const id of requiredIds){
      const val = answers[id];
      if(val==null || (typeof val==="string" && !val.trim()) || (Array.isArray(val) && val.length===0)) {
        return "נא למלא את כל השדות החובה";
      }
    }
    if(hasSignatureField && !sigData) return "נדרשת חתימה";
    return null;
  }

  async function onSubmit(){
    setMsg("");
    const err = validate();
    if(err){ setMsg(err); return; }
    try{
      let signatureUrl = "";
      if(sigData){
        const r = ref(storage, `signatures/public/${formId}-${Date.now()}.png`);
        await uploadString(r, sigData, "data_url");
        signatureUrl = await getDownloadURL(r);
      }
      await addDoc(collection(db,"forms",formId,"submissions"),{
        publicId: crypto.randomUUID(),
        answers, signatureUrl, status:"submitted", submittedAt: serverTimestamp()
      });
      setSent(true);
      setMsg("✅ הטופס נשלח בהצלחה. תודה!");
    }catch(e:any){ setMsg("שגיאה בשליחה: "+(e?.message||e)); }
  }

  if(loading) return <main className="p-6">טוען…</main>;
  if(!form) return <main className="p-6">{msg||"טופס לא נמצא"}</main>;

  return (
    <main dir="rtl" className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl mb-4">{form.title||"טופס"}</h1>
      <div className="space-y-4">
        {fields.map(f=>(<div key={f.id} className="border p-3 rounded">{renderField(f)}</div>))}
        <div className="flex gap-2">
          <button className="border p-2" onClick={onSubmit} disabled={sent}>{sent?"נשלח":"שליחה"}</button>
          <button className="border p-2" onClick={()=>history.back()}>ביטול</button>
        </div>
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </div>
    </main>
  );
}

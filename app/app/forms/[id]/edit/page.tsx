"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebaseClient";
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";

type Field = { id:string; type:string; label:string; options?:string[]; required?:boolean; };

export default function EditFormPage(){
  const { id } = useParams<{id:string}>();
  const [loading,setLoading]=useState(true);
  const [title,setTitle]=useState("");
  const [groups,setGroups]=useState<string>("");
  const [emails,setEmails]=useState<string>("");
  const [schema,setSchema]=useState<Field[]>([]);

  useEffect(()=>{ (async()=>{
    const snap=await getDoc(doc(db,"forms",id)); const d=snap.data() as any;
    setTitle(d?.title||""); setGroups((d?.targetGroups||[]).join(", ")); setEmails((d?.notifyStaffEmails||[]).join(", "));
    setSchema(d?.schema||[]); setLoading(false);
  })(); },[id]);

  async function save(){
    await updateDoc(doc(db,"forms",id),{
      title,
      targetGroups: groups.split(",").map(s=>s.trim()).filter(Boolean),
      notifyStaffEmails: emails.split(",").map(s=>s.trim()).filter(Boolean),
      schema,
      updatedAt: serverTimestamp()
    });
    alert("נשמר");
  }

  function addField(type:string){
    const base: Field = { id: crypto.randomUUID(), type, label: "שדה חדש", required:false };
    if(type==="select"||type==="radio"||type==="checkbox"){ base.options=["אפשרות 1","אפשרות 2"]; }
    setSchema(prev=>[...prev, base]);
  }

  if(loading) return <main className="p-6">טוען…</main>;
  return (
    <main dir="rtl" className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl mb-4">עריכת טופס</h1>

      <div className="grid gap-3 max-w-xl">
        <input className="border p-2" value={title} onChange={e=>setTitle(e.target.value)} placeholder="שם הטופס" />
        <input className="border p-2" value={groups} onChange={e=>setGroups(e.target.value)} placeholder="קבוצות (מופרד בפסיקים)" />
        <input className="border p-2" value={emails} onChange={e=>setEmails(e.target.value)} placeholder="מיילים לשליחה (מופרד בפסיקים)" />
      </div>

      <div className="mt-6">
        <h2 className="text-xl mb-2">רכיבי טופס</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <button className="border p-2" onClick={()=>addField("richtext")}>טקסט עשיר</button>
          <button className="border p-2" onClick={()=>addField("text")}>שדה טקסט</button>
          <button className="border p-2" onClick={()=>addField("phone")}>טלפון</button>
          <button className="border p-2" onClick={()=>addField("email")}>דוא"ל</button>
          <button className="border p-2" onClick={()=>addField("select")}>רשימה נגללת</button>
          <button className="border p-2" onClick={()=>addField("radio")}>בחירה אחת</button>
          <button className="border p-2" onClick={()=>addField("checkbox")}>סימונים</button>
          <button className="border p-2" onClick={()=>addField("signature")}>חתימה</button>
        </div>

        <ul className="space-y-2">
          {schema.map(f=>(
            <li key={f.id} className="border p-2 rounded">
              <div className="flex gap-2 items-center">
                <span className="text-xs px-2 py-1 border rounded">{f.type}</span>
                <input className="border p-1 flex-1" value={f.label} onChange={e=>setSchema(s=>s.map(x=>x.id===f.id?{...x,label:e.target.value}:x))}/>
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!f.required} onChange={e=>setSchema(s=>s.map(x=>x.id===f.id?{...x,required:e.target.checked}:x))}/> נדרש</label>
                <button className="text-red-600" onClick={()=>setSchema(s=>s.filter(x=>x.id!==f.id))}>מחק</button>
              </div>
              {(f.type==="select"||f.type==="radio"||f.type==="checkbox") && (
                <input className="border p-1 mt-2 w-full" value={(f.options||[]).join(", ")} onChange={e=>{
                  const opts=e.target.value.split(",").map(s=>s.trim()).filter(Boolean);
                  setSchema(s=>s.map(x=>x.id===f.id?{...x,options:opts}:x));
                }} placeholder="אפשרויות (מופרד בפסיקים)"/>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button className="border p-2 mt-6" onClick={save}>שמור</button>
    </main>
  );
}

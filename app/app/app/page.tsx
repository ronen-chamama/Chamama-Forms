"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

export default function AppHome() {
  const [uid,setUid]=useState<string>(""); const [forms,setForms]=useState<any[]>([]);
  useEffect(()=>{ const u=onAuthStateChanged(auth,(x)=>{ if(!x) location.href="/login"; else setUid(x.uid); }); return ()=>u();},[]);
  useEffect(()=>{ if(!uid) return; (async()=>{
    const q=query(collection(db,"forms"), where("ownerUid","==",uid));
    const snap=await getDocs(q); setForms(snap.docs.map(d=>({id:d.id,...d.data()})));
  })(); },[uid]);

  async function createNew(){
    const docRef=await addDoc(collection(db,"forms"),{
      ownerUid: uid, title: "טופס חדש", targetGroups: [], notifyStaffEmails: [],
      schema: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    location.href=`/app/forms/${docRef.id}/edit`;
  }

  return (
    <main dir="rtl" className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl mb-4">הטפסים שלי</h1>
      <button className="border p-2 mb-4" onClick={createNew}>+ טופס חדש</button>
      <ul className="space-y-2">
        {forms.map(f=>(
          <li key={f.id} className="border p-2 rounded flex justify-between">
            <div>{f.title}</div>
            <div className="space-x-2 space-x-reverse">
              <a className="underline" href={`/app/forms/${f.id}/edit`}>עריכה</a>
               <a className="underline" href={`/app/forms/${f.id}/submissions`}>הגשות</a>
              <a className="underline" href={`/f/${f.id}`} target="_blank" rel="noopener noreferrer">קישור להורה</a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

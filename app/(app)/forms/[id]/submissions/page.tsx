"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { functions } from "@/lib/firebaseClient";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

type Field = {
  id: string;
  type: "richtext" | "text" | "phone" | "email" | "select" | "radio" | "checkbox" | "signature";
  label: string;
  options?: string[];
  required?: boolean;
};

type Submission = {
  id: string;
  submittedAt?: Timestamp | { seconds: number; nanoseconds: number } | null;
  answers?: Record<string, any>;
  signatureUrl?: string;
  pdfUrl?: string;
  status?: string;
};

function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (ts?.toDate) return ts.toDate();
  if (typeof ts?.seconds === "number") return new Date(ts.seconds * 1000);
  return null;
}

function formatDate(d?: Date | null) {
  if (!d) return "-";
  try {
    return d.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return d.toISOString();
  }
}

                                         
function prettyValue(field: Field | undefined, value: any): string {
  if (value == null) return "";
  if (!field) {
                                                      
    if (Array.isArray(value)) return value.join(", ");
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  }

  switch (field.type) {
    case "checkbox":
      return Array.isArray(value) ? value.join(", ") : String(value);
    case "richtext":
                                  
      return String(value).replace(/<[^>]+>/g, "").trim();
    default:
      return Array.isArray(value) ? value.join(", ") : String(value);
  }
}

export default function SubmissionsPage() {
  const { id: formId } = useParams<{ id: string }>();
  const [uid, setUid] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Submission[]>([]);
  const [schema, setSchema] = useState<Field[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Submission | null>(null);

                 
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) location.href = "/login";
      else setUid(u.uid);
    });
    return () => unsub();
  }, []);

                                      
  useEffect(() => {
    if (!uid) return;
    (async () => {
      setLoading(true);
      try {
                                                
        const f = await getDoc(doc(db, "forms", formId));
        const data = f.data() as any;
        const formSchema: Field[] = (data?.schema || []) as Field[];
        setSchema(formSchema);

                       
        const q = query(
          collection(db, "forms", formId, "submissions"),
          orderBy("submittedAt", "desc")
        );
        const snap = await getDocs(q);
        const arr: Submission[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setItems(arr);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid, formId]);

                                                 
  const fieldById = useMemo(() => {
    const map = new Map<string, Field>();
    schema.forEach((f) => map.set(f.id, f));
    return map;
  }, [schema]);

                                              
  const filtered = useMemo(() => {
    if (!filter.trim()) return items;
    const f = filter.trim().toLowerCase();
    return items.filter((s) => {
      const parts: string[] = [];
      const answers = s.answers || {};
      for (const [fid, val] of Object.entries(answers)) {
        const field = fieldById.get(fid);
        const label = field?.label || fid;
        const pretty = prettyValue(field, val);
        parts.push(`${label}: ${pretty}`);
      }
      return parts.join(" | ").toLowerCase().includes(f);
    });
  }, [items, filter, fieldById]);

  const [making, setMaking] = useState<string | null>(null);

async function makePdfFor(submissionId: string) {
  try {
    setMaking(submissionId);
    const fn = httpsCallable(functions, "makePdf");
    const res: any = await fn({ formId, submissionId });
    const nextUrl: string = res?.data?.pdfUrl || "";
const fileName: string = res?.data?.fileName || `submission-${submissionId}.pdf`;

                    
setItems(prev =>
  prev.map(it => (it.id === submissionId ? { ...it, pdfUrl: nextUrl } : it))
);

                                                        
if (nextUrl) {
  const a = document.createElement("a");
  a.href = nextUrl;
  a.download = fileName;                                                                                          
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
} else {
  console.warn("makePdf returned no pdfUrl", res);
}

  } catch (e:any) {
    alert("שגיאה ביצירת PDF: " + (e?.message || e));
  } finally {
    setMaking(null);
  }
}

                                                                           
  function exportCSV() {
                    
    const fixedHeaders = ["id", "submittedAt", "status", "signatureUrl", "pdfUrl"];
                                      
    const dynamicHeaders = schema.map((f) => f.label);
    const header = [...fixedHeaders, ...dynamicHeaders];

    const rows = filtered.map((s) => {
      const fixed = [
        s.id,
        formatDate(toDate(s.submittedAt)),
        s.status || "",
        s.signatureUrl || "",
        s.pdfUrl || "",
      ];
      const answers = s.answers || {};
      const dynamic = schema.map((f) => prettyValue(f, answers[f.id]));
      return [...fixed, ...dynamic];
    });

    const csv =
      header.join(",") +
      "\n" +
      rows
        .map((r) =>
          r
            .map((cell) => {
              const str = String(cell ?? "");
              if (str.includes(",") || str.includes("\n") || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `submissions-${formId}-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main dir="rtl" className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">הגשות לטופס</h1>
        <div className="flex items-center gap-2">
          <input
            className="border p-2 rounded w-64"
            placeholder="חיפוש לפי שם שדה או ערך…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button onClick={exportCSV} className="border p-2 rounded">
            ייצוא CSV
          </button>
          <a href={`/app/forms/${formId}/edit`} className="border p-2 rounded">
            חזרה לעריכה
          </a>
        </div>
      </div>

      {loading ? (
        <div>טוען…</div>
      ) : filtered.length === 0 ? (
        <div>אין הגשות עדיין.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const date = formatDate(toDate(s.submittedAt));
            const answers = s.answers || {};
            return (
              <div key={s.id} className="border rounded p-3 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">
                    נשלח: {date} | סטטוס: {s.status || "-"}
                  </div>
                  <div className="flex items-center gap-3">
                    {s.signatureUrl ? (
                      <a href={s.signatureUrl} target="_blank" className="underline">
                        חתימה
                      </a>
                    ) : (
                      <span className="text-gray-400">אין חתימה</span>
                    )}
                    { s.pdfUrl ? (
  <a href={s.pdfUrl} target="_blank" className="underline">PDF</a>
) : (
  <button
    onClick={() => makePdfFor(s.id)}
    className="border px-2 py-1 rounded"
    disabled={making === s.id}
    title="הפק מסמך PDF רשמי"
  >
    {making === s.id ? "יוצר…" : "הפק PDF"}
  </button>
)}
                  </div>
                </div>

                <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {schema.map((f) => {
                    const val = answers[f.id];
                    const pv = prettyValue(f, val);
                                                                                       
                    if (f.type === "signature") return null;
                    return (
                      <div key={f.id} className="border rounded p-2">
                        <div className="text-xs text-gray-600 mb-1">{f.label}</div>
                        <div className="text-sm break-words">{pv || <span className="text-gray-400">—</span>}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

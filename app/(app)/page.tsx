"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { COPY } from "@/lib/copy";


type FormListItem = {
  id: string;
  title: string;
  submissionCount?: number;
  publicId?: string;
  updatedAt?: number;
};

export default function MyFormsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const db = useMemo(() => getFirestore(), []);

  // ESC סוגר תפריטים/דיאלוגים
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenuId(null);
        setConfirmDeleteId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // טעינת טפסים + ניקוי טפסים ריקים
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const col1 = collection(db, "users", user.uid, "forms");
      const snap1 = await getDocs(col1);
      const list1 = snap1.docs.map((d) => ({
        id: d.id,
        title: (d.data() as any).title || "ללא כותרת",
        submissionCount: (d.data() as any).submissionCount || 0,
        publicId: (d.data() as any).publicId,
        updatedAt: (d.data() as any).updatedAt,
      })) as FormListItem[];

      const col2 = collection(db, "forms");
      const q2 = query(col2, where("ownerUid", "==", user.uid));
      const snap2 = await getDocs(q2);
      const list2 = snap2.docs.map((d) => ({
        id: d.id,
        title: (d.data() as any).title || "ללא כותרת",
        submissionCount: (d.data() as any).submissionCount || 0,
        publicId: (d.data() as any).publicId,
        updatedAt: (d.data() as any).updatedAt,
      })) as FormListItem[];

      // מאחד כפילויות
      const map = new Map<string, FormListItem>();
      [...list1, ...list2].forEach((f) => map.set(f.id, f));
      let list = Array.from(map.values()).sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
      );

      // ניקוי טפסים ריקים (מחיקה מה-DB + הסרה מהרשימה)
      const cleanedIds = await cleanupEmptyForms(db, user.uid, list.map((f) => f.id));
      if (cleanedIds.size > 0) {
        list = list.filter((f) => !cleanedIds.has(f.id));
      }

      setForms(list);
      setLoading(false);
    })();
  }, [db, user]);

  function newId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  }

  async function createNewForm() {
    if (!user) return;
    const id = newId();
    const payload = {
      title: "ללא כותרת",
      description: "",
      schema: [],
      fields: [],
      formFields: [],
      items: [],
      ownerUid: user.uid,
      createdAt: new Date(),
      updatedAt: Date.now(),
      publicId: id,
      submissionCount: 0,
    };
    await setDoc(doc(db, "forms", id), payload, { merge: true });
    await setDoc(doc(db, "users", user.uid, "forms", id), payload, { merge: true });
    router.push(`/forms/${id}/edit`);
  }

  async function deleteFormEverywhere(id: string, publicId?: string) {
    if (!user) return;
    await deleteDoc(doc(db, "forms", id)).catch(() => {});
    await deleteDoc(doc(db, "users", user.uid, "forms", id)).catch(() => {});
    if (publicId) {
      await deleteDoc(doc(db, "formsPublic", publicId)).catch(() => {});
    }
  }

  async function deleteForm(id: string) {
    const f = forms.find((x) => x.id === id);
    await deleteFormEverywhere(id, f?.publicId);
    setForms((prev) => prev.filter((ff) => ff.id !== id));
    setConfirmDeleteId(null);
    setOpenMenuId(null);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 sm:px-8 py-8" dir="rtl">
      <h1 className="text-2xl font-semibold text-center">{COPY.formsPage.title}</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 md:[grid-template-columns:260px_minmax(0,1fr)]">
        {/* צד ימין – יצירת טופס */}
        <aside>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <button
              onClick={createNewForm}
              className="w-full h-11 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-700"
            >
              {COPY.formsPage.newFormBtn}
            </button>
            <div className="mt-4 text-sm text-neutral-600">
              {COPY.formsPage.newFormHelp}
            </div>
          </div>
        </aside>

        {/* צד שמאל – רשימת טפסים */}
        <section>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-2xl border border-neutral-200 bg-neutral-50 animate-pulse" />
              ))}
            </div>
          ) : forms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-600">
              {COPY.formsPage.emptyState}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => {
                const pubId = (form.publicId && form.publicId.trim()) || form.id;
                const fillUrl =
                  typeof window !== "undefined" ? `${window.location.origin}/f/${pubId}` : `/f/${pubId}`;
                const isOpen = openMenuId === form.id;

                return (
                  <div
                    key={form.id}
                    className="group relative rounded-2xl border border-neutral-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setOpenMenuId((prev) => (prev === form.id ? null : form.id))}
                  >
                    <div className="relative overflow-hidden rounded-t-2xl">
                      <div className="aspect-[16/9] bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200" />
                      <div className="absolute top-2 left-2 opacity-80">
                        <div className="relative w-[110px] h-[26px]">
                          <Image
                            src="/branding/logo-banner-color.png"
                            alt=""
                            fill
                            sizes="110px"
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-base font-semibold line-clamp-2">
                        {form.title || "ללא כותרת"}
                      </div>
                      <div className="mt-1 text-sm text-neutral-600">
                       {COPY.formsPage.filledCount(form.submissionCount ?? 0)}
                      </div>
                    </div>

                    {/* תפריט + קליק-בחוץ + אישור מחיקה קטן */}
                    {isOpen ? (
                      <>
                        {/* BACKDROP גלובלי — לוכד קליקים וסוגר */}
                        <div
                          className="fixed inset-0 z-[100]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            setConfirmDeleteId(null);
                          }}
                        />

                        {/* תפריט */}
                        <div
                          className="absolute z-[110] left-3 top-3 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-full px-3 py-2 text-right hover:bg-neutral-50 text-sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try { await navigator.clipboard.writeText(fillUrl); } catch {}
                              setOpenMenuId(null);
                            }}
                          >
                            {COPY.formsPage.menu.copyLink}
                          </button>

                          <Link
                            href={`/forms/${form.id}/edit`}
                            className="block px-3 py-2 text-right hover:bg-neutral-50 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          >
                            {COPY.formsPage.menu.edit}
                          </Link>

                          <button
                            className="w-full px-3 py-2 text-right hover:bg-neutral-50 text-sm text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(form.id);
                            }}
                          >
                            {COPY.formsPage.menu.delete}
                          </button>
                        </div>

                        {/* אישור מחיקה קטן */}
                        {confirmDeleteId === form.id && (
                          <div
                            className="absolute z-[120] left-3 top-28 w-56 rounded-xl border border-neutral-200 bg-white shadow-xl p-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="text-sm text-neutral-800">
                               {COPY.formsPage.menu.confirmDeleteTitle(form.title)}
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <button
                                className="h-9 px-3 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                {COPY.formsPage.menu.cancel}
                              </button>
                              <button
                                className="h-9 px-3 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                                onClick={() => deleteForm(form.id)}
                              >
                                 {COPY.formsPage.menu.deleteAction}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ===================== Helpers ===================== */

/**
 * מוחק טפסים שהם ריקים לגמרי:
 * - כותרת "ללא כותרת" (או ריקה)
 * - אין description/descriptionHtml
 * - אין schema/fields/formFields/items (כולם ריקים או לא קיימים)
 * - אין הגשות (submissionCount לא קיים או 0)
 *
 * מחיקה משלושת הנתיבים: forms/{id}, users/{uid}/forms/{id}, formsPublic/{publicId}
 * מחזיר set של המזהים שנמחקו.
 */
async function cleanupEmptyForms(
  db: ReturnType<typeof getFirestore>,
  uid: string,
  ids: string[]
): Promise<Set<string>> {
  const cleaned = new Set<string>();

  await Promise.all(
    ids.map(async (id) => {
      try {
        // קורא תחילה את המסמך הראשי
        let snap = await getDoc(doc(db, "forms", id));
        let data: any = snap.exists() ? snap.data() : null;

        // אם אין — נסה מתת-האוסף של המשתמש
        if (!data) {
          const userSnap = await getDoc(doc(db, "users", uid, "forms", id));
          data = userSnap.exists() ? userSnap.data() : null;
        }
        if (!data) return;

        const title = (data.title || "").toString().trim();
        const desc = (data.description || data.descriptionHtml || "").toString().trim();
        const submissionCount = Number(data.submissionCount || 0);

        const schemaLen = Array.isArray(data.schema) ? data.schema.length : 0;
        const fieldsLen = Array.isArray(data.fields) ? data.fields.length : 0;
        const formFieldsLen = Array.isArray(data.formFields) ? data.formFields.length : 0;
        const itemsLen = Array.isArray(data.items) ? data.items.length : 0;

        const noCustomFields =
          schemaLen + fieldsLen + formFieldsLen + itemsLen === 0;

        const isDefaultTitle = title === "" || title === "ללא כותרת";
        const noDesc = desc === "";
        const noSubs = submissionCount <= 0;

        const shouldDelete = isDefaultTitle && noDesc && noCustomFields && noSubs;

        if (shouldDelete) {
          const publicId = (data.publicId || id)?.toString();

          await Promise.allSettled([
            deleteDoc(doc(db, "forms", id)),
            deleteDoc(doc(db, "users", uid, "forms", id)),
            publicId ? deleteDoc(doc(db, "formsPublic", publicId)) : Promise.resolve(),
          ]);

          cleaned.add(id);
        }
      } catch {
        // אי-אפשר לנקות? מתעלמים בשקט.
      }
    })
  );

  return cleaned;
}

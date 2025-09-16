"use client";

import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  orderBy,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebaseClient";
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
  const [heroUrls, setHeroUrls] = useState<Record<string, string>>({});


  // מאזין ל-auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

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

  // טעינת טפסים + ניקוי טפסים ריקים (רק מה-forms הראשי)
  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "forms"),
          where("ownerUid", "==", user.uid),
          orderBy("createdAt", "desc") // לשילוב עם where נדרש אינדקס
        );

        const snap = await getDocs(q);

        let list = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title || "ללא כותרת",
            submissionCount: data.submissionCount || 0,
            publicId: data.publicId,
            updatedAt: data.updatedAt,
          } as FormListItem;
        });

        // מיון בצד לקוח לפי updatedAt (מספר)
        list = list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        // ניקוי טפסים ריקים
        const cleanedIds = await cleanupEmptyForms(db, user.uid, list.map((f) => f.id));
        if (cleanedIds.size > 0) {
          list = list.filter((f) => !cleanedIds.has(f.id));
        }

        setForms(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  useEffect(() => {
  if (!forms || forms.length === 0) {
    setHeroUrls({});
    return;
  }

  const storage = getStorage(); // אם אתה לא על הברירת-מחדל, תן שם באקט: getStorage(undefined, "gs://<your-bucket>")
  let cancelled = false;

  (async () => {
    const tasks = forms.map(async (f) => {
      try {
        const path = `forms/${f.id}/hero.png`;
        const url = await getDownloadURL(storageRef(storage, path));
        return { id: f.id, url };
      } catch {
        return null; // אין תמונה? נשאיר פלס-הולדר
      }
    });

    const results = await Promise.allSettled(tasks);
    if (cancelled) return;

    const map: Record<string, string> = {};
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        map[r.value.id] = r.value.url;
      }
    }
    setHeroUrls(map);
  })();

  return () => { cancelled = true; };
}, [forms]);

  function newId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  }

  async function createNewForm() {
    if (!user) return;

    const id = newId();

    // הכללים נשענים על ownerUid + createdAt
    const payload = {
      title: "ללא כותרת",
      description: "",
      schema: [] as any[],
      fields: [] as any[],
      formFields: [] as any[],
      items: [] as any[],
      ownerUid: user.uid,
      createdAt: serverTimestamp(), // לשימוש ב-orderBy/אינדקס
      updatedAt: Date.now(), // מיון בצד לקוח
      publicId: id,
    };

    try {
      await setDoc(doc(db, "forms", id), payload);

      // ניווט מיידי לעמוד העריכה של הטופס שנוצר
      router.push(`/forms/${id}/edit`);
    } catch (err) {
      console.error("Failed to create form:", err);
      // עדכון UI אופטימי במקרה שתרצה להשאיר:
      setForms((prev) => [
        {
          id,
          title: payload.title,
          submissionCount: 0,
          publicId: id,
          updatedAt: payload.updatedAt,
        },
        ...prev,
      ]);
    }
  }

  async function deleteFormEverywhere(id: string, publicId?: string) {
    // מחיקה רק מהמקומות שאנו מנהלים בפועל
    await deleteDoc(doc(db, "forms", id)).catch(() => {});
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
              const hero = heroUrls[form.id] || null;

              return (
                <div
                  key={form.id}
                  className="group relative rounded-2xl border border-neutral-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setOpenMenuId((prev) => (prev === form.id ? null : form.id))}
                >
                  {/* Hero */}
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <div className="relative aspect-[16/9]">
                      {hero ? (
                        <Image
                          src={hero}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                          priority={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200" />
                      )}
                    </div>

                    {/* לוגו מעל ההירו */}
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

                  {/* גוף הכרטיס */}
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
                            try {
                              await navigator.clipboard.writeText(fillUrl);
                            } catch {}
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

async function cleanupEmptyForms(db: Firestore, uid: string, ids: string[]): Promise<Set<string>> {
  const cleaned = new Set<string>();

  await Promise.all(
    ids.map(async (id) => {
      try {
        // קורא רק את המסמך הראשי
        const snap = await getDoc(doc(db, "forms", id));
        const data: any = snap.exists() ? snap.data() : null;
        if (!data) return;

        const title = (data.title || "").toString().trim();
        const desc = (data.description || data.descriptionHtml || "").toString().trim();
        const submissionCount = Number(data.submissionCount || 0);

        const schemaLen = Array.isArray(data.schema) ? data.schema.length : 0;
        const fieldsLen = Array.isArray(data.fields) ? data.fields.length : 0;
        const formFieldsLen = Array.isArray(data.formFields) ? data.formFields.length : 0;
        const itemsLen = Array.isArray(data.items) ? data.items.length : 0;

        const noCustomFields = schemaLen + fieldsLen + formFieldsLen + itemsLen === 0;

        const isDefaultTitle = title === "" || title === "ללא כותרת";
        const noDesc = desc === "";
        const noSubs = submissionCount <= 0;

        const shouldDelete = isDefaultTitle && noDesc && noCustomFields && noSubs;

        if (shouldDelete) {
          const publicId = (data.publicId || id)?.toString();

          await Promise.allSettled([
            deleteDoc(doc(db, "forms", id)),
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

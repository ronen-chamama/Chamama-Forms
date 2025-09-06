"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";

type ChamamaForm = {
  id: string;
  title: string;
  publicId?: string;
  stats?: { submissionCount?: number };
  createdAt?: any;
};

export default function AppHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [forms, setForms] = useState<ChamamaForm[] | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore();

    const q1 = query(
      collection(db, "forms"),
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub1 = onSnapshot(q1, (snap) => {
      if (!snap.empty) {
        setForms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } else {
        const q2 = query(
          collection(db, "users", user.uid, "forms"),
          orderBy("createdAt", "desc")
        );
        const unsub2 = onSnapshot(q2, (snap2) => {
          setForms(snap2.empty ? [] : snap2.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        });
        return unsub2;
      }
    });

    return () => unsub1();
  }, [user]);

  const origin = useMemo(() => (typeof window === "undefined" ? "" : window.location.origin), []);
  const formFillUrl = (f: ChamamaForm) => `${origin}/f/${f.publicId || f.id}`;

  async function copyFillLink(f: ChamamaForm) {
    try {
      await navigator.clipboard.writeText(formFillUrl(f));
    } finally {
      setOpenMenuId(null); // סוגר את התפריט אחרי העתקה
    }
  }

  function editForm(f: ChamamaForm) {
    router.push(`/forms/${f.id}/edit`); // נתיב מוחלט
  }

  async function deleteForm(f: ChamamaForm) {
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, "forms", f.id));
    } catch {
      if (user) await deleteDoc(doc(db, "users", user.uid, "forms", f.id));
    }
    setOpenMenuId(null);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 sm:px-8 py-8">
      <div className="grid grid-cols-1 gap-6 md:[grid-template-columns:320px_minmax(0,1fr)]">
        {/* סיידבר (ימין) */}
        <aside className="md:pt-4">
          <div className="sticky top-24 space-y-4">
            {/* שימוש ב-<Link> עם href מוחלט */}
            <Link
              href="/forms/new"
              prefetch={false}
              className="w-full h-12 rounded-2xl bg-sky-600 text-white text-base font-semibold shadow-sm hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 grid place-items-center"
            >
              טופס חדש
            </Link>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
              כאן נוסיף מסננים/תיוגים (בקרוב).
            </div>
          </div>
        </aside>

        {/* תוכן (שמאל) */}
        <section>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-center">הטפסים שלי</h1>
          </div>

          {forms === null ? (
            <CardsSkeleton />
          ) : forms.length === 0 ? (
            <div className="text-neutral-600 text-sm border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
              אין עדיין טפסים. לחצו על “טופס חדש” כדי להתחיל.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {forms.map((f) => (
                <FormCard
                  key={f.id}
                  form={f}
                  open={openMenuId === f.id}
                  onToggle={() => setOpenMenuId((v) => (v === f.id ? null : f.id))}
                  onClose={() => setOpenMenuId(null)}
                  onCopy={() => copyFillLink(f)}
                  onEdit={() => editForm(f)}
                  onDelete={() => deleteForm(f)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FormCard({
  form,
  open,
  onToggle,
  onClose,
  onCopy,
  onEdit,
  onDelete,
}: {
  form: ChamamaForm;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // אם התפריט נסגר, ודא שסוגרים גם את חלון האישור
  useEffect(() => {
    if (!open) setConfirmOpen(false);
  }, [open]);

  return (
    // כל הכרטיס לחיץ לפתיחת התפריט
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="group relative rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
    >
      {/* תמונת placeholder 16:9 */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="aspect-[16/9] bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200" />
        <div className="absolute top-2 left-2 opacity-80 pointer-events-none">
          <div className="relative w-[128px] h-[30px]">
            <Image
              src="/branding/logo-banner-color.png"
              alt=""
              fill
              sizes="128px"
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* גוף הכרטיס */}
      <div className="w-full text-right p-5">
        <div className="font-medium truncate text-[15px]">{form.title || "ללא כותרת"}</div>
        <div className="mt-1.5 text-sm text-neutral-500">
          {(form.stats?.submissionCount ?? 0).toLocaleString("he-IL")} טפסים מולאו
        </div>
      </div>

      {/* תפריט נפתח */}
      {open && (
        <>
          <div
            role="menu"
            onClick={(e) => e.stopPropagation()} // לא לסגור כשנלחץ בתוך התפריט
            className="absolute top-3 left-3 z-30 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl"
          >
            <button
              className="w-full text-right px-3 py-2 text-sm hover:bg-neutral-50"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            >
              העתקת קישור למילוי
            </button>
            <button
              className="w-full text-right px-3 py-2 text-sm hover:bg-neutral-50"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              עריכה
            </button>
            <button
              className="w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true); // פותח חלונית אישור מחיקה
              }}
            >
              מחיקה
            </button>
          </div>

          {/* חלונית אישור מחיקה — לצד התפריט */}
          {confirmOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 z-40 w-60 rounded-xl border border-neutral-200 bg-white shadow-2xl p-3 text-sm"
              style={{ left: "calc(0.75rem + 13rem + 0.5rem)" }} // 0.75rem (left-3) + 13rem (w-52) + 0.5rem רווח
            >
              <div className="font-medium mb-2 truncate">
                למחוק את “{form.title || "ללא כותרת"}”?
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  className="h-8 px-3 rounded-md border border-neutral-300 hover:bg-neutral-50"
                  onClick={() => setConfirmOpen(false)}
                >
                  ביטול
                </button>
                <button
                  className="h-8 px-3 rounded-md bg-red-600 text-white hover:bg-red-700"
                  onClick={() => onDelete()}
                >
                  מחק
                </button>
              </div>
            </div>
          )}

          {/* שכבת כיסוי — סגירה בלחיצה מחוץ */}
          <button
            aria-label="סגור תפריט"
            className="fixed inset-0 z-20 cursor-default"
            onClick={onClose}
          />
        </>
      )}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="aspect-[16/9] bg-neutral-200 animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-4/5 bg-neutral-200 animate-pulse rounded" />
            <div className="h-3 w-2/5 bg-neutral-200 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";


export default function LoginPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
   const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/");
    });
    return () => unsub();
  }, [router]);


  async function loginWithGoogle() {
    setErr(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      // הניווט נעשה ב-onAuthStateChanged
    } catch (e: any) {
      const code = e?.code || "";
      if (code === "permission-denied" || code === "auth/permission-denied") {
        setErr("אין לך הרשאה להיכנס. פנה/י לרונן להוספה לרשימת מורשים.");
      } else if (code === "auth/popup-closed-by-user") {
        setErr("החלון נסגר לפני סיום ההתחברות.");
      } else {
        setErr("התחברות עם Google נכשלה. נסו שוב.");
      }
    } finally {
      setLoading(false);
    }
  }

 useEffect(() => {
  const key = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const folder = process.env.NEXT_PUBLIC_LOGIN_PHOTOS_FOLDER;
  if (!key || !folder) return;

  (async () => {
    try {
      // מביאים גם thumbnailLink + webContentLink
      const q = encodeURIComponent(`'${folder}' in parents and mimeType contains 'image/' and trashed=false`);
      const fields = encodeURIComponent("files(id,name,mimeType,thumbnailLink,webContentLink)");
      const url =
        `https://www.googleapis.com/drive/v3/files?q=${q}` +
        `&fields=${fields}` +
        `&pageSize=50&orderBy=modifiedTime desc` +
        `&includeItemsFromAllDrives=true&supportsAllDrives=true` +
        `&key=${key}`;

      console.log("[login photo] fetch list", { url });
      const res = await fetch(url);
      if (!res.ok) throw new Error(`list failed ${res.status}`);
      const json = await res.json();
      const files: Array<{ id: string; name: string; mimeType: string; thumbnailLink?: string; webContentLink?: string }> = json?.files || [];
      console.log("[login photo] files:", files.length);
      if (!files.length) return;

      const pick = files[Math.floor(Math.random() * files.length)];

      // 1) מועדף: thumbnailLink (להגדיל רזולוציה)
      let urlImg =
        (pick.thumbnailLink && pick.thumbnailLink.replace(/=s\d+(-c)?$/i, "=s2000")) ||
        // 2) fallback יציב לציבורי:
        `https://drive.google.com/uc?export=view&id=${pick.id}`;

      // למקרה של קאש קשוח בזמן פיתוח:
      urlImg += (urlImg.includes("?") ? "&" : "?") + "t=" + Date.now();

      setPhotoUrl(urlImg);
    } catch (e) {
      console.warn("[login photo] error", e);
    }
  })();
}, []);

  return (
    <main dir="rtl" className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-neutral-50">
      {/* ימין: כרטיס התחברות עם לוגו */}
      <section className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 md:p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            <Image
  src="/branding/logo-squer-color.png"
  alt="תיכון החממה"
  width={120}
  height={120}
  priority
  style={{ width: "auto", height: "auto" }} // או אל תשנה בכלל ב-CSS
/>
            <h1 className="text-2xl font-semibold text-neutral-900">ברוכ.ה הבא.ה</h1>
            <p className="text-sm text-neutral-500">התחברות למערכת הטפסים</p>
          </div>

          {/* הודעת שגיאה (אם יש) */}
          {err && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
              {err}
            </div>
          )}

          {/* כפתור התחברות עם Google — שומר על אותו סטייל/מידות של הכפתור הקודם */}
          <button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full h-11 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 inline-flex items-center justify-center gap-2"
          >
            {/* אייקון Google קטן (inline SVG) */}
            <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.7 3.4-5.5 3.4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.7C16.9 2.9 14.7 2 12 2 6.9 2 2.7 6.2 2.7 11.3S6.9 20.7 12 20.7c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.2H12z"/>
            </svg>
            {loading ? "מתחבר…" : "התחברות עם Google"}
          </button>

          <p className="mt-6 text-center text-sm text-neutral-500">
            לא מצליח.ה להתחבר? חפש.י את טל, אור או רונן.
          </p>
        </div>
      </section>

         {/* שמאל: מסגרת 80% עם תמונה */}
      <section className="hidden md:flex items-center justify-center bg-neutral-900 text-white">
  <div className="group relative w-[80%] h-[80%] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
    {photoUrl ? (
      <Image
        src={photoUrl}
        alt="תמונת השראה"
        fill
        className="
  object-cover
sepia
  transform transform-gpu origin-center scale-100
  transition duration-3000 ease-in-out           /* ← כולל גם filter וגם transform */
  group-hover:sepia-0 group-hover:scale-[1.035]
  motion-reduce:transition-none motion-reduce:transform-none
"
        sizes="(max-width: 1024px) 50vw, 50vw"
        priority
        unoptimized
        style={{ willChange: "transform, filter" }}
      />
    ) : (
      <div className="w-full h-full grid place-items-center text-white/70">
        טוען תמונה…
      </div>
    )}
  </div>
</section>
    </main>
  );
}

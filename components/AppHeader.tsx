// components/AppHeader.tsx
"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function AppHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function doSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  const display = user?.displayName || user?.email || "משתמש/ת";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-neutral-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 lg:h-20 flex items-center justify-between">
        {/* ימין: לוגו באנר בתוך קונטיינר עם clamp כך שלא יקטן מתחת ל-64px */}
        <div className="shrink-0 relative"
             style={{
               height: "clamp(64px, 7vw, 88px)",   // מינימום 64px, גדל עד 88px
               width:  "clamp(200px, 26vw, 340px)" // מינימום 200px, גדל עד 340px
             }}>
          <Image
            src="/branding/logo-banner-color.png"
            alt="תיכון החממה"
            fill
            priority
            sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 340px"
            className="object-contain"
          />
        </div>

        {/* שמאל: תפריט משתמש */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="select-none rounded-lg border border-neutral-300 bg-white shadow-sm px-3 h-9 inline-flex items-center gap-2 text-sm hover:bg-neutral-50"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="inline-block size-5 rounded-md bg-sky-600 text-white grid place-items-center">
              {(display[0] || "?").toUpperCase()}
            </span>
            <span className="max-w-[28ch] truncate">{display}</span>
          </button>

          {open && (
            <div
              role="menu"
              className="absolute left-0 mt-2 w-44 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden"
            >
              <button
                role="menuitem"
                onClick={doSignOut}
                className="w-full text-right px-3 py-2 text-sm hover:bg-neutral-50"
              >
                התנתקות
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

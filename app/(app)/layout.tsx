// app/(app)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import EmuPadding from "@/components/EmuPadding";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    });
    return () => unsub();
  }, [router]);

  // בזמן בדיקה/הפניה לא מציגים את התוכן
  if (!ready) {
    return (
      <div className="min-h-dvh grid place-items-center bg-neutral-50" dir="rtl">
        <div className="text-neutral-500 animate-pulse">טוען…</div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-dvh flex flex-col bg-neutral-50" dir="rtl">
        <EmuPadding />
        <AppHeader />
        <main className="flex-1">{children}</main>
        <AppFooter />
      </div>
    </RequireAuth>
  );
}

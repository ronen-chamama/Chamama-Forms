// app/forms/new/page.js
"use client";
import useUser from "../../../hooks/useUser";
import { useRouter } from "next/navigation";

export default function NewFormPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) return <p>טוען...</p>;
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div dir="rtl">
      <h1>יצירת טופס חדש</h1>
      {/* כאן נבנה בהמשך את ממשק בניית הטופס */}
    </div>
  );
}

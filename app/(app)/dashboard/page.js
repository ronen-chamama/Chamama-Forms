// app/dashboard/page.js
"use client";
import { useRouter } from "next/navigation";
import useUser from "../../hooks/useUser";

export default function DashboardPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) return <p>טוען...</p>;
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div dir="rtl">
      <h1>דשבורד</h1>
      <p>שלום {user.email}</p>
      <a href="/forms/new">יצירת טופס חדש</a>
      {/* כאן תוצג רשימת הטפסים בעתיד */}
    </div>
  );
}

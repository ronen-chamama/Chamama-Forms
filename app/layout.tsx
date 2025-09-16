// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Chamama Forms – החממה",
    template: "%s – Chamama Forms"
  },
  description: "מערכת טפסים להורים ולתלמידים בתיכון החממה"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}

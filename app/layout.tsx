// app/layout.tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}

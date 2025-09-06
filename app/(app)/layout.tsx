// app/(app)/layout.tsx
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import EmuPadding from "@/components/EmuPadding";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ paddingBottom: "var(--emu-bottom, 0px)" }}>
      <EmuPadding />
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}

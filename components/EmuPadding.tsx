// components/EmuPadding.tsx
"use client";
import { useEffect } from "react";

export default function EmuPadding() {
  useEffect(() => {
    const sel = "#firebase-emulator-warning, [id*='emulator'], [class*='emulator']";

    function measureAndSet() {
      const cands = Array.from(document.querySelectorAll<HTMLElement>(sel)).filter((el) => {
        const s = getComputedStyle(el);
        return s.position === "fixed" && s.bottom === "0px" && el.offsetHeight > 0;
      });
      const h = cands.length ? Math.max(...cands.map((el) => el.offsetHeight)) : 0;
      document.documentElement.style.setProperty("--emu-bottom", h ? `${h + 8}px` : "0px");
    }

    measureAndSet();
    const mo = new MutationObserver(measureAndSet);
    mo.observe(document.body, { subtree: true, childList: true, attributes: true });
    window.addEventListener("resize", measureAndSet);

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", measureAndSet);
      document.documentElement.style.removeProperty("--emu-bottom");
    };
  }, []);
  return null;
}

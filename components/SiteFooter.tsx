"use client";

import { Feedback } from "./Feedback";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const isHome = usePathname() === "/";

  return (
    <footer className={isHome ? "bg-ink text-paper" : "bg-white text-ink"}>
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-14 lg:py-14">
        <p className="text-xl font-semibold tracking-normal sm:text-2xl">
          The laboratory, redefined.
        </p>
        <p className={`mt-2 text-sm font-light leading-6 sm:text-base ${isHome ? "text-paper/65" : "text-ink/65"}`}>
          Begin the BindLab era of doing science.
        </p>
        <div className={`mt-9 text-sm font-light leading-7 sm:flex sm:items-end sm:justify-between sm:gap-8 sm:text-base ${isHome ? "text-paper/55" : "text-ink/60"}`}>
          <p>© 2026 BindLab AI.</p>
          <p
            className="whitespace-nowrap tracking-normal"
            style={{ fontSize: "clamp(0.625rem, 2.55vw, 1rem)" }}
          >
            Developed and Engineered in Hong Kong by BindLab AI.
          </p>
        </div>
        <nav aria-label="Legal" className={`mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm ${isHome ? "text-paper/65" : "text-ink/65"}`}>
          <Link href="/dashboard">Researcher dashboard</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-handling">Data Handling</Link>
        </nav>
        <Feedback />
      </div>
    </footer>
  );
}

"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BindLabLogo } from "./BindLabLogo";

const leftLinks = [
  { label: "About", href: "/about" },
  { label: "Calculators", href: "/dashboard/calculators" }
];

const rightLinks = [
  { label: "Resources", href: "/#resources" },
  { label: "Lab Guides", href: "/#lab-guides" }
];

export function HomeNavbar({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [isOpen, setIsOpen] = useState(false);
  const allLinks = [...leftLinks, ...rightLinks];
  const linkClass = tone === "light"
    ? "text-white/90 hover:text-white"
    : "text-ink/68 hover:text-ink";
  const dividerClass = tone === "light" ? "border-white/[0.55]" : "border-ink/12";
  const menuButtonClass = tone === "light" ? "text-white" : "text-ink";
  const mobileMenuClass = tone === "light"
    ? "border-white/20 bg-black/35 text-white backdrop-blur-md"
    : "border-ink/10 bg-paper/80 text-ink backdrop-blur-md";
  const mobileLinkClass = tone === "light"
    ? "text-white/84 hover:bg-white/10 hover:text-white"
    : "text-ink/70 hover:bg-ink/5 hover:text-ink";

  return (
    <header className="absolute left-0 right-0 top-0 z-20">
      <div className="px-5 py-6 sm:px-8 md:px-14 lg:px-[72px] lg:py-9">
        <div className={`border-b pb-5 ${dividerClass}`}>
          <div className="relative grid w-full grid-cols-[auto_1fr_auto] items-center md:grid-cols-[1fr_auto_1fr]">
            <nav className="hidden justify-end gap-[clamp(80px,9vw,150px)] pr-[clamp(80px,8vw,140px)] md:col-start-1 md:flex">
              {leftLinks.map((link) => (
                <a key={link.href} href={link.href} className={`text-[12px] font-semibold uppercase tracking-[0.30em] transition duration-300 ${linkClass}`}>
                  {link.label}
                </a>
              ))}
            </nav>

            <Link href="/" className="col-start-1 flex items-center justify-start md:col-start-2 md:justify-center" aria-label="BindLab home">
              <BindLabLogo tone={tone} />
            </Link>

            <nav className="hidden justify-start gap-[clamp(80px,9vw,150px)] pl-[clamp(80px,8vw,140px)] md:col-start-3 md:flex">
              {rightLinks.map((link) => (
                <a key={link.href} href={link.href} className={`text-[12px] font-semibold uppercase tracking-[0.30em] transition duration-300 ${linkClass}`}>
                  {link.label}
                </a>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 md:hidden ${menuButtonClass}`}
              aria-label="Toggle navigation"
              aria-expanded={isOpen}
            >
              <Menu size={28} strokeWidth={2.25} />
            </button>
          </div>

          {isOpen && (
            <nav className={`mt-5 grid gap-2 border-t py-4 md:hidden ${mobileMenuClass}`}>
              {allLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-md px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.26em] transition ${mobileLinkClass}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

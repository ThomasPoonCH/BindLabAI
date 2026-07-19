import Link from "next/link";
import { Activity, Calculator, ClipboardList, FlaskConical, LayoutDashboard, Microscope, Plus } from "lucide-react";
import { BindLabLogo } from "./BindLabLogo";

const navItems = [
  { href: "/dashboard/reaction/new", label: "New Reaction", icon: Plus },
  { href: "/", label: "Home", icon: FlaskConical },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bench-mode-demo", label: "Live Bench Demo", icon: Activity },
  { href: "/dashboard/calculators", label: "Calculators", icon: Calculator },
  { href: "/analysis", label: "Analysis Plans", icon: Microscope },
  { href: "/dashboard/experiments", label: "Experiments", icon: ClipboardList }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="BindLab home">
            <BindLabLogo compact />
          </Link>
          <nav className="flex max-w-full items-center gap-1 overflow-x-auto text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isPrimary = item.href === "/dashboard/reaction/new";
              return (
                <Link
                  key={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 transition ${isPrimary ? "bg-ink text-paper hover:bg-ink/90" : "text-ink/75 hover:bg-ink/5"}`}
                  href={item.href}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

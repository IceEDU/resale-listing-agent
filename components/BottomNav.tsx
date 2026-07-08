"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" },
  { href: "/listings", label: "Listings", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/new", label: "Sell", icon: "M12 5v14M5 12h14", primary: true },
  {
    href: "/recommendations",
    label: "For you",
    icon: "M12 3l2.5 6H21l-5 4 2 7-6-4.5L6 20l2-7-5-4h6.5z",
  },
  { href: "/more", label: "More", icon: "M5 12h.01M12 12h.01M19 12h.01" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/25"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d={tab.icon} />
                </svg>
              </Link>
            );
          }
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] ${
                active ? "text-white" : "text-zinc-500"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

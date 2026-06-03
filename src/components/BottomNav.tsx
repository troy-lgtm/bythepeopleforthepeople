"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Landmark, Megaphone, Search } from "lucide-react";

type Tab = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  action?: "search";
  match?: (p: string) => boolean;
};

const TABS: Tab[] = [
  { label: "Home", icon: Home, href: "/", match: (p) => p === "/" },
  { label: "Causes", icon: Megaphone, href: "/causes", match: (p) => p.startsWith("/causes") },
  { label: "Search", icon: Search, action: "search" },
  { label: "Reps", icon: Landmark, href: "/federal", match: (p) => p.startsWith("/federal") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-record-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match ? tab.match(pathname) : false;
          const tone = active ? "text-civic-700" : "text-ink-600";
          const inner = (
            <>
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold tracking-wide">
                {tab.label}
              </span>
            </>
          );

          if (tab.action === "search") {
            return (
              <li key="search" className="flex-1">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new Event("btp:open-search"))
                  }
                  className={`flex h-14 w-full flex-col items-center justify-center gap-0.5 ${tone}`}
                >
                  {inner}
                </button>
              </li>
            );
          }

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href ?? "/"}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 w-full flex-col items-center justify-center gap-0.5 ${tone}`}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

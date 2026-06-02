import Link from "next/link";
import { Landmark } from "lucide-react";
import { readPlace } from "@/lib/place";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { PlacePicker } from "./PlacePicker";
import { UniversalSearch } from "./UniversalSearch";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/causes", label: "Causes" },
  { href: "/federal", label: "Reps" },
  { href: "/near-me", label: "Near me" },
  { href: "/activity", label: "Upcoming" },
  { href: "/sources", label: "Sources" },
];

const trustLinks = [
  { href: "/about", label: "About / Governance" },
  { href: "/methodology", label: "Methodology" },
  { href: "/corrections", label: "Corrections log" },
  { href: "/changelog", label: "Changelog" },
  { href: "/developers", label: "Developers + API" },
  { href: "/share", label: "Share a sourced fact" },
];

export async function Header() {
  const place = await readPlace();
  const placeLabel = place ? `${place.city} ${place.zip}` : null;

  return (
    <header className="sticky top-0 z-40 border-b border-record-200 bg-paper-50/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-800 bg-ink-950 text-white">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-wide text-ink-950">
              By The People, For The People
            </span>
            <span className="block truncate text-xs text-ink-600">
              Public Decision Intelligence
            </span>
          </span>
        </Link>

        <NavLinks items={navItems} />

        <div className="flex items-center gap-2">
          <PlacePicker
            currentZip={place?.zip ?? null}
            currentLabel={placeLabel}
            className="hidden sm:inline-flex"
          />
          <UniversalSearch />
          <MobileMenu items={navItems} trustLinks={trustLinks} />
        </div>
      </div>
    </header>
  );
}

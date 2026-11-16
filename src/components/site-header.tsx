import Link from "next/link";

import { DesktopNav, MobileNav } from "@/components/nav-links";

/** Server Component; only the nav links (active state, mobile sheet) run on the client. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Flan
        </Link>
        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  );
}

"use client";

import { cn } from "cn";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/recipes", label: "Recipes" },
  { href: "/plans", label: "Plans" },
] as const;

/** True for the item's own page and anything beneath it (e.g. /recipes/12). */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            isActive(href) && "font-medium text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const isActive = useIsActive();
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            aria-label="Open menu"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Flan</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col gap-1 px-2">
          {navItems.map(({ href, label }) => (
            // Closing the sheet on click; `nativeButton={false}` because it renders a link.
            <SheetClose
              key={href}
              nativeButton={false}
              render={
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                />
              }
              className={cn(
                "rounded-md px-3 py-2 text-base text-muted-foreground hover:bg-muted hover:text-foreground",
                isActive(href) && "font-medium text-foreground",
              )}
            >
              {label}
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

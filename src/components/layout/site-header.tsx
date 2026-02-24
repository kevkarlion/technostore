"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const mainNav = [
  { href: "/", label: "Home" },
  { href: "/category/laptops", label: "Laptops" },
  { href: "/category/components", label: "Components" },
  { href: "/category/peripherals", label: "Peripherals" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="TechnoStore home"
        >
          <span className="relative h-9 w-auto sm:h-10">
            <Image
              src="/logo2.png"
              alt="TechnoStore"
              width={120}
              height={40}
              className="block h-9 w-auto object-contain object-left sm:hidden"
              priority
            />
            <Image
              src="/logo-texto.png"
              alt="TechnoStore"
              width={160}
              height={40}
              className="hidden h-10 w-auto object-contain object-left sm:block"
              priority
            />
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-between gap-8 md:flex">
          <div className="flex items-center gap-4 text-xs font-medium text-[var(--foreground-muted)]">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                  pathname === item.href && "bg-[var(--surface)] text-[var(--foreground)]"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
            <Link
              href="/search"
              className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            >
              Search products
            </Link>
            <Link
              href="/cart"
              aria-label="Open cart"
              className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--background)] shadow-sm transition hover:opacity-90"
            >
              Cart
            </Link>
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-3 md:hidden">
          <Link
            href="/search"
            aria-label="Search products"
            className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            Search
          </Link>
          <Link
            href="/cart"
            aria-label="Open cart"
            className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--background)] shadow-sm transition hover:opacity-90"
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}

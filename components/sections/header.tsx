"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Moon, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { assets } from "@/lib/assets";

const navItems = [
  { label: "Apartments", href: "/properties" },
  { label: "Shared Rooms", href: "/search?type=shared" },
  { label: "Universities", href: "/universities" },
  { label: "Student Housing", href: "/dashboard" },
  { label: "Resources", href: "/contact" }
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-2xl">
      <div className="relative mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 py-4 md:h-20 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="StudentNest home">
          <Image src={assets.logo} alt="" width={32} height={32} className="h-8 w-8" />
          <span className="text-[19px] font-extrabold leading-[1.3] text-[var(--secondary)]">StudentNest</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-bold leading-[1.5] text-[var(--muted-strong)] xl:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="transition hover:text-[var(--primary)]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 xl:flex">
          <button
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-strong)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            type="button"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Button asChild variant="outline">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signup">Sign up</Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="xl:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </Button>
      </div>
      <AnimatePresence>
      {open ? (
        <motion.div
          className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-4 shadow-[0_18px_36px_rgba(14,8,84,0.08)] xl:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18 }}
        >
          <nav className="mx-auto grid max-w-[720px] gap-3 text-[15px] font-medium" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-[12px] px-3 py-3 hover:bg-[var(--surface)]" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
              <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />} Theme
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/login" onClick={() => setOpen(false)}>Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup" onClick={() => setOpen(false)}>Sign up</Link>
              </Button>
            </div>
          </nav>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </header>
  );
}

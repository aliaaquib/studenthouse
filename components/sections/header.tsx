"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/hooks/use-theme";
import { useTypingWords } from "@/hooks/use-typing-words";
import { assets } from "@/lib/assets";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Add property", href: "/add-property" },
  { label: "Contact", href: "/contact" }
];

const searchWords = ["area", "city", "property", "university"];

function getDashboardTarget(role?: string | null) {
  if (role === "admin") {
    return { href: "/admin/dashboard", label: "Admin" };
  }
  if (role === "agent") {
    return { href: "/agent", label: "Agent" };
  }
  return { href: "/dashboard", label: "Dashboard" };
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const scrollStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDark, toggleTheme } = useTheme();
  const { profile, supabase } = useAuth();
  const typedWord = useTypingWords(searchWords);
  const dashboardTarget = getDashboardTarget(profile?.role);

  useEffect(() => {
    function showAfterScrollStops() {
      if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
      scrollStopTimer.current = setTimeout(() => {
        setHidden(false);
      }, 520);
    }

    function handleScroll() {
      const isScrolled = window.scrollY > 8;
      setScrolled(isScrolled);
      if (isScrolled) {
        setHidden(true);
      }
      showAfterScrollStops();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams({ region: "Jalal-Abad" });
    if (query.trim()) params.set("q", query.trim());
    setSearchOpen(false);
    setOpen(false);
    router.push(`/search?${params.toString()}`);
  }

  async function handleLogout() {
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
    <header className={`theme-transition fixed left-0 right-0 top-0 z-50 mx-auto w-full max-w-[1440px] border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${hidden && !open && !searchOpen ? "-translate-y-full" : "translate-y-0"}`}>
      <div className={`relative mx-auto flex h-18 max-w-[1440px] items-center px-5 py-4 md:h-20 lg:px-10 ${searchOpen ? "justify-center" : "justify-between"}`}>
        {searchOpen ? (
          <form className="theme-transition motion-surface flex h-11 min-w-0 w-full max-w-[620px] items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]" onSubmit={handleSearch}>
            <span className="hidden h-full shrink-0 items-center border-r border-[var(--border)] px-4 text-[13px] font-medium text-[var(--foreground)] sm:flex">Jalal-Abad</span>
            <label className="relative flex min-w-0 flex-1 items-center px-3">
              <Search size={16} className="mr-2 shrink-0 text-[var(--primary)]" />
              {!query ? (
                <span className="pointer-events-none absolute left-10 flex items-center gap-1 text-[13px] font-light text-[var(--muted)]">
                  <span>Search by</span>
                  <span className="search-typing-word">{typedWord}</span>
                </span>
              ) : null}
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="relative z-10 min-w-0 flex-1 bg-transparent text-[14px] font-light outline-none"
                aria-label="Search property"
                autoFocus
              />
            </label>
            <button type="submit" className="focus-ring mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white" aria-label="Search">
              <Search size={16} />
            </button>
            <button type="button" className="focus-ring mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)]" onClick={() => setSearchOpen(false)} aria-label="Close search">
              <X size={16} />
            </button>
          </form>
        ) : (
          <Link href="/" className="flex items-center gap-3" aria-label="StudentNest home">
            <Image src={assets.logo} alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-[19px] font-bold leading-[1.3] text-[var(--secondary)]">StudentNest</span>
          </Link>
        )}
        {!searchOpen ? (
          <nav className="hidden items-center gap-7 text-[13px] font-medium leading-[1.5] text-[var(--muted-strong)] xl:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={`transition hover:text-[var(--primary)] ${active ? "nav-link-active" : ""}`}>
                  {item.label}
                </Link>
              );
            })}
            {scrolled ? (
              <button
                type="button"
                className="focus-ring flex h-10 items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--card)] text-[13px] font-medium text-[var(--foreground)] shadow-[var(--shadow-card)] transition hover:border-[var(--primary)]"
                onClick={() => setSearchOpen(true)}
                aria-label="Open property search"
              >
                <span className="border-r border-[var(--border)] px-4">Jalal-Abad</span>
                <span className="flex h-10 w-10 items-center justify-center text-[var(--primary)]">
                  <Search size={16} />
                </span>
              </button>
            ) : null}
          </nav>
        ) : null}
        {!searchOpen && scrolled ? (
          <button
            type="button"
            className="focus-ring ml-auto mr-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-card)] xl:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="Open property search"
          >
            <Search size={16} />
          </button>
        ) : null}
        <div className={`${searchOpen ? "hidden" : "hidden xl:flex"} items-center gap-3`}>
          <button
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-strong)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            type="button"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {profile ? (
            <>
              <Button asChild variant="outline">
                <Link href={dashboardTarget.href}>{dashboardTarget.label}</Link>
              </Button>
              <Button type="button" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
        {!searchOpen ? <Button
          variant="ghost"
          size="sm"
          className="xl:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </Button> : null}
      </div>
      <AnimatePresence>
      {open ? (
        <motion.div
          className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-4 shadow-[0_18px_36px_rgba(14,8,84,0.08)] xl:hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <nav className="mx-auto grid max-w-[720px] gap-3 text-[15px] font-medium" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-[12px] px-3 py-3 hover:bg-[var(--surface)] ${active ? "nav-link-active" : ""}`} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 grid gap-3 sm:grid-cols-[auto_1fr_1fr]">
              <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />} Theme
              </Button>
              {profile ? (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href={dashboardTarget.href} onClick={() => setOpen(false)}>{dashboardTarget.label}</Link>
                  </Button>
                  <Button size="sm" type="button" onClick={() => { void handleLogout(); setOpen(false); }}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth/login" onClick={() => setOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/signup" onClick={() => setOpen(false)}>Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </header>
    <div className="h-18 md:h-20" aria-hidden="true" />
    </>
  );
}

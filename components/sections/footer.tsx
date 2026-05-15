import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { assets } from "@/lib/assets";

const columns = [
  {
    title: "STUDENTS",
    links: [
      { label: "Find Apartments", href: "/properties" },
      { label: "Shared Rooms", href: "/shared-rooms" },
      { label: "Roommates", href: "/roommates" }
    ]
  },
  {
    title: "UNIVERSITIES",
    links: [
      { label: "Browse Universities", href: "/universities" },
      { label: "Popular Locations", href: "/popular-locations" }
    ]
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Help Center", href: "/help-center" },
      { label: "Safety Tips", href: "/safety-tips" },
      { label: "Contact", href: "/contact" }
    ]
  },
  {
    title: "COMPANY",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" }
    ]
  }
] as const;

export function Footer() {
  return (
    <footer className="bg-[var(--background)] py-16">
      <div className="section-frame">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          <Link href="/" className="flex h-10 items-center gap-3">
            <Image src={assets.logo} alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-[20px] font-bold leading-[1.4] text-[var(--secondary)]">StudentNest</span>
          </Link>
          <nav className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4" aria-label="Footer navigation">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[13px] font-semibold leading-[1.5] tracking-[0.08em]">{column.title}</h3>
                <ul className="mt-4 space-y-3 text-[14px] font-normal leading-[1.5] text-[var(--muted)]">
                  {column.links.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="hover:text-[var(--primary)]">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-6 border-t border-[var(--border)] pt-8 text-[14px] font-normal text-[var(--muted)] md:flex-row md:items-center md:justify-between">
          <p>©2026 StudentNest. All rights reserved.</p>
          <div className="flex gap-10 text-[var(--foreground)]">
            {[Facebook, Instagram, Twitter, Linkedin].map((Icon, index) => (
              <Link key={index} href="/contact" aria-label={`Social link ${index + 1}`} className="hover:text-[var(--primary)]">
                <Icon size={24} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

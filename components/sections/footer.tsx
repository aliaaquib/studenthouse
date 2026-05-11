import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { assets } from "@/lib/assets";

const columns = [
  ["STUDENTS", "Find Apartments", "Shared Rooms", "Roommates"],
  ["UNIVERSITIES", "Browse Universities", "Popular Locations"],
  ["SUPPORT", "Help Center", "Safety Tips", "Contact"],
  ["COMPANY", "About", "Careers", "Blog"]
];

export function Footer() {
  return (
    <footer className="bg-[var(--background)] py-16">
      <div className="section-frame">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          <Link href="/" className="flex h-10 items-center gap-3">
            <Image src={assets.logo} alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-[20px] font-extrabold leading-[1.4] text-[var(--secondary)]">StudentNest</span>
          </Link>
          <nav className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4" aria-label="Footer navigation">
            {columns.map((column) => (
              <div key={column[0]}>
                <h3 className="text-[13px] font-extrabold leading-[1.5] tracking-[0.08em]">{column[0]}</h3>
                <ul className="mt-4 space-y-3 text-[14px] font-semibold leading-[1.5] text-[var(--muted)]">
                  {column.slice(1).map((item) => (
                    <li key={item}>
                      <Link href="/search" className="hover:text-[var(--primary)]">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-6 border-t border-[var(--border)] pt-8 text-[14px] font-semibold text-[var(--muted)] md:flex-row md:items-center md:justify-between">
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

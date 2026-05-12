"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock, GraduationCap, Map, MapPin, Search, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MotionDiv } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { assets } from "@/lib/assets";
import { properties } from "@/lib/data";
import { PropertyCard } from "@/components/sections/property-card";
import { useTypingWords } from "@/hooks/use-typing-words";

const cityOptions = [
  { name: "Jalal-Abad", status: "active" },
  { name: "Bishkek", status: "coming-soon" },
  { name: "Osh", status: "coming-soon" },
  { name: "Karakol", status: "coming-soon" },
  { name: "Kant", status: "coming-soon" },
  { name: "Naryn", status: "coming-soon" },
  { name: "Talas", status: "coming-soon" },
  { name: "Batken", status: "coming-soon" }
] as const;

const searchWords = ["area", "city", "property", "university"];

export function Hero() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState("Jalal-Abad");
  const [query, setQuery] = useState("");
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [comingSoonCity, setComingSoonCity] = useState<string | null>(null);
  const typedWord = useTypingWords(searchWords);

  function handleCitySelect(city: string) {
    const item = cityOptions.find((option) => option.name === city);
    setCitiesOpen(false);
    setSelectedCity(city);

    if (item?.status === "coming-soon") {
      setComingSoonCity(city);
    } else {
      setComingSoonCity(null);
    }
  }

  function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (selectedCity !== "Jalal-Abad") {
      setComingSoonCity(selectedCity);
      return;
    }

    const params = new URLSearchParams({ region: "Jalal-Abad" });
    if (query.trim()) params.set("q", query.trim());
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className="relative bg-[var(--surface)] pb-16 md:pb-20 lg:min-h-[820px]">
      <div className="absolute right-0 top-0 hidden h-full w-[48%] overflow-hidden lg:block">
        <Image
          src={assets.heroMap}
          alt=""
          fill
          sizes="49vw"
          priority
          className="object-cover opacity-75 saturate-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface)] via-[color-mix(in_srgb,var(--surface)_72%,transparent)] to-transparent" />
      </div>
      <div className="section-frame relative grid gap-12 pt-16 md:pt-16 lg:grid-cols-[560px_1fr] lg:pt-[76px]">
        <div>
          <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-5 hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[12px] font-semibold text-[var(--primary)] shadow-[var(--shadow-card)] sm:inline-flex">
              <GraduationCap size={16} /> Verified student housing
            </div>
            <h1 className="text-h1 max-w-[680px] text-balance">Find Your Perfect Student Apartment</h1>
          </MotionDiv>
          <div className="mt-8 max-w-[760px] md:mt-10">
            <div className="relative">
              <div className="absolute left-4 top-4 hidden h-[78px] w-[calc(100%-32px)] rounded-full bg-black/10 blur-[20px] sm:block" />
              <form className="relative grid min-h-[56px] grid-cols-[1fr_48px] items-center overflow-visible rounded-full bg-white shadow-[0_14px_36px_rgba(15,39,35,0.10)] md:min-h-[64px] md:grid-cols-[170px_1fr_76px] dark:bg-[var(--card)]" onSubmit={handleSearch}>
                <div className="relative hidden min-w-0 md:block">
                  <button type="button" className="focus-ring flex h-full min-h-[56px] w-full min-w-0 items-center gap-2 border-r border-[var(--border)] px-3 text-left text-[13px] font-medium transition hover:text-[var(--primary)] md:min-h-[64px] md:gap-3 md:px-5 md:text-[17px]" onClick={() => setCitiesOpen((value) => !value)} aria-expanded={citiesOpen} aria-label="Select city">
                    <Map size={18} strokeWidth={1.9} className="shrink-0" />
                    <span className="truncate">{selectedCity}</span>
                    <ChevronDown className="ml-auto shrink-0" size={14} />
                  </button>
                  <AnimatePresence>
                    {citiesOpen ? (
                      <motion.div
                        className="absolute left-0 top-[calc(100%+10px)] z-40 w-[240px] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow-float)] md:w-[260px]"
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                      >
                        {cityOptions.map((city) => (
                          <button
                            key={city.name}
                            type="button"
                            className="focus-ring flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-left text-[13px] font-medium transition hover:bg-[var(--surface)]"
                            onClick={() => handleCitySelect(city.name)}
                          >
                            <span>{city.name}</span>
                            {city.status === "coming-soon" ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-1 text-[10px] text-[var(--muted)]"><Clock size={11} /> Soon</span> : <span className="text-[10px] font-semibold text-[var(--primary)]">Active</span>}
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <label className="relative flex h-full min-h-[56px] min-w-0 items-center px-4 md:min-h-[64px] md:px-5">
                  {!query ? (
                    <span className="pointer-events-none absolute left-4 flex items-center gap-1 text-[12px] font-light text-[#9b9b9b] md:left-5 md:text-[15px]">
                      <span>Search by</span>
                      <span className="search-typing-word">{typedWord}</span>
                    </span>
                  ) : null}
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="relative z-10 h-full min-w-0 flex-1 bg-transparent text-[12px] font-light text-[var(--foreground)] outline-none placeholder:font-light placeholder:text-[#9b9b9b] md:text-[15px]"
                    aria-label="Search your student home"
                  />
                </label>
                <div className="flex justify-end pr-2 md:px-3">
                  <button
                    type="submit"
                    aria-label="Search properties"
                    className="focus-ring flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_12px_32px_rgba(0,168,132,0.18)] transition hover:scale-105 hover:bg-[var(--primary-light)] md:h-[52px] md:w-[52px]"
                  >
                    <Search size={18} strokeWidth={1.5} className="text-white md:size-6" />
                  </button>
                </div>
              </form>
              <AnimatePresence>
                {comingSoonCity ? (
                  <motion.div
                    className="absolute left-0 right-0 top-[calc(100%+14px)] z-30 rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-float)]"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    role="status"
                  >
                    <button type="button" className="focus-ring absolute right-3 top-3 rounded-full p-1 text-[var(--muted)] hover:bg-[var(--surface)]" onClick={() => setComingSoonCity(null)} aria-label="Close city availability message">
                      <X size={16} />
                    </button>
                    <p className="pr-7 text-[14px] font-semibold">{comingSoonCity} is launching soon.</p>
                    <p className="mt-1 text-[13px] font-normal leading-[1.6] text-[var(--muted)]">Apartments are currently available only in Jalal-Abad. We&apos;re expanding to more cities across Kyrgyzstan soon.</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="!text-white">
              <Link href="/properties" className="!text-white">Browse Apartments</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/universities">Explore Universities</Link>
            </Button>
          </div>
        </div>
        <MotionDiv
          className="relative hidden min-h-[640px] lg:block"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          <div className="absolute left-[42px] top-0 w-[340px]">
            <PropertyCard property={properties[0]} priority />
          </div>
          <div className="absolute bottom-5 right-0 w-[218px]">
            <PropertyCard property={properties[1]} compact />
          </div>
          <div className="absolute right-[138px] top-[270px] flex h-16 w-14 items-center justify-center">
            <div className="absolute bottom-0 h-4 w-4 rounded-full bg-[var(--primary)]" />
            <div className="absolute top-0 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_10px_30px_rgba(23,166,115,0.32)]">
              <GraduationCap size={24} />
            </div>
          </div>
          <div className="absolute right-[158px] top-[40px] flex h-14 w-14 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--card)] text-[var(--primary)]">
            <MapPin size={22} fill="currentColor" />
          </div>
        </MotionDiv>
      </div>
    </section>
  );
}

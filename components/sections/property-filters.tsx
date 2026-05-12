"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useTypingWords } from "@/hooks/use-typing-words";
import { defaultFilters } from "@/lib/property-utils";
import type { PropertyFilters as PropertyFiltersValue, Region } from "@/types/property";

const filterSchema = z.object({
  query: z.string(),
  budget: z.enum(["Any", "Under 15,000 KGS", "15,000 - 22,000 KGS", "22,000+ KGS"]),
  roomType: z.enum(["Any", "Studio", "Private room", "Shared room", "Apartment"]),
  furnished: z.enum(["Any", "Furnished", "Unfurnished"]),
  utilities: z.enum(["Any", "Included", "Separate"]),
  genderPreference: z.enum(["Any", "Female only", "Male only", "Mixed"]),
  university: z.string(),
  region: z.enum(["Any", "Jalal-Abad"])
});

const selectClassName = "focus-ring h-12 rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-normal";
const searchWords = ["area", "city", "property", "university"];

export function PropertyFilters({
  universities,
  activeRegions,
  comingSoonRegions,
  onFiltersChange,
  onSearchSubmit,
  initialFilters = defaultFilters
}: {
  universities: string[];
  activeRegions: Region[];
  comingSoonRegions: Region[];
  onFiltersChange: (filters: PropertyFiltersValue) => void;
  onSearchSubmit?: (filters: PropertyFiltersValue) => void;
  initialFilters?: PropertyFiltersValue;
}) {
  const form = useForm<PropertyFiltersValue>({
    resolver: zodResolver(filterSchema),
    defaultValues: initialFilters
  });
  const watchedValues = useWatch({ control: form.control });
  const typedWord = useTypingWords(searchWords);

  useEffect(() => {
    onFiltersChange(filterSchema.parse(watchedValues));
  }, [onFiltersChange, watchedValues]);

  function resetFilters() {
    form.reset(defaultFilters);
    onFiltersChange(defaultFilters);
  }

  return (
    <form
      className="grid gap-4 rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] md:grid-cols-2 xl:grid-cols-[1.2fr_150px_150px_150px]"
      onSubmit={form.handleSubmit((values) => {
        onFiltersChange(values);
        onSearchSubmit?.(values);
      })}
    >
      <label className="focus-ring relative flex h-12 items-center rounded-[12px] border border-[var(--border)] bg-[var(--card)] px-4">
        {!watchedValues.query ? (
          <span className="pointer-events-none absolute flex items-center gap-1 text-[14px] font-light text-[var(--muted)]">
            <span>Search by</span>
            <span className="search-typing-word">{typedWord}</span>
          </span>
        ) : null}
        <input
          aria-label="Search by city, university, or apartment title"
          className="relative z-10 h-full min-w-0 flex-1 bg-transparent text-[14px] font-light text-[var(--foreground)] outline-none"
          {...form.register("query")}
        />
      </label>
      <select aria-label="Budget" className={selectClassName} {...form.register("budget")}>
        <option>Any</option>
        <option>Under 15,000 KGS</option>
        <option>15,000 - 22,000 KGS</option>
        <option>22,000+ KGS</option>
      </select>
      <select aria-label="Room type" className={selectClassName} {...form.register("roomType")}>
        <option>Any</option>
        <option>Studio</option>
        <option>Private room</option>
        <option>Shared room</option>
        <option>Apartment</option>
      </select>
      <select aria-label="University nearby" className={selectClassName} {...form.register("university")}>
        <option>Any</option>
        {universities.map((university) => <option key={university}>{university}</option>)}
      </select>
      <select aria-label="Launch region" className={selectClassName} {...form.register("region")}>
        <option>Any</option>
        {activeRegions.map((region) => <option key={region.slug}>{region.name}</option>)}
        {comingSoonRegions.map((region) => <option key={region.slug} disabled>{region.name} · Coming Soon</option>)}
      </select>
      <select aria-label="Furnished status" className={selectClassName} {...form.register("furnished")}>
        <option>Any</option>
        <option>Furnished</option>
        <option>Unfurnished</option>
      </select>
      <select aria-label="Utilities included" className={selectClassName} {...form.register("utilities")}>
        <option>Any</option>
        <option>Included</option>
        <option>Separate</option>
      </select>
      <select aria-label="Gender preference" className={selectClassName} {...form.register("genderPreference")}>
        <option>Any</option>
        <option>Female only</option>
        <option>Male only</option>
        <option>Mixed</option>
      </select>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_auto]">
        <Button type="submit">
        <Search size={18} /> Search
        </Button>
        <Button type="button" variant="outline" onClick={resetFilters}>
          <SlidersHorizontal size={18} /> Reset
        </Button>
      </div>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { House, MapPinned, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
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
  region: z.string()
});

const selectClassName = "focus-ring h-12 rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 text-[14px] font-normal";
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => {
        onFiltersChange(values);
        onSearchSubmit?.(values);
      })}
    >
      <div className="overflow-hidden rounded-[28px] bg-white p-2 shadow-[0_14px_36px_rgba(15,39,35,0.10)] dark:bg-[var(--card)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center">
          <label className="focus-ring flex h-16 items-center rounded-[22px] border border-[var(--border)] bg-[var(--card)] px-4 lg:w-[190px] lg:flex-none">
            <MapPinned size={22} className="shrink-0 text-[var(--muted-strong)]" />
            <select
              aria-label="Launch region"
              className="ml-3 h-full min-w-0 flex-1 bg-transparent pr-6 text-[16px] font-semibold text-[var(--muted-strong)] outline-none"
              {...form.register("region")}
            >
              <option>Any</option>
              {activeRegions.map((region) => <option key={region.slug}>{region.name}</option>)}
              {comingSoonRegions.map((region) => <option key={region.slug} disabled>{region.name} · Coming Soon</option>)}
            </select>
          </label>

          <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)]">
            <label className="relative flex h-16 min-w-0 flex-1 items-center px-5">
              {!watchedValues.query ? (
                <span className="pointer-events-none absolute flex items-center gap-1 text-[15px] font-light text-[var(--muted)]">
                  <span>Search by</span>
                  <span className="search-typing-word">{typedWord}</span>
                </span>
              ) : null}
              <input
                aria-label="Search by city, university, or apartment title"
                className="relative z-10 h-full min-w-0 flex-1 bg-transparent text-[15px] font-light text-[var(--foreground)] outline-none"
                {...form.register("query")}
              />
            </label>
            <button
              type="submit"
              className="focus-ring mr-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_12px_32px_rgba(0,168,132,0.18)] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:bg-[var(--primary-light)]"
              aria-label="Search apartments"
            >
              <Search size={20} />
            </button>
          </div>

          <label className="focus-ring flex h-16 items-center rounded-[22px] border border-[var(--border)] bg-[var(--card)] px-4 lg:w-[214px] lg:flex-none">
            <House size={22} className="shrink-0 text-[var(--muted-strong)]" />
            <select
              aria-label="Room type"
              className="ml-3 h-full min-w-0 flex-1 bg-transparent pr-6 text-[16px] font-semibold text-[var(--muted-strong)] outline-none"
              {...form.register("roomType")}
            >
              <option>Any</option>
              <option>Studio</option>
              <option>Private room</option>
              <option>Shared room</option>
              <option>Apartment</option>
            </select>
          </label>

          <button
            type="button"
            className="focus-ring flex h-16 items-center justify-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--card)] px-5 text-[16px] font-semibold text-[var(--muted-strong)] transition hover:border-[var(--primary)] lg:flex-none"
            onClick={() => setShowAdvancedFilters((value) => !value)}
            aria-expanded={showAdvancedFilters}
            aria-controls="advanced-property-filters"
          >
            <SlidersHorizontal size={21} />
            All Filters
          </button>
        </div>
      </div>

      {showAdvancedFilters ? (
        <div
          id="advanced-property-filters"
          className="grid gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)] md:grid-cols-2 xl:grid-cols-5"
        >
          <select aria-label="Budget" className={selectClassName} {...form.register("budget")}>
            <option>Any</option>
            <option>Under 15,000 KGS</option>
            <option>15,000 - 22,000 KGS</option>
            <option>22,000+ KGS</option>
          </select>
          <select aria-label="University nearby" className={selectClassName} {...form.register("university")}>
            <option>Any</option>
            {universities.map((university) => <option key={university}>{university}</option>)}
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
          <div className="flex justify-end md:col-span-2 xl:col-span-5">
            <Button type="button" variant="outline" onClick={resetFilters}>
              <SlidersHorizontal size={18} /> Reset
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

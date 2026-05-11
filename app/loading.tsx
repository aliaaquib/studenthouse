import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="figma-shell min-h-screen bg-[var(--background)]">
      <div className="section-frame py-12">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-5 h-5 w-full max-w-[520px]" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="mt-5 h-6 w-36" />
              <Skeleton className="mt-3 h-4 w-56" />
              <Skeleton className="mt-6 h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

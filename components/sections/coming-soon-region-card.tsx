"use client";

import { Clock, LockKeyhole, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { motionEase } from "@/components/motion";
import type { City } from "@/types/property";

const schema = z.object({
  email: z.string().email("Enter a valid email")
});

export function ComingSoonRegionCard({ city }: { city: City }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" }
  });

  function handleNotify() {
    setSent(true);
    form.reset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring motion-surface theme-transition group relative min-h-[190px] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-[var(--shadow-card)] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[var(--primary)]"
        aria-label={`${city.name} student housing is coming soon`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(23,166,115,0.14),transparent_34%),linear-gradient(145deg,rgba(255,184,77,0.12),transparent)] transition duration-500 group-hover:scale-110" />
        <div className="relative flex h-full flex-col justify-between">
          <span className="inline-flex w-max items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--muted-strong)]">
            <LockKeyhole size={13} /> Coming Soon
          </span>
          <span>
            <h3 className="text-[22px] font-semibold">{city.name}</h3>
            <p className="mt-2 flex items-center gap-2 text-[13px] font-normal text-[var(--muted)]">
              <Clock size={15} /> Launching soon
            </p>
          </span>
        </div>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-black/40 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: motionEase }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`region-${city.slug}-title`}
          >
            <motion.div
              className="w-full max-w-[460px] rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.96 }}
              transition={{ duration: 0.24, ease: motionEase }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]">
                <Clock size={22} />
              </div>
              <h2 id={`region-${city.slug}-title`} className="mt-5 text-[24px] font-semibold leading-[1.2]">
                Student housing in this region is launching soon.
              </h2>
              <p className="mt-3 text-[14px] font-normal leading-[1.7] text-[var(--muted)]">
                We&apos;re currently expanding across Kyrgyzstan.
              </p>
              <form className="mt-6 grid gap-3" onSubmit={form.handleSubmit(handleNotify)}>
                <Input type="email" aria-label={`Email for ${city.name} launch notifications`} placeholder="Enter your email" {...form.register("email")} />
                <Button type="submit"><Mail size={17} /> Notify Me</Button>
              </form>
              {form.formState.errors.email ? <p className="mt-2 text-[13px] font-normal text-[var(--muted)]">{form.formState.errors.email.message}</p> : null}
              {sent ? <Toast className="mt-4">You&apos;ll be notified when {city.name} launches.</Toast> : null}
              <Button className="mt-4 w-full" variant="outline" type="button" onClick={() => setOpen(false)}>Close</Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

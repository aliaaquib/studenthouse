"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWhatsAppHref, WHATSAPP_PHONE } from "@/lib/property-utils";
import type { Property } from "@/types/property";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

export function ContactForm({ title = "Contact landlord", property }: { title?: string; property?: Property }) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", message: "" }
  });

  function handleInquiry() {
    const fallbackHref = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("Hi, I'm interested in student housing listed on your platform. Please share more details.")}`;
    window.location.assign(property ? getWhatsAppHref(property, "requesting a booking for") : fallbackHref);
  }

  return (
    <form
      className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] sm:p-6"
      onSubmit={form.handleSubmit(handleInquiry)}
    >
      <h2 className="text-[20px] font-extrabold leading-[1.3]">{title}</h2>
      <p className="mt-2 text-[13px] font-semibold leading-[1.6] text-[var(--muted)]">Ask a question, book a visit, or request a virtual tour.</p>
      <div className="mt-6 grid gap-4">
        <Input placeholder="Name" aria-label="Name" {...form.register("name")} />
        <Input placeholder="Email" aria-label="Email" {...form.register("email")} />
        <textarea
          className="focus-ring min-h-32 rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-4 text-[14px] font-medium"
          placeholder="Hi, I would like to book a visit..."
          aria-label="Message"
          {...form.register("message")}
        />
      </div>
      <Button className="mt-5 w-full" type="submit">Send booking request</Button>
      <Button asChild className="mt-3 w-full" variant="outline">
        <a href={property ? getWhatsAppHref(property, "interested in") : `https://wa.me/${WHATSAPP_PHONE}`} target="_blank" rel="noreferrer">WhatsApp landlord</a>
      </Button>
      <div className="mt-3 text-[14px] font-medium text-[var(--muted)]">
        {Object.values(form.formState.errors)[0]?.message ?? "Secure communication. No phone number shared until you choose."}
      </div>
    </form>
  );
}

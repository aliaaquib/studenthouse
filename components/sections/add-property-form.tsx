"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WHATSAPP_PHONE } from "@/lib/property-utils";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  phone: z.string().min(6, "Enter your phone number"),
  title: z.string().min(4, "Enter a property title"),
  location: z.string().min(3, "Enter the property location"),
  rent: z.string().min(2, "Enter monthly rent"),
  details: z.string().min(10, "Add a few property details")
});

type AddPropertyValues = z.infer<typeof schema>;

export function AddPropertyForm() {
  const form = useForm<AddPropertyValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      title: "",
      location: "",
      rent: "",
      details: ""
    }
  });

  function submitProperty(values: AddPropertyValues) {
    const message = [
      "Hi, I want to add a student housing property to StudentNest.",
      `Name: ${values.name}`,
      `Phone: ${values.phone}`,
      `Property: ${values.title}`,
      `Location: ${values.location}`,
      `Monthly rent: ${values.rent}`,
      `Details: ${values.details}`
    ].join("\n");

    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form className="grid gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] sm:p-7" onSubmit={form.handleSubmit(submitProperty)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Your name" aria-label="Your name" {...form.register("name")} />
        <Input placeholder="Phone or WhatsApp" aria-label="Phone or WhatsApp" {...form.register("phone")} />
        <Input placeholder="Property title" aria-label="Property title" {...form.register("title")} />
        <Input placeholder="Location in Jalal-Abad" aria-label="Location in Jalal-Abad" {...form.register("location")} />
        <Input placeholder="Monthly rent, e.g. 18,000 сом" aria-label="Monthly rent" {...form.register("rent")} />
        <Input placeholder="Room type, furnished, roommates" aria-label="Quick property details" {...form.register("details")} />
      </div>
      {Object.values(form.formState.errors)[0]?.message ? (
        <p className="text-[13px] font-normal text-[var(--muted)]">{Object.values(form.formState.errors)[0]?.message}</p>
      ) : null}
      <Button type="submit" className="mt-2 w-full sm:w-max">
        Send property for review <ArrowRight size={18} />
      </Button>
    </form>
  );
}

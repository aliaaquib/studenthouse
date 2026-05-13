"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Reveal, motionEase } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

const schema = z.object({
  email: z.string().email("Enter a valid email")
});

export function CTA() {
  const [subscribed, setSubscribed] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" }
  });

  return (
    <section className="bg-[var(--primary)] py-16 text-center text-white">
      <Reveal className="section-frame" amount={0.18}>
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] opacity-80">Weekly housing alerts</p>
        <h2 className="mx-auto mt-3 max-w-[620px] text-[26px] font-medium leading-[1.2] sm:text-[40px]">
          Get the Latest Student
          <br />
          Housing Updates
        </h2>
        <form
          className="theme-transition mx-auto mt-8 flex max-w-[560px] flex-col gap-3 rounded-[18px] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.15)] sm:flex-row"
          onSubmit={form.handleSubmit(() => {
            setSubscribed(true);
            form.reset();
          })}
        >
          <Input
            aria-label="Email address"
            placeholder="Enter your email address"
            className="border-0 text-[var(--foreground)] sm:h-12 sm:flex-1"
            {...form.register("email")}
          />
          <Button type="submit" className="bg-[var(--primary)] text-white shadow-none hover:bg-[var(--primary-light)] sm:w-[142px]">Subscribe</Button>
        </form>
        {form.formState.errors.email ? (
          <p className="mt-2 text-[14px] font-medium text-white">{form.formState.errors.email.message}</p>
        ) : null}
        {subscribed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: motionEase }}
          >
            <Toast className="mt-4 bg-white text-[#10201c]">You are subscribed to housing alerts.</Toast>
          </motion.div>
        ) : null}
        <p className="mt-6 text-[14px] font-normal text-white/80">Join 15,000+ students tracking verified housing near campus.</p>
      </Reveal>
    </section>
  );
}

export function Testimonials() {
  const items = [
    ["AI", "Aigerim, CAIMU medical student", "I found a verified room near CAIMU in two days. The landlord answered on WhatsApp and the virtual tour made me feel safe before arriving."],
    ["OM", "Omar, JAIU exchange student", "The roommate filters were the best part. I could see bills, WiFi, and campus distance around Jalal-Abad without messaging ten different hosts."],
    ["SA", "Saltanat, JASU student", "StudentNest made finding a shared room near JASU much less stressful. Saved listings, clear prices, and trusted hosts were exactly what I needed."]
  ];

  return (
    <section className="bg-[var(--background)] py-16 sm:py-20">
      <div className="section-frame">
        <div className="text-center">
          <h2 className="text-h2 mx-auto max-w-[620px]">Loved by students arriving from everywhere</h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[15px] font-semibold leading-[1.7] text-[var(--muted)]">
            Real stories from students who needed safe, affordable housing before the semester started.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map(([initials, name, quote]) => (
            <blockquote key={name} className="rounded-[18px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[13px] font-extrabold text-[var(--primary)]">{initials}</span>
              <p className="mt-5 text-[14px] font-semibold leading-[1.75] text-[var(--muted-strong)]">“{quote}”</p>
              <p className="mt-5 text-[14px] font-extrabold">{name}</p>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

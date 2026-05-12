const firstRow = [
  ["Aigerim, CAIMU medical student", "I found a verified room near CAIMU in two days. The landlord answered on WhatsApp and the virtual tour made me feel safe before arriving."],
  ["Omar, JAIU exchange student", "The roommate filters were the best part. I could see bills, WiFi, and campus distance around Jalal-Abad without messaging ten different hosts."],
  ["Saltanat, JASU student", "StudentNest made finding a shared room near JASU much less stressful. Saved listings, clear prices, and trusted hosts were exactly what I needed."],
  ["Daniel, international student", "I arrived in Jalal-Abad with one suitcase and already had three saved apartments ready to visit."]
];

const secondRow = [
  ["Madina, JAIU student", "The prices were clear in som and the listings felt real. I did not need to guess what was included."],
  ["Yusuf, CAIMU student", "Booking a virtual tour before moving helped my parents feel comfortable with the apartment."],
  ["Elina, JASU student", "I liked seeing furnished rooms, bills, and campus distance in one place before contacting anyone."],
  ["Nargiza, first-year student", "The saved apartments page made it easy to compare rooms with my roommate after class."]
];

function ReviewRow({ items, direction }: { items: string[][]; direction: "left" | "right" }) {
  return (
    <div className="overflow-hidden">
      <div className={`reviews-marquee-${direction} flex w-max items-start gap-10`}>
        {[...items, ...items].map(([name, quote], index) => (
          <blockquote key={`${name}-${index}`} className="w-[320px] shrink-0 sm:w-[420px]">
            <p className="text-[15px] font-light leading-[1.8] text-[var(--muted-strong)] sm:text-[16px]">“{quote}”</p>
            <p className="mt-4 text-[14px] font-light text-[var(--foreground)]">{name}</p>
          </blockquote>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="overflow-hidden bg-[var(--background)] py-16 sm:py-20">
      <div className="section-frame">
        <div className="text-left sm:text-center">
          <h2 className="text-[34px] font-medium leading-[1.12] tracking-[-0.01em] sm:mx-auto sm:max-w-[620px] sm:text-[44px]">
            What <span className="text-[var(--primary)]">Students</span> Say
            <br className="sm:hidden" /> About Us
          </h2>
        </div>
        <div className="mt-12 space-y-10">
          <ReviewRow items={firstRow} direction="left" />
          <ReviewRow items={secondRow} direction="right" />
        </div>
      </div>
    </section>
  );
}

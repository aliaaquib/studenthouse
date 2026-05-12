const partners = [
  { mark: "JAIU", name: "Jalal-Abad International University" },
  { mark: "JASU", name: "Jalal-Abad State University" },
  { mark: "CAIMU", name: "Central Asian International Medical University" },
  { mark: "JAIU", name: "International Student Center" },
  { mark: "JASU", name: "College Housing Office" },
  { mark: "CAIMU", name: "Medical Student Housing" }
];

function PartnerMark({ partner }: { partner: (typeof partners)[number] }) {
  return (
    <div className="flex min-w-[188px] items-center justify-center gap-3 grayscale">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-2 border-[#4a4a4a] text-[14px] font-black tracking-[-0.04em] text-[#3f3f3f]">
        {partner.mark}
      </div>
      <div className="max-w-[176px] text-[#3f3f3f]">
        <p className="text-[20px] font-black leading-none tracking-[-0.04em]">{partner.mark}</p>
        <p className="mt-1 text-[10px] font-extrabold uppercase leading-[1.15] tracking-[0.08em]">{partner.name}</p>
      </div>
    </div>
  );
}

export function CollegePartners() {
  return (
    <section className="overflow-hidden bg-[var(--background)] py-16 sm:py-20" aria-labelledby="college-partners-heading">
      <div className="section-frame">
        <h2 id="college-partners-heading" className="college-partners-title text-center text-[30px] font-medium leading-[1.15] sm:text-[38px] md:text-[44px]">
          College Partners
        </h2>
      </div>
      <div className="mt-16 overflow-hidden opacity-70 sm:mt-20">
        <div className="college-partners-marquee flex w-max items-center gap-14 px-8 sm:gap-20 md:gap-28">
          {[...partners, ...partners].map((partner, index) => (
            <PartnerMark key={`${partner.mark}-${partner.name}-${index}`} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Image, { type StaticImageData } from "next/image";
import React, { useEffect, useMemo, useState } from "react";

// =====================
// Helpers: safe image src + fallback
// =====================
const FALLBACK_DATA_URI =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'>
      <rect width='320' height='180' fill='#f1f5f9'/>
      <path d='M0 150 L90 80 L150 140 L210 90 L320 155 L320 180 L0 180 Z' fill='#e2e8f0'/>
      <circle cx='250' cy='55' r='18' fill='#e2e8f0'/>
      <text x='16' y='32' fill='#64748b' font-size='14' font-family='Arial, sans-serif'>Image unavailable</text>
    </svg>`
  );

type ImageSrcLike = string | StaticImageData | { src?: unknown } | null | undefined;

function normalizeImgSrc(src: ImageSrcLike): string {
  // Must never throw.
  try {
    // 1) null/undefined => fallback
    if (src == null) return FALLBACK_DATA_URI;

    // 2) Accept string
    if (typeof src === "string") {
      const s = src.trim();
      if (!s) return FALLBACK_DATA_URI;
      if (s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://")) return s;
      // Missing leading slash (e.g. "clients/moh.png")
      return FALLBACK_DATA_URI;
    }

    // 3) Accept Next.js StaticImport-like objects (or any object with .src string)
    if (typeof src === "object") {
      // Guard: object is not null (already checked) before reading properties.
      const maybeSrc = (src as any)?.src;
      if (typeof maybeSrc === "string") {
        const s = maybeSrc.trim();
        if (!s) return FALLBACK_DATA_URI;
        if (s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://")) return s;
      }
    }

    return FALLBACK_DATA_URI;
  } catch {
    return FALLBACK_DATA_URI;
  }
}

type SafeImageProps = {
  src?: ImageSrcLike;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
};

function SafeImage({ src, alt, fill, className, priority, sizes }: SafeImageProps) {
  // Always keep a safe string to pass into Next/Image.
  const safeSrc = normalizeImgSrc(src);
  const [currentSrc, setCurrentSrc] = useState<string>(safeSrc);

  // If the src changes, reflect it.
  useEffect(() => {
    setCurrentSrc(safeSrc);
  }, [safeSrc]);

  // When src is a data: URI, Next/Image should be unoptimized.
  const unoptimized = currentSrc.startsWith("data:");

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={!!fill}
      priority={priority}
      sizes={sizes ?? (fill ? "(max-width: 768px) 50vw, 200px" : undefined)}
      unoptimized={unoptimized}
      className={className}
      onError={() => {
        if (currentSrc !== FALLBACK_DATA_URI) setCurrentSrc(FALLBACK_DATA_URI);
      }}
    />
  );
}

// =====================
// Partners Carousel (simple, preview-ready)
// =====================
type Partner = {
  name: string;
  href?: string;
  img?: ImageSrcLike;
};

function PartnersCarousel({ partners }: { partners: Partner[] }) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth">
        {partners.map((p, idx) => {
          const key = p?.name ? `${p.name}-${idx}` : `partner-${idx}`;
          const href = typeof p?.href === "string" && p.href.trim() ? p.href : "#";
          const name = typeof p?.name === "string" && p.name.trim() ? p.name : "Partner";

          return (
            <a
              key={key}
              href={href}
              target={href === "#" ? undefined : "_blank"}
              rel={href === "#" ? undefined : "noreferrer"}
              className="snap-start shrink-0 w-44 sm:w-52 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition"
            >
              <div className="relative w-full h-20">
                {/* Never pass null to Next/Image; SafeImage guarantees a string */}
                <SafeImage src={p?.img} alt={name} fill className="object-contain" sizes="220px" />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-800 text-center">{name}</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// =====================
// Self-tests (lightweight)
// =====================
function runSelfTests() {
  console.assert(normalizeImgSrc(null).startsWith("data:image/svg+xml"), "normalizeImgSrc(null) should fallback");
  console.assert(
    normalizeImgSrc(undefined).startsWith("data:image/svg+xml"),
    "normalizeImgSrc(undefined) should fallback"
  );
  console.assert(
    normalizeImgSrc(123 as any).startsWith("data:image/svg+xml"),
    "normalizeImgSrc(non-string) should fallback"
  );
  console.assert(normalizeImgSrc(" ").startsWith("data:image/svg+xml"), "normalizeImgSrc(empty) should fallback");
  console.assert(normalizeImgSrc("/clients/moh.png") === "/clients/moh.png", "local path should pass");
  console.assert(
    normalizeImgSrc("https://example.com/x.png") === "https://example.com/x.png",
    "absolute https URL should pass"
  );

  // Missing leading slash should fallback
  console.assert(
    normalizeImgSrc("clients/moh.png").startsWith("data:image/svg+xml"),
    "missing leading slash should fallback"
  );

  // Static import-like object should pass
  console.assert(
    normalizeImgSrc({ src: "/clients/moh.png" } as any) === "/clients/moh.png",
    "object with src string should pass"
  );

  // Ensure it never throws
  let threw = false;
  try {
    normalizeImgSrc(null);
    normalizeImgSrc({ src: null } as any);
  } catch {
    threw = true;
  }
  console.assert(threw === false, "normalizeImgSrc must never throw");
}

// =====================
// Main Page
// =====================
export default function Site() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const t = useMemo(() => (lang === "ar" ? AR : EN), [lang]);
  const isRTL = lang === "ar";

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") runSelfTests();
  }, []);

  const navItems = [
    { id: "about", label: t.nav.about },
    { id: "services", label: t.nav.services },
    { id: "partners", label: t.nav.partners },
    { id: "clients", label: t.nav.clients },
    { id: "contact", label: t.nav.contact }
  ];

  // ✅ IMPORTANT: images must exist under /public/partners
  // Example path: public/partners/asset.png -> src: "/partners/asset.png"
  const partners: Partner[] = [
    { name: "Asset Medical", href: "https://www.assetmedical.com/", img: "/partners/asset.jpeg" },
    {
      name: "Temena",
      href: "https://temena.com/en/local-anesthesia-and-regional-anesthesia/",
      img: "/partners/temena.jpeg"
    },
    { name: "Formed", href: "https://www.formedtech.net/", img: "/partners/formed.jpeg" },
        { name: "Bioptimal", href: "https://www.bioptimalg.com/Home", img: "/partners/bioptimal.jpeg" }
  ];

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={"min-h-screen bg-slate-50 text-slate-800 " + (isRTL ? "rtl" : "ltr")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/90 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* ✅ Company logo
               Put your logo file here:
               public/logo.png
               Then it will load via: /logo.png
            */}
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <SafeImage src="/logo.png" alt="Company Logo" fill className="object-contain" priority sizes="56px" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-base">{t.companyName}</div>
              <div className="text-xs text-slate-500">{t.companyArabic}</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => scrollToId(n.id)} className="text-slate-600 hover:text-slate-900">
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={t.contact.whatsappHref}
              className="hidden sm:inline-flex rounded-xl px-3 py-2 text-sm border border-slate-300 hover:bg-slate-100"
              target="_blank"
              rel="noreferrer"
            >
              {t.cta.whatsapp}
            </a>
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="rounded-xl px-3 py-2 text-sm bg-[#2E7C7C] text-white hover:opacity-90"
              aria-label="Toggle language"
            >
              {lang === "ar" ? "English" : "العربية"}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2 text-sm">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollToId(n.id)}
                className="rounded-lg px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#2E7C7C]">
        <div className="absolute inset-0 -z-10 bg-[#2E7C7C]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-white">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{t.hero.title}</h1>
            <p className="mt-4 text-base md:text-lg text-white/90">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => scrollToId("contact")}
                className="rounded-2xl px-5 py-3 bg-white text-slate-900 text-sm font-semibold hover:opacity-90"
              >
                {t.cta.getQuote}
              </button>
              <button
                onClick={() => scrollToId("services")}
                className="rounded-2xl px-5 py-3 border border-white/40 text-white text-sm hover:bg-white/10"
              >
                {t.cta.explore}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">{t.about.heading}</h2>
            
            <p className="mt-4 text-slate-600 leading-relaxed">{t.about.p1}</p>
            <p className="mt-4 text-slate-600 leading-relaxed">{t.about.p2}</p>

            {t.about.bullets && t.about.bullets.length ? (
              <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-slate-700">
                {t.about.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1 inline-block w-2 h-2 rounded-full bg-[#2E7C7C]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {t.about.mission && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold">{t.about.missionHeading}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{t.about.mission}</p>
              </div>
            )}

            {t.about.vision && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold">{t.about.visionHeading}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{t.about.vision}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <Stat label={t.stats.years} value={t.statsVals.years} />
            <Stat label={t.stats.skus} value={t.statsVals.skus} />
            <Stat label={t.stats.partners} value={t.statsVals.partners} />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">{t.services.heading}</h2>
        <p className="mt-3 text-center text-slate-600 max-w-3xl mx-auto">{t.services.sub}</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {t.services.items.map((s) => (
            <FeatureCard key={s.title} title={s.title} desc={s.desc} icon={s.icon} />
          ))}
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">{t.partners.heading}</h2>
        <p className="mt-3 text-center text-slate-600 max-w-3xl mx-auto">{t.partners.sub}</p>
        <div className="mt-10">
          <PartnersCarousel partners={partners} />
        </div>
      </section>

      {/* Clients */}
      <section
        id="clients"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-slate-50 rounded-3xl my-16 border border-slate-200"
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-center">{t.clients.heading}</h2>
        <p className="mt-3 text-center text-slate-600 max-w-3xl mx-auto">{t.clients.sub}</p>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {[
            { name: "MOH", img: "/clients/moh.png" },
            { name: "NUPCO", img: "/clients/nupco.png" },
            { name: "KFSH", img: "/clients/kfsh.png" },
            { name: "NGHA", img: "/clients/ngha.png" },
            { name: "Dr. Sulaiman Al Habib", img: "/clients/alhabib.png" },
            { name: "Dallah", img: "/clients/dallah.png" },
            { name: "Mouwasat", img: "/clients/mouwasat.png" },
            { name: "IMC", img: "/clients/imc.png" },
            { name: "Hammady", img: "/clients/hammady.png" },
            { name: "Hayat", img: "/clients/hayat.png" },
            { name: "SGH", img: "/clients/sgh.png" },
            { name: "SMC", img: "/clients/smc.png" },
            { name: "Fakeeh", img: "/clients/fakeeh.png" }
          ].map((client, idx) => (
            <div
              key={`${client.name}-${idx}`}
              className="relative w-24 h-24 transition-all duration-300"
              title={client.name}
            >
              <SafeImage src={client.img} alt={client.name} fill className="object-contain" sizes="96px" />
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">{t.contact.heading}</h2>
            <p className="mt-3 text-slate-600">{t.contact.sub}</p>
            <div className="mt-6 space-y-2 text-sm">
              <InfoRow label={t.contact.phoneLabel} value={t.contact.phone} />
              <InfoRow label={t.contact.emailLabel} value={t.contact.email} />
              <InfoRow label={t.contact.addressLabel} value={t.contact.address} />
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={t.contact.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl px-5 py-3 bg-[#2E7C7C] text-white text-sm font-semibold hover:opacity-90"
                >
                  {t.cta.whatsapp}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                const body = encodeURIComponent(
                  `${t.form.name}: ${String(data.name ?? "")}` +
                    `\n${t.form.company}: ${String(data.company ?? "")}` +
                    `\n${t.form.email}: ${String(data.email ?? "")}` +
                    `\n${t.form.message}:\n${String(data.message ?? "")}`
                );
                window.location.href = `mailto:${encodeURIComponent(t.contact.email)}?subject=${encodeURIComponent(
                  t.form.subject
                )}&body=${body}`;
              }}
              className="space-y-4"
            >
              <Input label={t.form.name} name="name" required />
              <Input label={t.form.company} name="company" />
              <Input label={t.form.email} name="email" type="email" required />
              <Textarea label={t.form.message} name="message" rows={5} required />
              <button
                type="submit"
                className="w-full rounded-xl px-5 py-3 bg-slate-900 text-white font-semibold hover:opacity-90"
              >
                {t.cta.send}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} {t.companyName} — {t.companyArabic}. {t.footer.rights}
          </div>
        </div>
      </footer>

      <style>{`
        .rtl { direction: rtl; }
        .ltr { direction: ltr; }
      `}</style>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow transition">
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-none">
      <div className="text-slate-600">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  required
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#2E7C7C]"
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  rows = 4,
  required
}: {
  label: string;
  name: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#2E7C7C]"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-slate-500">{label} </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// =====================
// i18n
// =====================
const EN = {
  companyName: "Advanced Basics For Trading Co.",
  companyArabic: "الأساسيات المتطورة للتجارة",
  nav: { about: "About", services: "Services", partners: "Partners", clients: "Featured Clients", contact: "Contact" },
  hero: {
    title: "Trusted trading partner for medical solutions",
    subtitle: "We supply quality medical products with reliable delivery, clear documentation, and responsive support."
  },
  cta: { getQuote: "Request a Quote", explore: "Explore Services", whatsapp: "WhatsApp", send: "Send Message" },
  about: {
    heading: "Who We Are",
    p1: "We are a trading company focused on medical supplies, built on transparency, compliance, and fast logistics.",
    p2: "From tender documentation to last-mile delivery, we ensure a smooth supply experience for our customers.",
    bullets: ["MOH, Military & Private", "Regulatory & Tenders", "Quality Sourcing", "On-time Delivery"],
    missionHeading: "Mission",
    mission: "Deliver dependable medical solutions through quality sourcing, compliant documentation, and excellent service.",
    visionHeading: "Vision",
    vision: "To become a preferred medical supply partner across the region."
  },
  stats: { years: "Years of Experience", skus: "SKUs Supplied", partners: "Global Partners" },
  statsVals: { years: "5+", skus: "5000+", partners: "10+" },
  services: {
    heading: "Medical Coverage Fields",
    sub: "We provide specialized medical supply solutions covering the main clinical departments in hospitals, according to approved standards and ensuring operational efficiency and service continuity.",
    items: [
      {
        icon: "💉",
        title: "Anaesthesia & Respiratory Care",
        desc: "Supplying anaesthesia, resuscitation, and artificial respiration supplies, in compliance with the requirements of operating rooms and intensive care units."
      },
      {
        icon: "🔪",
        title: "Operating Rooms",
        desc: "Providing surgical supplies of various specialties, with commitment to approved quality and safety standards."
      },
      {
        icon: "🚨",
        title: "Emergency Department",
        desc: "Supplying medical supplies for emergency and immediate care, to support rapid response in critical cases."
      },
      {
        icon: "🧼",
        title: "Sterilization & Infection Control",
        desc: "Integrated solutions for sterilization and infection prevention supplies, to ensure a safe medical environment according to approved health policies."
      }
    ]
  },
  partners: { heading: "Partners", sub: "Click a partner to open their website.", hint: "Tip: hover to pause autoplay." },
  clients: { heading: "Featured Clients", sub: "Proud to serve leading institutions and organizations." },
  contact: {
    heading: "Get in Touch",
    sub: "Tell us what you need — we’ll send options and lead times.",
    phoneLabel: "Phone:",
    emailLabel: "Email:",
    addressLabel: "Address:",
    phone: "0534337777",
    email: "Regulatory@alasasiat.com",
    address: "P.O.BOX. 6787, Riyadh 13521, Imam Saud Bin Faisal Road, Malqa, KSA",
    whatsappHref: "https://wa.me/966539326813"
  },
  form: { subject: "Website Inquiry", name: "Name", company: "Company", email: "Email", message: "Message" },
  footer: { rights: "All rights reserved." }
};

const AR = {
  companyName: "الأساسيات المتطورة للتجارة",
  companyArabic: "Advanced Basics For Trading Co.",
  nav: { about: "من نحن", services: "خدماتنا", partners: "شركاؤنا", clients: "أبرز العملاء", contact: "تواصل معنا" },
  hero: {
    title: "شريك موثوق لحلول المستلزمات الطبية",
    subtitle: "نوفر منتجات طبية عالية الجودة مع التزام بالتسليم ووضوح في الوثائق وخدمة سريعة."
  },
  cta: { getQuote: "اطلب عرض سعر", explore: "استكشف الخدمات", whatsapp: "واتساب", send: "إرسال" },
  about: {
    heading: "من نحن",
    overview: "نظرة عامة على الشركة",
    quote: "التميز في المنتجات هو البداية، لكن الرؤية الواضحة والقيادة الحكيمة هما أساس النجاح المستدام.",
    p1: "نحن شركة تجارة متخصصة في المستلزمات الطبية، نعمل وفق معايير الجودة والموثوقية والالتزام.",
    p2: "نغطي رحلة التوريد من عروض الأسعار والمناقصات إلى التوريد والتوزيع والمتابعة بعد البيع.",
    bullets: ["وزارة الصحة والقطاع العسكري والخاص", "الوثائق والتنظيم والمناقصات", "توريد بجودة عالية", "التزام بالمواعيد"],
    missionHeading: "مهمتنا",
    mission: "توفير حلول طبية موثوقة عبر توريد عالي الجودة ووثائق معتمدة وخدمة عملاء ممتازة.",
    visionHeading: "رؤيتنا",
    vision: "أن نكون خيارًا مفضلًا لتوريد المستلزمات الطبية في المنطقة."
  },
  stats: { years: "سنوات خبرة", skus: "عدد الأصناف المورّدة", partners: "شركاء عالميون" },
  statsVals: { years: "10+", skus: "1500+", partners: "40+" },
  services: {
    heading: "مجالات التغطية الطبية",
    sub: "نقدم حلول توريد طبية متخصصة تغطي الأقسام السريرية الرئيسية في المستشفيات، وفق المعايير المعتمدة وبما يضمن كفاءة التشغيل واستمرارية الخدمة.",
    items: [
      {
        icon: "💉",
        title: "قسم التخدير والعناية التنفسية",
        desc: "توريد مستلزمات التخدير والإنعاش والتنفس الصناعي، بما يتوافق مع متطلبات غرف العمليات ووحدات العناية."
      },
      {
        icon: "🔪",
        title: "غرف العمليات",
        desc: "توفير مستلزمات العمليات الجراحية بمختلف تخصصاتها، مع الالتزام بمعايير الجودة والسلامة المعتمدة."
      },
      {
        icon: "🚨",
        title: "قسم الطوارئ",
        desc: "توريد المستلزمات الطبية الخاصة بحالات الطوارئ والرعاية الفورية، لدعم سرعة الاستجابة في الحالات الحرجة."
      },
      {
        icon: "🧼",
        title: "التعقيم ومكافحة العدوى",
        desc: "حلول متكاملة لمستلزمات التعقيم والوقاية من العدوى، لضمان بيئة طبية آمنة وفق السياسات الصحية المعتمدة."
      }
    ]
  },
  partners: { heading: "شركاؤنا", sub: "اضغط على الشريك لفتح موقعه.", hint: "معلومة: مرّر المؤشر لإيقاف الحركة." },
  clients: { heading: "أبرز العملاء", sub: "نفخر بخدمة كبرى المؤسسات والجهات." },
  contact: {
    heading: "تواصل معنا",
    sub: "أخبرنا باحتياجك لنرسل الخيارات ومدة التوريد.",
    phoneLabel: "الهاتف:",
    emailLabel: "البريد الإلكتروني:",
    addressLabel: "العنوان:",
    phone: "0534337777",
    email: "Regulatory@alasasiat.com",
    address: "P.O.BOX. 6787, Riyadh 13521, Imam Saud Bin Faisal Road, Malqa, KSA",
    whatsappHref: "https://wa.me/966539326813"
  },
  form: { subject: "استفسار من الموقع", name: "الاسم", company: "الشركة", email: "البريد الإلكتروني", message: "الرسالة" },
  footer: { rights: "جميع الحقوق محفوظة" }
};

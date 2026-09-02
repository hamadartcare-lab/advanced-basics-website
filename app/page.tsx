"use client";

import Image, { type StaticImageData } from "next/image";
import React, { useEffect, useState } from "react";

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
  catalog?: string;
  img?: ImageSrcLike;
};

function PartnersCarousel({ partners, isRTL }: { partners: Partner[]; isRTL: boolean }) {
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  useEffect(() => {
    if (!selectedPartner) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedPartner(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedPartner]);

  const labels = isRTL
    ? {
        prompt: "اختر ما تريد فتحه",
        website: "زيارة موقع الوكالة",
        catalog: "فتح الكتالوج",
        close: "إغلاق",
      }
    : {
        prompt: "Choose what you want to open",
        website: "Visit partner website",
        catalog: "Open catalog",
        close: "Close",
      };

  return (
    <div className="relative">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {partners.map((p, idx) => {
          const key = p?.name ? `${p.name}-${idx}` : `partner-${idx}`;
          const name = typeof p?.name === "string" && p.name.trim() ? p.name : "Partner";

          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedPartner(p)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2E7C7C] focus:ring-offset-2"
              aria-label={`${labels.prompt}: ${name}`}
            >
              <div className="relative w-full h-20">
                {/* Never pass null to Next/Image; SafeImage guarantees a string */}
                <SafeImage src={p?.img} alt={name} fill className="object-contain" sizes="220px" />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-800 text-center">{name}</div>
            </button>
          );
        })}
      </div>

      {selectedPartner && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={() => setSelectedPartner(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPartner(null)}
              className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200"
              aria-label={labels.close}
            >
              ×
            </button>

            <div className="mx-auto h-24 w-44 relative">
              <SafeImage
                src={selectedPartner.img}
                alt={selectedPartner.name}
                fill
                className="object-contain"
                sizes="176px"
              />
            </div>
            <h3 id="partner-dialog-title" className="mt-4 text-center text-2xl font-bold text-slate-900">
              {selectedPartner.name}
            </h3>
            <p className="mt-2 text-center text-sm text-slate-500">{labels.prompt}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={selectedPartner.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#2E7C7C] px-4 py-3 text-center text-sm font-semibold text-[#2E7C7C] transition hover:bg-teal-50"
              >
                {labels.website}
              </a>
              <a
                href={selectedPartner.catalog}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-[#2E7C7C] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#256969]"
              >
                {labels.catalog}
              </a>
            </div>
          </div>
        </div>
      )}
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
export function Site({ initialLang = "ar" }: { initialLang?: "ar" | "en" }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lang = initialLang;
  const t = lang === "ar" ? AR : EN;
  const isRTL = lang === "ar";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    if (process.env.NODE_ENV !== "production") runSelfTests();
  }, [isRTL, lang]);

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
    {
      name: "Asset Medical",
      href: "https://www.assetmedical.com/",
      catalog: "/catalogs/asset-medical-catalog.pdf",
      img: "/partners/asset.jpeg"
    },
    {
      name: "Temena",
      href: "https://temena.com/en/local-anesthesia-and-regional-anesthesia/",
      catalog: "/catalogs/temena-catalog.pdf",
      img: "/partners/temena.jpeg"
    },
    {
      name: "Formed",
      href: "https://www.formedtech.net/",
      catalog: "/catalogs/formed-catalog.pdf",
      img: "/partners/formed.jpeg"
    },
    {
      name: "Bioptimal",
      href: "https://www.bioptimalg.com/Home",
      catalog: "/catalogs/bioptimal-catalog.pdf",
      img: "/partners/bioptimal.jpeg"
    }
  ];

  function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  }

  return (
    <div className={"min-h-screen bg-slate-50 text-slate-800 " + (isRTL ? "rtl" : "ltr")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-teal-100 bg-[#2E7C7C] shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl">
              <SafeImage src="/logo.png" alt="Company Logo" fill className="object-contain" priority sizes="56px" />
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-bold tracking-tight text-slate-900 lg:text-base">{t.companyName}</div>
              <div className="mt-1 text-[11px] text-slate-500">{t.companyArabic}</div>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm lg:flex">
            {navItems.map((n) => (
              <button key={n.id} onClick={() => scrollToId(n.id)} className="font-medium text-slate-600 transition hover:text-[#2E7C7C]">
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={t.contact.whatsappHref}
              className="hidden items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-[#256969] transition hover:bg-teal-100 md:inline-flex"
              target="_blank"
              rel="noreferrer"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t.cta.whatsapp}
            </a>
            <a
              href={lang === "ar" ? "/en" : "/"}
              className="rounded-xl bg-[#2E7C7C] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#256969]"
              hrefLang={lang === "ar" ? "en" : "ar"}
              aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              {lang === "ar" ? "English" : "العربية"}
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label={t.nav.menu}
            >
              <span className="relative block h-4 w-5">
                <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition ${mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
                <span className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition ${mobileMenuOpen ? "opacity-0" : ""}`} />
                <span className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition ${mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <nav className="mx-auto grid max-w-7xl gap-1 px-4 py-3 text-sm sm:px-6">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollToId(n.id)}
                className="rounded-lg px-3 py-3 text-start font-medium text-slate-700 hover:bg-slate-50 hover:text-[#2E7C7C]"
              >
                {n.label}
              </button>
            ))}
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#123f43] text-white">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(61,163,163,0.55),transparent_35%),linear-gradient(125deg,#123f43_0%,#1f696b_55%,#2e7c7c_100%)]" />
        <div className="absolute -end-28 top-10 -z-10 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -end-12 top-28 -z-10 h-56 w-56 rounded-full border border-white/10" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-teal-50 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-teal-300" />
              {t.hero.badge}
            </div>
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">{t.hero.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 md:text-lg">{t.hero.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button
                onClick={() => scrollToId("contact")}
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#174f52] shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-teal-50"
              >
                {t.cta.getQuote}
              </button>
              <button
                onClick={() => scrollToId("services")}
                className="rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t.cta.explore}
              </button>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-lg lg:block">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-white/5 blur-sm" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
              <div className="flex items-center gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-white/20 bg-[#2E7C7C] shadow-xl">
                  <SafeImage src="/logo.png" alt="Advanced Basics" fill className="object-contain" priority sizes="96px" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">ABC Medical Supply</p>
                  <p className="mt-2 text-xl font-bold leading-snug">{t.hero.cardTitle}</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {t.hero.capabilities.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-medium text-white/90">
                    <span className="mb-3 block h-1.5 w-8 rounded-full bg-teal-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2E7C7C]">{t.about.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t.about.heading}</h2>
            
            <p className="mt-6 text-lg leading-8 text-slate-600">{t.about.p1}</p>
            <p className="mt-4 leading-7 text-slate-600">{t.about.p2}</p>

            {t.about.bullets && t.about.bullets.length ? (
              <ul className="mt-8 grid gap-3 text-slate-700 sm:grid-cols-2">
                {t.about.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 rounded-xl bg-teal-50/70 px-4 py-3 text-sm font-medium">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2E7C7C] text-xs text-white">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {t.about.mission && (
              <div className="mt-8 border-s-4 border-[#2E7C7C] ps-5">
                <h3 className="text-lg font-bold text-slate-900">{t.about.missionHeading}</h3>
                <p className="mt-2 leading-7 text-slate-600">{t.about.mission}</p>
              </div>
            )}

            {t.about.vision && (
              <div className="mt-6 border-s-4 border-teal-200 ps-5">
                <h3 className="text-lg font-bold text-slate-900">{t.about.visionHeading}</h3>
                <p className="mt-2 leading-7 text-slate-600">{t.about.vision}</p>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-teal-100 bg-gradient-to-br from-[#174f52] to-[#2E7C7C] p-8 text-white shadow-xl shadow-teal-950/10">
            <div className="absolute -end-12 -top-12 h-40 w-40 rounded-full border border-white/10" />
            <p className="mb-5 text-sm font-semibold text-teal-100">{t.stats.heading}</p>
            <Stat label={t.stats.years} value={t.statsVals.years} />
            <Stat label={t.stats.skus} value={t.statsVals.skus} />
            <Stat label={t.stats.partners} value={t.statsVals.partners} />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-[#2E7C7C]">{t.services.eyebrow}</p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t.services.heading}</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center leading-7 text-slate-600">{t.services.sub}</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {t.services.items.map((s) => (
            <FeatureCard key={s.title} title={s.title} desc={s.desc} icon={s.icon} />
          ))}
        </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-[#2E7C7C]">{t.partners.eyebrow}</p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t.partners.heading}</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center leading-7 text-slate-600">{t.partners.sub}</p>
        <div className="mt-12">
          <PartnersCarousel partners={partners} isRTL={isRTL} />
        </div>
      </section>

      {/* Clients */}
      <section
        id="clients"
        className="mx-auto my-10 max-w-7xl rounded-[2rem] border border-slate-200 bg-white px-4 py-20 shadow-sm sm:px-6 md:my-20 lg:px-8"
      >
        <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-[#2E7C7C]">{t.clients.eyebrow}</p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t.clients.heading}</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center leading-7 text-slate-600">{t.clients.sub}</p>

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
              className="relative h-24 w-24 opacity-75 grayscale transition-all duration-300 hover:scale-105 hover:opacity-100 hover:grayscale-0"
              title={client.name}
            >
              <SafeImage src={client.img} alt={client.name} fill className="object-contain" sizes="96px" />
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="relative overflow-hidden bg-[#123f43] text-white">
        <div className="absolute -end-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">{t.contact.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{t.contact.heading}</h2>
            <p className="mt-5 max-w-xl leading-7 text-white/70">{t.contact.sub}</p>
            <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm backdrop-blur">
              <InfoRow label={t.contact.phoneLabel} value={t.contact.phone} />
              <InfoRow label={t.contact.emailLabel} value={t.contact.email} />
              <InfoRow label={t.contact.addressLabel} value={t.contact.address} />
              <div className="flex flex-wrap gap-3 pt-3">
                <a
                  href={t.contact.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#174f52] transition hover:bg-teal-50"
                >
                  {t.cta.whatsapp}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 text-slate-800 shadow-2xl shadow-slate-950/20 sm:p-8">
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
                className="w-full rounded-xl bg-[#2E7C7C] px-5 py-3.5 font-bold text-white shadow-md transition hover:bg-[#256969]"
              >
                {t.cta.send}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0d3033] text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm sm:px-6 md:flex-row md:text-start lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-[#2E7C7C]">
              <SafeImage src="/logo.png" alt="ABC" fill className="object-contain" sizes="40px" />
            </div>
            <span>
            © {new Date().getFullYear()} {t.companyName} — {t.companyArabic}. {t.footer.rights}
            </span>
          </div>
          <button onClick={() => scrollToId("about")} className="font-semibold text-teal-200 transition hover:text-white">
            {t.footer.backToTop}
          </button>
        </div>
      </footer>

      <a
        href={t.contact.whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label={t.cta.whatsapp}
        className="fixed bottom-5 end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-xl font-bold text-white shadow-xl shadow-emerald-950/20 transition hover:-translate-y-1 hover:bg-[#20bd5a]"
      >
        <span aria-hidden="true">↗</span>
      </a>

      <style>{`
        .rtl { direction: rtl; }
        .ltr { direction: ltr; }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  return <Site initialLang="ar" />;
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-7 transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-2xl transition group-hover:bg-[#2E7C7C] group-hover:shadow-lg">{icon}</div>
      <div className="mt-5 text-lg font-bold text-slate-900">{title}</div>
      <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/15 py-5 last:border-none">
      <div className="text-sm text-white/70">{label}</div>
      <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
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
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#2E7C7C] focus:bg-white focus:ring-2 focus:ring-teal-100"
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
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#2E7C7C] focus:bg-white focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[110px_1fr]">
      <span className="text-white/55">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

// =====================
// i18n
// =====================
const EN = {
  companyName: "Advanced Basics For Trading Co.",
  companyArabic: "الأساسيات المتطورة للتجارة",
  nav: { about: "About", services: "Services", partners: "Partners", clients: "Featured Clients", contact: "Contact", menu: "Open menu" },
  hero: {
    badge: "Medical supply solutions across Saudi Arabia",
    title: "Trusted trading partner for medical solutions",
    subtitle: "We supply quality medical products with reliable delivery, clear documentation, and responsive support.",
    cardTitle: "Reliable solutions for every stage of medical supply",
    capabilities: ["Quality sourcing", "Tender support", "Reliable delivery", "Responsive service"]
  },
  cta: { getQuote: "Request a Quote", explore: "Explore Services", whatsapp: "WhatsApp", send: "Send Message" },
  about: {
    eyebrow: "About Advanced Basics",
    heading: "Who We Are",
    p1: "We are a trading company focused on medical supplies, built on transparency, compliance, and fast logistics.",
    p2: "From tender documentation to last-mile delivery, we ensure a smooth supply experience for our customers.",
    bullets: ["MOH, Military & Private", "Regulatory & Tenders", "Quality Sourcing", "On-time Delivery"],
    missionHeading: "Mission",
    mission: "Deliver dependable medical solutions through quality sourcing, compliant documentation, and excellent service.",
    visionHeading: "Vision",
    vision: "To become a preferred medical supply partner across the region."
  },
  stats: { heading: "Our experience in numbers", years: "Years of Experience", skus: "SKUs Supplied", partners: "Global Partners" },
  statsVals: { years: "10+", skus: "1500+", partners: "40+" },
  services: {
    eyebrow: "What we provide",
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
  partners: { eyebrow: "Global partnerships", heading: "Our Partners", sub: "Select a partner to visit their website or view their product catalog.", hint: "Tip: hover to pause autoplay." },
  clients: { eyebrow: "Trusted relationships", heading: "Featured Clients", sub: "Proud to serve leading healthcare institutions and organizations." },
  contact: {
    eyebrow: "Let’s work together",
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
  footer: { rights: "All rights reserved.", backToTop: "Back to top" }
};

const AR = {
  companyName: "الأساسيات المتطورة للتجارة",
  companyArabic: "Advanced Basics For Trading Co.",
  nav: { about: "من نحن", services: "خدماتنا", partners: "شركاؤنا", clients: "أبرز العملاء", contact: "تواصل معنا", menu: "فتح القائمة" },
  hero: {
    badge: "حلول توريد طبية في المملكة العربية السعودية",
    title: "شريك موثوق لحلول المستلزمات الطبية",
    subtitle: "نوفر منتجات طبية عالية الجودة مع التزام بالتسليم ووضوح في الوثائق وخدمة سريعة.",
    cardTitle: "حلول موثوقة في كل مرحلة من مراحل التوريد الطبي",
    capabilities: ["توريد بجودة عالية", "دعم المناقصات", "تسليم موثوق", "خدمة سريعة"]
  },
  cta: { getQuote: "اطلب عرض سعر", explore: "استكشف الخدمات", whatsapp: "واتساب", send: "إرسال" },
  about: {
    eyebrow: "عن الأساسيات المتطورة",
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
  stats: { heading: "خبرتنا بالأرقام", years: "سنوات خبرة", skus: "عدد الأصناف المورّدة", partners: "شركاء عالميون" },
  statsVals: { years: "10+", skus: "1500+", partners: "40+" },
  services: {
    eyebrow: "ما نقدمه",
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
  partners: { eyebrow: "شراكات عالمية", heading: "شركاؤنا", sub: "اختر الوكالة لزيارة موقعها أو استعراض كتالوج منتجاتها.", hint: "معلومة: مرّر المؤشر لإيقاف الحركة." },
  clients: { eyebrow: "علاقات موثوقة", heading: "أبرز العملاء", sub: "نفخر بخدمة كبرى المؤسسات والجهات الصحية." },
  contact: {
    eyebrow: "لنبدأ العمل معًا",
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
  footer: { rights: "جميع الحقوق محفوظة", backToTop: "العودة للأعلى" }
};

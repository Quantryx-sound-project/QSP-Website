import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { useParallax } from "@/hooks/useParallax";
import ArtworkOrbit, { type Artwork } from "@/components/portfolio/ArtworkOrbit";
import heroBg from "@/assets/backgrounds/hero-main.webp";

import art1 from "@/assets/portfolio/art-1.webp";
import art2 from "@/assets/portfolio/art-2.webp";
import art3 from "@/assets/portfolio/art-3.webp";
import art4 from "@/assets/portfolio/art-4.webp";

import logoBlaspheme from "@/assets/portfolio/logo-blaspheme.webp";
import logoFredo from "@/assets/portfolio/logo-fredo.webp";
import logoGudmyDark from "@/assets/portfolio/logo-gudmy-dark.webp";
import logoGudmyLight from "@/assets/portfolio/logo-gudmy-light.webp";

import merchFront from "@/assets/portfolio/merch-hoodie-front.webp";
import merchSide from "@/assets/portfolio/merch-hoodie-side.webp";
import merchBack from "@/assets/portfolio/merch-hoodie-back.webp";
import merchScarf from "@/assets/portfolio/merch-scarf.webp";

// Doplň sem skutočné artworky aj odkazy. `spotify` je voliteľné –
// keď chýba, tlačidlo sa v detaile jednoducho nezobrazí.
const ARTWORKS: Artwork[] = [
  { src: art1, title: "Fredo", kind: "Single cover" },
  { src: art2, title: "Quantryx", kind: "Album cover" },
  { src: art3, title: "Gudmy", kind: "Merch artwork" },
  { src: art4, title: "Gudmy", kind: "Textile print" },
];

const LOGOS = [
  { src: logoBlaspheme, name: "Blaspheme", kind: "Band logo", light: true },
  { src: logoFredo, name: "Fredo", kind: "Artist logo" },
  { src: logoGudmyDark, name: "Gudmy", kind: "Logo — dark", light: true },
  { src: logoGudmyLight, name: "Gudmy", kind: "Logo — light" },
];

const MERCH = [
  { src: merchFront, name: "Gudmy hoodie", kind: "Front" },
  { src: merchSide, name: "Gudmy hoodie", kind: "Side" },
  { src: merchBack, name: "Gudmy hoodie", kind: "Back" },
  { src: merchScarf, name: "Gudmy scarf", kind: "All-over print" },
];

/** Nadpis sekcie, ktorý sa pri rolovaní jemne dvíha. */
const SectionHead = ({
  eyebrow,
  title,
  note,
  shift,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  shift: number;
}) => (
  <header
    className="mb-10 will-change-transform"
    style={{ transform: `translateY(${shift}px)` }}
  >
    <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{eyebrow}</p>
    <h2 className="mt-3 text-3xl font-bold text-glow md:text-4xl">{title}</h2>
    {note && <p className="mt-3 max-w-xl text-muted-foreground">{note}</p>}
  </header>
);

const Portfolio = () => {
  const hero = useParallax<HTMLDivElement>();
  const orbit = useParallax<HTMLDivElement>();
  const logos = useParallax<HTMLDivElement>();
  const merch = useParallax<HTMLDivElement>();

  return (
    <AppLayout>
      {/* ---------- ÚVOD ---------- */}
      <section
        ref={hero.ref}
        className="relative overflow-hidden border-b border-primary/10 px-6 pb-24 pt-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-center opacity-35 will-change-transform"
          style={{
            backgroundImage: `url(${heroBg})`,
            transform: `scale(1.15) translateY(${(hero.progress - 0.5) * 60}px)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 cyber-grid opacity-25 will-change-transform"
          style={{ transform: `translateY(${(hero.progress - 0.5) * -80}px)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_45%_at_50%_0%,hsl(var(--primary)/0.22),transparent_70%)] will-change-transform"
          style={{ transform: `translateY(${(hero.progress - 0.5) * 140}px)` }}
        />
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Portfolio</p>
          <h1
            className="mt-4 text-5xl font-bold leading-[0.95] text-glow md:text-7xl will-change-transform"
            style={{ transform: `translateY(${(hero.progress - 0.5) * -40}px)` }}
          >
            Covers, logos
            <br />
            and things
            <br />
            people wear.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Visual work for music — drawn, modelled and rendered by hand. Nothing on this page
            was generated.
          </p>
        </div>
      </section>

      {/* ---------- ARTWORKY V KRUHU ---------- */}
      <section ref={orbit.ref} className="relative overflow-hidden px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(50%_40%_at_50%_50%,hsl(var(--neon)/0.12),transparent_70%)] will-change-transform"
          style={{ transform: `scale(${1 + (orbit.progress - 0.5) * 0.3})` }}
        />
        <div className="container mx-auto max-w-5xl">
          <SectionHead
            eyebrow="Artworks"
            title="Cover art"
            note="Singles, EPs and albums. Drag the ring to spin it."
            shift={(orbit.progress - 0.5) * -30}
          />
          <div className="mx-auto max-w-3xl" style={{ transform: `translateY(${(orbit.progress - 0.5) * -50}px)` }}>
            <ArtworkOrbit items={ARTWORKS} />
          </div>
        </div>
      </section>

      {/* ---------- LOGÁ ---------- */}
      <section ref={logos.ref} className="relative overflow-hidden border-t border-primary/10 px-6 py-24">
        <div className="container mx-auto max-w-5xl">
          <SectionHead
            eyebrow="Identity"
            title="Logos"
            note="Lettering built to survive a shirt print, a stage banner and a 32-pixel avatar."
            shift={(logos.progress - 0.5) * -30}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {LOGOS.map((logo, i) => (
              <figure
                key={logo.src}
                className="cyber-frame will-change-transform"
                style={{
                  // Striedavý posun stĺpcov – mriežka sa pri rolovaní rozvlní.
                  transform: `translateY(${(logos.progress - 0.5) * (i % 2 ? 40 : -40)}px)`,
                }}
              >
                <div className="cyber-frame-inner">
                  <div
                    className={`grid place-items-center p-8 ${
                      logo.light ? "bg-white/90" : "bg-black/40"
                    }`}
                  >
                    <img
                      src={logo.src}
                      alt={`${logo.name} — ${logo.kind}`}
                      loading="lazy"
                      className="max-h-40 w-auto object-contain"
                    />
                  </div>
                  <figcaption className="flex items-baseline justify-between p-4">
                    <span className="font-medium">{logo.name}</span>
                    <span className="text-sm text-muted-foreground">{logo.kind}</span>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- MERCH ---------- */}
      <section ref={merch.ref} className="relative overflow-hidden border-t border-primary/10 px-6 py-24">
        <div className="container mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Collection"
            title="Merch"
            note="Gudmy — hoodie from three angles and an all-over print scarf."
            shift={(merch.progress - 0.5) * -30}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MERCH.map((item, i) => (
              <figure
                key={item.src}
                className="group overflow-hidden rounded-xl border border-border/50 bg-black/30 will-change-transform"
                style={{ transform: `translateY(${(merch.progress - 0.5) * (-20 - i * 14)}px)` }}
              >
                <img
                  src={item.src}
                  alt={`${item.name} — ${item.kind}`}
                  loading="lazy"
                  className="aspect-[9/16] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <figcaption className="flex items-baseline justify-between p-4">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.kind}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- MOTION ---------- */}
      <section className="border-t border-primary/10 px-6 py-24">
        <div className="container mx-auto max-w-5xl">
          <SectionHead eyebrow="Moving" title="Motion design" shift={0} />
          <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">
            Videos land here next.
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-3">
            <a href={`mailto:${site.email}?subject=Design%20enquiry`}>
              <Button size="lg">Work with me</Button>
            </a>
            <Link to="/design">
              <Button size="lg" variant="outline">
                What I offer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
};

export default Portfolio;

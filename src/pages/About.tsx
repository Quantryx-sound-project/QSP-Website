import { useEffect, useState } from "react";
import { Mail, ArrowRight, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import ModuleBackground from "@/components/ModuleBackground";
import aboutBg from "@/assets/backgrounds/hero-about.webp";
import quantryxLogo from "@/assets/images/quantryxlogo.jpg";
import longside from "@/assets/images/longside.jpg";
import { site } from "@/lib/site";
import { useT } from "@/lib/i18n";

const About = () => {
  const { t, tList } = useT();
  const [scrollY, setScrollY] = useState(0);

  // Jemný parallax: dekoratívne vrstvy v hero sa hýbu pomalšie než obsah.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const activeSocials = site.socials.filter((s) => s.url);

  return (
    <AppLayout>
      {/* Hero s parallaxom */}
      <section className="relative overflow-hidden">
        <ModuleBackground src={aboutBg} position="top" size="100% auto" opacity={1} blur={0} darken={0.28} parallax={0} blend="normal" fade="top" />
        <div
          className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div
          className="pointer-events-none absolute top-20 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />

        <div className="relative container mx-auto px-6 pt-52 pb-28 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-4 py-1.5 text-sm text-muted-foreground">
            <Music className="h-4 w-4 text-primary" />
            {t("about.badge")}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="px-6 pb-8">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-[3fr_2fr] gap-8 items-center">
            <div className="relative aspect-[2543/1362] rounded-2xl overflow-hidden">
              <img
                src={quantryxLogo}
                alt={site.artist}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
            </div>
            <div className="space-y-4">
              {tList("bio").map((p, i) => (
                <p key={i} className="text-lg leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Foto pod textom — fade dole ku kontaktu */}
      <section className="relative -mt-4">
        <img
          src={longside}
          alt={site.artist}
          className="w-full h-[65vh] object-cover"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, #000 22%, #000 68%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, #000 22%, #000 68%, transparent 100%)",
          }}
          loading="lazy"
        />
      </section>

      {/* Kontakt + siete */}
      <section className="px-6 py-12">
        <div className="container mx-auto max-w-3xl">
          <div className="group cyber-frame">
            <div className="cyber-frame-inner py-8 px-6 text-center">
              <h2 className="text-2xl font-bold mb-2">{t("about.connectTitle")}</h2>
              <p className="text-muted-foreground mb-6">{t("about.connectText")}</p>
              <Button asChild size="lg" variant="cyber">
                <a href={`mailto:${site.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  {site.email}
                </a>
              </Button>

              {activeSocials.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
                  {activeSocials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                      {s.label}
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-6">{t("about.socialsTodo")}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
};

export default About;

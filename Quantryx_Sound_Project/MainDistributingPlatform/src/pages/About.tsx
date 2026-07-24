import { useEffect, useState } from "react";
import { Sparkles, Mail, ArrowRight, Music } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import ModuleBackground from "@/components/ModuleBackground";
import aboutBg from "@/assets/backgrounds/hero-about.webp";
import { site } from "@/lib/site";
import { products, planNameKey } from "@/lib/products";
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
        <ModuleBackground src={aboutBg} position="center" opacity={0.95} blur={0} darken={0.35} parallax={0.18} blend="normal" fade="radial" />
        <div
          className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div
          className="pointer-events-none absolute top-20 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />

        <div className="relative container mx-auto px-6 py-28 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Music className="h-4 w-4 text-primary" />
            {t("about.badge")}
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold tracking-tight mb-4"
            style={{ transform: `translateY(${scrollY * -0.05}px)` }}
          >
            {site.artist}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t("about.heroSubtitle").replace("{brand}", site.brand)}
          </p>
        </div>
      </section>

      {/* Bio */}
      <section className="px-6 pb-8">
        <div className="container mx-auto max-w-3xl">
          <div className="grid md:grid-cols-[1fr_2fr] gap-8 items-start">
            <div className="aspect-square rounded-2xl border border-dashed border-border/60 bg-muted/30 grid place-items-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="h-8 w-8" />
                <span className="text-sm">{t("about.yourPhoto")}</span>
              </div>
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

      {/* Tvorba / projekty */}
      <section className="px-6 py-12">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">{t("about.toolsTitle")}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {products.map((product) => (
              <Link key={product.slug} to={`/product/${product.slug}`}>
                <Card className="bg-card/50 border-border/40 hover:border-primary/40 transition-colors h-full">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-1">{t(planNameKey(product.slug))}</h3>
                    <p className="text-sm text-muted-foreground">{t(`products.${product.slug}.tagline`)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
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

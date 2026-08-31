import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Menu, X, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import { useSidebar } from "@/hooks/useSidebar";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n";
import { planById } from "@/lib/products";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AppMenu from "@/components/AppMenu";
import { cn } from "@/lib/utils";
import ModuleBackground from "@/components/ModuleBackground";
import WaitlistSection from "@/components/WaitlistSection";
import heroBg from "@/assets/backgrounds/background.png";
import spiralBg from "@/assets/backgrounds/bg2.png";

const Quantryx = () => {
  const { t } = useT();
  const { open: menuOpen, setOpen: setMenuOpen, width, startResize } = useSidebar(true);

  // Aplikácie a pluginy zobrazené na homepage. Ďalšie doplníš pridaním položky.
  const apps = [
    {
      name: "Alter",
      icon: Waves,
      href: "#waitlist",
      status: t("landing.statusActive"),
      tagline: t("landing.alterTagline"),
      price: `${t("landing.from")} ${planById.listener.price}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-[70] h-16 border-b border-primary/20 bg-background/70 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--neon)/0.22)]">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? t("nav.menuClose") : t("nav.menuOpen")}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo-wordmark.svg" alt="Quantryx Sound Project" className="h-8 w-auto" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <Link to="/login">
              <Button variant="ghost">{t("nav.login")}</Button>
            </Link>
          </div>
        </div>
      </nav>

      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-[65] border-r border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl transition-transform duration-300",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width }}
      >
        <div className="h-full overflow-y-auto p-4">
          <AppMenu onNavigate={() => setMenuOpen(false)} compact />
        </div>
        <div
          onMouseDown={startResize}
          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 transition-colors"
          aria-hidden
        />
      </aside>

      <div className="transition-[padding] duration-300" style={{ paddingLeft: menuOpen ? width : 0 }}>
      <section className="relative overflow-hidden pt-32 pb-24 px-6 aurora">
        <ModuleBackground src={heroBg} position="center 40%" opacity={0.6} blur={6} darken={0.45} blend="screen" fade="radial" />
        <div className="relative z-10 container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 gap-2 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 font-mono text-xs uppercase tracking-[0.2em]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-neon shadow-neon-cyan animate-neon-flicker" />
            {t("landing.badge")}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-glow bg-gradient-to-r from-foreground via-primary to-neon bg-clip-text text-transparent">
            {t("landing.heroTitle1")}
            <br />
            {t("landing.heroTitle2")}
          </h1>
          <blockquote className="mb-6 text-lg md:text-xl italic text-foreground/80 max-w-2xl mx-auto">
            “{t("landing.heroQuote")}”
            <footer className="mt-2 text-sm not-italic text-primary">— {t("landing.heroQuoteAuthor")}</footer>
          </blockquote>
          <p className="text-base text-muted-foreground mb-10">{t("landing.heroSubtitle")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/pricing">
              <Button size="lg">
                {t("nav.pricing")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline">
                {t("landing.aboutCta")}
              </Button>
            </Link>
            <a href="#waitlist">
              <Button size="lg">
                Join ALTER Waitlist
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="container mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-glow">{t("landing.productsTitle")}</h2>
              <p className="text-muted-foreground mt-2">{t("landing.productsSubtitle")}</p>
            </div>
            <span className="text-sm text-muted-foreground hidden md:block">
              {apps.length} {t("landing.productsCount")}
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <a key={app.name} href={app.href} className="group">
                  <div className="cyber-frame h-full">
                    <div className="cyber-frame-inner h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 grid place-items-center transition-shadow group-hover:glow-cyan">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {app.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-3xl">{app.name}</CardTitle>
                      <CardDescription className="text-base text-foreground/80 pt-2">
                        {app.tagline}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{app.price}</span>
                        <span className="inline-flex items-center gap-2 text-primary font-medium">
                          Join waitlist
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </CardContent>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <WaitlistSection />

      <section className="relative overflow-hidden py-24 px-6 border-t border-primary/15">
        <ModuleBackground src={spiralBg} position="center" opacity={0.22} blend="screen" fade="radial" />
        <div className="relative z-10 container mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">{t("landing.craftedTitle")}</div>
            <p className="text-muted-foreground">{t("landing.craftedText")}</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-neon text-glow-cyan mb-2">{t("landing.crossTitle")}</div>
            <p className="text-muted-foreground">{t("landing.crossText")}</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">{t("landing.accountTitle")}</div>
            <p className="text-muted-foreground">{t("landing.accountText")}</p>
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </div>
  );
};

export default Quantryx;

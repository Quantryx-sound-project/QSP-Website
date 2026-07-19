import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import Footer from "@/components/Footer";
import { useT } from "@/lib/i18n";
import { products, planById, planNameKey } from "@/lib/products";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AppMenu from "@/components/AppMenu";
import { cn } from "@/lib/utils";

const Quantryx = () => {
  const { t } = useT();
  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-[70] h-16 border-b border-border/40 bg-background/90 backdrop-blur-xl">
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
              <img src="/logo.svg" alt="Quantryx Sound Project" className="h-8 w-auto" />
              <span className="text-xl font-bold tracking-tight">
                Quantryx<span className="text-primary"> Sound</span> Project
              </span>
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

      {menuOpen && <div className="fixed left-0 right-0 bottom-0 top-16 z-[60] bg-black/45" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-[65] w-72 max-w-[85vw] border-r border-border/40 bg-background shadow-2xl transition-transform duration-300",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full overflow-y-auto p-4">
          <AppMenu onNavigate={() => setMenuOpen(false)} compact />
        </div>
      </aside>

      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            {t("landing.badge")}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
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
          </div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="container mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">{t("landing.productsTitle")}</h2>
              <p className="text-muted-foreground mt-2">{t("landing.productsSubtitle")}</p>
            </div>
            <span className="text-sm text-muted-foreground hidden md:block">
              {products.length} {t("landing.productsCount")}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {products.map((p) => {
              const Icon = p.icon;
              const primaryPlanId = p.planIds[0];
              const plan = planById[primaryPlanId];
              const base = `products.${p.slug}`;
              const name = t(planNameKey(primaryPlanId));
              const price =
                plan?.periodType === "free"
                  ? t("plans.free")
                  : `${plan?.price ?? ""} ${t("plans.oneTime")}`;

              return (
                <Link key={p.slug} to={`/product/${p.slug}`} className="group">
                  <Card className="h-full bg-card/50 border-border/40 backdrop-blur-sm transition-all group-hover:border-primary/50 group-hover:bg-card/80">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 grid place-items-center">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {t(`${base}.status`)}
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <CardTitle className="text-3xl">{name}</CardTitle>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">
                          {t(`${base}.tag`)}
                        </span>
                      </div>
                      <CardDescription className="text-base text-foreground/80 pt-2">
                        {t(`${base}.tagline`)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">{t(`${base}.intro`)}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{price}</span>
                        <span className="inline-flex items-center gap-2 text-primary font-medium">
                          {t("landing.viewProduct")}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/40">
        <div className="container mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">{t("landing.craftedTitle")}</div>
            <p className="text-muted-foreground">{t("landing.craftedText")}</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">{t("landing.crossTitle")}</div>
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
  );
};

export default Quantryx;

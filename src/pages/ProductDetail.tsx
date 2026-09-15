import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, ImageIcon, ChevronDown, Zap } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  alterModules,
  alterOverview,
  dawAutomation,
  fullDocsZipPath,
  type AlterModuleDoc,
} from "@/lib/alterDocs";
import { planById, planNameKey, productBySlug, type PlanId } from "@/lib/products";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useClaimDemo } from "@/hooks/useProfileData";
import { toast } from "sonner";
import ModuleBackground from "@/components/ModuleBackground";
import bgDemo from "@/assets/backgrounds/hero-demo.webp";
import bgListener from "@/assets/backgrounds/hero-listener.webp";
import bgCreator from "@/assets/backgrounds/hero-creator.webp";
import bgPro from "@/assets/backgrounds/hero-pro.webp";
import demoShot from "@/assets/backgrounds/demoBG.png";

const productBg: Record<string, string> = {
  demo: bgDemo, // mandala
  listener: bgListener,
  creator: bgCreator, // spiro tunnel
  pro: bgPro, // star in blue halo
};

// Collapsible, Wikipedia-style module section.
// Text + images are only mounted once the panel is opened (lazy), so nothing
// loads until the reader actually expands that module.
const ModuleSection = ({
  module,
  reversed,
  openLabel,
}: {
  module: AlterModuleDoc;
  reversed: boolean;
  openLabel: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`group cyber-frame ${open ? "is-open" : ""}`}>
      <div className="cyber-frame-inner overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-primary/[0.06] transition-colors"
        >
          <span
            aria-hidden
            className={`shrink-0 h-9 w-9 rounded-lg bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/30 grid place-items-center transition-shadow ${
              open ? "glow-cyan" : "group-hover:glow-cyan"
            }`}
          >
            <ChevronDown
              className={`h-5 w-5 text-primary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </span>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-semibold">{module.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{module.summary}</p>
          </div>
          <span className="hidden sm:inline shrink-0 text-xs text-muted-foreground">{openLabel}</span>
        </button>

        {open && (
          <div className="px-5 pb-6 pt-1 border-t border-primary/15">
            <div
              className={`grid gap-6 md:grid-cols-2 items-start ${
                reversed ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="space-y-4">
                {module.content.map((p, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
              <div className="space-y-3">
                {module.images.map((img, i) => (
                  <figure key={i} className="space-y-1">
                    <img
                      src={img.src}
                      alt={img.caption ?? module.title}
                      loading="lazy"
                      className="w-full rounded-lg border border-border/40 bg-black/20"
                    />
                    {img.caption && (
                      <figcaption className="text-xs text-muted-foreground text-center">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useT();
  const { session } = useAuth();
  const claimDemo = useClaimDemo();
  const product = slug ? productBySlug[slug] : undefined;

  if (!product) {
    return (
      <AppLayout>
        <div className="px-6 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("productPage.notFound")}</h1>
          <Link to="/pricing" className="text-primary hover:underline">
            {t("productPage.seePricing")}
          </Link>
        </div>
      </AppLayout>
    );
  }

  const primaryPlanId = product.planIds[0];
  const plan = planById[primaryPlanId];
  const currentPlanId = primaryPlanId as PlanId;
  const isDemo = product.slug === "demo";
  const name = t(planNameKey(primaryPlanId));
  const price = plan?.price ?? "";
  const base = `products.${product.slug}`;
  // Demo je zadarmo – priame stiahnutie. Zatiaľ nemáme reálnu inštalačku,
  // takže sťahujeme zástupný súbor z /public/downloads.
  const demoDownloadPath = "/downloads/alter-demo-placeholder.png";
  const buyLabel = t("productPage.buyFor").replace("{price}", price);
  const isAuthed = Boolean(session);

  // Prihlásený používateľ: zapíšeme demo licenciu (aby sa objavila v „Licenciách")
  // a spustíme stiahnutie. Neprihlásený: pošleme ho na login.
  const handleDemoDownload = async () => {
    try {
      await claimDemo.mutateAsync();
    } catch {
      /* aj keď zápis licencie zlyhá, stiahnutie povolíme */
    }
    const a = document.createElement("a");
    a.href = demoDownloadPath;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(t("productPage.downloadStarted"));
  };

  const demoCta = isAuthed ? (
    <Button
      size="lg"
      variant="cyber"
      onClick={handleDemoDownload}
      disabled={claimDemo.isPending}
    >
      <Download className="mr-2 h-4 w-4" />
      {t("dashboard.download")}
    </Button>
  ) : (
    <Button size="lg" variant="cyber" onClick={() => navigate("/login")}>
      {t("productPage.signInToDownload")}
    </Button>
  );

  const planModules = alterModules.filter((m) => m.availableIn.includes(currentPlanId));
  const analysisModules = planModules.filter((m) => m.category === "analysis");
  const creativeModules = planModules.filter((m) => m.category === "creative");
  const openLabel = t("productPage.expand");

  return (
    <AppLayout>
      <div className="relative">
        {/* Hero image — crisp, fully visible, soft gradient blend into the page */}
        <div className="relative overflow-hidden h-[42vh] min-h-[300px] sm:h-[48vh]">
          <ModuleBackground
            src={productBg[product.slug] ?? bgDemo}
            position="center"
            opacity={1}
            blur={0}
            darken={0}
            parallax={0.16}
            blend="normal"
            fade="none"
          />
          {/* readability scrims: fade the edges into the background */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-transparent to-background" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background/60 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background/60 to-transparent" />
        </div>

        {/* Content pulled up to overlap the faded lower edge of the hero */}
        <div className="relative z-10 px-6 -mt-24 sm:-mt-28 pb-12">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {t(`${base}.tag`)}
            </Badge>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-3">{name}</h1>
          <p className="text-xl text-primary mb-4">{t(`${base}.tagline`)}</p>
          <p className="text-lg text-muted-foreground max-w-3xl mb-8">{t(`${base}.intro`)}</p>

          <div className="flex flex-wrap gap-3 mb-14">
            {isDemo ? (
              demoCta
            ) : (
              <Button
                size="lg"
                variant="cyber"
                onClick={() => navigate(`/checkout?plan=${primaryPlanId}`)}
              >
                {buyLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Link to="/pricing">
              <Button size="lg" variant="cyber-outline">
                {t("productPage.allOptions")}
              </Button>
            </Link>
          </div>

          {isDemo && (
            <Card className="bg-card/50 border-primary/25 mb-14 overflow-hidden">
              <CardContent className="flex flex-col md:flex-row items-center gap-6 py-7">
                <img
                  src={demoShot}
                  alt=""
                  className="w-full md:w-56 rounded-lg border border-border/40 bg-black/20 object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">{t("productPage.downloadDemoTitle")}</h2>
                  <p className="text-muted-foreground mb-4">{t("productPage.downloadDemoText")}</p>
                  {demoCta}
                  <p className="text-xs text-muted-foreground mt-3">
                    {isAuthed ? t("productPage.installerSoon") : t("productPage.demoNeedsLogin")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {isDemo && (
            <section className="mb-16 grid gap-6 md:grid-cols-3">
              <Card className="bg-card/50 border-border/40">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-2">Why Alter exists</h2>
                  <p className="text-sm text-muted-foreground">{alterOverview.why}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/40 md:col-span-2">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-2">What it is</h2>
                  <p className="text-sm text-muted-foreground">{alterOverview.summary}</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Modules — collapsible, lazy-loaded explanations */}
          <section className="mb-16">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">{t("productPage.modulesTitle")}</h2>
              <p className="text-muted-foreground">{t("productPage.modulesSubtitle")}</p>
            </div>

            <div className="space-y-4">
              {analysisModules.map((module, i) => (
                <ModuleSection
                  key={module.slug}
                  module={module}
                  reversed={i % 2 === 1}
                  openLabel={openLabel}
                />
              ))}
            </div>

            {creativeModules.length > 0 && (
              <>
                {/* Shared DAW automation block — so it is explained once, not per creative module */}
                <Card className="bg-primary/5 border-primary/25 mt-8 mb-4">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{dawAutomation.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {dawAutomation.content.map((p, i) => (
                        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {creativeModules.map((module, i) => (
                    <ModuleSection
                      key={module.slug}
                      module={module}
                      reversed={i % 2 === 1}
                      openLabel={openLabel}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Full documentation download — one folder, every module */}
          <Card className="bg-card/50 border-border/40 mb-16">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-7">
              <div>
                <h3 className="text-xl font-bold">{t("productPage.fullDocsTitle")}</h3>
                <p className="text-muted-foreground">{t("productPage.fullDocsText")}</p>
              </div>
              <Button asChild size="lg" variant="cyber-outline">
                <a href={fullDocsZipPath} download>
                  <Download className="mr-2 h-4 w-4" />
                  {t("productPage.fullDocsButton")}
                </a>
              </Button>
            </CardContent>
          </Card>

          <div className="group cyber-frame">
            <div className="cyber-frame-inner">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-8">
                <div>
                  <h3 className="text-xl font-bold">
                    {t("productPage.ctaTitle").replace("{name}", name)}
                  </h3>
                  <p className="text-muted-foreground">{t("productPage.ctaText")}</p>
                </div>
                {isDemo ? (
                  demoCta
                ) : (
                  <Button
                    size="lg"
                    variant="cyber"
                    onClick={() => navigate(`/checkout?plan=${primaryPlanId}`)}
                  >
                    {buyLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">{t("common.mockupNote")}</p>
        </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetail;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, ImageIcon } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { alterModules, alterOverview } from "@/lib/alterDocs";
import { planById, planNameKey, productBySlug, type PlanId } from "@/lib/products";
import { useT } from "@/lib/i18n";

const ImagePlaceholder = ({ label }: { label: string }) => (
  <div className="aspect-video w-full rounded-xl border border-dashed border-border/60 bg-muted/30 grid place-items-center text-muted-foreground">
    <div className="flex flex-col items-center gap-2">
      <ImageIcon className="h-8 w-8" />
      <span className="text-sm">{label}</span>
    </div>
  </div>
);

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, tList } = useT();
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
  const buyLabel = isDemo ? t("productPage.signInToDownload") : t("productPage.buyFor").replace("{price}", price);

  const heads = tList(`${base}.sectionHeads`);
  const bodies = tList(`${base}.sectionBodies`);
  const sections = heads.map((h, index) => ({ h, b: bodies[index] ?? "" }));

  return (
    <AppLayout>
      <div className="px-6 py-12">
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
            <Button size="lg" onClick={() => (isDemo ? navigate("/dashboard") : navigate(`/checkout?plan=${primaryPlanId}`))}>
              {buyLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                {t("productPage.allOptions")}
              </Button>
            </Link>
          </div>

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

          <div className="mb-14">
            <ImagePlaceholder label={t("productPage.mainPreview").replace("{name}", name)} />
          </div>

          <div className="space-y-12 mb-16">
            {sections.map((section) => (
              <div key={section.h} className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-3">{section.h}</h2>
                  <p className="text-muted-foreground leading-relaxed">{section.b}</p>
                </div>
                <ImagePlaceholder label={section.h} />
              </div>
            ))}
          </div>

          <section className="mb-16">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t("productPage.docsTitle")}</h2>
                <p className="text-muted-foreground">{t("productPage.docsSubtitle")}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {alterModules.filter((module) => module.availableIn.includes(currentPlanId)).map((module) => (
                <Card key={module.slug} className="bg-card/50 border-border/40">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{module.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{module.summary}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button asChild size="sm" variant="outline">
                          <a href={module.docPath} download>
                            <Download className="mr-2 h-4 w-4" />
                            {t("productPage.downloadDoc")}
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <a href={module.docPath} target="_blank" rel="noreferrer">
                            {t("productPage.openDoc")}
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <h2 className="text-2xl font-bold mb-6">{t("productPage.samples")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
            {Array.from({ length: product.gallery }).map((_, index) => (
              <ImagePlaceholder key={index} label={`${t("productPage.screenshot")} ${index + 1}`} />
            ))}
          </div>

          <Card className="bg-card/50 border-primary/30">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
              <div>
                <h3 className="text-xl font-bold">{t("productPage.ctaTitle").replace("{name}", name)}</h3>
                <p className="text-muted-foreground">{t("productPage.ctaText")}</p>
              </div>
              <Button size="lg" onClick={() => (isDemo ? navigate("/dashboard") : navigate(`/checkout?plan=${primaryPlanId}`))}>
                {buyLabel}
              </Button>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-8">{t("common.mockupNote")}</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetail;

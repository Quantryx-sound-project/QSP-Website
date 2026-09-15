import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";
import ModuleBackground from "@/components/ModuleBackground";
import bgHero from "@/assets/backgrounds/hero-pricing.webp";
import { plans, planNameKey, planFeaturesKey, Plan } from "@/lib/products";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

const Pricing = () => {
  const navigate = useNavigate();
  const { t, tList, lang } = useT();
  const { session } = useAuth();

  const buy = (planId: string) => navigate(`/checkout?plan=${planId}`);
  const periodLabel = (p: Plan) => {
    if (p.periodType === "free") return t("plans.free");
    return t("plans.oneTime");
  };

  const descFor = (id: string) =>
    id === "demo"
      ? t("plans.descDemo")
      : id === "listener"
        ? t("plans.descListener")
        : id === "creator"
          ? t("plans.descCreator")
          : t("plans.descPro");

  const moduleRows =
    lang === "sk"
      ? [
          { module: "Audio Meter", type: "meranie", demo: "⚪", listener: "✅ plný", creator: "⚪", pro: "✅" },
          { module: "Spectrum", type: "meranie", demo: "⚪", listener: "✅", creator: "⚪", pro: "✅" },
          { module: "Oscilloscope", type: "meranie", demo: "⚪", listener: "✅", creator: "⚪", pro: "✅" },
          { module: "Spectrogram", type: "meranie", demo: "❌", listener: "✅", creator: "❌", pro: "✅" },
          { module: "Stereoscope", type: "meranie", demo: "❌", listener: "✅", creator: "❌", pro: "✅" },
          { module: "Tone Analyzer", type: "meranie", demo: "❌", listener: "✅", creator: "❌", pro: "✅" },
          { module: "Synesthesia", type: "kreatíva", demo: "❌", listener: "❌", creator: "✅", pro: "✅" },
          { module: "Chladni Pattern", type: "kreatíva", demo: "❌", listener: "❌", creator: "✅", pro: "✅" },
          { module: "Geometry", type: "kreatíva", demo: "❌", listener: "❌", creator: "✅", pro: "✅" },
        ]
      : [
          { module: "Audio Meter", type: "analysis", demo: "⚪", listener: "✅ full", creator: "⚪", pro: "✅" },
          { module: "Spectrum", type: "analysis", demo: "⚪", listener: "✅", creator: "⚪", pro: "✅" },
          { module: "Oscilloscope", type: "analysis", demo: "⚪", listener: "✅", creator: "⚪", pro: "✅" },
          { module: "Spectrogram", type: "analysis", demo: "❌", listener: "✅", creator: "❌", pro: "✅" },
          { module: "Stereoscope", type: "analysis", demo: "❌", listener: "✅", creator: "❌", pro: "✅" },
          { module: "Tone Analyzer", type: "analysis", demo: "❌", listener: "✅", creator: "❌", pro: "✅" },
          { module: "Synesthesia", type: "creative", demo: "❌", listener: "❌", creator: "✅", pro: "✅" },
          { module: "Chladni Pattern", type: "creative", demo: "❌", listener: "❌", creator: "✅", pro: "✅" },
          { module: "Geometry", type: "creative", demo: "❌", listener: "❌", creator: "✅", pro: "✅" },
        ];

  const functionRows =
    lang === "sk"
      ? [
          { feature: "Create (pridať modul)", demo: "⚪ max 2", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Destroy (zmazať modul)", demo: "✅", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Explore (info okná)", demo: "✅", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Save / Load preset", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Record (audio+video HUD)", demo: "⚪ s watermarkom", listener: "✅ čistý", creator: "✅ čistý", pro: "✅ čistý" },
          { feature: "Always on top / Hold / Hide info", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Théma", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Výber / prehadzovanie modulov", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Počet blokov (radov)", demo: "1", listener: "3", creator: "3", pro: "3" },
          { feature: "Audio Input: System Audio", demo: "✅", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Audio Input: Plugin / UDP", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Per-module Source picker", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "DAW automatizácia (Ableton)", demo: "❌", listener: "❌", creator: "✅", pro: "✅" },
          { feature: "Počet modulov spolu", demo: "max 2", listener: "neobmedzene", creator: "neobmedzene", pro: "neobmedzene" },
        ]
      : [
          { feature: "Create (add module)", demo: "⚪ max 2", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Destroy (remove module)", demo: "✅", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Explore (info windows)", demo: "✅", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Save / Load preset", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Record (audio+video HUD)", demo: "⚪ with watermark", listener: "✅ clean", creator: "✅ clean", pro: "✅ clean" },
          { feature: "Always on top / Hold / Hide info", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Theme", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Module selection / switching", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Number of blocks (rows)", demo: "1", listener: "3", creator: "3", pro: "3" },
          { feature: "Audio Input: System Audio", demo: "✅", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Audio Input: Plugin / UDP", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "Per-module Source picker", demo: "❌", listener: "✅", creator: "✅", pro: "✅" },
          { feature: "DAW automation (Ableton)", demo: "❌", listener: "❌", creator: "✅", pro: "✅" },
          { feature: "Total module count", demo: "max 2", listener: "unlimited", creator: "unlimited", pro: "unlimited" },
        ];

  const PlanCard = ({ plan }: { plan: Plan }) => (
    <Card
      className={cn(
        "relative overflow-hidden flex flex-col",
        plan.highlight
          ? "border-primary border-2 bg-card/70 md:scale-105 shadow-lg shadow-primary/10"
          : "bg-card/50 border-border/40"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 pointer-events-none bg-gradient-to-br to-transparent",
          plan.highlight ? "from-primary/10" : "from-primary/5"
        )}
      />
      {plan.highlight && (
        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
          {t("plans.badgeBestValue")}
        </Badge>
      )}
      <CardHeader className="relative">
        <CardTitle className="text-2xl">{t(planNameKey(plan.id))}</CardTitle>
        <CardDescription>{descFor(plan.id)}</CardDescription>
        <div className="mt-6 flex items-end gap-2">
          <span className="text-5xl font-bold">{plan.price}</span>
          <span className="text-muted-foreground mb-1">{periodLabel(plan)}</span>
        </div>
        {plan.originalPrice && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-muted-foreground line-through">{plan.originalPrice}</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {t("plans.save")}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col">
        <ul className="space-y-3 mb-8">
          {tList(planFeaturesKey(plan.id)).map((f) => (
            <li key={f} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button
          className="w-full mt-auto"
          size="lg"
          variant={plan.highlight ? "cyber" : "cyber-outline"}
          onClick={() =>
            plan.periodType === "free"
              ? navigate(session ? "/product/demo" : "/login")
              : buy(plan.id)
          }
        >
          {plan.periodType === "free"
            ? session
              ? t("dashboard.download")
              : t("common.signInToDownload")
            : t("common.buy")}
        </Button>
      </CardContent>
    </Card>
  );

  const renderCell = (value: string) => <span className="text-sm font-medium">{value}</span>;

  return (
    <AppLayout>
      <div className="relative overflow-hidden px-6 py-16">
        <ModuleBackground
          src={bgHero}
          position="center"
          opacity={0.85}
          blur={0}
          darken={0.45}
          parallax={0.18}
          blend="normal"
          fade="radial"
          className="h-[62vh] !bottom-auto"
        />
        <div className="relative z-10 container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("pricing.title")}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("pricing.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-border/40 bg-card/40 p-6 md:p-8 space-y-12">
            <section>
              <h2 className="text-2xl md:text-3xl font-bold">{lang === "sk" ? "Moduly" : "Modules"}</h2>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[860px] border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="px-4 py-2 font-medium">{lang === "sk" ? "Modul" : "Module"}</th>
                      <th className="px-4 py-2 font-medium">{lang === "sk" ? "Typ" : "Type"}</th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="px-4 py-2 font-medium text-center">
                          {t(planNameKey(plan.id))}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {moduleRows.map((row) => (
                      <tr key={row.module} className="rounded-2xl bg-background/60">
                        <td className="px-4 py-4 font-medium">{row.module}</td>
                        <td className="px-4 py-4 text-muted-foreground">{row.type}</td>
                        <td className="px-4 py-4 text-center">{renderCell(row.demo)}</td>
                        <td className="px-4 py-4 text-center">{renderCell(row.listener)}</td>
                        <td className="px-4 py-4 text-center">{renderCell(row.creator)}</td>
                        <td className="px-4 py-4 text-center">{renderCell(row.pro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-bold">{lang === "sk" ? "Funkcie a tlačidlá" : "Features and buttons"}</h2>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[980px] border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="px-4 py-2 font-medium">{lang === "sk" ? "Funkcia" : "Feature"}</th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="px-4 py-2 font-medium text-center">
                          {t(planNameKey(plan.id))}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {functionRows.map((row) => (
                      <tr key={row.feature} className="rounded-2xl bg-background/60">
                        <td className="px-4 py-4 font-medium">{row.feature}</td>
                        <td className="px-4 py-4 text-center">{renderCell(row.demo)}</td>
                        <td className="px-4 py-4 text-center">{renderCell(row.listener)}</td>
                        <td className="px-4 py-4 text-center">{renderCell(row.creator)}</td>
                        <td className="px-4 py-4 text-center">{renderCell(row.pro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="text-sm text-muted-foreground">{t("pricing.guarantee")}</p>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">{t("pricing.faqTitle")}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">{t("pricing.faq1q")}</h3>
                <p className="text-muted-foreground">{t("pricing.faq1a")}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t("pricing.faq2q")}</h3>
                <p className="text-muted-foreground">{t("pricing.faq2a")}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t("pricing.faq3q")}</h3>
                <p className="text-muted-foreground">{t("pricing.faq3a")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Pricing;

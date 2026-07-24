import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, ArrowLeft, Lock, ShieldCheck, Menu, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { planById, planNameKey } from "@/lib/products";
import { openLemonCheckout } from "@/lib/lemonSqueezy";
import { useT } from "@/lib/i18n";
import AppMenu from "@/components/AppMenu";
import { cn } from "@/lib/utils";

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useT();
  const planId = searchParams.get("plan") || "creator";
  const [loading, setLoading] = useState(false);
  const { open: menuOpen, setOpen: setMenuOpen, width, startResize } = useSidebar(true);

  const plan = planById[planId] || planById.creator;
  const priceLabel =
    plan.periodType === "free"
      ? t("plans.free")
      : `${plan.price} ${t("plans.oneTime")}`;

  // Otvorí Lemon Squeezy checkout (overlay cez lemon.js, inak nová karta).
  const handleCheckout = async () => {
    setLoading(true);
    try {
      const opened = openLemonCheckout(plan.id, {
        email: user?.email ?? undefined,
        userId: user?.id,
      });
      if (!opened) {
        toast.info(t("checkout.lemonNotConfigured"), {
          description: t("checkout.lemonNotConfiguredDesc"),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-[70] h-16 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-full flex items-center justify-between gap-6">
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
              <Waves className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold tracking-tight">Alter</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            {t("checkout.secure")}
          </div>
        </div>
      </nav>

      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-[65] border-r border-border/40 bg-background shadow-2xl transition-transform duration-300",
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

      <div className="py-12 px-6 transition-[padding] duration-300" style={{ paddingLeft: menuOpen ? width : 0 }}>
        <div className="container mx-auto max-w-2xl">
          <Link to="/pricing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" />
            {t("checkout.back")}
          </Link>

          <h1 className="text-2xl font-bold mb-6">{t("checkout.summary")}</h1>

          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle>{t(planNameKey(plan.id))}</CardTitle>
              <CardDescription>{plan.periodType === "free" ? t("plans.free") : t("checkout.oneTime")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-4 border-t border-border/40">
                <span className="font-medium">{t("checkout.total")}</span>
                <span className="text-2xl font-bold">{priceLabel}</span>
              </div>

              {user?.email && (
                <p className="text-sm text-muted-foreground mb-4">
                  {t("checkout.account")}: <span className="text-foreground">{user.email}</span>
                </p>
              )}

              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading}>
                {loading ? (
                  t("checkout.redirecting")
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    {t("checkout.continue")}
                  </>
                )}
              </Button>

              <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>{t("checkout.securityNote")}</span>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{t("checkout.note")}</strong> {t("checkout.noteText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

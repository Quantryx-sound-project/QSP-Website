import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Monitor,
  Apple,
  Trash2,
  KeyRound,
  ShoppingCart,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { useT } from "@/lib/i18n";
import { formatEur, cancellationDiscount } from "@/lib/pricing";

// --- Demo dáta (po prepojení Stripe/Supabase sa nahradia reálnymi) ----------
const CREATOR_PRICE = 9.97;
const LISTENER_PRICE = 0.97;
const MONTHS_PAID = 22; // koľko mesiacov už platí (demo)

interface CartItem {
  id: string;
  name: string;
  price: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [subActive, setSubActive] = useState(true);
  const [showCancel, setShowCancel] = useState(false);

  const totalPaid = MONTHS_PAID * LISTENER_PRICE;
  const discount = cancellationDiscount(totalPaid, CREATOR_PRICE);
  const discountedCreator = CREATOR_PRICE * (1 - discount);

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);

  const handleDownload = (platform: string) => {
    toast.success(t("dashboard.downloadToast").replace("{platform}", platform), {
      description: t("dashboard.downloadToastDesc"),
    });
  };

  const removeFromCart = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const claimOffer = () => {
    setCart((c) =>
      c.some((i) => i.id === "creator-offer")
        ? c
        : [...c, { id: "creator-offer", name: t("plans.creatorName"), price: discountedCreator }]
    );
    setSubActive(false);
    setShowCancel(false);
    toast.success(t("account.offerClaimed"));
  };

  const confirmCancel = () => {
    setSubActive(false);
    setShowCancel(false);
    toast.success(t("account.canceled"));
  };

  return (
    <AppLayout>
      <div className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t("account.title")}</h1>
            <p className="text-muted-foreground">
              {user?.email ? `${user.email} — ` : ""}
              {t("account.subtitle")}
            </p>
          </div>

          {/* Košík */}
          <Card className="bg-card/50 border-border/40 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                {t("account.cartTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-muted-foreground">{t("account.cartEmpty")}</p>
                  <Button variant="outline" onClick={() => navigate("/pricing")}>
                    {t("account.browse")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-border/40 pb-3">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span>{formatEur(item.price)}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} aria-label={t("account.remove")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-semibold">{t("account.total")}</span>
                    <span className="text-xl font-bold">{formatEur(cartTotal)}</span>
                  </div>
                  <Button className="w-full" onClick={() => navigate("/checkout?plan=creator")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t("account.checkout")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Licencie */}
          <Card className="bg-card/50 border-border/40 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("account.subTitle")}</CardTitle>
                  <CardDescription>{subActive ? t("plans.listenerName") : t("account.subNone")}</CardDescription>
                </div>
                {subActive && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">{t("account.subActive")}</Badge>
                )}
              </div>
            </CardHeader>
            {subActive && (
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t("account.plan")}</p>
                    <p className="font-medium">
                      {t("plans.listenerName")} — {formatEur(LISTENER_PRICE)} {t("plans.oneTime")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("account.paidSoFar")}</p>
                    <p className="font-medium">
                      {formatEur(totalPaid)} ({t("account.monthsLabel").replace("{months}", String(MONTHS_PAID))})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("account.nextRenewal")}</p>
                    <p className="font-medium">15. 07. 2026</p>
                  </div>
                </div>

                {!showCancel ? (
                  <Button variant="outline" size="sm" onClick={() => setShowCancel(true)}>
                    {t("account.cancel")}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <h3 className="font-semibold mb-2">{t("account.cancelTitle")}</h3>
                    {discount > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-3">{t("account.cancelOfferIntro")}</p>
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                            -{Math.round(discount * 100)} %
                          </Badge>
                          <div className="text-sm">
                            <span className="text-muted-foreground line-through mr-2">
                              {formatEur(CREATOR_PRICE)}
                            </span>
                            <span className="text-lg font-bold">{formatEur(discountedCreator)}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button onClick={claimOffer}>{t("account.claimOffer")}</Button>
                          <Button variant="ghost" onClick={() => setShowCancel(false)}>
                            {t("account.keepSub")}
                          </Button>
                          <Button variant="ghost" className="text-muted-foreground" onClick={confirmCancel}>
                            {t("account.confirmCancel")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">{t("account.noDiscount")}</p>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="ghost" onClick={() => setShowCancel(false)}>
                            {t("account.keepSub")}
                          </Button>
                          <Button variant="outline" onClick={confirmCancel}>
                            {t("account.confirmCancel")}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Licencie */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                {t("account.licensesTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{t("plans.creatorName")}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t("account.licenseKey")}: <span className="font-mono">ALTR-7F3K-9D2M-1A2B</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{t("account.activations")}: 1 / 3</p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {t("account.subActive")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDownload("Windows")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    Windows
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload("macOS")}>
                    <Apple className="mr-2 h-4 w-4" />
                    macOS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/40">
            <p className="text-sm text-muted-foreground">
              <Download className="inline h-4 w-4 mr-1" />
              {t("account.demoNote")}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Monitor,
  Apple,
  KeyRound,
  Receipt,
  CreditCard,
  User as UserIcon,
  ShieldCheck,
  Copy,
  Check,
  Mail,
  LogOut,
  RefreshCw,
  Loader2,
  Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { useT } from "@/lib/i18n";
import { formatEur } from "@/lib/pricing";
import { supabaseConfigured } from "@/integrations/supabase/client";
import {
  useProfile,
  useLicenses,
  useOrders,
  useUpdateProfile,
  describeSupabaseError,
  type License,
} from "@/hooks/useProfileData";

const Dashboard = () => {
  const { user, resetPassword, signOut } = useAuth();
  const { t, lang } = useT();
  const navigate = useNavigate();

  const profileQ = useProfile();
  const licensesQ = useLicenses();
  const ordersQ = useOrders();
  const updateProfile = useUpdateProfile();

  const fmtDate = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "sk" ? "sk-SK" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [lang]
  );
  const showDate = (iso?: string | null) =>
    iso ? fmtDate.format(new Date(iso)) : t("account.notSet");

  // ---- editácia profilu ----
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const startEdit = () => {
    setName(profileQ.data?.name ?? "");
    setCountry(profileQ.data?.country ?? "");
    setEditing(true);
  };
  const saveProfile = () => {
    updateProfile.mutate(
      { name: name.trim() || null, country: country.trim() || null },
      {
        onSuccess: () => {
          toast.success(t("account.profileSaved"));
          setEditing(false);
        },
        onError: () => toast.error(t("account.profileSaveErr")),
      }
    );
  };

  // ---- zmena hesla cez email (reset link) ----
  const [resetBusy, setResetBusy] = useState(false);
  const sendResetLink = async () => {
    if (!user?.email) return;
    setResetBusy(true);
    const { error } = await resetPassword(user.email);
    setResetBusy(false);
    if (error) return toast.error(t("account.pwErr"), { description: error.message });
    toast.success(t("account.resetSent"));
  };

  // ---- kopírovanie kľúča ----
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyKey = (lic: License) => {
    if (!lic.license_key) return;
    navigator.clipboard.writeText(lic.license_key).then(() => {
      setCopiedId(lic.id);
      toast.success(t("account.keyCopied"));
      setTimeout(() => setCopiedId((c) => (c === lic.id ? null : c)), 1800);
    });
  };

  const handleDownload = (platform: string) =>
    toast.success(t("dashboard.downloadToast").replace("{platform}", platform), {
      description: t("dashboard.downloadToastDesc"),
    });

  const statusMeta = (status: License["status"]) => {
    switch (status) {
      case "active":
        return { label: t("account.statusActive"), cls: "bg-primary/10 text-primary border-primary/30" };
      case "cancelled":
        return { label: t("account.statusCancelled"), cls: "bg-amber-500/10 text-amber-500 border-amber-500/30" };
      case "expired":
        return { label: t("account.statusExpired"), cls: "bg-muted text-muted-foreground border-border/40" };
      case "refunded":
        return { label: t("account.statusRefunded"), cls: "bg-muted text-muted-foreground border-border/40" };
      default:
        return { label: t("account.statusRevoked"), cls: "bg-destructive/10 text-destructive border-destructive/30" };
    }
  };

  const licenses = licensesQ.data ?? [];
  const orders = ordersQ.data ?? [];

  // uložená karta (bezpečné údaje z Lemon Squeezy – značka + posledné 4)
  const fmtCard = (brand?: string | null, last4?: string | null) =>
    last4
      ? `${brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : t("account.card")} •••• ${last4}`
      : null;
  const savedCardSource =
    orders.find((o) => o.card_last_four) ?? licenses.find((l) => l.card_last_four);
  const savedCard = fmtCard(savedCardSource?.card_brand, savedCardSource?.card_last_four);

  const loading = profileQ.isLoading || licensesQ.isLoading || ordersQ.isLoading;
  // Skutočná príčina zlyhania (pre technický detail v UI aj v konzole prehliadača).
  const errorDetail = [profileQ, licensesQ, ordersQ]
    .filter((q) => q.isError)
    .map((q) => describeSupabaseError(q.error))
    .filter(Boolean)
    .join(" · ");
  const anyError = Boolean(errorDetail);

  // Aktívna platená licencia (nie demo) → zákazník „má" produkt.
  const activeLicense = licenses.find(
    (l) => l.plan !== "demo" && (l.status === "active" || l.status === "cancelled")
  );
  const hasLicense = Boolean(activeLicense);

  const refetchAll = () => {
    profileQ.refetch();
    licensesQ.refetch();
    ordersQ.refetch();
  };

  return (
    <AppLayout>
      <div className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Hlavička */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("account.title")}</h1>
              <p className="text-muted-foreground">
                {user?.email ? `${user.email} — ` : ""}
                {t("account.subtitle")}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("account.signOut")}
            </Button>
          </div>

          {!supabaseConfigured && (
            <div className="mb-8 p-4 rounded-lg bg-muted/30 border border-border/40 text-sm text-muted-foreground">
              {t("account.demoNote")}
            </div>
          )}

          {/* Chybový prúžok – NEblokuje zvyšok stránky, len upozorní a ukáže
              skutočnú príčinu + tlačidlo na opätovné načítanie. */}
          {supabaseConfigured && anyError && (
            <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-destructive">{t("account.loadErrTitle")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("account.sectionErr")}</p>
                  {errorDetail && (
                    <p className="text-xs text-muted-foreground/80 mt-2 font-mono break-all">
                      {t("account.errDetail")}: {errorDetail}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={refetchAll}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("account.retry")}
                </Button>
              </div>
            </div>
          )}

          {supabaseConfigured && (
            <Card
              className={`mb-8 ${
                hasLicense ? "border-primary/40 bg-primary/5" : "border-border/60"
              }`}
            >
              <CardContent className="py-6">
                {loading && !licensesQ.data ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("account.loading")}
                  </div>
                ) : hasLicense && activeLicense ? (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/15 p-2.5">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t("account.membershipTitle")}
                        </p>
                        <p className="text-lg font-semibold">
                          {t("account.membershipActiveLead")} ·{" "}
                          {activeLicense.product_name || t(`plans.${activeLicense.plan}Name`)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusMeta(activeLicense.status).cls}>
                      {statusMeta(activeLicense.status).label}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2.5">
                        <KeyRound className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{t("account.membershipNone")}</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {t("account.membershipNoneSub")}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => navigate("/pricing")}>
                      {t("account.membershipCta")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(
            <div className="space-y-8">
              {/* 1. Údaje o účte */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <UserIcon className="h-5 w-5 text-primary" />
                      {t("account.accountInfoTitle")}
                    </CardTitle>
                    {!editing && (
                      <Button variant="outline" size="sm" onClick={startEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("account.edit")}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">{t("account.emailLabel")}</Label>
                      <p className="font-medium mt-1">
                        {user?.email ?? profileQ.data?.email ?? "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t("account.memberSince")}</Label>
                      <p className="font-medium mt-1">{showDate(profileQ.data?.created_at)}</p>
                    </div>

                    {editing ? (
                      <>
                        <div>
                          <Label htmlFor="name">{t("account.name")}</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("account.namePh")}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">{t("account.country")}</Label>
                          <Input
                            id="country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder={t("account.countryPh")}
                            className="mt-1"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-muted-foreground">{t("account.name")}</Label>
                          <p className="font-medium mt-1">
                            {profileQ.data?.name || t("account.notSet")}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">{t("account.country")}</Label>
                          <p className="font-medium mt-1">
                            {profileQ.data?.country || t("account.notSet")}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {editing && (
                    <div className="flex gap-3 pt-2">
                      <Button onClick={saveProfile} disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? t("account.saving") : t("account.save")}
                      </Button>
                      <Button variant="ghost" onClick={() => setEditing(false)}>
                        {t("account.cancelEdit")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. Zabezpečenie – zmena hesla */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {t("account.security")}
                  </CardTitle>
                  <CardDescription>{t("account.resetDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    onClick={sendResetLink}
                    disabled={resetBusy || !user?.email}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {resetBusy ? t("account.saving") : t("account.sendReset")}
                  </Button>
                </CardContent>
              </Card>

              {/* 2b. Uložená platobná karta */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CreditCard className="h-5 w-5 text-primary" />
                    {t("account.paymentTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {savedCard ? (
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base">{savedCard}</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t("account.noCard")}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">{t("account.cardNote")}</p>
                </CardContent>
              </Card>

              {/* 3. Zakúpené licencie */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <KeyRound className="h-5 w-5 text-primary" />
                    {t("account.licensesTitle")}
                  </CardTitle>
                  <CardDescription>{t("account.licensesSubtitle")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {licenses.length === 0 ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <p className="text-muted-foreground">{t("account.licensesEmpty")}</p>
                      <Button variant="outline" onClick={() => navigate("/pricing")}>
                        {t("account.browse")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {licenses.map((lic) => {
                        const st = statusMeta(lic.status);
                        const isActive = lic.status === "active" || lic.status === "cancelled";
                        return (
                          <div key={lic.id} className="rounded-lg border border-border/40 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold">
                                    {lic.product_name || t(`plans.${lic.plan}Name`)}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="border-border/50 text-muted-foreground text-xs"
                                  >
                                    {lic.period_type === "subscription"
                                      ? t("account.subscriptionBadge")
                                      : t("account.oneTimeBadge")}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t("account.purchasedOn")}: {showDate(lic.purchased_at)}
                                  {lic.price_paid != null && (
                                    <>
                                      {" "}· {t("account.pricePaid")}: {formatEur(Number(lic.price_paid))}
                                    </>
                                  )}
                                </p>
                              </div>
                              <Badge variant="outline" className={st.cls}>
                                {st.label}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-2">
                                {t("account.licenseKey")}:
                                {lic.license_key ? (
                                  <>
                                    <span className="font-mono text-foreground">{lic.license_key}</span>
                                    <button
                                      onClick={() => copyKey(lic)}
                                      className="hover:text-primary transition-colors"
                                      aria-label={t("account.copyKey")}
                                    >
                                      {copiedId === lic.id ? (
                                        <Check className="h-3.5 w-3.5" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </>
                                ) : (
                                  <span className="italic">{t("account.noKeyYet")}</span>
                                )}
                              </span>
                              <span>
                                {t("account.activationsLabel")}: {lic.activations_used} /{" "}
                                {lic.activations_limit}
                              </span>
                            </div>

                            {isActive && lic.plan !== "demo" && (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload("Windows")}
                                >
                                  <Monitor className="mr-2 h-4 w-4" />
                                  Windows
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload("macOS")}
                                >
                                  <Apple className="mr-2 h-4 w-4" />
                                  macOS
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 5. História objednávok */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Receipt className="h-5 w-5 text-primary" />
                    {t("account.ordersTitle")}
                  </CardTitle>
                  <CardDescription>{t("account.ordersSubtitle")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-muted-foreground">{t("account.ordersEmpty")}</p>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {orders.map((o) => (
                        <div
                          key={o.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="font-medium">
                              {o.product_name || (o.plan ? t(`plans.${o.plan}Name`) : "—")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {showDate(o.ordered_at)}
                              {o.order_number ? ` · #${o.order_number}` : ""}
                              {o.card_last_four ? ` · ${fmtCard(o.card_brand, o.card_last_four)}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {o.total != null && (
                              <span className="font-medium">{formatEur(Number(o.total))}</span>
                            )}
                            <Badge
                              variant="outline"
                              className={
                                o.status === "paid"
                                  ? "border-primary/30 text-primary"
                                  : "border-border/40 text-muted-foreground"
                              }
                            >
                              {o.status === "paid"
                                ? t("account.statusActive")
                                : t("account.statusRefunded")}
                            </Badge>
                            {o.invoice_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(o.invoice_url!, "_blank", "noopener")}
                              >
                                <Receipt className="mr-2 h-4 w-4" />
                                {t("account.orderInvoice")}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

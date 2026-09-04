import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TrendChart, { type TrendPoint } from "@/components/TrendChart";

type Summary = {
  visitors: number;
  sessions: number;
  page_views: number;
  views_per_visit: number | null;
  sign_ups: number;
  returning_users: number;
  checkout_starts: number;
  purchases: number;
};
type PathRow = { path: string; views: number; visitors: number; pct_of_visitors: number | null };
type ClickRow = { label: string; clicks: number; visitors: number; pct_of_visitors: number | null };
type FunnelRow = { step: string; step_order: number; visitors: number; pct_of_top: number | null };
type SourceRow = { source: string; visitors: number };
type DeviceRow = { device_type: string; visitors: number };
type JourneyRow = { journey: string; steps: number; sessions: number };
type ExitRow = { path: string; exits: number; exit_pct: number | null };
type AcquisitionRow = {
  source: string;
  sign_ups: number;
  paying_users: number;
  revenue: number;
  conversion_pct: number | null;
};

/**
 * Typy pre RPC funkcie vzniknú až keď sa znovu vygeneruje types.ts
 * (`supabase gen types typescript`). Dovtedy ich voláme cez uvoľnený
 * podpis – návratové dáta si aj tak pretypúvame nižšie.
 */
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: unknown }>;

const RANGES = [
  { days: 7, label: "7 dní" },
  { days: 30, label: "30 dní" },
  { days: 90, label: "90 dní" },
];

/** Vodorovný pruh – podiel voči najväčšej hodnote v tabuľke. */
const Bar = ({ value, max }: { value: number; max: number }) => (
  <div className="h-1.5 w-full rounded-full bg-muted">
    <div
      className="h-full rounded-full bg-primary transition-[width] duration-500"
      style={{ width: `${max > 0 ? Math.max(2, (value / max) * 100) : 0}%` }}
    />
  </div>
);

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </CardContent>
  </Card>
);

const Admin = () => {
  const { session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [paths, setPaths] = useState<PathRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [daily, setDaily] = useState<TrendPoint[]>([]);
  const [journeys, setJourneys] = useState<JourneyRow[]>([]);
  const [exits, setExits] = useState<ExitRow[]>([]);
  const [acquisition, setAcquisition] = useState<AcquisitionRow[]>([]);

  // Overenie práv – server rozhoduje, nie klient.
  useEffect(() => {
    if (!session) return;
    rpc("is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
  }, [session]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      rpc("analytics_summary", { days }),
      rpc("analytics_paths", { days }),
      rpc("analytics_clicks", { days }),
      rpc("analytics_funnel", { days }),
      rpc("analytics_sources", { days }),
      rpc("analytics_devices", { days }),
      rpc("analytics_daily", { days }),
      rpc("analytics_journeys", { days }),
      rpc("analytics_exits", { days }),
      rpc("analytics_acquisition", { days: 365 }),
    ]).then(([s, p, c, f, so, d, dy, j, e, a]) => {
      if (cancelled) return;
      setSummary((s.data as Summary[] | null)?.[0] ?? null);
      setPaths((p.data as PathRow[] | null) ?? []);
      setClicks((c.data as ClickRow[] | null) ?? []);
      setFunnel((f.data as FunnelRow[] | null) ?? []);
      setSources((so.data as SourceRow[] | null) ?? []);
      setDevices((d.data as DeviceRow[] | null) ?? []);
      setDaily((dy.data as TrendPoint[] | null) ?? []);
      setJourneys((j.data as JourneyRow[] | null) ?? []);
      setExits((e.data as ExitRow[] | null) ?? []);
      setAcquisition((a.data as AcquisitionRow[] | null) ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, days]);

  const maxPathVisitors = useMemo(() => Math.max(1, ...paths.map((r) => r.visitors)), [paths]);
  const maxClicks = useMemo(() => Math.max(1, ...clicks.map((r) => r.clicks)), [clicks]);
  const maxSource = useMemo(() => Math.max(1, ...sources.map((r) => r.visitors)), [sources]);

  if (authLoading) return null;
  if (!session) return <Navigate to="/login" replace />;

  if (isAdmin === null) {
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-20 text-muted-foreground">Overujem prístup…</div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-20">
          <h1 className="text-2xl font-bold">Nemáš prístup</h1>
          <p className="mt-2 text-muted-foreground">Táto stránka je len pre správcu.</p>
        </div>
      </AppLayout>
    );
  }

  const pct = (value: number | null | undefined) =>
    value === null || value === undefined ? "–" : `${value} %`;

  const conversion = (part: number, whole: number) =>
    whole > 0 ? `${Math.round((part / whole) * 1000) / 10} %` : "–";

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Návštevnosť</h1>
            <p className="text-muted-foreground">Vlastné dáta, bez cookies a bez tretej strany.</p>
          </div>
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.days}
                size="sm"
                variant={days === r.days ? "default" : "outline"}
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {loading && <p className="mt-8 text-muted-foreground">Načítavam…</p>}

        {!loading && summary && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Návštevníci" value={String(summary.visitors)} hint="jedineční ľudia, boty odfiltrované" />
              <Stat label="Zobrazenia stránok" value={String(summary.page_views)} />
              <Stat
                label="Stránok na návštevu"
                value={summary.views_per_visit === null ? "–" : String(summary.views_per_visit)}
                hint="koľko toho jeden človek prezrie"
              />
              <Stat
                label="Registrácie"
                value={String(summary.sign_ups)}
                hint={`${conversion(summary.sign_ups, summary.visitors)} z návštevníkov · zdroj: profiles`}
              />
              <Stat
                label="Vracajúci sa"
                value={String(summary.returning_users)}
                hint="rôzni ľudia, ktorí sa znovu prihlásili"
              />
              <Stat
                label="Začatých nákupov"
                value={String(summary.checkout_starts)}
                hint={`${conversion(summary.checkout_starts, summary.visitors)} z návštevníkov`}
              />
              <Stat
                label="Nákupy"
                value={String(summary.purchases)}
                hint={`${conversion(summary.purchases, summary.visitors)} z návštevníkov`}
              />
              <Stat label="Relácie" value={String(summary.sessions)} />
            </div>

            <Card className="mt-10">
              <CardHeader>
                <CardTitle>Priebeh v čase</CardTitle>
                <CardDescription>Denne, za zvolené obdobie</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart data={daily} />
              </CardContent>
            </Card>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lievik</CardTitle>
                  <CardDescription>Kam sa ľudia dostali a kde odpadli</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {funnel.map((row) => (
                    <div key={row.step_order}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{row.step}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {row.visitors} · {pct(row.pct_of_top)}
                        </span>
                      </div>
                      <Bar value={row.pct_of_top ?? 0} max={100} />
                    </div>
                  ))}
                  {funnel.length === 0 && <p className="text-sm text-muted-foreground">Zatiaľ žiadne dáta.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Otvorené stránky</CardTitle>
                  <CardDescription>Podiel je z celkového počtu návštevníkov</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paths.map((row) => (
                    <div key={row.path}>
                      <div className="mb-1 flex justify-between gap-4 text-sm">
                        <span className="truncate font-mono text-xs">{row.path}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {row.visitors} · {pct(row.pct_of_visitors)}
                        </span>
                      </div>
                      <Bar value={row.visitors} max={maxPathVisitors} />
                    </div>
                  ))}
                  {paths.length === 0 && <p className="text-sm text-muted-foreground">Zatiaľ žiadne dáta.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kliky na tlačidlá</CardTitle>
                  <CardDescription>To, čo Cloudflare nemeria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clicks.map((row) => (
                    <div key={row.label}>
                      <div className="mb-1 flex justify-between gap-4 text-sm">
                        <span className="truncate">{row.label}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {row.clicks} · {pct(row.pct_of_visitors)}
                        </span>
                      </div>
                      <Bar value={row.clicks} max={maxClicks} />
                    </div>
                  ))}
                  {clicks.length === 0 && <p className="text-sm text-muted-foreground">Zatiaľ žiadne kliky.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Odkiaľ prišli</CardTitle>
                  <CardDescription>Zdroj návštevy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sources.map((row) => (
                    <div key={row.source}>
                      <div className="mb-1 flex justify-between gap-4 text-sm">
                        <span className="truncate">{row.source}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{row.visitors}</span>
                      </div>
                      <Bar value={row.visitors} max={maxSource} />
                    </div>
                  ))}
                  {sources.length === 0 && <p className="text-sm text-muted-foreground">Zatiaľ žiadne dáta.</p>}
                  {devices.length > 0 && (
                    <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                      {devices.map((d) => `${d.device_type}: ${d.visitors}`).join(" · ")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cesty návštevníkov</CardTitle>
                  <CardDescription>Poradie stránok v rámci jednej návštevy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {journeys.map((row) => (
                    <div key={row.journey} className="flex items-start justify-between gap-4 text-sm">
                      <span className="break-all font-mono text-xs leading-relaxed">{row.journey}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{row.sessions}×</span>
                    </div>
                  ))}
                  {journeys.length === 0 && (
                    <p className="text-sm text-muted-foreground">Zatiaľ žiadne dáta.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kde ľudia odchádzajú</CardTitle>
                  <CardDescription>Posledná stránka pred odchodom</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {exits.map((row) => (
                    <div key={row.path} className="flex justify-between gap-4 text-sm">
                      <span className="truncate font-mono text-xs">{row.path}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {row.exits} · {pct(row.exit_pct)}
                      </span>
                    </div>
                  ))}
                  {exits.length === 0 && <p className="text-sm text-muted-foreground">Zatiaľ žiadne dáta.</p>}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ktorý kanál nosí zákazníkov</CardTitle>
                <CardDescription>
                  Zdroj sa ukladá k účtu pri registrácii, takže platí aj po týždňoch · za posledný rok
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Zdroj</th>
                        <th className="py-2 pr-4 text-right font-medium">Registrácie</th>
                        <th className="py-2 pr-4 text-right font-medium">Zaplatili</th>
                        <th className="py-2 pr-4 text-right font-medium">Konverzia</th>
                        <th className="py-2 text-right font-medium">Tržby</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acquisition.map((row) => (
                        <tr key={row.source} className="border-b border-border/50">
                          <td className="py-2 pr-4">{row.source}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{row.sign_ups}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{row.paying_users}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{pct(row.conversion_pct)}</td>
                          <td className="py-2 text-right tabular-nums">{Number(row.revenue ?? 0).toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {acquisition.length === 0 && (
                    <p className="pt-3 text-sm text-muted-foreground">
                      Zatiaľ žiadne registrácie. Zdroj sa začne zaznamenávať pri ďalšom novom účte.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Admin;

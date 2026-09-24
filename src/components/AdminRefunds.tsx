import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatEur } from "@/lib/pricing";

// Admin: žiadosti o refund (30-dňová garancia). Schválenie = skutočné vrátenie
// peňazí cez Lemon Squeezy (edge funkcia refund-approve).

type Row = {
  id: string;
  email: string;
  plan: string;
  amount: number | null;
  currency: string | null;
  reason: string;
  details: string;
  system_info: string | null;
  contacted_support: boolean;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  purchased_at: string | null;
  ls_order_id: string;
};

const REASON_SK: Record<string, string> = {
  technical: "Technický problém",
  compatibility: "Nefunguje s DAW / OS",
  performance: "Výkon",
  missing_feature: "Chýba funkcia",
  wrong_edition: "Nesprávna edícia",
  duplicate: "Omylom / dvakrát",
  expectations: "Nesplnilo očakávania",
  other: "Iné",
};
const STATUS_SK: Record<string, string> = {
  pending: "Čaká",
  refunded: "Vrátené",
  rejected: "Zamietnuté",
  withdrawn: "Stiahnuté zákazníkom",
  failed: "Chyba",
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("sk-SK", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";

const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message?: string } | null }>;

const AdminRefunds = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await rpc("admin_refund_requests");
    if (error) console.warn("[admin refunds]", error.message);
    setRows((data as Row[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (r: Row) => {
    if (!window.confirm(`Naozaj vrátiť ${formatEur(Number(r.amount))} zákazníkovi ${r.email}? Toto sa nedá vrátiť späť.`))
      return;
    setBusyId(r.id);
    const { data, error } = await supabase.functions.invoke("refund-approve", {
      body: { request_id: r.id },
    });
    setBusyId(null);
    if (error || (data as { error?: string })?.error) {
      toast.error("Refund zlyhal", {
        description: (data as { error?: string })?.error ?? error?.message ?? "",
      });
    } else {
      toast.success("Peniaze boli vrátené, licencia deaktivovaná");
    }
    load();
  };

  const reject = async (r: Row) => {
    setBusyId(r.id);
    const { error } = await rpc("admin_reject_refund", { p_request_id: r.id, p_note: note });
    setBusyId(null);
    if (error) toast.error("Nepodarilo sa zamietnuť", { description: error.message });
    else toast.success("Žiadosť zamietnutá");
    setRejectId(null);
    setNote("");
    load();
  };

  const pending = rows.filter((r) => r.status === "pending");
  const visible = showAll ? rows : pending;

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Žiadosti o refund {pending.length > 0 && `(${pending.length})`}</CardTitle>
            <CardDescription>
              30-dňová garancia. Schválenie vráti peniaze cez Lemon Squeezy a deaktivuje licenciu.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Len čakajúce" : "Zobraziť všetky"}
            </Button>
            <Button size="sm" variant="ghost" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Načítavam…</p>}
        {!loading && visible.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {showAll ? "Zatiaľ žiadne žiadosti." : "Žiadne čakajúce žiadosti."}
          </p>
        )}
        <div className="space-y-4">
          {visible.map((r) => (
            <div key={r.id} className="rounded-lg border border-border/50 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {r.email} · Alter {r.plan} · {formatEur(Number(r.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kúpené {fmt(r.purchased_at)} · žiadosť {fmt(r.created_at)} · objednávka #{r.ls_order_id}
                  </p>
                </div>
                <span className="rounded border border-border/50 px-2 py-0.5 text-xs">
                  {STATUS_SK[r.status] ?? r.status}
                </span>
              </div>
              <p className="mt-3">
                <span className="text-muted-foreground">Dôvod:</span> {REASON_SK[r.reason] ?? r.reason}
                {" · "}
                <span className="text-muted-foreground">Kontaktoval podporu:</span>{" "}
                {r.contacted_support ? "áno" : "nie"}
              </p>
              {r.system_info && (
                <p>
                  <span className="text-muted-foreground">Systém:</span> {r.system_info}
                </p>
              )}
              <p className="mt-2 whitespace-pre-wrap rounded bg-muted/30 p-2 text-muted-foreground">
                {r.details}
              </p>
              {r.admin_note && (
                <p className="mt-2 text-xs text-muted-foreground">Poznámka: {r.admin_note}</p>
              )}

              {r.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={busyId === r.id} onClick={() => approve(r)}>
                    {busyId === r.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Schváliť a vrátiť peniaze
                  </Button>
                  {rejectId === r.id ? (
                    <div className="flex w-full flex-wrap gap-2">
                      <input
                        className="min-w-[240px] flex-1 rounded-md border border-border/60 bg-background px-3 py-1.5 text-sm"
                        placeholder="Dôvod zamietnutia (uvidí ho zákazník)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <Button size="sm" variant="destructive" disabled={busyId === r.id} onClick={() => reject(r)}>
                        Zamietnuť
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejectId(null)}>
                        Zrušiť
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setRejectId(r.id)}>
                      Zamietnuť…
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminRefunds;

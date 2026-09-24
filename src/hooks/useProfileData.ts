import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type License = Tables<"licenses">;
export type Order = Tables<"orders">;

// Nechceme donekonečna opakovať dopyt, ak backend vracia trvalú chybu
// (napr. chýbajúca tabuľka / RLS). Rýchlejšie tak uvidíme skutočnú príčinu.
const RETRY = 1;

/** Zrozumiteľná chybová hláška z PostgREST/Supabase chyby (pre UI aj konzolu). */
export function describeSupabaseError(err: unknown): string {
  if (!err) return "";
  const e = err as { message?: string; details?: string; hint?: string; code?: string };
  const parts = [e.message, e.details, e.hint].filter(Boolean);
  const base = parts.join(" — ") || String(err);
  return e.code ? `${base} (${e.code})` : base;
}

// ---- Profil (údaje o účte) ------------------------------------------------
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id && supabaseConfigured),
    retry: RETRY,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) {
        // eslint-disable-next-line no-console
        console.error("[profile] load failed:", describeSupabaseError(error));
        throw error;
      }

      // Self-heal: ak profil ešte neexistuje (napr. používateľ vznikol skôr,
      // než existoval trigger `handle_new_user`), vytvoríme ho z auth údajov.
      if (!data && user) {
        const seed = {
          id: user.id,
          email: user.email ?? "",
          name:
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            null,
        };
        const { data: created, error: upsertErr } = await supabase
          .from("profiles")
          .upsert(seed, { onConflict: "id" })
          .select("*")
          .maybeSingle();
        if (upsertErr) {
          // eslint-disable-next-line no-console
          console.error("[profile] auto-create failed:", describeSupabaseError(upsertErr));
          // Nezhadzujeme celú stránku – vrátime aspoň provizórny profil.
          return {
            id: user.id,
            email: user.email ?? "",
            name: seed.name,
            country: null,
            created_at: user.created_at ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile;
        }
        return created;
      }

      return data;
    },
  });
}

// ---- Licencie -------------------------------------------------------------
export function useLicenses(opts: { pollMs?: number | false } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["licenses", user?.id],
    enabled: Boolean(user?.id && supabaseConfigured),
    retry: RETRY,
    refetchInterval: opts.pollMs ?? false,
    queryFn: async (): Promise<License[]> => {
      const { data, error } = await supabase
        .from("licenses")
        .select("*")
        .eq("user_id", user!.id)
        .order("purchased_at", { ascending: false });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[licenses] load failed:", describeSupabaseError(error));
        throw error;
      }
      return data ?? [];
    },
  });
}

// ---- Deaktivácia vlastnej licencie (napr. pred upgradom) -------------------
// Volá SQL funkciu public.deactivate_license (supabase/license_deactivate.sql).
export function useDeactivateLicense() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (licenseId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)("deactivate_license", {
        p_license_id: licenseId,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenses", user?.id] }),
  });
}

// ---- Refund (30-dňová garancia) ---------------------------------------------
// Tabuľka + funkcie: supabase/refunds.sql
export type RefundRequest = {
  id: string;
  license_id: string;
  plan: string;
  amount: number | null;
  currency: string | null;
  reason: string;
  status: "pending" | "refunded" | "rejected" | "withdrawn" | "failed";
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const looseDb = supabase as any;

export function useRefundRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["refund_requests", user?.id],
    enabled: Boolean(user?.id && supabaseConfigured),
    retry: RETRY,
    queryFn: async (): Promise<RefundRequest[]> => {
      const { data, error } = await looseDb
        .from("refund_requests")
        .select("id, license_id, plan, amount, currency, reason, status, admin_note, created_at, resolved_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      // Ak tabuľka ešte neexistuje (SQL nespustené), nezhadzujeme profil.
      if (error) {
        console.warn("[refund_requests]", describeSupabaseError(error));
        return [];
      }
      return (data ?? []) as RefundRequest[];
    },
  });
}

export function useRequestRefund() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      licenseId: string;
      reason: string;
      details: string;
      systemInfo: string;
      contactedSupport: boolean;
    }) => {
      const { error } = await looseDb.rpc("request_refund", {
        p_license_id: args.licenseId,
        p_reason: args.reason,
        p_details: args.details,
        p_system_info: args.systemInfo,
        p_contacted_support: args.contactedSupport,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["refund_requests", user?.id] }),
  });
}

export function useCancelRefund() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await looseDb.rpc("cancel_refund_request", { p_request_id: requestId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["refund_requests", user?.id] }),
  });
}

// ---- Dorovnanie licencií priamo z Lemon Squeezy (edge funkcia lemon-sync) ----
// Záchrana pre prípad, že webhook nedorazí. Chyby nehádžeme – len vrátime výsledok.
export function useSyncLicenses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("lemon-sync", { method: "POST" });
      if (error) {
        // eslint-disable-next-line no-console
        console.warn("[lemon-sync]", error.message ?? error);
        return { ok: false as const };
      }
      // eslint-disable-next-line no-console
      console.log("[lemon-sync]", data);
      return data as { ok: boolean; synced?: unknown[]; reason?: string };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["licenses", user?.id] });
      qc.invalidateQueries({ queryKey: ["orders", user?.id] });
    },
  });
}

// ---- História objednávok --------------------------------------------------
export function useOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["orders", user?.id],
    enabled: Boolean(user?.id && supabaseConfigured),
    retry: RETRY,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("ordered_at", { ascending: false });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[orders] load failed:", describeSupabaseError(error));
        throw error;
      }
      return data ?? [];
    },
  });
}

// ---- Nárok na demo licenciu (zadarmo, len pre prihláseného) ---------------
// Idempotentné: ak už demo licenciu má, len ju vráti. Zápis povoľuje RLS
// politika „Users can self-grant demo license" (plan = 'demo').
export function useClaimDemo() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user) throw new Error("not-signed-in");

      const { data: existing, error: selErr } = await supabase
        .from("licenses")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan", "demo")
        .maybeSingle();
      if (selErr) throw selErr;
      if (existing) return; // demo už vlastní

      const { error } = await supabase.from("licenses").insert({
        user_id: user.id,
        plan: "demo",
        status: "active",
        period_type: "free",
        activations_limit: 1,
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[claimDemo] insert failed:", describeSupabaseError(error));
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["licenses", user?.id] }),
  });
}

// ---- Úprava mena / krajiny v profile --------------------------------------
export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, "name" | "country">>) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });
}

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
export function useLicenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["licenses", user?.id],
    enabled: Boolean(user?.id && supabaseConfigured),
    retry: RETRY,
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

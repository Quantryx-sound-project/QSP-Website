import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Je prihlásený človek správca?
 *
 * Odpovedá server cez funkciu is_admin() – klient si to sám určiť nemôže.
 * Aj keby si niekto príznak v prehliadači prepol, dáta mu databáza
 * aj tak nevydá; toto slúži len na to, či sa odkaz v menu zobrazí.
 *
 * Vracia null, kým odpoveď nedorazí, aby položka menu neprebliklo.
 */
export function useIsAdmin(): boolean | null {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    // Typy RPC vzniknú až po `supabase gen types`; dovtedy uvoľnený podpis.
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      fn: string,
    ) => Promise<{ data: unknown }>;

    rpc("is_admin").then(({ data }) => {
      if (!cancelled) setIsAdmin(Boolean(data));
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return isAdmin;
}

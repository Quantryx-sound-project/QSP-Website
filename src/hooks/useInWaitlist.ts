import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Je prihlásený človek vo waitliste? (email v tabuľke waitlist)
 * Odpovedá server cez RPC is_in_waitlist(). Vracia null, kým odpoveď nedorazí.
 */
export function useInWaitlist(): boolean | null {
  const { session } = useAuth();
  const [inWaitlist, setInWaitlist] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setInWaitlist(false);
      return;
    }
    let cancelled = false;
    const rpc = supabase.rpc.bind(supabase) as unknown as (
      fn: string,
    ) => Promise<{ data: unknown }>;

    rpc("is_in_waitlist").then(({ data }) => {
      if (!cancelled) setInWaitlist(Boolean(data));
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return inWaitlist;
}

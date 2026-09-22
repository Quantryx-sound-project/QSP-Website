import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useInWaitlist } from "@/hooks/useInWaitlist";

/**
 * Prístup len pre prihláseného používateľa, ktorý je vo waitliste (alebo admin).
 * Neprihlásený → /login. Prihlásený bez oprávnenia → domov.
 */
const WaitlistRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const inWaitlist = useInWaitlist();
  const location = useLocation();

  const resolving = loading || (session && (isAdmin === null || inWaitlist === null));
  if (resolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-muted-foreground">Načítavam…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!(isAdmin || inWaitlist)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default WaitlistRoute;

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/**
 * Pustí ďalej len správcu. Kým sa session alebo odpoveď is_admin() načítava,
 * ukážeme loader (nech neprebliknem obsah ani presmerovanie). Kto nie je admin,
 * ide na domovskú stránku — /pricing je dočasne skrytý pre verejnosť.
 */
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { loading } = useAuth();
  const isAdmin = useIsAdmin();

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-muted-foreground">Načítavam…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;

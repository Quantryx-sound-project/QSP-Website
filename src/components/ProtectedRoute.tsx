import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Guards routes that require an authenticated user.
 * While the session is being resolved we show a lightweight loader to avoid
 * flashing the login page for already-signed-in users on refresh.
 */
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-muted-foreground">Načítavam…</div>
      </div>
    );
  }

  if (!session) {
    // Remember where the user wanted to go so we can return them after login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

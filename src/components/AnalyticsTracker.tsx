import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@/lib/analytics";

/**
 * Zaznamená zobrazenie stránky pri každej zmene trasy.
 *
 * React Router mení adresu bez načítania stránky, takže bežné meranie
 * by videlo len prvý vstup. Tento komponent počúva na zmeny trasy,
 * takže /pricing aj /product/pro sa počítajú ako samostatné zobrazenia.
 *
 * Musí byť vnútri <BrowserRouter>.
 */
const AnalyticsTracker = () => {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // V striktnom režime sa efekt spustí dvakrát – druhý raz ignorujeme.
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    void track("page_view", { path: location.pathname });
  }, [location.pathname]);

  return null;
};

export default AnalyticsTracker;

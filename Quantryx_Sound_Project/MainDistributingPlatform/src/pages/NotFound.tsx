import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";

const NotFound = () => {
  const location = useLocation();
  const { t } = useT();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-2 text-xl font-semibold">{t("notfound.title")}</p>
        <p className="mb-4 text-muted-foreground">{t("notfound.text")}</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {t("notfound.home")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

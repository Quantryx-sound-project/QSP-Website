import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import { site } from "@/lib/site";
import { useT } from "@/lib/i18n";

const Footer = () => {
  const { t } = useT();
  const activeSocials = site.socials.filter((s) => s.url);

  return (
    <footer className="relative border-t border-primary/20 bg-card/20 mt-20 shadow-[0_-1px_0_0_hsl(var(--neon)/0.2)]">
      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo-wordmark.svg" alt="Quantryx Sound Project" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">{t("footer.products")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/product/demo" className="hover:text-foreground">{t("plans.demoName")}</Link></li>
              <li><Link to="/product/listener" className="hover:text-foreground">{t("plans.listenerName")}</Link></li>
              <li><Link to="/product/creator" className="hover:text-foreground">{t("plans.creatorName")}</Link></li>
              <li><Link to="/product/pro" className="hover:text-foreground">{t("plans.proName")}</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">{t("nav.pricing")}</Link></li>
              <li><Link to="/about" className="hover:text-foreground">{t("nav.aboutFull")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">{t("footer.contact")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${site.email}`} className="hover:text-foreground">{site.email}</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                {site.location}
              </li>
            </ul>
            {activeSocials.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4 text-sm">
                {activeSocials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {site.brand}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

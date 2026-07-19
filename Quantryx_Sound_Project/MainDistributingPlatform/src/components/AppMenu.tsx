import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Waves, Headphones, Sparkles, LayoutDashboard, Tag, User, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const navItems: { to: string; labelKey?: string; label?: string; icon: typeof Tag }[] = [
  { to: "/dashboard", labelKey: "nav.account", icon: User },
  { to: "/pricing", labelKey: "nav.pricing", icon: Tag },
  { to: "/about", labelKey: "nav.aboutFull", icon: LayoutDashboard },
];

const AppMenu = ({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) => {
  const { session, signOut } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();
  const [alterOpen, setAlterOpen] = useState(true);

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logoutOk"));
    onNavigate?.();
    navigate("/");
  };

  return (
    <div className="flex h-full flex-col">
      {!compact && (
        <Link
          to="/"
          className="flex items-center gap-2 px-6 py-5 border-b border-border/40"
          onClick={onNavigate}
        >
          <img src="/logo.svg" alt="Quantryx Sound Project" className="h-8 w-auto" />
          <span className="text-lg font-bold tracking-tight">
            Quantryx<span className="text-primary"> Sound</span> Project
          </span>
        </Link>
      )}

      <nav className={cn("flex-1 space-y-1", compact ? "px-0 py-0" : "px-3 py-4")}>
        {navItems.map(({ to, label, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label ?? t(labelKey as string)}
          </NavLink>
        ))}

        <div className={cn("pt-2", compact && "pt-1") }>
          <button
            type="button"
            onClick={() => setAlterOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Waves className="h-5 w-5 shrink-0 text-primary" />
              {t("nav.alter")}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", alterOpen && "rotate-180")} />
          </button>

          {alterOpen && (
            <div className="mt-1 ml-3 space-y-1 border-l border-border/40 pl-3">
              <NavLink
                to="/product/demo"
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <Waves className="h-4 w-4 shrink-0" />
                {t("plans.demoName")}
              </NavLink>
              <NavLink
                to="/product/listener"
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <Headphones className="h-4 w-4 shrink-0" />
                {t("plans.listenerName")}
              </NavLink>
              <NavLink
                to="/product/creator"
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )
                }
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                {t("plans.creatorName")}
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      <div className={cn("space-y-3", compact ? "px-0 pt-3" : "px-3 py-4 border-t border-border/40")}>
        <LanguageSwitcher className="w-full justify-center" />
        {session ? (
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {t("nav.logout")}
          </button>
        ) : (
          <Link to="/login" onClick={onNavigate}>
            <Button className="w-full">{t("nav.login")}</Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default AppMenu;

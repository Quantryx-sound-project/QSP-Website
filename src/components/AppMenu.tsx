import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogOut, ChevronDown, BarChart3, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useInWaitlist } from "@/hooks/useInWaitlist";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Per-item emblems (transparent, colour-matched to each page's hero) + the
// gallery underlay shown behind the cell when the item is active.
import embAccount from "@/assets/emblems/emblem-account.webp";
import embPricing from "@/assets/emblems/emblem-pricing.webp";
import embAbout from "@/assets/emblems/emblem-about.webp";
import embListener from "@/assets/emblems/emblem-listener.webp";
import embDemo from "@/assets/emblems/emblem-demo.webp";
import embCreator from "@/assets/emblems/emblem-creator.webp";
import embPro from "@/assets/emblems/emblem-pro.webp";
import embAlter from "@/assets/emblems/emblem-alter.webp";
import embAlter3D from "@/assets/emblems/emblem-alter-3d.webp";
import embMain from "@/assets/emblems/emblem-main.webp";
import embPortfolio from "@/assets/emblems/emblem-portfolio.webp";

import ulAccount from "@/assets/backgrounds/underlay-account.webp"; // red — matches account emblem
import ulPricing from "@/assets/backgrounds/underlay-pricing.webp"; // orange — matches pricing emblem
import ulAbout from "@/assets/backgrounds/hero-about.webp"; // red/pink — matches about hero
import ulListener from "@/assets/backgrounds/hero-listener.webp";
import ulPro from "@/assets/backgrounds/hero-pro.webp";
import ulDemo from "@/assets/backgrounds/hero-demo.webp"; // mandala
import ulCreator from "@/assets/backgrounds/underlay-creator.webp"; // spiro tunnel — creator hover bg (separate from hero)
import ulAlter from "@/assets/backgrounds/underlay-alter.webp"; // magenta mandala — Alter toggle hover bg
import ulEarlyAccess from "@/assets/backgrounds/underlay-earlyaccess.webp"; // cosmic spiral — Early Access bg
import ulMain from "@/assets/backgrounds/underlay-main.webp"; // crystals — Main page bg
import ulPortfolio from "@/assets/backgrounds/underlay-portfolio.webp"; // quantum well — Portfolio bg

type Item = {
  to: string;
  labelKey?: string;
  label?: string;
  /** Starsie polozky maju vlastny emblem; nove pouzivaju ikonu. */
  emblem?: string;
  underlay?: string;
  icon?: LucideIcon;
};

export const navItems: Item[] = [
  { to: "/", label: "Main page", emblem: embMain, underlay: ulMain },
  { to: "/dashboard", labelKey: "nav.account", emblem: embAccount, underlay: ulAccount },
  { to: "/portfolio", label: "Portfolio", emblem: embPortfolio, underlay: ulPortfolio },
  { to: "/about", labelKey: "nav.aboutFull", emblem: embAbout, underlay: ulAbout },
];

// Ceny patria k Alteru, tak su az tu - a hned ako prva polozka,
// lebo to je najcastejsia otazka pred stiahnutim.
const alterItems: Item[] = [
  // Early Access je teraz hlavný vstup k Alteru (predaj ešte nebeží).
  { to: "/early-access", label: "What is Alter", emblem: embAlter, underlay: ulEarlyAccess },
  { to: "/pricing", labelKey: "nav.pricing", emblem: embPricing, underlay: ulPricing },
  { to: "/product/demo", labelKey: "plans.demoName", emblem: embDemo, underlay: ulDemo },
  { to: "/product/listener", labelKey: "plans.listenerName", emblem: embListener, underlay: ulListener },
  { to: "/product/creator", labelKey: "plans.creatorName", emblem: embCreator, underlay: ulCreator },
  { to: "/product/pro", labelKey: "plans.proName", emblem: embPro, underlay: ulPro },
];

// One nav row: emblem is greyscale by default (menu text colour), colours in on
// hover, and stays coloured when active — where the cell also gets a gradient
// panel with a colour-matched gallery underlay.
const NavItem = ({
  item,
  small = false,
  onNavigate,
}: {
  item: Item;
  small?: boolean;
  onNavigate?: () => void;
}) => {
  const { t } = useT();
  const label = item.label ?? t(item.labelKey as string);
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group relative block rounded-lg font-medium transition-colors",
          small ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-sm",
          // Keep the label in the normal foreground colour (no purple); readability
          // on active/hover comes from a subtle neon text-glow instead of a colour shift.
          isActive
            ? "text-foreground shadow-[inset_0_0_18px_-8px_hsl(var(--neon)/0.6)] [&_span]:[text-shadow:0_0_8px_hsl(var(--neon)/0.45)]"
            : "text-muted-foreground hover:text-foreground group-hover:[&_span]:[text-shadow:0_0_6px_hsl(var(--neon)/0.3)]"
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Row background — the colour-matched gallery underlay.
              Appears on hover already; the gradient panel + neon edge are added only when active. */}
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
            {item.underlay && (
            <span
              className={cn(
                // These underlays are very dark hero images (near-black with a bright
                // centre). `screen` blend drops the black to transparent and lets the
                // bright detail read; brightness lifts it further on hover.
                "absolute inset-0 bg-cover bg-center transition-opacity duration-300 [mix-blend-mode:screen]",
                // Active must read brighter than hover: higher opacity + stronger
                // brightness lift on the active cell, gentler on plain hover.
                isActive
                  ? "opacity-70 [filter:brightness(1.6)_contrast(1.1)]"
                  : "opacity-0 group-hover:opacity-45 group-hover:[filter:brightness(1.3)_contrast(1.05)]"
              )}
              style={{ backgroundImage: `url(${item.underlay})` }}
            />
            )}
            {isActive && (
              <>
                <span className="absolute inset-0 bg-gradient-to-r from-primary/18 via-primary/5 to-neon/8" />
                <span className="absolute inset-y-0 left-0 w-[2px] bg-neon" />
              </>
            )}
          </span>
          <span className="relative z-10 flex items-center gap-3">
            {item.emblem ? (
              <img
                src={item.emblem}
                alt=""
                aria-hidden
                className={cn(
                  "h-5 w-5 shrink-0 object-contain transition duration-300",
                  isActive
                    ? "opacity-100 grayscale-0 drop-shadow-[0_0_6px_hsl(var(--primary)/0.7)]"
                    : "opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                )}
              />
            ) : (
              item.icon && (
                <item.icon
                  aria-hidden
                  className={cn(
                    "h-5 w-5 shrink-0 transition duration-300",
                    isActive ? "text-neon" : "opacity-60 group-hover:opacity-100"
                  )}
                />
              )
            )}
            <span className="truncate">{label}</span>
          </span>
        </>
      )}
    </NavLink>
  );
};

/**
 * Položka pre správcu. Nemá emblem ako ostatné stránky – nie je to
 * verejná časť webu, tak nech sa aj vizuálne odlišuje.
 */
const AdminNavItem = ({ onNavigate }: { onNavigate?: () => void }) => (
  <NavLink
    to="/admin"
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "text-foreground shadow-[inset_0_0_18px_-8px_hsl(var(--neon)/0.6)]"
          : "text-muted-foreground hover:text-foreground"
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[2px] rounded-full bg-neon" />
        )}
        <BarChart3
          className={cn(
            "h-5 w-5 shrink-0 transition",
            isActive ? "text-neon" : "opacity-60 group-hover:opacity-100"
          )}
        />
        <span className="truncate">Analytika</span>
      </>
    )}
  </NavLink>
);

const AppMenu = ({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) => {
  const { session, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const inWaitlist = useInWaitlist();
  const { t } = useT();
  const navigate = useNavigate();
  const [alterOpen, setAlterOpen] = useState(true);

  // Cenník vidí v menu len admin; Early Access je zatiaľ len pre prihlásených
  // (rozdávame ho po ľuďoch, verejnosť oň zatiaľ nemá vedieť).
  // "What is Alter" je verejné; Pricing a karty tierov len pre prihláseného
  // vo waitliste (alebo admina).
  const eligible = isAdmin === true || inWaitlist === true;
  const visibleAlterItems = alterItems.filter((item) => {
    if (item.to === "/early-access") return true;
    if (item.to === "/pricing") return eligible;
    if (item.to.startsWith("/product/")) return eligible;
    return true;
  });

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logoutOk"));
    onNavigate?.();
    navigate("/");
  };

  return (
    <div className="flex h-full flex-col">
      {!compact && (
        <Link to="/" className="flex items-center gap-2 px-6 py-5 border-b border-primary/20">
          <img src="/logo-wordmark.svg" alt="Quantryx Sound Project" className="h-8 w-auto" />
        </Link>
      )}

      <nav className={cn("flex-1 space-y-1", compact ? "px-0 py-0" : "px-3 py-4")}>
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}

        <div className={cn("pt-2", compact && "pt-1")}>
          <button
            type="button"
            onClick={() => setAlterOpen((open) => !open)}
            className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors"
          >
            {/* Pozadie ako pri ostatných položkách — objaví sa na hover cez screen blend. */}
            <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
              <span
                className="absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-300 [mix-blend-mode:screen] group-hover:opacity-45 group-hover:[filter:brightness(1.3)_contrast(1.05)]"
                style={{ backgroundImage: `url(${ulAlter})` }}
              />
            </span>
            <span className="relative z-10 flex items-center gap-3">
              <img
                src={embAlter3D}
                alt=""
                aria-hidden
                className="h-5 w-5 shrink-0 object-contain opacity-70 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
              />
              {t("nav.alter")}
            </span>
            <ChevronDown className={cn("relative z-10 h-4 w-4 transition-transform", alterOpen && "rotate-180")} />
          </button>

          {alterOpen && (
            <div className="mt-1 ml-3 space-y-1 border-l border-border/40 pl-3">
              {visibleAlterItems.map((item) => (
                <NavItem key={item.to} item={item} small onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>

        {/* Správcovská časť – zobrazí sa len tebe. */}
        {isAdmin && (
          <div className="mt-4 space-y-1 border-t border-border/40 pt-4">
            <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">
              Správa
            </p>
            <AdminNavItem onNavigate={onNavigate} />
          </div>
        )}
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

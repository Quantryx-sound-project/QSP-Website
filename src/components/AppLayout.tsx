import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import Footer from "@/components/Footer";
import AppMenu from "@/components/AppMenu";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import sigilBg from "@/assets/backgrounds/background.png";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { open, setOpen, width, startResize, isDesktop } = useSidebar(true);
  const { t } = useT();

  // Na mobile menu po prechode na inú stránku zavri, na počítači nechaj otvorené.
  const closeOnMobile = () => {
    if (!isDesktop) setOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-top opacity-[0.12]" style={{ backgroundImage: `url(${sigilBg})` }} />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 cyber-grid opacity-30" />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_-5%,hsl(var(--primary)/0.14),transparent_70%)]" />
      <header className="fixed top-0 left-0 right-0 z-[70] h-16 border-b border-primary/20 bg-background/70 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--neon)/0.22)]">
        <div className="h-full container mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" onClick={closeOnMobile} className="flex min-w-0 items-center gap-2">
              <img
                src="/logo-wordmark.svg"
                alt="Quantryx Sound Project"
                className="h-7 sm:h-8 w-auto max-w-[52vw] sm:max-w-none object-contain object-left"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Stmavené pozadie na mobile – kliknutie mimo menu ho zavrie. */}
      {open && !isDesktop && (
        <div
          className="fixed inset-0 top-16 z-[55] bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-[60] border-r border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: isDesktop ? width : "min(18rem, 82vw)" }}
      >
        <div className="h-full overflow-y-auto p-4">
          <AppMenu compact onNavigate={closeOnMobile} />
        </div>
        {isDesktop && (
          <div
            onMouseDown={startResize}
            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 transition-colors"
            aria-hidden
          />
        )}
      </aside>

      {/* Content */}
      <main
        className="transition-[padding] duration-300"
        style={{ paddingLeft: open && isDesktop ? width : 0 }}
      >
        <div className="pt-16">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default AppLayout;

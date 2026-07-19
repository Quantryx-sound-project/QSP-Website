import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import Footer from "@/components/Footer";
import AppMenu from "@/components/AppMenu";
import { cn } from "@/lib/utils";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(true);
  const { t } = useT();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-[70] h-16 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="h-full container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Quantryx Sound Project" className="h-7 w-auto" />
              <span className="font-bold tracking-tight">
                Quantryx<span className="text-primary"> Sound</span> Project
              </span>
            </Link>
          </div>
        </div>
      </header>

      {open && <div className="fixed left-0 right-0 bottom-0 top-16 z-50 bg-black/45" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-[60] w-72 max-w-[85vw] border-r border-border/40 bg-background shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full overflow-y-auto p-4">
          <AppMenu compact onNavigate={() => setOpen(false)} />
        </div>
      </aside>

      {/* Content */}
      <main className={cn("transition-[padding] duration-300", open ? "md:pl-64" : "md:pl-0")}>
        <div className="pt-16">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default AppLayout;

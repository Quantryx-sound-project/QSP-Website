import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Coffee, LogIn, Check, Instagram, Heart } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { trackClick } from "@/lib/analytics";
import {
  installerUrl,
  donationUrl,
  bmcUsername,
  earlyAccessVersion,
  hasInstaller,
} from "@/lib/earlyAccess";

const INSTAGRAM_URL = "https://www.instagram.com/quantryx_sound_project/";
const INSTAGRAM_HANDLE = "@quantryx_sound_project";

/**
 * Early Access — testovacia fáza. Plná verzia zadarmo, len pre prihlásených.
 *
 * Podpora ide cez vnorený Buy Me a Coffee widget (overlay): otvorí sa priamo
 * na stránke, človek zadá sumu + správu a zaplatí kartou BEZ registrácie a BEZ
 * presmerovania na inú stránku — čo najmenej trenia pre darcu. Widget načítavame
 * len tu (a po odchode zo stránky ho upraceme), aby o ňom verejnosť nevedela.
 */
const EarlyAccess = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const isAuthed = Boolean(session);

  // Načítaj BMC widget len na tejto stránke; po odchode upraceme jeho DOM.
  useEffect(() => {
    const script = document.createElement("script");
    script.setAttribute("data-name", "BMC-Widget");
    script.setAttribute("data-cfasync", "false");
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
    script.setAttribute("data-id", bmcUsername);
    script.setAttribute("data-description", "Support Quantryx");
    script.setAttribute("data-message", "love you and thank you for the support!💖");
    script.setAttribute("data-color", "#6B7280");
    script.setAttribute("data-position", "Right");
    script.setAttribute("data-x_margin", "18");
    script.setAttribute("data-y_margin", "18");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      // Widget si vytvára prvky s id začínajúcim "bmc-" — po odchode ich zmažeme.
      document.querySelectorAll('[id^="bmc-"]').forEach((el) => el.remove());
    };
  }, []);

  // Otvor BMC overlay priamo na stránke (bez presmerovania). Ak by widget ešte
  // nebol načítaný, otvoríme profil v novej karte ako záloha.
  const openSupport = () => {
    trackClick("early_access_donate");
    const btn = document.getElementById("bmc-wbtn") as HTMLElement | null;
    if (btn) {
      btn.click();
    } else {
      window.open(donationUrl, "_blank", "noopener");
    }
  };

  const startDownload = () => {
    trackClick("early_access_download");
    const a = document.createElement("a");
    a.href = installerUrl;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neon">
            Early Access
          </span>
          <h1 className="mt-4 text-4xl font-bold text-glow md:text-5xl">Test Alter early</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            You're one of the first people ever to run this. Grab the full build, break it, and
            tell me what's off.
          </p>
        </header>

        {/* SUPPORT — nad stiahnutím. Otvorí BMC overlay priamo na stránke. */}
        <section className="mt-10 rounded-2xl border border-primary/25 bg-primary/[0.06] p-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Heart className="h-6 w-6 text-primary" aria-hidden />
            Thank you for being here
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Thank you for supporting the project. I build this on my own as an indie developer, and
            every single interaction means the world to me. If you'd like to fuel my
            creativity with a tip for a coffee, you can do so right here on
            this page. Every little bit helps. And if you don't, that's completely fine, the download
            is free either way. 💜
          </p>
          <p className="mt-3 max-w-2xl font-medium text-primary">
            Thank you for being here with me
          </p>
          <div className="mt-6">
            <Button size="lg" variant="cyber" onClick={openSupport}>
              <Coffee className="mr-2 h-4 w-4" />
              Buy me a coffee
            </Button>
          </div>
        </section>

        {/* DOWNLOAD — len pre prihlásených. */}
        <Card className="mt-8 border-primary/25 bg-card/50 overflow-hidden">
          <CardContent className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Download the Early Access build</h2>
              <p className="mt-2 text-muted-foreground">
                {isAuthed
                  ? "The full version, free to test. Windows & macOS."
                  : "Sign in (or create a free account) to download — it takes a few seconds and lets me send you updates."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{earlyAccessVersion}</p>
            </div>

            <div className="shrink-0">
              {isAuthed ? (
                hasInstaller() ? (
                  <Button size="lg" variant="cyber" onClick={startDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Alter
                  </Button>
                ) : (
                  <Button size="lg" variant="cyber" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Installer coming soon
                  </Button>
                )
              ) : (
                <Button
                  size="lg"
                  variant="cyber"
                  onClick={() => {
                    trackClick("early_access_signin");
                    navigate("/login");
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in to download
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pod stiahnutím — vysvetlenie, že predaj ešte nebeží. */}
        <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
          Alter isn't on sale yet. While it's being tested you can get the full version for free —
          install it, push it around, and tell me what breaks.
        </p>

        {/* Kontakt cez Instagram. */}
        <section className="mt-14 border-t border-border/40 pt-10">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Instagram className="h-6 w-6 text-primary" aria-hidden />
            Found a bug? Message me
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Crashes, weird meter readings, anything that feels off — send it over and it gets fixed.
            The fastest way to reach me is Instagram.
          </p>
          <div className="mt-6">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("early_access_instagram")}
            >
              <Button size="lg" variant="outline">
                <Instagram className="mr-2 h-4 w-4" />
                {INSTAGRAM_HANDLE}
              </Button>
            </a>
          </div>
        </section>

        {/* Čo dostaneš */}
        <ul className="mt-14 space-y-3 border-t border-border/40 pt-10">
          {[
            "The full version of Alter — every module unlocked, no license needed.",
            "You're testing the real thing before it launches. Your feedback shapes it.",
            "Free during Early Access. A tip is welcome, never required.",
          ].map((perk) => (
            <li key={perk} className="flex items-start gap-3 text-muted-foreground">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-neon" aria-hidden />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
};

export default EarlyAccess;

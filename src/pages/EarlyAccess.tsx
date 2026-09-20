import { Link, useNavigate } from "react-router-dom";
import { Download, Coffee, LogIn, Check, Bug } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { site } from "@/lib/site";
import { trackClick } from "@/lib/analytics";
import {
  installerUrl,
  donationUrl,
  earlyAccessVersion,
  hasInstaller,
  hasDonation,
} from "@/lib/earlyAccess";

/**
 * Early Access — testovacia fáza. Plná verzia Alteru zadarmo, len pre prihlásených
 * (aby sme vedeli, komu poslať update a od koho pýtať feedback). Podpora cez
 * Buy Me a Coffee je dobrovoľná a nie je podmienkou stiahnutia.
 */
const PERKS = [
  "The full version of Alter — every module unlocked, no license needed.",
  "You're testing the real thing before it launches. Your feedback shapes it.",
  "Free during Early Access. A tip is welcome, never required.",
];

const EarlyAccess = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const isAuthed = Boolean(session);

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
      <div className="container mx-auto max-w-4xl px-6 py-16">
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neon">
            Early Access
          </span>
          <h1 className="mt-4 text-4xl font-bold text-glow md:text-5xl">Test Alter early</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Alter isn't on sale yet. While it's being tested you can get the full version for
            free — install it, push it around, and tell me what breaks.
          </p>
        </header>

        {/* Download card — gated behind sign-in so we know who's testing. */}
        <Card className="mt-10 border-primary/25 bg-card/50 overflow-hidden">
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

        {/* What you get */}
        <ul className="mt-10 space-y-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-3 text-muted-foreground">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-neon" aria-hidden />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        {/* Poďakovanie od srdca — pre tých, čo sú tu odteraz na začiatku. */}
        <div className="mt-14 rounded-2xl border border-border/40 bg-card/40 p-8 text-center">
          <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
            You're one of the first people ever to run this. ALTER is made by one
            person — no studio, no team — so you being here this early, testing
            something still rough around the edges, genuinely means the world to me.
            Break it, tell me what's off, and we'll make it better together.
          </p>
          <p className="mt-4 font-medium text-primary">Thank you for being here. — Quantryx</p>
        </div>

        {/* Optional support — only shows once a Buy Me a Coffee link is set. */}
        {hasDonation() && (
          <section className="mt-14 rounded-2xl border border-primary/25 bg-primary/[0.06] p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                  <Coffee className="h-6 w-6 text-primary" aria-hidden />
                  Like it? Buy me a coffee
                </h2>
                <p className="mt-2 text-muted-foreground">
                  The download is free — this is just here if you want to chip in. Alter is built
                  by one person; even a small tip helps keep it going. Totally optional.
                </p>
              </div>
              <a
                href={donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick("early_access_donate")}
                className="shrink-0"
              >
                <Button size="lg" variant="cyber-outline">
                  <Coffee className="mr-2 h-4 w-4" />
                  Support Alter
                </Button>
              </a>
            </div>
          </section>
        )}

        {/* Feedback */}
        <section className="mt-14 border-t border-border/40 pt-10">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Bug className="h-6 w-6 text-primary" aria-hidden />
            Found a bug? Tell me
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Early Access is all about catching problems before launch. Crashes, weird meter
            readings, anything that feels off — send it over and it gets fixed.
          </p>
          <div className="mt-6">
            <a
              href={`mailto:${site.email}?subject=Alter%20Early%20Access%20feedback`}
              onClick={() => trackClick("early_access_feedback")}
            >
              <Button size="lg" variant="outline">
                {site.email}
              </Button>
            </a>
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          The paid editions of Alter aren't on sale yet.{" "}
          <Link to="/about" className="text-primary hover:underline">
            More about Quantryx
          </Link>
        </p>
      </div>
    </AppLayout>
  );
};

export default EarlyAccess;

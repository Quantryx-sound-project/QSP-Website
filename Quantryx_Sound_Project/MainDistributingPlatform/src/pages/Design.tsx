import { Link } from "react-router-dom";
import { ArrowRight, Disc3, Clapperboard, Boxes, Mail } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { trackClick } from "@/lib/analytics";

/**
 * Book a design – ponuka vizuálnej tvorby (obaly, motion, 3D).
 * Zámerne bez formulára: prvý kontakt je mail alebo Instagram,
 * lebo pri zákazkovej práci aj tak nasleduje rozhovor.
 */
const SERVICES = [
  {
    icon: Disc3,
    title: "Cover art",
    body: "Artwork for singles, EPs and albums — built to hold up both as a 3000×3000 release cover and as a thumbnail in a feed.",
  },
  {
    icon: Clapperboard,
    title: "Motion design",
    body: "Animated visuals for release promos, canvases and social posts. Loops that stay watchable the tenth time around.",
  },
  {
    icon: Boxes,
    title: "3D design",
    body: "Rendered objects, type and environments — the same toolset behind the visuals across this site.",
  },
];

const Design = () => (
  <AppLayout>
    <div className="container mx-auto max-w-4xl px-6 py-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold text-glow md:text-5xl">Book a design</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Visual work for music: covers, motion and 3D — made by hand, for artists who care how
          their release looks.
        </p>
      </header>

      {/* Toto je to, co odlisuje ponuku, tak to nesmie zapadnut medzi sluzbami. */}
      <p className="mt-8 inline-flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
        <span className="font-semibold text-primary">No AI.</span>
        <span className="text-foreground/80">
          Every piece is designed and rendered by hand. Nothing here is generated.
        </span>
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {SERVICES.map((service) => (
          <div key={service.title} className="cyber-frame h-full">
            <div className="cyber-frame-inner h-full p-6">
              <service.icon className="h-7 w-7 text-primary" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold">{service.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.body}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-16 border-t border-border/40 pt-10">
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-4 space-y-3 text-muted-foreground">
          <li>
            <span className="text-foreground">1. Tell me about the release.</span> The music, the
            mood, where it's going out, and when.
          </li>
          <li>
            <span className="text-foreground">2. You get a quote and a timeline.</span> Price
            depends on scope — a single cover and a full campaign are different jobs.
          </li>
          <li>
            <span className="text-foreground">3. Drafts, then revisions.</span> You see directions
            before anything is finished.
          </li>
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${site.email}?subject=Design%20enquiry`}
            onClick={() => trackClick("design_email")}
          >
            <Button size="lg">
              <Mail className="mr-2 h-4 w-4" />
              {site.email}
            </Button>
          </a>
          <Link to="/portfolio" onClick={() => trackClick("design_portfolio")}>
            <Button size="lg" variant="outline">
              See the work
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  </AppLayout>
);

export default Design;

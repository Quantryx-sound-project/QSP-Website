import { Instagram } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { trackClick } from "@/lib/analytics";

const INSTAGRAM_URL = "https://www.instagram.com/quantryx_sound_project/";
const INSTAGRAM_HANDLE = "@quantryx_sound_project";

/**
 * "What is Alter" — verejná info stránka (predtým Early Access).
 * Podpora (Buy me a coffee) je teraz na domovskej stránke,
 * karty tierov + download sú v Pricing (len pre waitlist/admin).
 */
const WhatIsAlter = () => {
  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neon">
            Alter
          </span>
          <h1 className="mt-4 text-4xl font-bold text-glow md:text-5xl">What is Alter</h1>
        </header>

        <section className="mt-8 space-y-4 text-lg leading-relaxed text-muted-foreground">
          <p>
            Alter is a real-time audio metering and visualization tool for music producers. It turns
            what you hear into something you can see — precise meters for mixing and mastering, and
            audio-reactive visuals you can record for your releases.
          </p>
          <p>
            It comes as a desktop app plus two lightweight VST3 plugins (Creator and Listener) that
            feed audio straight from your DAW. On the analysis side you get an oscilloscope, RMS,
            True Peak and LUFS metering, a spectrum analyzer, spectrogram, stereoscope and a tone
            analyzer. On the creative side, GPU-accelerated visual modules (Synesthesia, Chladni
            patterns, Geometry) react to your sound in real time.
          </p>
          <p>
            I'm building Alter on my own as an indie developer — it's currently in active
            development, and the people testing it are shaping what it becomes.
          </p>
        </section>

        {/* Found a bug — kontakt cez Instagram (ostáva tu). */}
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
              onClick={() => trackClick("what_is_alter_instagram")}
            >
              <Button size="lg" variant="outline">
                <Instagram className="mr-2 h-4 w-4" />
                {INSTAGRAM_HANDLE}
              </Button>
            </a>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default WhatIsAlter;

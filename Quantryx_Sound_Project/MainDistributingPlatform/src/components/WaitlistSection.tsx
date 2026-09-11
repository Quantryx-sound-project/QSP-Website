import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Handshake, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { trackClick } from "@/lib/analytics";

type Kind = "collab" | "early_access";

const SPECIALIZATIONS = [
  "Sharing & reposting",
  "Audio Engineering",
  "Audio Production",
  "Software Testing",
  "VJ / Visuals",
  "Other Audiovisual",
];

/**
 * Waitlist – samostatná sekcia, nič iné na stránke nemení.
 * Vetva "collab": špecializácia + popis + email alebo instagram.
 * Vetva "early_access": meno + email.
 * Zapisuje do Supabase tabuľky `waitlist` (viď supabase/waitlist.sql).
 */
const WaitlistSection = () => {
  const [kind, setKind] = useState<Kind | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);

  const toggleSpecialization = (s: string) =>
    setSpecializations((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setKind(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabaseConfigured) {
      setError("Signups are not available right now. Please try again later.");
      return;
    }
    if (kind === "collab" && !email.trim() && !instagram.trim()) {
      setError("Please leave an email or an Instagram handle so we can reach you.");
      return;
    }
    if (kind === "collab" && message.trim().split(/\s+/).filter(Boolean).length < 10) {
      setError("Please tell us a bit more about what you do (at least 10 words).");
      return;
    }
    if (kind === "early_access" && (!name.trim() || !email.trim())) {
      setError("Please enter your name and email.");
      return;
    }

    setSubmitting(true);
    trackClick(kind === "collab" ? "waitlist_collab_submit" : "waitlist_early_access_submit");
    const { error: dbError } = await supabase.from("waitlist").insert({
      kind,
      name: name.trim() || null,
      email: email.trim() || null,
      instagram: instagram.trim() || null,
      specialization:
        kind === "collab" && specializations.length > 0
          ? specializations.join(", ")
          : null,
      message: kind === "collab" ? message.trim() || null : null,
    });
    setSubmitting(false);

    if (dbError) {
      if (dbError.code === "23505") {
        // duplicitný email – berieme ako úspech
        setDone(true);
        return;
      }
      setError("Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  };

  return (
    <section id="waitlist" className="py-24 px-6 border-t border-primary/15">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-glow mb-3">
          Be part of the drop
        </h2>
        <p className="text-muted-foreground mb-10">
          ALTER is coming. Join the waitlist — as a collaborator or an early
          supporter.
        </p>

        {done ? (
          <div className="cyber-frame">
            <div className="cyber-frame-inner p-8 flex flex-col items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <p className="text-lg font-semibold">You're on the list.</p>
              <p className="text-sm text-muted-foreground">
                {kind === "collab"
                  ? "We'll get back to you personally — keep an eye on your inbox / DMs."
                  : "You'll be the first to know when ALTER drops."}
              </p>
            </div>
          </div>
        ) : kind === null ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setKind("collab"); trackClick("waitlist_open_collab"); }}
              className="cyber-frame text-left group"
            >
              <div className="cyber-frame-inner h-full p-6">
                <Handshake className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-1">
                  I want to work with you
                </h3>
                <p className="text-sm text-muted-foreground">
                  Help shape ALTER and earn a free licence.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setKind("early_access"); trackClick("waitlist_open_early_access"); }}
              className="cyber-frame text-left group"
            >
              <div className="cyber-frame-inner h-full p-6">
                <Sparkles className="h-8 w-8 text-neon mb-3" />
                <h3 className="font-semibold text-lg mb-1">
                  I want early access &amp; discounts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get notified first and grab launch-day deals.
                </p>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="cyber-frame text-left">
            <div className="cyber-frame-inner p-6 md:p-8 space-y-5">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              {kind === "collab" ? (
                <>
                  <div className="space-y-2">
                    <Label>How can you help?</Label>
                    <p className="text-sm text-muted-foreground">
                      Pick anything that fits. Sharing posts about ALTER counts — you don't need to be a pro.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SPECIALIZATIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSpecialization(s)}
                          className={cn(
                            "px-3 py-1.5 rounded-full border text-sm transition-colors",
                            specializations.includes(s)
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border/60 text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wl-message">
                      Tell us in your own words what you do
                    </Label>
                    <textarea
                      id="wl-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                      placeholder="What do you work on? Which tools/DAWs do you use? What would you like to test or explore with ALTER? (2–3 sentences)"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="wl-email">Email</Label>
                      <Input
                        id="wl-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wl-instagram">or Instagram</Label>
                      <Input
                        id="wl-instagram"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@yourhandle"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wl-name">Name</Label>
                    <Input
                      id="wl-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wl-email2">Email</Label>
                    <Input
                      id="wl-email2"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" size="lg" disabled={submitting} className="w-full">
                {submitting
                  ? "Sending..."
                  : kind === "collab"
                    ? "Apply to collaborate"
                    : "Join the waitlist"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default WaitlistSection;

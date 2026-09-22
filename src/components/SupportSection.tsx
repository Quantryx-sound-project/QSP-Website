import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Coffee, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackClick } from "@/lib/analytics";
import { donationUrl, bmcUsername } from "@/lib/earlyAccess";

const LIKE_KEY = "alter_support_liked";

/** "Thank you for being here" + Buy me a coffee. Presunuté z Early Access na home. */
const SupportSection = () => {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(LIKE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLike = () =>
    setLiked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LIKE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next) trackClick("support_like");
      return next;
    });

  // Načítaj BMC widget a skry jeho plávajúce tlačidlo (máme vlastné).
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-bmc-hide", "1");
    style.textContent = "#bmc-wbtn{opacity:0!important;pointer-events:none!important;}";
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.setAttribute("data-name", "BMC-Widget");
    script.setAttribute("data-cfasync", "false");
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
    script.setAttribute("data-id", bmcUsername);
    script.setAttribute("data-description", "Support Quantryx");
    script.setAttribute("data-message", "");
    script.setAttribute("data-color", "#6B7280");
    script.setAttribute("data-position", "Right");
    script.setAttribute("data-x_margin", "18");
    script.setAttribute("data-y_margin", "18");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      style.remove();
      document.querySelectorAll('[id^="bmc-"]').forEach((el) => el.remove());
    };
  }, []);

  const openSupport = () => {
    trackClick("support_donate");
    const btn = document.getElementById("bmc-wbtn") as HTMLElement | null;
    if (btn) btn.click();
    else window.open(donationUrl, "_blank", "noopener");
  };

  return (
    <section className="px-6 pb-16">
      <div className="container mx-auto max-w-3xl">
        <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <button
              type="button"
              onClick={toggleLike}
              aria-pressed={liked}
              aria-label={liked ? "Unlike" : "Like"}
              className="rounded-full p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <Heart
                className={cn(
                  "h-6 w-6 transition-all duration-200",
                  liked ? "scale-110 fill-primary text-primary" : "text-primary"
                )}
                aria-hidden
              />
            </button>
            Thank you for being here
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            I build Alter on my own as an indie developer, and every single interaction means the
            world to me. If you'd like to fuel my creativity with a tip for a coffee, you can do so
            right here. Every little bit helps — and if you don't, that's completely fine. 💜
          </p>
          <p className="mt-3 max-w-2xl font-medium text-primary">
            Thank you for being here with me — Quantryx
          </p>
          <div className="mt-6">
            <Button size="lg" variant="cyber" onClick={openSupport}>
              <Coffee className="mr-2 h-4 w-4" />
              Buy me a coffee
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SupportSection;

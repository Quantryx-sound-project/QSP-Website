import { useEffect, useRef, useState } from "react";

/**
 * Priebeh scrollovania cez prvok: 0 = práve vchádza zdola, 1 = odchádza hore.
 *
 * Počíta sa v rAF, nie priamo v scroll udalosti – prehliadač tak stihne
 * vykresliť snímku a rolovanie ostane plynulé aj pri viacerých vrstvách.
 * Kto má v systéme vypnuté animácie, dostane napevno 0.5 (stred, bez pohybu).
 */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0.5);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = window.innerHeight + rect.height;
      const seen = window.innerHeight - rect.top;
      setProgress(Math.min(1, Math.max(0, seen / total)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { ref, progress };
}

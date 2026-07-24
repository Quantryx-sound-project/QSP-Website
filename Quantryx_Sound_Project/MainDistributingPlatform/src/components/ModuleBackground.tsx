import { CSSProperties, useEffect, useRef, useState } from "react";

type Fade = "radial" | "bottom" | "top" | "none";
type Blend = "screen" | "lighten" | "plus-lighter" | "normal";

interface ModuleBackgroundProps {
  src?: string;
  position?: string;
  opacity?: number;
  blend?: Blend;
  fade?: Fade;
  /** Gaussian blur in px — smooths low-res art and keeps text readable. */
  blur?: number;
  /** 0..1 dark veil over the image for text contrast. */
  darken?: number;
  /** Subtle scroll parallax strength (~0.1–0.35). 0 disables it. */
  parallax?: number;
  className?: string;
}

const fadeMask: Record<Fade, string | undefined> = {
  radial: "radial-gradient(120% 100% at 50% 40%, #000 30%, transparent 85%)",
  bottom: "linear-gradient(to bottom, #000 55%, transparent 100%)",
  top: "linear-gradient(to top, #000 55%, transparent 100%)",
  none: undefined,
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const ModuleBackground = ({
  src,
  position = "center",
  opacity = 0.6,
  blend = "screen",
  fade = "radial",
  blur = 0,
  darken = 0,
  parallax = 0,
  className = "",
}: ModuleBackgroundProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  // Cheap, smooth scroll parallax: translate the image layer by a fraction of
  // how far the section's centre sits from the viewport centre. rAF-throttled.
  useEffect(() => {
    if (!parallax || prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewCentre = window.innerHeight / 2;
      const sectionCentre = rect.top + rect.height / 2;
      // distance normalised; multiplied by strength and a px budget
      setOffset(((viewCentre - sectionCentre) / window.innerHeight) * parallax * 140);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [parallax]);

  const mask = fadeMask[fade];
  const scale = blur ? 1.12 : parallax ? 1.16 : 1;
  const transform =
    scale !== 1 || offset
      ? `translate3d(0, ${offset.toFixed(1)}px, 0) scale(${scale})`
      : undefined;

  const imgStyle: CSSProperties = {
    backgroundImage: src ? `url("${src}")` : undefined,
    backgroundSize: "cover",
    backgroundPosition: position,
    backgroundRepeat: "no-repeat",
    opacity,
    mixBlendMode: blend as CSSProperties["mixBlendMode"],
    WebkitMaskImage: mask,
    maskImage: mask,
    filter: blur ? `blur(${blur}px)` : undefined,
    transform,
    willChange: parallax ? "transform" : undefined,
  };

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-0 overflow-hidden ${className}`}
    >
      {src && <div ref={layerRef} className="absolute inset-0" style={imgStyle} />}
      {darken > 0 && (
        <div
          className="absolute inset-0"
          style={{ background: "hsl(var(--background))", opacity: darken }}
        />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_35%,hsl(var(--primary)/0.10),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};

export default ModuleBackground;

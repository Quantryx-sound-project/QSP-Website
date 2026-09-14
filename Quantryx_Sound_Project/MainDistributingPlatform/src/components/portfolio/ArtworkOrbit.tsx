import { useEffect, useRef, useState } from "react";
import scene from "@/assets/portfolio/scene-figure.webp";

/**
 * Artworky obiehajúce okolo postavy.
 *
 * Prečo nie CSS `transform-style: preserve-3d`: potrebujeme, aby zadná
 * polovica kruhu zmizla ZA postavou a predná ju prekryla. Pri preserve-3d
 * to závisí na tom, ako prehliadač zoradí pretínajúce sa roviny, a naprieč
 * prehliadačmi to nie je spoľahlivé. Tu si polohu aj poradie vrstiev
 * rátame sami – je to predvídateľné a môžeme podľa hĺbky riadiť aj
 * zmenšenie, rozostrenie a stmavnutie, čo ilúziu priestoru dotiahne.
 */
type Props = {
  images: { src: string; alt: string }[];
  /** Polomer obehu v pomere k šírke javiska. */
  radius?: number;
};

const ArtworkOrbit = ({ images, radius = 0.3 }: Props) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [spin, setSpin] = useState(0);
  const spinRef = useRef(0);
  const velocity = useRef(0.12);
  const dragging = useRef<{ x: number; spin: number } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!dragging.current) {
        spinRef.current = (spinRef.current + (velocity.current * dt) / 16) % 360;
        setSpin(spinRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Ťahanie myšou/prstom – kruh sa dá roztočiť ručne.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const start = (x: number) => {
      dragging.current = { x, spin: spinRef.current };
    };
    const move = (x: number) => {
      if (!dragging.current) return;
      const delta = (x - dragging.current.x) * 0.35;
      spinRef.current = dragging.current.spin + delta;
      setSpin(spinRef.current);
    };
    const end = () => {
      dragging.current = null;
    };

    const onDown = (e: PointerEvent) => start(e.clientX);
    const onMove = (e: PointerEvent) => move(e.clientX);

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative aspect-square w-full max-w-3xl mx-auto touch-none select-none cursor-grab active:cursor-grabbing"
    >
      {/* Pozadie scény */}
      <img
        src={scene}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full rounded-2xl object-cover"
      />

      {images.map((image, index) => {
        const angle = ((index / images.length) * 360 + spin) * (Math.PI / 180);
        const x = Math.sin(angle);   // -1 vľavo … 1 vpravo
        const z = Math.cos(angle);   // 1 vpredu … -1 vzadu

        // Hĺbka: vpredu väčšie a ostré, vzadu menšie, tmavšie a rozostrené.
        const depth = (z + 1) / 2;                    // 0 vzadu … 1 vpredu
        const scale = 0.55 + depth * 0.55;
        const blur = (1 - depth) * 5;
        const dim = 0.35 + depth * 0.65;

        return (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            loading="lazy"
            draggable={false}
            className="absolute left-1/2 top-1/2 w-[22%] rounded-lg shadow-2xl ring-1 ring-white/10"
            style={{
              // Postava je vo vrstve 0; čo je vpredu, ide nad ňu, zvyšok pod ňu.
              zIndex: z > 0 ? 20 + Math.round(z * 10) : 10 + Math.round(z * 10),
              transform: `translate(-50%, -50%) translateX(${x * radius * 100}%) translateY(${
                -z * 4
              }%) scale(${scale})`,
              filter: `blur(${blur.toFixed(2)}px) brightness(${dim.toFixed(2)})`,
            }}
          />
        );
      })}

      {/* Postava vyrezaná mäkkou maskou – toto je tá clona, za ktorú
          zadná polovica kruhu zapadne. Vrstva 15 = medzi zadnými a prednými. */}
      <img
        src={scene}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full rounded-2xl object-cover"
        style={{
          zIndex: 15,
          maskImage:
            "radial-gradient(ellipse 20% 34% at 50% 62%, #000 58%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 20% 34% at 50% 62%, #000 58%, transparent 82%)",
        }}
      />

      <p className="pointer-events-none absolute bottom-3 left-0 right-0 z-30 text-center text-xs text-white/45">
        potiahni pre otočenie
      </p>
    </div>
  );
};

export default ArtworkOrbit;

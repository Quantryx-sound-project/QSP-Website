import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import scene from "@/assets/portfolio/scene-figure.webp";

export type Artwork = {
  src: string;
  title: string;
  /** Odkaz na vydanie. Keď chýba, tlačidlo sa nezobrazí. */
  spotify?: string;
  kind?: string;
};

/**
 * Artworky obiehajúce okolo postavy.
 *
 * Prečo nie CSS `transform-style: preserve-3d`: potrebujeme, aby zadná
 * polovica kruhu zapadla ZA postavu a predná ju prekryla. Pri preserve-3d
 * to závisí na tom, ako prehliadač zoradí pretínajúce sa roviny, a naprieč
 * prehliadačmi to nie je spoľahlivé. Polohu aj poradie vrstiev si preto
 * rátame sami – je to predvídateľné a podľa hĺbky vieme riadiť aj
 * zmenšenie, natočenie, rozostrenie a stmavnutie.
 *
 * Kruh je naklonený: čo je vzadu, je aj vyššie. Tým vznikne elipsa
 * namiesto úsečky a celé to pôsobí priestorovo.
 */
const ArtworkOrbit = ({ items }: { items: Artwork[] }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [spin, setSpin] = useState(0);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const spinRef = useRef(0);
  const dragging = useRef<{ x: number; spin: number; moved: boolean } | null>(null);

  // Otáčanie. Keď je niečo otvorené, kruh sa zastaví – inak by sa
  // pod detailom hýbalo pozadie a odvádzalo pozornosť.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (selected) return;

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!dragging.current) {
        spinRef.current = (spinRef.current + (dt * 0.008)) % 360;
        setSpin(spinRef.current);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  // Ťahaním sa dá kruh roztočiť ručne.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      dragging.current = { x: e.clientX, spin: spinRef.current, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const delta = (e.clientX - dragging.current.x) * 0.3;
      if (Math.abs(delta) > 3) dragging.current.moved = true;
      spinRef.current = dragging.current.spin + delta;
      setSpin(spinRef.current);
    };
    const onUp = () => {
      // Krátke potiahnutie nesmie zožrať klik na artwork.
      setTimeout(() => (dragging.current = null), 0);
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const open = useCallback((item: Artwork) => {
    if (dragging.current?.moved) return;
    setSelected(item);
  }, []);

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
      >
        <img src={scene} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />

        {items.map((item, index) => {
          const angle = ((index / items.length) * 360 + spin) * (Math.PI / 180);
          const x = Math.sin(angle);   // -1 vľavo … 1 vpravo
          const z = Math.cos(angle);   // 1 vpredu … -1 vzadu
          const depth = (z + 1) / 2;   // 0 vzadu … 1 vpredu

          return (
            <button
              key={item.src + index}
              type="button"
              onClick={() => open(item)}
              aria-label={`Zobraziť ${item.title}`}
              className="absolute left-1/2 top-1/2 w-[20%] rounded-md transition-[filter] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              style={{
                // Postava je vo vrstve 15; vpredu ide nad ňu, vzadu pod ňu.
                zIndex: z > 0 ? 20 + Math.round(z * 10) : 10 + Math.round(z * 10),
                transform: [
                  "translate(-50%, -50%)",
                  `translateX(${x * 34}%)`,
                  // Naklonený kruh: vzadu vyššie, vpredu nižšie.
                  `translateY(${-z * 14 - 4}%)`,
                  // Artworky sa natáčajú k stredu, ako pri skutočnom kolotoči.
                  `rotateY(${-x * 42}deg)`,
                  `scale(${0.5 + depth * 0.7})`,
                ].join(" "),
                filter: `blur(${((1 - depth) * 3).toFixed(2)}px) brightness(${(
                  0.4 + depth * 0.6
                ).toFixed(2)})`,
                perspective: "800px",
              }}
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                draggable={false}
                className="w-full rounded-md shadow-2xl ring-1 ring-white/15"
              />
            </button>
          );
        })}

        {/* Postava vyrezaná mäkkou maskou – clona medzi zadnou a prednou
            polovicou kruhu. Vrstva 15 leží presne medzi nimi. */}
        <img
          src={scene}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{
            zIndex: 15,
            maskImage: "radial-gradient(ellipse 20% 34% at 50% 62%, #000 58%, transparent 82%)",
            WebkitMaskImage: "radial-gradient(ellipse 20% 34% at 50% 62%, #000 58%, transparent 82%)",
          }}
        />

        {!selected && (
          <p className="pointer-events-none absolute bottom-3 left-0 right-0 z-30 text-center text-xs text-white/45">
            klikni na artwork · potiahni pre otočenie
          </p>
        )}

        {/* ---------- DETAIL ---------- */}
        {selected && (
          <div
            className="absolute inset-0 z-40 grid place-items-center bg-background/85 backdrop-blur-sm p-6 animate-in fade-in duration-200"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
          >
            <div
              className="relative w-full max-w-sm text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Zavrieť"
                className="absolute -right-2 -top-10 rounded-full p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={selected.src}
                alt={selected.title}
                className="w-full rounded-xl shadow-[0_0_60px_-12px_hsl(var(--primary)/0.6)] ring-1 ring-white/15"
              />
              <h3 className="mt-6 text-2xl font-bold">{selected.title}</h3>
              {selected.kind && (
                <p className="mt-1 text-sm text-muted-foreground">{selected.kind}</p>
              )}
              {selected.spotify && (
                <a
                  href={selected.spotify}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-block text-primary hover:underline"
                >
                  Play on Spotify
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtworkOrbit;

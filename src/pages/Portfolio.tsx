import { useEffect, useRef, useState } from "react";
import AppLayout from "@/components/AppLayout";
import ArtworkOrbit, { type Artwork } from "@/components/portfolio/ArtworkOrbit";
import scene from "@/assets/portfolio/scene-figure.webp";
import "./portfolio.css";

/* ---------------------------------------------------------------------------
   Assety sa načítavajú automaticky z priečinkov — stačí hodiť webp do
   príslušného priečinka v src/assets/portfolio/web/<sekcia>/ a objaví sa.
   Metadáta (názvy, odkazy) sú voliteľné; keď chýbajú, názov sa odvodí z názvu súboru.
--------------------------------------------------------------------------- */
const artFiles = import.meta.glob("../assets/portfolio/web/artworks/*.{webp,jpg,png}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const logo2dFiles = import.meta.glob("../assets/portfolio/web/logos-2d/*.{webp,png}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const logo3dFiles = import.meta.glob("../assets/portfolio/web/logos-3d/*.{webp,jpg,png}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const drawingFiles = import.meta.glob("../assets/portfolio/web/drawings/*.{webp,jpg,png}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const merchFiles = import.meta.glob("../assets/portfolio/web/product-designs/*.{webp,png}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

const base = (p: string) => p.split("/").pop()!.replace(/\.\w+$/, "");
const pretty = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Zoradí súbory podľa poradia v `order` (podľa basename), zvyšok pridá na koniec. */
function ordered(files: Record<string, string>, order: string[]): { b: string; url: string }[] {
  const map = new Map(Object.entries(files).map(([p, u]) => [base(p), u]));
  const out: { b: string; url: string }[] = [];
  order.forEach((b) => { if (map.has(b)) { out.push({ b, url: map.get(b)! }); map.delete(b); } });
  map.forEach((url, b) => out.push({ b, url }));
  return out;
}

/* ---- Artworks (covers) ---- */
const ART_META: Record<string, { title: string; kind: string; spotify?: string }> = {
  "alchemist": { title: "Alchemist", kind: "EP cover", spotify: "https://open.spotify.com/album/6XKqSGKDGdKjaDsUNvghoT" },
  "beyond-matter": { title: "Beyond Matter", kind: "Single", spotify: "https://open.spotify.com/track/4EYXz7bNZRYc9Oz25C0ngI" },
  "construct-of-mind": { title: "Construct of Mind", kind: "Single", spotify: "https://open.spotify.com/track/6LFzV7O9zRUJtBc0H1gTqP" },
  "cosmic-journey": { title: "Cosmic Journey", kind: "Single", spotify: "https://open.spotify.com/track/31ZatoKx39n6khRes5feOL" },
  "evolve": { title: "Evolve", kind: "Single", spotify: "https://open.spotify.com/track/4SeXKlXbxqNR4ONyj3siAk" },
  "explore": { title: "Explore", kind: "Album", spotify: "https://open.spotify.com/album/2Hw4rQtAkXk4Xme0XMhrRE" },
  "metagalactic-quest": { title: "Metagalactic Quest", kind: "Album", spotify: "https://open.spotify.com/album/65DGvlBdh9Ut71DaYIjDJA" },
  "new-level": { title: "New Level", kind: "Album", spotify: "https://open.spotify.com/album/52tK7knx0QH2foR1nYghku" },
  "blooming-within": { title: "Blooming Within", kind: "Single" },
  "chronon-particles": { title: "Chronon Particles", kind: "Single" },
  "energy-waves": { title: "Energy Waves", kind: "Single" },
  "lost-entrance": { title: "Lost Entrance", kind: "Single" },
};
const ART_ORDER = ["alchemist", "beyond-matter", "construct-of-mind", "cosmic-journey", "evolve", "explore", "metagalactic-quest", "new-level", "blooming-within", "chronon-particles", "energy-waves", "lost-entrance"];
const ARTWORKS: Artwork[] = ordered(artFiles, ART_ORDER).map(({ b, url }) => ({
  url, title: ART_META[b]?.title ?? pretty(b), kind: ART_META[b]?.kind, spotify: ART_META[b]?.spotify,
}));

/* ---- 2D logos ---- */
const LOGO2D_META: Record<string, { name: string; sub: string }> = {
  "quantryx-white": { name: "Quantryx", sub: "Brand mark" },
  "blaspheme": { name: "Blaspheme", sub: "Band logo" },
  "fredo": { name: "Fredo", sub: "Artist logo" },
  "exacta": { name: "Exacta", sub: "Graffiti" },
};
const LOGOS2D = ordered(logo2dFiles, ["quantryx-white", "blaspheme", "fredo", "exacta"]).map(({ b, url }) => ({
  url, name: LOGO2D_META[b]?.name ?? pretty(b), sub: LOGO2D_META[b]?.sub ?? "Logo",
}));

/* ---- 3D logos ---- */
const LOGO3D_META: Record<string, string> = {
  "qsp-3d-1": "QSP 3D · I", "qsp-3d-2": "QSP 3D · II", "qsp-3d-3": "QSP 3D · III", "blasphemy": "Blasphemy 3D",
};
const LOGOS3D = ordered(logo3dFiles, ["qsp-3d-1", "qsp-3d-2", "qsp-3d-3", "blasphemy"]).map(({ b, url }) => ({
  url, title: LOGO3D_META[b] ?? pretty(b),
}));

/* ---- Drawings ---- */
const DRAW_META: Record<string, string> = { "third-eye": "Third Eye", "meduza": "Meduza", "sketch-6": "Untitled VI", "sketch-7": "Untitled VII" };
const DRAWINGS = ordered(drawingFiles, ["third-eye", "meduza", "sketch-6", "sketch-7"]).map(({ b, url }) => ({
  url, title: DRAW_META[b] ?? pretty(b),
}));

/* ---- Merch ---- */
const MERCH_META: Record<string, string> = {
  "merch-hoodie-front": "Front", "merch-hoodie-side": "Side", "merch-hoodie-back": "Back", "merch-scarf": "Scarf",
};
const MERCH = ordered(merchFiles, ["merch-hoodie-front", "merch-hoodie-side", "merch-hoodie-back", "merch-scarf"]).map(({ b, url }) => ({
  url, angle: MERCH_META[b] ?? pretty(b),
}));

/* ---- Motion (self-hosted z public/portfolio/motion) ---- */
type Clip = { title: string; poster: string; loop?: string };
const MOTION: Clip[] = [
  { title: "Abstract Cube", poster: "/portfolio/motion/poster-0.webp", loop: "/portfolio/motion/loop-0.mp4" },
  { title: "Red Tech Eye", poster: "/portfolio/motion/poster-1.webp", loop: "/portfolio/motion/loop-1.mp4" },
  { title: "Organic Portal", poster: "/portfolio/motion/poster-2.webp", loop: "/portfolio/motion/loop-2.mp4" },
  { title: "Laser Boss Fight", poster: "/portfolio/motion/poster-3.webp", loop: "/portfolio/motion/loop-3.mp4" },
  { title: "K-Hop", poster: "/portfolio/motion/poster-4.webp", loop: "/portfolio/motion/loop-4.mp4" },
  { title: "Metagalactic Quest", poster: "/portfolio/motion/poster-5.webp", loop: "/portfolio/motion/loop-5.mp4" },
  { title: "Bluetech Ball", poster: "/portfolio/motion/poster-6.webp" },
  { title: "Phaseshift Fog", poster: "/portfolio/motion/poster-7.webp" },
  { title: "Organic Wireframe", poster: "/portfolio/motion/poster-8.webp" },
  { title: "Unknown World", poster: "/portfolio/motion/poster-9.webp" },
];

const SectionHead = ({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) => (
  <div className="sec-head">
    <span className="eyebrow">{eyebrow}</span>
    <h2 className="sec-title">{title}</h2>
    {note && <p className="sec-note">{note}</p>}
  </div>
);

/* ======================= 2D LOGOS — magnifier + codex ===================== */
const LogoWall = () => {
  const lensRef = useRef<HTMLDivElement>(null);
  const [codex, setCodex] = useState<{ url: string; name: string; sub: string } | null>(null);

  const move = (e: React.PointerEvent) => {
    const lens = lensRef.current;
    if (!lens) return;
    const tile = (e.target as HTMLElement).closest(".ltile");
    const img = tile?.querySelector("img") as HTMLImageElement | null;
    if (!img) { lens.classList.remove("on"); return; }
    const r = img.getBoundingClientRect();
    if (!r.width) { lens.classList.remove("on"); return; }
    const zoom = 2.4, half = 100;
    lens.style.backgroundImage = `url(${img.src})`;
    lens.style.backgroundSize = `${r.width * zoom}px ${r.height * zoom}px`;
    lens.style.backgroundPosition = `${half - (e.clientX - r.left) * zoom}px ${half - (e.clientY - r.top) * zoom}px`;
    lens.style.left = `${e.clientX - half}px`;
    lens.style.top = `${e.clientY - half}px`;
    lens.classList.add("on");
  };
  const leave = () => lensRef.current?.classList.remove("on");

  useEffect(() => {
    if (!codex) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCodex(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [codex]);

  return (
    <>
      <div className="loga" onPointerMove={move} onPointerLeave={leave}>
        <div className="loga-grid">
          {LOGOS2D.map((l) => (
            <button className="ltile" key={l.url} onClick={() => setCodex(l)}>
              <img src={l.url} alt={l.name} />
              <span className="sub">{l.sub}</span>
              <span className="zi">⌕</span>
            </button>
          ))}
        </div>
      </div>
      <div className="qx-lens" ref={lensRef} />
      {codex && (
        <div className="qx-codex open" onClick={(e) => { if (e.target === e.currentTarget) setCodex(null); }}>
          <div className="qx-codex-panel">
            <span className="qx-c tl" /><span className="qx-c tr" /><span className="qx-c bl" /><span className="qx-c br" />
            <button className="qx-codex-x" onClick={() => setCodex(null)} aria-label="Close">✕</button>
            <div className="qx-codex-eyebrow">Quantryx · Identity</div>
            <div className="qx-codex-fig"><img src={codex.url} alt={codex.name} /></div>
            <h3>{codex.name}</h3>
            <div className="k">{codex.sub}</div>
          </div>
        </div>
      )}
    </>
  );
};

/* ======================= 3D LOGOS — click-through ======================== */
const Carousel3D = () => {
  const [cur, setCur] = useState(0);
  const n = LOGOS3D.length;
  const at = (i: number) => {
    let off = ((i - cur) % n + n) % n;
    if (off > n / 2) off -= n;
    if (off === 0) return { transform: "translateX(0) scale(1)", opacity: 1, filter: "none", zIndex: 5 };
    if (off === 1) return { transform: "translateX(58%) scale(.8) rotateY(-22deg)", opacity: .5, filter: "blur(2px)", zIndex: 3 };
    if (off === -1) return { transform: "translateX(-58%) scale(.8) rotateY(22deg)", opacity: .5, filter: "blur(2px)", zIndex: 3 };
    return { transform: "scale(.6)", opacity: 0, zIndex: 1 };
  };
  return (
    <>
      <div className="carou">
        <button className="c-arrow prev" onClick={() => setCur((c) => (c - 1 + n) % n)} aria-label="Previous">‹</button>
        <button className="c-arrow next" onClick={() => setCur((c) => (c + 1) % n)} aria-label="Next">›</button>
        {LOGOS3D.map((o, i) => (
          <div className="c-item" key={o.url} style={at(i) as React.CSSProperties}>
            <img src={o.url} alt={o.title} />
          </div>
        ))}
      </div>
      <div className="c-cap">{LOGOS3D[cur]?.title}</div>
    </>
  );
};

/* ======================= MOTION — player + mini grid ===================== */
const MotionPlayer = () => {
  const [i, setI] = useState(0);
  const clip = MOTION[i];
  return (
    <div className="motion">
      <div className="player">
        {clip.loop ? (
          <video key={clip.loop} src={clip.loop} muted loop autoPlay playsInline />
        ) : (
          <img src={clip.poster} alt={clip.title} />
        )}
        <div className="pmeta"><span>{clip.title}</span><span className="full">{clip.loop ? "live loop" : "full version"}</span></div>
      </div>
      <div className="mini-grid">
        {MOTION.map((c, idx) => (
          <button className={`mini${idx === i ? " on" : ""}`} key={c.poster} onClick={() => setI(idx)}>
            <img src={c.poster} alt={c.title} loading="lazy" />
            {c.loop && <span className="dot" />}
            <span className="cap">{c.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ======================= DRAWINGS — pile + lightbox ====================== */
const Sketchbook = () => {
  const [top, setTop] = useState(-1);
  const [box, setBox] = useState<{ url: string; title: string } | null>(null);
  const rot = [-13, -4, 6, 15];
  const style = (i: number): React.CSSProperties => {
    const isTop = i === top;
    return {
      transform: `translate(${(i - (DRAWINGS.length - 1) / 2) * 62}px, ${Math.abs(i - (DRAWINGS.length - 1) / 2) * 10}px) rotate(${isTop ? 0 : rot[i % rot.length]}deg)${isTop ? " scale(1.08)" : ""}`,
      zIndex: isTop ? 50 : i + 1,
    };
  };
  return (
    <>
      <div className="sketch">
        {DRAWINGS.map((d, i) => (
          <button className="paper" key={d.url} style={style(i)}
            onClick={() => (top === i ? setBox(d) : setTop(i))}>
            <img src={d.url} alt={d.title} loading="lazy" />
            <span className="cap">{d.title}</span>
          </button>
        ))}
      </div>
      {box && (
        <div className="qx-detail open" onClick={(e) => { if (e.target === e.currentTarget) setBox(null); }}>
          <button className="qx-detail-x" onClick={() => setBox(null)} aria-label="Close">✕</button>
          <div className="qx-detail-card">
            <img src={box.url} alt={box.title} />
            <h3>{box.title}</h3>
            <div className="kind">Drawing</div>
          </div>
        </div>
      )}
    </>
  );
};

/* ======================= FUN — drag board =============================== */
const LABS = ["GLITCH", "404", "TRYX", "WIP", "LOL", "∆", "RAVE", "?!"];
const GRAD = [["#7c3aed", "#1ec8ee"], ["#e64bd0", "#7c3aed"], ["#1ec8ee", "#22d3ee"], ["#f59e0b", "#e64bd0"], ["#22c55e", "#1ec8ee"], ["#b79bff", "#e64bd0"], ["#06b6d4", "#3b82f6"], ["#e11d48", "#7c3aed"]];
const ScrapBoard = () => {
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{ el: HTMLElement; ox: number; oy: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    drag.current = { el, ox: e.clientX - r.left, oy: e.clientY - r.top };
    el.style.zIndex = "99"; el.setPointerCapture(e.pointerId); e.preventDefault();
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current, b = board.current;
    if (!d || !b) return;
    const rb = b.getBoundingClientRect();
    const x = Math.max(0, Math.min(rb.width - d.el.offsetWidth, e.clientX - rb.left - d.ox));
    const y = Math.max(0, Math.min(rb.height - d.el.offsetHeight, e.clientY - rb.top - d.oy));
    d.el.style.left = `${x}px`; d.el.style.top = `${y}px`; d.el.style.transform = "rotate(0deg)";
  };
  const onUp = () => { drag.current = null; };
  return (
    <div className="board" ref={board} onPointerMove={onMove} onPointerUp={onUp}>
      {LABS.map((l, i) => (
        <div className="sticker" key={l} onPointerDown={onDown}
          style={{
            left: `${20 + (i % 4) * 150}px`, top: `${26 + Math.floor(i / 4) * 160}px`,
            transform: `rotate(${(i * 37) % 40 - 20}deg)`,
            background: `linear-gradient(150deg, ${GRAD[i][0]}, ${GRAD[i][1]})`,
          }}>{l}</div>
      ))}
      <div className="board-tip">drag the stickers</div>
    </div>
  );
};

/* ======================= MERCH — angle switcher ========================= */
const MerchViewer = () => {
  const [i, setI] = useState(0);
  return (
    <div className="merch">
      <div className="garment">
        {MERCH.map((m, idx) => (
          <div className={`gv${idx === i ? " on" : ""}`} key={m.url}><img src={m.url} alt={m.angle} /></div>
        ))}
      </div>
      <div>
        <div className="angles">
          {MERCH.map((m, idx) => (
            <button className={`angle-btn${idx === i ? " on" : ""}`} key={m.angle} onClick={() => setI(idx)}>{m.angle}</button>
          ))}
        </div>
        <p className="sec-note">Quantryx apparel — hoodie from three angles plus an all-over print scarf.</p>
      </div>
    </div>
  );
};

/* ============================== PAGE ==================================== */
const Portfolio = () => {
  return (
    <AppLayout>
      <div className="qx">
        {/* Artworks orbit — immersive opener, no labels */}
        <section id="artworks">
          <ArtworkOrbit items={ARTWORKS} figure={scene} />
        </section>

        <section className="sec" id="logos2d">
          <div className="wrap">
            <SectionHead eyebrow="02 · 2D Logos & graffiti" title="Move the light"
              note="Lettering built to survive a shirt print, a stage banner and a 32-pixel avatar. Sweep your cursor and the logos magnify; click one to inspect it up close." />
            <LogoWall />
            <p className="tip">magnify · click a logo to inspect</p>
          </div>
        </section>

        <section className="sec" id="logos3d">
          <div className="wrap">
            <SectionHead eyebrow="03 · 3D Logos & renders" title="In three dimensions"
              note="Logos taken into 3D. For now a simple click-through — real rotatable 3D objects will land here later." />
            <Carousel3D />
          </div>
        </section>

        <section className="sec" id="motion">
          <div className="wrap">
            <SectionHead eyebrow="04 · Motion design" title="Choose what you want to see"
              note="The selected clip plays on the left; hover a preview on the right (it shows the title and grows), click and it plays. Full versions stay self-hosted and light." />
            <MotionPlayer />
          </div>
        </section>

        <section className="sec" id="drawings">
          <div className="wrap">
            <SectionHead eyebrow="05 · Drawings" title="The sketchbook"
              note="Where everything starts — by hand, on paper. Click a sheet to pull it to the top, click again to open it large." />
            <Sketchbook />
            <p className="tip">click a sheet</p>
          </div>
        </section>

        <section className="sec" id="fun">
          <div className="wrap">
            <SectionHead eyebrow="06 · Fun stuff" title="Scrap board"
              note="Experiments, memes, throwaways, happy accidents. Grab them and toss them around — no rules here." />
            <ScrapBoard />
          </div>
        </section>

        <section className="sec" id="merch">
          <div className="wrap">
            <SectionHead eyebrow="07 · Product designs" title="Wearable"
              note="Quantryx apparel — turn it around before you decide. Switch the angle and the piece rotates to face you." />
            <MerchViewer />
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Portfolio;

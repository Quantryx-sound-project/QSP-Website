import { useEffect, useState } from "react";

export type Artwork = { url: string; title: string; kind?: string; spotify?: string };

/**
 * Artworky obiehajúce v 3D kruhu okolo kozmickej scény — presne ako pôvodný
 * CSS carousel (perspective + rotateX + translateZ), točí sa sám.
 * Štýly sú v src/pages/portfolio.css (trieda .banner / .slider / .item).
 */
const ArtworkOrbit = ({ items, figure }: { items: Artwork[]; figure: string }) => {
  const [sel, setSel] = useState<Artwork | null>(null);

  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel]);

  return (
    <div className="banner">
      <div className="banner-bg" style={{ backgroundImage: `url(${figure})` }} />
      <div className="slider" style={{ ["--n" as string]: items.length } as React.CSSProperties}>
        {items.map((it, i) => (
          <div className="item" key={it.url + i} style={{ ["--i" as string]: i + 1 } as React.CSSProperties}>
            <img src={it.url} alt={it.title} draggable={false} loading="lazy" onClick={() => setSel(it)} />
          </div>
        ))}
      </div>
      <div className="orbit-hint">it spins on its own · click a cover to open it</div>

      {sel && (
        <div
          className="qx-detail open"
          onClick={(e) => { if (e.target === e.currentTarget) setSel(null); }}
        >
          <button className="qx-detail-x" onClick={() => setSel(null)} aria-label="Close">✕</button>
          <div className="qx-detail-card">
            <img src={sel.url} alt={sel.title} />
            <h3>{sel.title}</h3>
            {sel.kind && <div className="kind">{sel.kind}</div>}
            {sel.spotify && (
              <a className="qx-spotify" href={sel.spotify} target="_blank" rel="noreferrer noopener">▶ Play on Spotify</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkOrbit;

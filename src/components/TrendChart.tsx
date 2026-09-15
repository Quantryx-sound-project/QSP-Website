import { useMemo, useState } from "react";

export type TrendPoint = { day: string; visitors: number; page_views: number };

/**
 * Denný priebeh návštevnosti.
 *
 * Dve série na jednej osi (obe sú počty, takže druhá os by klamala).
 * Farby sú z našich tokenov – fialová --primary a cyan --neon stlmená
 * do tmavého pásma, aby ich rozoznal aj farboslepý človek
 * (overené: ΔE 17,2 pri deutánii, cieľ je 8).
 */
const SERIES = [
  { key: "visitors" as const, label: "Návštevníci", color: "#7C3BED" },
  { key: "page_views" as const, label: "Zobrazenia", color: "#1E9BB5" },
];

const W = 720;
const H = 240;
const PAD = { top: 16, right: 56, bottom: 28, left: 40 };

const TrendChart = ({ data }: { data: TrendPoint[] }) => {
  const [hover, setHover] = useState<number | null>(null);

  const { points, max, xOf, yOf } = useMemo(() => {
    const maxValue = Math.max(1, ...data.flatMap((d) => [d.visitors, d.page_views]));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / maxValue) * innerH;
    return { points: data, max: maxValue, xOf: x, yOf: y };
  }, [data]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Zatiaľ žiadne dáta.</p>;
  }

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const active = hover !== null ? points[hover] : null;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const innerW = W - PAD.left - PAD.right;
    const ratio = (relX - PAD.left) / (innerW || 1);
    const index = Math.round(ratio * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, index)));
  };

  const shortDay = (day: string) => day.slice(5).replace("-", ".");

  return (
    <div className="relative">
      {/* Legenda – identita nikdy nesmie stáť len na farbe */}
      <div className="mb-3 flex flex-wrap gap-4">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Denný priebeh návštevnosti"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Mriežka – zámerne nevýrazná */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yOf(t)}
              y2={yOf(t)}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={yOf(t) + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              style={{ fontSize: 11 }}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Popisky dní – len prvý, stredný a posledný, nech sa neprekrývajú */}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((i, idx, arr) => arr.indexOf(i) === idx && i >= 0)
          .map((i) => (
            <text
              key={i}
              x={xOf(i)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className="fill-muted-foreground"
              style={{ fontSize: 11 }}
            >
              {shortDay(points[i].day)}
            </text>
          ))}

        {/* Zvislý zameriavač */}
        {hover !== null && (
          <line
            x1={xOf(hover)}
            x2={xOf(hover)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {SERIES.map((s) => {
          const d = points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(p[s.key])}`)
            .join(" ");
          const last = points[points.length - 1];
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              {/* Priamy popisok na konci krivky */}
              <text
                x={W - PAD.right + 8}
                y={yOf(last[s.key]) + 4}
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                {last[s.key]}
              </text>
              {hover !== null && (
                <circle
                  cx={xOf(hover)}
                  cy={yOf(points[hover][s.key])}
                  r={5}
                  fill={s.color}
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-8 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${Math.min(80, (xOf(hover!) / W) * 100)}%`,
          }}
        >
          <div className="mb-1 font-medium">{active.day}</div>
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}: <span className="tabular-nums text-foreground">{active[s.key]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendChart;

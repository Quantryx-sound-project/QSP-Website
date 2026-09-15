import { useCallback, useEffect, useRef, useState } from "react";

const MIN_WIDTH = 220;
const MAX_WIDTH = 480;
const DESKTOP_QUERY = "(min-width: 1024px)";

const matchesDesktop = () =>
  typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;

/**
 * Bočné menu.
 * - Na počítači (>= 1024px): odtláča obsah, dá sa ťahaním zmeniť šírka.
 * - Na mobile/tablete: zavreté po načítaní, otvára sa ako prekrytie cez obsah.
 *
 * `open` / `setOpen`: viditeľnosť
 * `width`: šírka v px (len desktop)
 * `startResize`: onMouseDown pre ťahadlo
 * `isDesktop`: true, ak je okno širšie ako 1024px
 */
export function useSidebar(defaultOpen = true, defaultWidth = 288) {
  const [isDesktop, setIsDesktop] = useState(matchesDesktop);
  const [open, setOpen] = useState(() => defaultOpen && matchesDesktop());
  const [width, setWidth] = useState(defaultWidth);
  const resizing = useRef(false);

  // Reaguj na zmenu šírky okna (otočenie telefónu, zmena veľkosti okna).
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      setOpen(defaultOpen && e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [defaultOpen]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX)));
    };
    const stop = () => {
      resizing.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
    };
  }, []);

  // Na mobile zavri menu klávesou Escape.
  useEffect(() => {
    if (!open || isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isDesktop]);

  return { open, setOpen, width, startResize, isDesktop };
}

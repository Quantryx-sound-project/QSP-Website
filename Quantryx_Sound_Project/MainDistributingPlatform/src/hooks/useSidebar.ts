import { useCallback, useEffect, useRef, useState } from "react";

const MIN_WIDTH = 220;
const MAX_WIDTH = 480;

/**
 * Pushing, manually resizable sidebar.
 * - `open` / `setOpen`: toggle visibility (content makes room, no overlay).
 * - `width`: current sidebar width in px (drag the handle to resize).
 * - `startResize`: onMouseDown handler for the drag handle.
 */
export function useSidebar(defaultOpen = true, defaultWidth = 288) {
  const [open, setOpen] = useState(defaultOpen);
  const [width, setWidth] = useState(defaultWidth);
  const resizing = useRef(false);

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

  return { open, setOpen, width, startResize };
}

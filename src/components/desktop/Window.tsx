import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { Minus, Square, X } from "lucide-react";

interface Props {
  title: string;
  initial?: { x: number; y: number; w: number; h: number };
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
  children: ReactNode;
}

export const Window = ({ title, initial, onClose, onFocus, zIndex = 10, children }: Props) => {
  const [pos, setPos] = useState({ x: initial?.x ?? 80, y: initial?.y ?? 60 });
  const [size, setSize] = useState({ w: initial?.w ?? 980, h: initial?.h ?? 640 });
  const [maximized, setMaximized] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  useEffect(() => {
    const move = (e: globalThis.PointerEvent) => {
      if (dragRef.current && !maximized) {
        setPos({
          x: e.clientX - dragRef.current.ox,
          y: Math.max(0, e.clientY - dragRef.current.oy),
        });
      }
      if (resizeRef.current) {
        setSize({
          w: Math.max(360, resizeRef.current.sw + (e.clientX - resizeRef.current.sx)),
          h: Math.max(280, resizeRef.current.sh + (e.clientY - resizeRef.current.sy)),
        });
      }
    };
    const up = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [maximized]);

  const startDrag = (e: PointerEvent) => {
    onFocus?.();
    if (maximized) return;
    dragRef.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
  };

  const startResize = (e: PointerEvent) => {
    e.stopPropagation();
    onFocus?.();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, sw: size.w, sh: size.h };
  };

  const style = maximized
    ? { left: 0, top: 0, width: "100vw", height: "calc(100vh - 36px)", zIndex }
    : { left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex };

  return (
    <div className="os-window absolute flex flex-col overflow-hidden" style={style} onMouseDown={onFocus}>
      <div
        className="os-titlebar flex h-7 select-none items-center justify-between px-2"
        onPointerDown={startDrag}
        onDoubleClick={() => setMaximized((m) => !m)}
      >
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 rounded border border-window-border bg-window px-2.5 py-0.5 text-[11px] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {title}
        </div>
        <div className="flex flex-1 items-center justify-end gap-1">
          <button className="os-btn-square" onClick={(e) => e.stopPropagation()} aria-label="Minimize">
            <Minus className="h-2.5 w-2.5" />
          </button>
          <button
            className="os-btn-square"
            onClick={(e) => {
              e.stopPropagation();
              setMaximized((m) => !m);
            }}
            aria-label="Maximize"
          >
            <Square className="h-2 w-2" />
          </button>
          <button
            className="os-btn-square hover:!bg-destructive hover:!text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden bg-window">{children}</div>
      {!maximized && (
        <div
          className="absolute bottom-0 right-0 h-3.5 w-3.5 cursor-nwse-resize"
          onPointerDown={startResize}
          style={{
            background:
              "linear-gradient(135deg, transparent 0 40%, hsl(var(--window-border)) 40% 50%, transparent 50% 60%, hsl(var(--window-border)) 60% 70%, transparent 70%)",
          }}
        />
      )}
    </div>
  );
};
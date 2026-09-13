import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";

const MIN_SCALE = 0.45;
const MAX_SCALE = 4;
const ZOOM_STEP = 1.2;

export type DiagramTransform = {
  scale: number;
  tx: number;
  ty: number;
};

export function useDiagramTransform(initialScale = 1) {
  const [transform, setTransform] = useState<DiagramTransform>({
    scale: initialScale,
    tx: 0,
    ty: 0,
  });

  const zoomBy = useCallback((factor: number, originX?: number, originY?: number) => {
    setTransform((prev) => {
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, prev.scale * factor),
      );
      if (nextScale === prev.scale) return prev;
      if (originX == null || originY == null) {
        return { ...prev, scale: nextScale };
      }
      const ratio = nextScale / prev.scale;
      return {
        scale: nextScale,
        tx: originX - (originX - prev.tx) * ratio,
        ty: originY - (originY - prev.ty) * ratio,
      };
    });
  }, []);

  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / ZOOM_STEP), [zoomBy]);
  const fit = useCallback(() => {
    setTransform({ scale: initialScale, tx: 0, ty: 0 });
  }, [initialScale]);

  const resetForView = useCallback((scale = initialScale) => {
    setTransform({ scale, tx: 0, ty: 0 });
  }, [initialScale]);

  return {
    transform,
    setTransform,
    zoomBy,
    zoomIn,
    zoomOut,
    fit,
    resetForView,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  };
}

type DiagramViewportProps = {
  children: ReactNode;
  transform: DiagramTransform;
  onTransformChange: (
    next: DiagramTransform | ((prev: DiagramTransform) => DiagramTransform),
  ) => void;
  onZoomBy: (factor: number, originX?: number, originY?: number) => void;
  className?: string;
  /** When true, content is centered in the viewport at scale 1 offsets. */
  centerContent?: boolean;
};

export function DiagramViewport({
  children,
  transform,
  onTransformChange,
  onZoomBy,
  className = "",
  centerContent = true,
}: DiagramViewportProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const suppressClick = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onPointerUp() {
      dragging.current = false;
    }
    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, []);

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const box = rootRef.current?.getBoundingClientRect();
    if (!box) return;
    const originX = event.clientX - box.left;
    const originY = event.clientY - box.top;
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    onZoomBy(factor, originX, originY);
  }

  return (
    <div
      ref={rootRef}
      className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}
      onWheel={handleWheel}
      onPointerDown={(event) => {
        if (event.button !== 0 && event.button !== 1) return;
        dragging.current = true;
        moved.current = false;
        suppressClick.current = false;
        last.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const dx = event.clientX - last.current.x;
        const dy = event.clientY - last.current.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
        last.current = { x: event.clientX, y: event.clientY };
        if (!moved.current) return;
        onTransformChange((prev) => ({
          ...prev,
          tx: prev.tx + dx,
          ty: prev.ty + dy,
        }));
      }}
      onPointerUp={() => {
        if (moved.current) suppressClick.current = true;
        dragging.current = false;
      }}
      onPointerLeave={() => {
        dragging.current = false;
      }}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      style={{ cursor: dragging.current ? "grabbing" : "grab" }}
    >
      <div
        className={
          centerContent
            ? "absolute left-1/2 top-1/2 origin-center will-change-transform"
            : "absolute left-0 top-0 origin-top-left will-change-transform"
        }
        style={{
          transform: centerContent
            ? `translate(calc(-50% + ${transform.tx}px), calc(-50% + ${transform.ty}px)) scale(${transform.scale})`
            : `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef } from "react";

const SOURCE = "/windfarm.jpg";
const DARKEN_SHADOW = 0.36;
const DARKEN_HIGHLIGHT = 0.58;
const BLOB_RADIUS = 64;
const RAMP =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const RAMP_LAST = RAMP.length - 1;

type Cell = {
  luma: number;
  r: number;
  g: number;
  b: number;
};

type Grid = {
  cells: Cell[];
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  font: string;
  dpr: number;
};

type Palette = {
  bg: [number, number, number];
  fg: [number, number, number];
  accent: [number, number, number];
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function luma(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function coverCrop(
  imgW: number,
  imgH: number,
  cols: number,
  rows: number,
  biasX = 0.68,
  biasY = 0.22,
) {
  const imageRatio = imgW / imgH;
  const canvasRatio = cols / rows;
  if (imageRatio > canvasRatio) {
    const sw = imgH * canvasRatio;
    return { sx: (imgW - sw) * biasX, sy: 0, sw, sh: imgH };
  }
  const sh = imgW / canvasRatio;
  return { sx: 0, sy: (imgH - sh) * biasY, sw: imgW, sh };
}

function percentile(sorted: number[], p: number) {
  const i = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * p)),
  );
  return sorted[i];
}

function parseHexRgb(value: string, fallback: [number, number, number]) {
  const hex = value.trim();
  if (!hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) {
    return fallback;
  }
  if (hex.length === 4) {
    return [
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
      parseInt(hex[3] + hex[3], 16),
    ] as [number, number, number];
  }
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ] as [number, number, number];
}

/** Auth always sits on Alcaster dark page with orange accent. */
function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  return {
    bg: parseHexRgb(styles.getPropertyValue("--alcaster-page"), [1, 6, 9]),
    fg: parseHexRgb(styles.getPropertyValue("--alcaster-fg"), [255, 255, 255]),
    accent: parseHexRgb(
      styles.getPropertyValue("--alcaster-accent"),
      [230, 116, 10],
    ),
  };
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function cellChar(cell: Cell) {
  const idx = Math.min(RAMP_LAST, Math.floor(cell.luma * RAMP_LAST + 0.0001));
  return RAMP[idx];
}

function cellFill(cell: Cell, palette: Palette, hover: boolean) {
  const { r, g, b, luma: t } = cell;
  const [ar, ag, ab] = palette.accent;

  // Keep sunset photo color, darkened for Alcaster dark UI.
  const shade = hover
    ? 1.08 + t * 0.18
    : DARKEN_SHADOW + t * (DARKEN_HIGHLIGHT - DARKEN_SHADOW);

  let outR = r * shade;
  let outG = g * shade;
  let outB = b * shade;

  // Soft Alcaster orange lift on hover / warm midtones.
  if (hover) {
    outR = mix(outR, ar, 0.22);
    outG = mix(outG, ag, 0.14);
    outB = mix(outB, ab, 0.06);
  } else {
    outR = mix(outR, ar, 0.04 + t * 0.05);
    outG = mix(outG, ag, 0.02 + t * 0.03);
  }

  return `rgb(${Math.min(255, Math.round(outR))} ${Math.min(255, Math.round(outG))} ${Math.min(255, Math.round(outB))})`;
}

function sampleCells(
  img: HTMLImageElement,
  cols: number,
  rows: number,
): Cell[] {
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.imageSmoothingEnabled = true;
  const crop = coverCrop(img.width, img.height, cols, rows);
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const cells: Cell[] = new Array(cols * rows);
  const lumas: number[] = new Array(cells.length);

  for (let i = 0; i < cells.length; i += 1) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const l = luma(r, g, b);
    lumas[i] = l;
    // Slightly cool-suppress so Alcaster orange accent reads cleaner.
    const cool = Math.max(0, b - Math.max(r, g));
    cells[i] = {
      luma: l,
      r,
      g,
      b: Math.max(0, b - cool * 0.55),
    };
  }

  const sorted = lumas.slice().sort((a, b) => a - b);
  const lo = percentile(sorted, 0.08);
  const hi = percentile(sorted, 0.94);
  const range = Math.max(0.12, hi - lo);

  for (let i = 0; i < cells.length; i += 1) {
    let t = (lumas[i] - lo) / range;
    t = Math.min(1, Math.max(0, t));
    t = Math.pow(t, 0.72);
    cells[i].luma = t;
  }

  return cells;
}

function paintBase(grid: Grid, palette: Palette) {
  const { cells, cols, rows, cellW, cellH, font, dpr } = grid;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cols * cellW));
  canvas.height = Math.max(1, Math.round(rows * cellH));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const [br, bg, bb] = palette.bg;
  ctx.scale(dpr, dpr);
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = `rgb(${br} ${bg} ${bb})`;
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  const cssCellW = cellW / dpr;
  const cssCellH = cellH / dpr;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cell = cells[y * cols + x];
      if (!cell) continue;
      const char = cellChar(cell);
      if (char === " ") continue;
      ctx.fillStyle = cellFill(cell, palette, false);
      ctx.fillText(char, x * cssCellW, y * cssCellH);
    }
  }

  return canvas;
}

export function AsciiWindscape() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<Grid | null>(null);
  const introRef = useRef(0);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const paletteRef = useRef<Palette | null>(null);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    radius: 0,
    targetRadius: 0,
  });

  const renderFrame = useCallback((time = 0) => {
    const canvas = canvasRef.current;
    const base = baseRef.current;
    const grid = gridRef.current;
    if (!canvas || !base || !grid) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h, dpr } = sizeRef.current;
    const intro = introRef.current;
    const pointer = pointerRef.current;

    pointer.x += (pointer.tx - pointer.x) * 0.34;
    pointer.y += (pointer.ty - pointer.y) * 0.34;
    pointer.radius += (pointer.targetRadius - pointer.radius) * 0.28;

    ctx.clearRect(0, 0, w, h);
    const revealRows = Math.ceil(grid.rows * Math.min(1, intro * 1.08));
    const revealH = Math.min(h, revealRows * grid.cellH + 1);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, revealH);
    ctx.clip();
    ctx.globalAlpha = Math.min(1, intro * 1.4);
    ctx.drawImage(base, 0, 0);

    const palette = paletteRef.current;
    if (pointer.radius > 0.6 && palette) {
      const cssCellW = grid.cellW / dpr;
      const cssCellH = grid.cellH / dpr;
      const radius = pointer.radius * dpr;
      const t = time / 1000;

      const colStart = Math.max(
        0,
        Math.floor((pointer.x - radius * 1.35) / grid.cellW),
      );
      const colEnd = Math.min(
        grid.cols - 1,
        Math.ceil((pointer.x + radius * 1.35) / grid.cellW),
      );
      const rowStart = Math.max(
        0,
        Math.floor((pointer.y - radius * 1.35) / grid.cellH),
      );
      const rowEnd = Math.min(
        grid.rows - 1,
        Math.ceil((pointer.y + radius * 1.35) / grid.cellH),
      );

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.font = grid.font;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;

      for (let row = rowStart; row <= rowEnd; row += 1) {
        for (let col = colStart; col <= colEnd; col += 1) {
          const cell = grid.cells[row * grid.cols + col];
          if (!cell) continue;
          const char = cellChar(cell);
          if (char === " ") continue;

          const cx = (col + 0.5) * grid.cellW;
          const cy = (row + 0.5) * grid.cellH;
          const dist = Math.hypot(cx - pointer.x, cy - pointer.y);
          const n = hash2(col, row);
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + n * 6.28318);
          const localRadius = radius * (0.62 + n * 0.48 + pulse * 0.1);
          if (dist > localRadius) continue;

          ctx.fillStyle = cellFill(cell, palette, true);
          ctx.fillText(char, col * cssCellW, row * cssCellH);
        }
      }
      ctx.restore();
    }

    ctx.restore();

    const moving =
      intro < 1 ||
      pointer.radius > 0.5 ||
      Math.abs(pointer.targetRadius - pointer.radius) > 0.15 ||
      Math.abs(pointer.tx - pointer.x) > 0.15 ||
      Math.abs(pointer.ty - pointer.y) > 0.15;

    if (moving) {
      rafRef.current = requestAnimationFrame(renderFrame);
    }
  }, []);

  const build = useCallback(
    async (img: HTMLImageElement) => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;

      const cssW = Math.max(1, wrap.clientWidth || window.innerWidth);
      const cssH = Math.max(1, wrap.clientHeight || window.innerHeight);
      if (cssW < 8 || cssH < 8) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(cssW * dpr);
      const height = Math.round(cssH * dpr);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      sizeRef.current = { w: width, h: height, dpr };

      const cols = Math.round(Math.min(180, Math.max(80, cssW / 5.1)));
      const cellW = width / cols;
      const fontSize = Math.max(7, (cellW / dpr) * 1.24);
      const cellH = fontSize * dpr * 0.88;
      const rows = Math.max(28, Math.floor(height / cellH));

      const grid: Grid = {
        cells: sampleCells(img, cols, rows),
        cols,
        rows,
        cellW,
        cellH,
        font: `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`,
        dpr,
      };
      gridRef.current = grid;
      paletteRef.current = readPalette();
      baseRef.current = paintBase(grid, paletteRef.current);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(renderFrame);
    },
    [renderFrame],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let cancelled = false;
    let img: HTMLImageElement | null = null;
    let resizing = false;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let started = false;
    introRef.current = 0;
    const playIntro = () => {
      if (started || cancelled) return;
      started = true;
      if (reduced) {
        introRef.current = 1;
        renderFrame();
        return;
      }
      introRef.current = 0;
      const start = performance.now();
      const intro = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - start) / 1100);
        introRef.current = 1 - Math.pow(1 - t, 3);
        renderFrame(now);
        if (t < 1) requestAnimationFrame(intro);
      };
      requestAnimationFrame(intro);
    };

    const setup = async () => {
      try {
        img = await loadImage(SOURCE);
      } catch {
        return;
      }
      if (cancelled) return;
      await build(img);
      if (cancelled) return;
      playIntro();
    };

    void setup();

    const ro = new ResizeObserver(() => {
      if (!img || resizing) return;
      resizing = true;
      requestAnimationFrame(() => {
        resizing = false;
        if (cancelled || !img) return;
        void build(img);
      });
    });
    ro.observe(wrap);

    const onPointerMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const dpr = sizeRef.current.dpr;
      pointerRef.current.tx = (event.clientX - rect.left) * dpr;
      pointerRef.current.ty = (event.clientY - rect.top) * dpr;
      pointerRef.current.targetRadius = BLOB_RADIUS;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(renderFrame);
    };

    const onPointerLeave = () => {
      pointerRef.current.targetRadius = 0;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(renderFrame);
    };

    const onThemeChange = () => {
      const grid = gridRef.current;
      if (!grid) return;
      paletteRef.current = readPalette();
      baseRef.current = paintBase(grid, paletteRef.current);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(renderFrame);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("themechange", onThemeChange);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
      window.removeEventListener("themechange", onThemeChange);
    };
  }, [build, renderFrame]);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

import { useEffect, useRef } from "react";

const SOURCE = "/windfarm.jpg";
const BG = "#010609";
const DARKEN_SHADOW = 0.26;
const DARKEN_HIGHLIGHT = 0.56;
const BLOB_RADIUS = 20;
const RAMP =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const RAMP_LAST = RAMP.length - 1;

type Cell = {
  luma: number;
  r: number;
  g: number;
  b: number;
  mill?: boolean;
};

type Turbine = {
  x: number;
  hubY: number;
  groundY: number;
  blade: number;
  phase: number;
  speed: number;
};

type Crop = { sx: number; sy: number; sw: number; sh: number };

type Grid = {
  cells: Cell[];
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  font: string;
  dpr: number;
};

const FALLBACK_TURBINES: Turbine[] = [
  { x: 0.72, hubY: 0.32, groundY: 0.84, blade: 0.34, phase: 0.5, speed: 0.28 },
  { x: 0.33, hubY: 0.49, groundY: 0.81, blade: 0.22, phase: 1.4, speed: 0.36 },
  { x: 0.17, hubY: 0.6, groundY: 0.81, blade: 0.13, phase: 2.1, speed: 0.42 },
  { x: 0.47, hubY: 0.63, groundY: 0.81, blade: 0.1, phase: 0.7, speed: 0.44 },
  { x: 0.58, hubY: 0.64, groundY: 0.82, blade: 0.09, phase: 1.9, speed: 0.4 },
  { x: 0.07, hubY: 0.66, groundY: 0.82, blade: 0.08, phase: 1.1, speed: 0.46 },
  { x: 0.25, hubY: 0.66, groundY: 0.82, blade: 0.07, phase: 2.8, speed: 0.45 },
  { x: 0.4, hubY: 0.67, groundY: 0.82, blade: 0.07, phase: 1.6, speed: 0.43 },
];

const PHOTO_RIGHT_MILL: Turbine = {
  x: 0.86,
  hubY: 0.3,
  groundY: 0.84,
  blade: 0.45,
  phase: 0,
  speed: 0,
};

const BLACK_CELL: Cell = { luma: 0.04, r: 8, g: 8, b: 8, mill: true };
const BLADE_CELL: Cell = { luma: 0.08, r: 44, g: 42, b: 40, mill: true };

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function luma(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function percentile(sorted: number[], p: number) {
  const i = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * p)),
  );
  return sorted[i];
}

function cellChar(cell: Cell, hover = false) {
  const print = cell.mill ? 0.9 : Math.pow(cell.luma, 0.74);
  let idx = Math.min(RAMP_LAST, Math.floor(print * RAMP_LAST + 0.0001));
  if (hover) idx = Math.min(RAMP_LAST, idx + 8);
  return RAMP[idx];
}

function bladeGlyph(angle: number) {
  const sector = ((angle % Math.PI) + Math.PI) % Math.PI;
  const idx = Math.min(3, Math.floor((sector / Math.PI) * 4));
  return "-\\|/"[idx];
}

function cellFill(cell: Cell, hover: boolean) {
  if (cell.mill) {
    const ink = hover ? Math.max(cell.r + 18, 48) : Math.max(cell.r, 22);
    return `rgb(${ink} ${ink} ${ink})`;
  }

  const t = cell.luma;
  const shade =
    DARKEN_SHADOW +
    Math.min(t, 0.82) * (DARKEN_HIGHLIGHT - DARKEN_SHADOW);
  let r = cell.r * shade;
  let g = cell.g * shade;
  let b = Math.min(cell.b, Math.max(cell.r, cell.g) + 6) * shade;
  if (hover) {
    r = Math.min(255, r * 1.62 + 40);
    g = Math.min(255, g * 1.36 + 22);
    b = Math.min(255, b * 1.1 + 8);
  }
  return `rgb(${Math.min(255, Math.round(r))} ${Math.min(255, Math.round(g))} ${Math.min(255, Math.round(b))})`;
}

function coverCrop(
  imgW: number,
  imgH: number,
  cols: number,
  rows: number,
  biasX = 0.9,
  biasY = 0.22,
): Crop {
  const imageRatio = imgW / imgH;
  const canvasRatio = cols / rows;
  if (imageRatio > canvasRatio) {
    const sw = imgH * canvasRatio;
    return { sx: (imgW - sw) * biasX, sy: 0, sw, sh: imgH };
  }
  const sh = imgW / canvasRatio;
  return { sx: 0, sy: (imgH - sh) * biasY, sw: imgW, sh };
}

function sampleCells(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  crop: Crop,
): Cell[] {
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.imageSmoothingEnabled = true;
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
    cells[i] = { luma: l, r, g, b };
  }

  const sorted = lumas.slice().sort((a, b) => a - b);
  const lo = percentile(sorted, 0.08);
  const hi = percentile(sorted, 0.94);
  const range = Math.max(0.12, hi - lo);

  for (let i = 0; i < cells.length; i += 1) {
    let t = (lumas[i] - lo) / range;
    t = clamp(t);
    t = Math.pow(t, 0.72);
    cells[i].luma = t;
    const cool = Math.max(0, cells[i].b - Math.max(cells[i].r, cells[i].g));
    cells[i].b = Math.max(0, cells[i].b - cool * 0.7);
  }

  return cells;
}

function detectTurbines(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Turbine[] {
  const lum = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    lum[i] = luma(data[o], data[o + 1], data[o + 2]);
  }

  const rowMean = new Float32Array(height);
  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let x = 0; x < width; x += 1) sum += lum[y * width + x];
    rowMean[y] = sum / width;
  }

  let horizon = Math.floor(height * 0.82);
  let best = -Infinity;
  for (let y = Math.floor(height * 0.58); y < Math.floor(height * 0.94); y += 1) {
    const gradient =
      rowMean[Math.max(0, y - 6)] - rowMean[Math.min(height - 1, y + 6)];
    if (gradient > best) {
      best = gradient;
      horizon = y;
    }
  }

  const skyY = Math.max(0, horizon - Math.floor(height * 0.08));
  const skyThresh = rowMean[skyY] * 0.58;
  const heights = new Float32Array(width);
  const tops = new Int16Array(width);

  for (let x = 0; x < width; x += 1) {
    let y = horizon - 1;
    let dark = 0;
    while (y > 4 && lum[y * width + x] < skyThresh) {
      dark += 1;
      y -= 1;
    }
    heights[x] = dark;
    tops[x] = y + 1;
  }

  const peaks: Turbine[] = [];
  const minHeight = height * 0.045;
  for (let x = 3; x < width - 3; x += 1) {
    const h = heights[x];
    if (h < minHeight) continue;
    if (
      h >= heights[x - 1] &&
      h >= heights[x + 1] &&
      h >= heights[x - 2] &&
      h >= heights[x + 2]
    ) {
      const mast = h / height;
      peaks.push({
        x: x / width,
        hubY: tops[x] / height,
        groundY: horizon / height,
        blade: mast * 0.84,
        phase: x * 0.13,
        speed: 0.16 + (1 - Math.min(1, mast / 0.5)) * 0.2,
      });
    }
  }

  peaks.sort((a, b) => a.x - b.x);
  const merged: Turbine[] = [];
  for (const peak of peaks) {
    const prev = merged[merged.length - 1];
    if (prev && Math.abs(peak.x - prev.x) < 0.03) {
      if (peak.blade > prev.blade) merged[merged.length - 1] = peak;
    } else {
      merged.push(peak);
    }
  }

  return FALLBACK_TURBINES.map((fallback, index) => {
    if (index === 0) return fallback;
    const match = merged
      .filter(
        (peak) =>
          peak.x < 0.78 &&
          Math.abs(peak.x - fallback.x) < 0.05 &&
          Math.abs(peak.hubY - fallback.hubY) < 0.14,
      )
      .sort((a, b) => b.blade - a.blade)[0];
    return match
      ? { ...match, phase: fallback.phase, speed: fallback.speed }
      : fallback;
  });
}

function inTower(
  x: number,
  y: number,
  turbine: Turbine,
  aspect: number,
  scale = 1,
) {
  const dx = Math.abs(x - turbine.x) * aspect;
  const half = (0.0035 + (turbine.groundY - turbine.hubY) * 0.016) * scale;
  return y >= turbine.hubY - 0.02 && y <= turbine.groundY + 0.012 && dx < half;
}

function imageUV(
  col: number,
  row: number,
  cols: number,
  rows: number,
  crop: Crop,
  imgW: number,
  imgH: number,
) {
  return {
    x: (crop.sx + ((col + 0.5) / cols) * crop.sw) / imgW,
    y: (crop.sy + ((row + 0.5) / rows) * crop.sh) / imgH,
  };
}

function uvToCell(
  x: number,
  y: number,
  cols: number,
  rows: number,
  crop: Crop,
  imgW: number,
  imgH: number,
) {
  return {
    col: ((x * imgW - crop.sx) / crop.sw) * cols,
    row: ((y * imgH - crop.sy) / crop.sh) * rows,
  };
}

function findRightPhotoMill(
  cells: Cell[],
  cols: number,
  rows: number,
  crop: Crop,
  imgW: number,
  imgH: number,
): Turbine | null {
  const startCol = Math.floor(cols * 0.78);
  let bestCol = -1;
  let bestH = 0;
  let top = 0;
  for (let col = startCol; col < cols - 1; col += 1) {
    let run = 0;
    let runTop = rows;
    for (let row = 0; row < Math.floor(rows * 0.86); row += 1) {
      if (cells[row * cols + col].luma < 0.34) {
        if (run === 0) runTop = row;
        run += 1;
      }
    }
    if (run > bestH) {
      bestH = run;
      bestCol = col;
      top = runTop;
    }
  }
  if (bestCol < 0 || bestH < rows * 0.16) return null;
  const uv = imageUV(bestCol, top, cols, rows, crop, imgW, imgH);
  return {
    x: uv.x,
    hubY: uv.y,
    groundY: 0.84,
    blade: Math.max(0.28, (0.84 - uv.y) * 0.9),
    phase: 0,
    speed: 0,
  };
}

function eraseSilhouette(
  cells: Cell[],
  cols: number,
  rows: number,
  turbine: Turbine,
  crop: Crop,
  imgW: number,
  imgH: number,
) {
  const aspect = imgW / imgH;
  const sky = uvToCell(
    Math.max(0.08, turbine.x - 0.16),
    Math.max(0.08, turbine.hubY - 0.1),
    cols,
    rows,
    crop,
    imgW,
    imgH,
  );
  const skyIndex =
    Math.min(rows - 1, Math.max(0, Math.round(sky.row))) * cols +
    Math.min(cols - 1, Math.max(0, Math.round(sky.col)));
  const fill = {
    luma: Math.max(cells[skyIndex]?.luma ?? 0.5, 0.48),
    r: cells[skyIndex]?.r ?? 120,
    g: cells[skyIndex]?.g ?? 90,
    b: cells[skyIndex]?.b ?? 60,
  };

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const uv = imageUV(col, row, cols, rows, crop, imgW, imgH);
      const dx = (uv.x - turbine.x) * aspect;
      const dy = uv.y - turbine.hubY;
      const inRotor = Math.hypot(dx, dy) <= turbine.blade + 0.03;
      const tower = inTower(uv.x, uv.y, turbine, aspect, 3.2);
      if (!inRotor && !tower) continue;
      const cell = cells[row * cols + col];
      if (!tower && cell.luma > 0.55) continue;
      cells[row * cols + col] = { ...fill };
    }
  }
}

function stampTowers(
  cells: Cell[],
  cols: number,
  rows: number,
  turbines: Turbine[],
  crop: Crop,
  imgW: number,
  imgH: number,
) {
  for (const turbine of turbines) {
    const hub = uvToCell(
      turbine.x,
      turbine.hubY,
      cols,
      rows,
      crop,
      imgW,
      imgH,
    );
    const ground = uvToCell(
      turbine.x,
      turbine.groundY,
      cols,
      rows,
      crop,
      imgW,
      imgH,
    );
    const steps = Math.max(8, Math.ceil(Math.abs(ground.row - hub.row) * 2));
    const half = turbine.blade > 0.28 ? 2.1 : turbine.blade > 0.14 ? 1.05 : 0.4;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const col = hub.col + (ground.col - hub.col) * t;
      const row = hub.row + (ground.row - hub.row) * t;
      const width = half * (0.55 + t * 0.85);
      const c0 = Math.round(col - width);
      const c1 = Math.round(col + width);
      const r = Math.round(row);
      for (let c = c0; c <= c1; c += 1) {
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        cells[r * cols + c] = { ...BLACK_CELL };
      }
    }
  }
}

function inpaintBlades(
  cells: Cell[],
  cols: number,
  rows: number,
  turbines: Turbine[],
  crop: Crop,
  imgW: number,
  imgH: number,
) {
  const aspect = imgW / imgH;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const uv = imageUV(col, row, cols, rows, crop, imgW, imgH);
      for (const turbine of turbines) {
        const dx = (uv.x - turbine.x) * aspect;
        const dy = uv.y - turbine.hubY;
        if (Math.hypot(dx, dy) > turbine.blade + 0.02) continue;
        if (inTower(uv.x, uv.y, turbine, aspect)) continue;
        const side = Math.min(
          cols - 1,
          Math.max(0, col + (uv.x > turbine.x ? 4 : -4)),
        );
        const up = Math.max(0, row - 3);
        const sample = cells[up * cols + side];
        if (sample?.mill) continue;
        cells[row * cols + col] = {
          luma: Math.max(sample.luma, 0.42),
          r: sample.r,
          g: sample.g,
          b: sample.b,
        };
        break;
      }
    }
  }
}

function paintBase(grid: Grid) {
  const { cells, cols, rows, cellW, cellH, font, dpr } = grid;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cols * cellW));
  canvas.height = Math.max(1, Math.round(rows * cellH));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  const cssCellW = cellW / dpr;
  const cssCellH = cellH / dpr;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cell = cells[y * cols + x];
      const char = cellChar(cell);
      if (char === " ") continue;
      ctx.fillStyle = cellFill(cell, false);
      ctx.fillText(char, x * cssCellW, y * cssCellH);
    }
  }

  return canvas;
}

export function AsciiWindscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let img: HTMLImageElement | null = null;
    let imgW = 0;
    let imgH = 0;
    let crop: Crop = { sx: 0, sy: 0, sw: 1, sh: 1 };
    let turbines: Turbine[] = [];
    let grid: Grid | null = null;
    let base: HTMLCanvasElement | null = null;
    let cssW = 0;
    let cssH = 0;
    const mouse = { x: -2000, y: -2000, hx: -2000, hy: -2000, r: 0 };
    let raf = 0;
    let ticker = 0;
    let running = true;
    let resizeTimer = 0;
    let lastTick = 0;

    const rebuild = () => {
      if (!img) return;
      cssW = Math.max(1, window.innerWidth);
      cssH = Math.max(1, window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(cssW * dpr);
      const height = Math.round(cssH * dpr);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      const cols = Math.round(Math.min(220, Math.max(128, cssW / 4.0)));
      const cellW = width / cols;
      const fontSize = Math.max(6.2, (cellW / dpr) * 1.14);
      const rows = Math.max(48, Math.round(height / (fontSize * dpr * 0.82)));
      const cellH = height / rows;
      crop = coverCrop(imgW, imgH, cols, rows);
      const cells = sampleCells(img, cols, rows, crop);
      eraseSilhouette(cells, cols, rows, PHOTO_RIGHT_MILL, crop, imgW, imgH);
      const rightMill = findRightPhotoMill(cells, cols, rows, crop, imgW, imgH);
      if (rightMill) {
        eraseSilhouette(cells, cols, rows, rightMill, crop, imgW, imgH);
      }
      inpaintBlades(cells, cols, rows, turbines, crop, imgW, imgH);
      stampTowers(cells, cols, rows, turbines, crop, imgW, imgH);

      grid = {
        cells,
        cols,
        rows,
        cellW,
        cellH,
        font: `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`,
        dpr,
      };
      base = paintBase(grid);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, 0, 0);
      drawBlades(performance.now() / 1000);
    };

    const drawBlades = (time: number) => {
      if (!grid || !img) return;
      const { cols, rows, cellW, cellH, font, dpr } = grid;
      const aspect = imgW / imgH;
      const cssCellW = cellW / dpr;
      const cssCellH = cellH / dpr;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = font;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      for (const turbine of turbines) {
        const hub = uvToCell(
          turbine.x,
          turbine.hubY,
          cols,
          rows,
          crop,
          imgW,
          imgH,
        );
        const angle = reduceMotion
          ? turbine.phase
          : turbine.phase + time * turbine.speed;
        const stamp = (col: number, row: number, char: string) => {
          if (col < 0 || row < 0 || col >= cols || row >= rows) return;
          ctx.fillStyle = cellFill(BLADE_CELL, false);
          ctx.fillText(char, col * cssCellW, row * cssCellH);
        };

        const thick = turbine.blade > 0.2 ? 1.7 : turbine.blade > 0.1 ? 1.15 : 0.7;

        for (let i = 0; i < 3; i += 1) {
          const a = angle + (i * Math.PI * 2) / 3;
          const glyph = bladeGlyph(a);
          const end = uvToCell(
            turbine.x + (Math.cos(a) * turbine.blade) / aspect,
            turbine.hubY + Math.sin(a) * turbine.blade,
            cols,
            rows,
            crop,
            imgW,
            imgH,
          );
          const steps = Math.max(
            16,
            Math.ceil(Math.hypot(end.col - hub.col, end.row - hub.row) * 3),
          );
          for (let s = 0; s <= steps; s += 1) {
            const t = s / steps;
            const col = hub.col + (end.col - hub.col) * t;
            const row = hub.row + (end.row - hub.row) * t;
            const width = thick * (1 - t * 0.28);
            stamp(Math.round(col), Math.round(row), glyph);
            stamp(Math.round(col + 1), Math.round(row), glyph);
            if (width > 0.55) {
              stamp(Math.round(col), Math.round(row + 1), glyph);
              stamp(Math.round(col - 1), Math.round(row), glyph);
            }
            if (width > 1.05) {
              stamp(Math.round(col + 1), Math.round(row + 1), "#");
            }
          }
        }

        stamp(Math.round(hub.col), Math.round(hub.row), "@");
        stamp(Math.round(hub.col + 1), Math.round(hub.row), "@");
      }

      ctx.restore();
    };

    const drawHover = () => {
      if (!grid || mouse.r < 0.6) return;
      const { cells, cols, rows, cellW, cellH, font, dpr } = grid;
      const radius = mouse.r;
      const colStart = Math.max(0, Math.floor((mouse.hx - radius) / cellW));
      const colEnd = Math.min(cols - 1, Math.ceil((mouse.hx + radius) / cellW));
      const rowStart = Math.max(0, Math.floor((mouse.hy - radius) / cellH));
      const rowEnd = Math.min(rows - 1, Math.ceil((mouse.hy + radius) / cellH));

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = font;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      const cssCellW = cellW / dpr;
      const cssCellH = cellH / dpr;

      for (let row = rowStart; row <= rowEnd; row += 1) {
        for (let col = colStart; col <= colEnd; col += 1) {
          const cell = cells[row * cols + col];
          const cx = (col + 0.5) * cellW;
          const cy = (row + 0.5) * cellH;
          const dist = Math.hypot(cx - mouse.hx, cy - mouse.hy);
          const n = hash2(col, row);
          if (dist > radius) continue;
          const falloff = 1 - dist / radius;
          if (falloff < 0.12 + n * 0.08) continue;
          const char = cellChar(cell, true);
          if (char === " ") continue;
          ctx.fillStyle = cellFill(cell, true);
          ctx.globalAlpha = 0.72 + falloff * 0.28;
          ctx.fillText(char, col * cssCellW, row * cssCellH);
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
    };

    const drawFrame = (timeMs: number) => {
      if (!running) return;
      lastTick = timeMs;
      mouse.hx += (mouse.x - mouse.hx) * 0.32;
      mouse.hy += (mouse.y - mouse.hy) * 0.32;
      const targetR = mouse.x > -800 ? BLOB_RADIUS * (grid?.dpr ?? 1) : 0;
      mouse.r += (targetR - mouse.r) * 0.28;

      if (base) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(base, 0, 0);
        drawHover();
        drawBlades(timeMs / 1000);
      }
    };

    const loop = (timeMs: number) => {
      drawFrame(timeMs);
      raf = window.requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = grid?.dpr ?? 1;
      mouse.x = (event.clientX - rect.left) * dpr;
      mouse.y = (event.clientY - rect.top) * dpr;
    };

    const onPointerLeave = () => {
      mouse.x = -2000;
      mouse.y = -2000;
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 80);
    };

    const image = new Image();
    image.src = SOURCE;
    image.onload = () => {
      if (!running) return;
      img = image;
      imgW = image.naturalWidth;
      imgH = image.naturalHeight;
      const probe = document.createElement("canvas");
      probe.width = imgW;
      probe.height = imgH;
      const probeCtx = probe.getContext("2d", { willReadFrequently: true });
      if (probeCtx) {
        probeCtx.drawImage(image, 0, 0);
        turbines = detectTurbines(
          probeCtx.getImageData(0, 0, imgW, imgH).data,
          imgW,
          imgH,
        );
      } else {
        turbines = FALLBACK_TURBINES;
      }
      rebuild();
    };

    raf = window.requestAnimationFrame(loop);
    ticker = window.setInterval(() => {
      if (!running) return;
      if (performance.now() - lastTick > 80) {
        drawFrame(performance.now());
      }
    }, 50);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.clearInterval(ticker);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "mouseleave",
        onPointerLeave,
      );
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

import { useEffect, useRef } from "react";

const BG = "#010609";
const RAMP = " .'`^,:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const CELL_W = 6;
const CELL_H = 9;
const FONT =
  '8px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';
const HOVER_RADIUS = 168;

type Turbine = {
  x: number;
  ridge: 0 | 1 | 2;
  scale: number;
  phase: number;
  speed: number;
};

const TURBINES: Turbine[] = [
  { x: 0.05, ridge: 0, scale: 0.16, phase: 0.4, speed: 0.38 },
  { x: 0.13, ridge: 0, scale: 0.13, phase: 1.9, speed: 0.44 },
  { x: 0.79, ridge: 0, scale: 0.14, phase: 2.4, speed: 0.4 },
  { x: 0.9, ridge: 0, scale: 0.11, phase: 0.8, speed: 0.48 },
  { x: 0.08, ridge: 1, scale: 0.3, phase: 1.1, speed: 0.3 },
  { x: 0.24, ridge: 1, scale: 0.26, phase: 2.7, speed: 0.34 },
  { x: 0.74, ridge: 1, scale: 0.28, phase: 0.2, speed: 0.32 },
  { x: 0.91, ridge: 1, scale: 0.24, phase: 1.6, speed: 0.36 },
  { x: 0.14, ridge: 2, scale: 0.56, phase: 0.7, speed: 0.22 },
  { x: 0.86, ridge: 2, scale: 0.6, phase: 2.2, speed: 0.2 },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function ridgeHeight(x: number, layer: 0 | 1 | 2) {
  if (layer === 0) {
    return (
      0.6 +
      0.034 * Math.sin(x * 4.8) +
      0.02 * Math.sin(x * 11.6 + 1.1) +
      0.01 * Math.sin(x * 23.4 + 0.4)
    );
  }
  if (layer === 1) {
    return (
      0.705 +
      0.048 * Math.sin(x * 3.1 + 0.7) +
      0.022 * Math.sin(x * 8.4 + 1.8) +
      0.012 * Math.sin(x * 18.2 + 0.3)
    );
  }
  return (
    0.84 +
    0.04 * Math.sin(x * 2.2 + 1.3) +
    0.018 * Math.sin(x * 6.8 + 0.5) +
    0.01 * Math.sin(x * 16.5 + 2.1)
  );
}

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  const t =
    ab2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  return Math.hypot(apx - abx * t, apy - aby * t);
}

function distToTaper(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  startR: number,
  endR: number,
) {
  const abx = bx - ax;
  const aby = by - ay;
  const len = Math.hypot(abx, aby);
  if (len === 0) return Math.hypot(px - ax, py - ay) - startR;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / (len * len));
  const qx = ax + abx * t;
  const qy = ay + aby * t;
  return Math.hypot(px - qx, py - qy) - (startR + (endR - startR) * t);
}

function rampIndex(lum: number) {
  return Math.min(RAMP.length - 1, Math.max(0, Math.floor(lum * RAMP.length)));
}

function cellColor(lum: number, warm: number, hover: number) {
  const l = clamp(lum + hover * 0.58);
  const w = clamp(warm + hover * 0.95);
  const coolR = 18 + 186 * l;
  const coolG = 24 + 198 * l;
  const coolB = 30 + 204 * l;
  const warmR = 22 + 228 * l;
  const warmG = 10 + 112 * l;
  const warmB = 4 + 18 * l;
  const r = Math.round(coolR * (1 - w) + warmR * w);
  const g = Math.round(coolG * (1 - w) + warmG * w);
  const b = Math.round(coolB * (1 - w) + warmB * w);
  return `rgb(${r},${g},${b})`;
}

function leftWarm(nx: number, ny: number, ridgeY: number) {
  const alongHorizon = Math.exp(-((ny - ridgeY) ** 2) / 0.01);
  const fromLeft = Math.exp(-((nx - 0.08) ** 2) / 0.22);
  return fromLeft * (0.22 + 0.55 * alongHorizon);
}

function sampleStatic(
  nx: number,
  ny: number,
  aspect: number,
  minSize: number,
) {
  const px = nx * aspect;
  const far = ridgeHeight(nx, 0);
  const mid = ridgeHeight(nx, 1);
  const near = ridgeHeight(nx, 2);
  const dusk = leftWarm(nx, ny, far);

  let lum = 0.016 + 0.012 * Math.max(0, 0.42 - ny);
  let warm = dusk * 0.08;

  if (ny < far && hash(nx * 340, ny * 340) > 0.9972) {
    lum = 0.28 + hash(nx * 90, ny * 70) * 0.18;
  }

  if (ny > far) {
    const depth = ny - far;
    lum = 0.09 + 0.035 * hash(nx * 36, ny * 18) + dusk * 0.08;
    warm = dusk * 0.55;
    if (depth < 0.01) {
      lum += 0.07 + dusk * 0.12;
      warm += dusk * 0.2;
    }
  }

  if (ny > mid) {
    const depth = ny - mid;
    lum =
      0.14 +
      0.045 * hash(nx * 22, ny * 16) +
      0.02 * Math.sin(nx * 28 + ny * 10);
    warm = dusk * 0.32;
    if (depth < 0.012) lum += 0.06;
  }

  if (ny > near) {
    const grass = Math.abs(Math.sin(nx * 150 + ny * 42));
    const clumps = hash(Math.floor(nx * 90), Math.floor(ny * 55));
    lum = 0.07 + 0.05 * grass + 0.04 * clumps + 0.015 * Math.sin(ny * 90);
    warm = dusk * 0.18;
  }

  for (const turbine of TURBINES) {
    const ground = ridgeHeight(turbine.x, turbine.ridge);
    const hubY = ground - turbine.scale * 0.58;
    const tx = turbine.x * aspect;
    const dx = px - tx;
    const towardLight = clamp(0.55 - dx * 4);

    if (ny >= hubY && ny <= ground + 0.008) {
      const t = (ny - hubY) / Math.max(0.001, ground - hubY);
      const half = Math.max(
        minSize * 0.85,
        (0.0038 + turbine.scale * 0.007) * (1 + t * 1.15),
      );
      if (Math.abs(dx) < half) {
        lum = 0.58 + towardLight * 0.22;
        warm = 0.28 + towardLight * 0.42;
      }
    }

    const hubR = Math.max(minSize * 1.35, 0.007 + turbine.scale * 0.01);
    const hubDist = Math.hypot(dx, ny - hubY);
    if (hubDist < hubR) {
      lum = 0.86;
      warm = 0.72;
    }

    const nacelle = 0.016 + turbine.scale * 0.028;
    if (
      distToSegment(px, ny, tx - nacelle * 0.15, hubY, tx + nacelle, hubY) <
      Math.max(minSize, 0.005 + turbine.scale * 0.004)
    ) {
      lum = 0.7 + towardLight * 0.12;
      warm = 0.4 + towardLight * 0.28;
    }

    const foot = 0.012 + turbine.scale * 0.018;
    if (
      ny > ground - 0.01 &&
      ny < ground + 0.012 &&
      Math.abs(dx) < foot
    ) {
      lum = Math.max(lum, 0.42);
      warm = Math.max(warm, 0.3);
    }
  }

  return { lum: clamp(lum), warm: clamp(warm) };
}

function sampleBlades(
  nx: number,
  ny: number,
  aspect: number,
  time: number,
  reduceMotion: boolean,
  minSize: number,
) {
  const px = nx * aspect;
  let hit = 0;
  let warmBoost = 0;

  for (const turbine of TURBINES) {
    const ground = ridgeHeight(turbine.x, turbine.ridge);
    const hubY = ground - turbine.scale * 0.58;
    const tx = turbine.x * aspect;
    const len = turbine.scale * 0.33;
    const angle = reduceMotion
      ? turbine.phase
      : turbine.phase + time * turbine.speed;
    const root = Math.max(minSize * 0.9, 0.007 + turbine.scale * 0.01);
    const tip = Math.max(minSize * 0.35, 0.002 + turbine.scale * 0.0035);

    for (let i = 0; i < 3; i += 1) {
      const a = angle + (i * Math.PI * 2) / 3;
      const bx = tx + Math.cos(a) * len;
      const by = hubY + Math.sin(a) * len;
      const d = distToTaper(px, ny, tx, hubY, bx, by, root, tip);
      if (d < 0) {
        const inside = clamp(-d / root);
        hit = Math.max(hit, 0.55 + inside * 0.45);
        warmBoost = Math.max(warmBoost, Math.cos(a) < 0 ? 0.55 : 0.28);
      }
    }
  }

  if (hit <= 0) return { lum: 0, warm: 0, blade: false };
  return { lum: 0.52 + hit * 0.4, warm: 0.34 + warmBoost, blade: true };
}

function paintCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ch: string,
  lum: number,
  warm: number,
  hover: number,
) {
  ctx.fillStyle = BG;
  ctx.fillRect(x * CELL_W, y * CELL_H, CELL_W, CELL_H);
  if (lum < 0.03 && hover < 0.05) return;
  ctx.fillStyle = cellColor(lum, warm, hover);
  ctx.fillText(ch, x * CELL_W + 0.2, y * CELL_H + 0.2);
}

export function AsciiWindscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const staticCanvas = document.createElement("canvas");
    const staticCtx = staticCanvas.getContext("2d", { alpha: false });
    if (!staticCtx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let cols = 0;
    let rows = 0;
    let cssW = 0;
    let cssH = 0;
    let aspect = 1;
    let dpr = 1;
    let baseLum = new Float32Array(0);
    let baseWarm = new Float32Array(0);
    let chars = new Uint16Array(0);
    const mouse = { x: -2400, y: -2400, hx: -2400, hy: -2400 };
    let raf = 0;
    let running = true;
    let resizeTimer = 0;

    const setupContext = (target: CanvasRenderingContext2D) => {
      target.setTransform(dpr, 0, 0, dpr, 0, 0);
      target.font = FONT;
      target.textBaseline = "top";
      target.textAlign = "left";
      target.imageSmoothingEnabled = false;
    };

    const rebuild = () => {
      cssW = Math.max(1, window.innerWidth);
      cssH = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      aspect = cssW / cssH;
      cols = Math.ceil(cssW / CELL_W);
      rows = Math.ceil(cssH / CELL_H);

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      staticCanvas.width = canvas.width;
      staticCanvas.height = canvas.height;

      setupContext(ctx);
      setupContext(staticCtx);

      const count = cols * rows;
      baseLum = new Float32Array(count);
      baseWarm = new Float32Array(count);
      chars = new Uint16Array(count);

      staticCtx.fillStyle = BG;
      staticCtx.fillRect(0, 0, cssW, cssH);

      const minSize = Math.max(2 / rows, (2.2 * aspect) / cols);
      for (let y = 0; y < rows; y += 1) {
        const ny = (y + 0.5) / rows;
        for (let x = 0; x < cols; x += 1) {
          const nx = (x + 0.5) / cols;
          const sample = sampleStatic(nx, ny, aspect, minSize);
          const i = y * cols + x;
          baseLum[i] = sample.lum;
          baseWarm[i] = sample.warm;
          const idx = rampIndex(sample.lum);
          chars[i] = RAMP.charCodeAt(idx);
          paintCell(staticCtx, x, y, RAMP[idx], sample.lum, sample.warm, 0);
        }
      }
    };

    const drawFrame = (timeMs: number) => {
      if (!running) return;
      const time = timeMs / 1000;
      mouse.hx += (mouse.x - mouse.hx) * 0.18;
      mouse.hy += (mouse.y - mouse.hy) * 0.18;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(staticCanvas, 0, 0);
      setupContext(ctx);

      const dirty = new Set<number>();
      const markBox = (nx0: number, ny0: number, nx1: number, ny1: number) => {
        const x0 = Math.max(0, Math.floor(nx0 * cols) - 1);
        const y0 = Math.max(0, Math.floor(ny0 * rows) - 1);
        const x1 = Math.min(cols - 1, Math.ceil(nx1 * cols) + 1);
        const y1 = Math.min(rows - 1, Math.ceil(ny1 * rows) + 1);
        for (let y = y0; y <= y1; y += 1) {
          for (let x = x0; x <= x1; x += 1) {
            dirty.add(y * cols + x);
          }
        }
      };

      const minSize = Math.max(2 / rows, (2.2 * aspect) / cols);
      for (const turbine of TURBINES) {
        const ground = ridgeHeight(turbine.x, turbine.ridge);
        const hubY = ground - turbine.scale * 0.58;
        const len = turbine.scale * 0.36;
        markBox(
          turbine.x - len / aspect - 0.025,
          hubY - len - 0.025,
          turbine.x + len / aspect + 0.025,
          hubY + len + 0.025,
        );
      }

      const hx = mouse.hx;
      const hy = mouse.hy;
      if (hx > -800 && hy > -800) {
        markBox(
          (hx - HOVER_RADIUS) / cssW,
          (hy - HOVER_RADIUS) / cssH,
          (hx + HOVER_RADIUS) / cssW,
          (hy + HOVER_RADIUS) / cssH,
        );
      }

      dirty.forEach((i) => {
        const x = i % cols;
        const y = Math.floor(i / cols);
        const nx = (x + 0.5) / cols;
        const ny = (y + 0.5) / rows;
        const blades = sampleBlades(
          nx,
          ny,
          aspect,
          time,
          reduceMotion,
          minSize,
        );
        let lum = baseLum[i];
        let warm = baseWarm[i];
        if (blades.blade) {
          lum = blades.lum;
          warm = blades.warm;
        }

        const cx = (x + 0.5) * CELL_W;
        const cy = (y + 0.5) * CELL_H;
        const dist = Math.hypot(cx - hx, cy - hy);
        const hover = clamp(1 - dist / HOVER_RADIUS);
        const hoverEase = hover * hover * (3 - 2 * hover);

        if (hoverEase > 0.015) {
          lum = clamp(lum + hoverEase * 0.62 + 0.03);
          warm = clamp(warm + hoverEase * 0.92);
        }

        let idx = rampIndex(lum);
        if (!reduceMotion && hoverEase > 0.16) {
          idx = Math.min(
            RAMP.length - 1,
            idx +
              Math.floor(
                hash(x + Math.floor(time * 14), y) * 7 * hoverEase,
              ),
          );
        }

        const ch = RAMP[idx];
        paintCell(ctx, x, y, ch, lum, warm, hoverEase);
      });

      raf = window.requestAnimationFrame(drawFrame);
    };

    const onPointerMove = (event: PointerEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const onPointerLeave = () => {
      mouse.x = -2400;
      mouse.y = -2400;
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 80);
    };

    rebuild();
    raf = window.requestAnimationFrame(drawFrame);

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
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

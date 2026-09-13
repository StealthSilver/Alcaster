"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

type WindmillProps = {
  x: number;
  y: number;
  scale?: number;
  duration?: number;
  delay?: number;
  opacity?: number;
  reduced: boolean;
};

function Windmill({
  x,
  y,
  scale = 1,
  duration = 8,
  delay = 0,
  opacity = 0.55,
  reduced,
}: WindmillProps) {
  const hubY = -88;
  const blade = "M0 -5 L4.2 -58 L0 -74 L-4.2 -58 Z";
  const bladeFill = "rgba(186, 208, 218, 0.22)";

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <path
        d="M-4.5 0 L-2 -84 L2 -84 L4.5 0 Z"
        fill="rgba(180, 205, 215, 0.16)"
      />
      <path
        d="M-1.2 -84 L1.2 -84 L1 -92 L-1 -92 Z"
        fill="rgba(200, 220, 230, 0.2)"
      />
      <ellipse
        cx="0"
        cy={hubY}
        rx="5.5"
        ry="3.6"
        fill="rgba(200, 220, 230, 0.22)"
      />
      <g transform={`translate(0 ${hubY})`}>
        <g>
          {!reduced ? (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur={`${duration}s`}
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          ) : null}
          <path d={blade} fill={bladeFill} />
          <path d={blade} fill={bladeFill} transform="rotate(120)" />
          <path d={blade} fill={bladeFill} transform="rotate(240)" />
        </g>
        <circle cx="0" cy="0" r="2.4" fill="rgba(200, 220, 230, 0.28)" />
      </g>
    </g>
  );
}

type HeroWindscapeProps = {
  className?: string;
};

/**
 * Home-only terrain: full-bleed wind farm silhouette over the horizon glow.
 */
export function HeroWindscape({ className }: HeroWindscapeProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[42%] min-h-[220px] sm:h-[46%] sm:min-h-[260px]",
        className,
      )}
      aria-hidden
    >
      {/* Soft lift so windmills sit in the orange horizon wash */}
      <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#010609] via-[#010609]/55 to-transparent" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hero-sky-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#010609" stopOpacity="0" />
            <stop offset="45%" stopColor="#041018" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#010609" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="hero-hill-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1c26" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#06141c" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="hero-hill-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c222e" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#071820" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="hero-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e2834" />
            <stop offset="55%" stopColor="#07141c" />
            <stop offset="100%" stopColor="#010609" />
          </linearGradient>
          <linearGradient id="hero-ridge-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6740a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#e6740a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Atmosphere wash */}
        <rect width="1440" height="420" fill="url(#hero-sky-fade)" />

        {/* Far ridge */}
        <path
          d="M0 268 C120 248 220 255 340 242 C480 226 560 250 700 238 C860 224 980 248 1120 236 C1240 226 1340 246 1440 238 L1440 420 L0 420 Z"
          fill="url(#hero-hill-far)"
        />

        {/* Distant turbines — smaller, slower */}
        <Windmill
          x={180}
          y={248}
          scale={0.42}
          duration={14}
          delay={-2}
          opacity={0.32}
          reduced={reduced}
        />
        <Windmill
          x={420}
          y={242}
          scale={0.36}
          duration={16}
          delay={-5}
          opacity={0.26}
          reduced={reduced}
        />
        <Windmill
          x={780}
          y={240}
          scale={0.4}
          duration={15}
          delay={-1}
          opacity={0.3}
          reduced={reduced}
        />
        <Windmill
          x={1180}
          y={238}
          scale={0.34}
          duration={17}
          delay={-7}
          opacity={0.24}
          reduced={reduced}
        />

        {/* Mid ridge */}
        <path
          d="M0 302 C160 278 280 292 420 276 C580 256 700 288 860 272 C1020 254 1160 286 1320 274 C1380 270 1410 278 1440 276 L1440 420 L0 420 Z"
          fill="url(#hero-hill-mid)"
        />
        <path
          d="M0 302 C160 278 280 292 420 276 C580 256 700 288 860 272 C1020 254 1160 286 1320 274 C1380 270 1410 278 1440 276 L1440 292 C1380 294 1320 290 1160 300 C1020 312 860 296 700 310 C580 322 420 298 280 312 C160 324 80 318 0 318 Z"
          fill="url(#hero-ridge-glow)"
        />

        <Windmill
          x={95}
          y={292}
          scale={0.72}
          duration={10}
          delay={-3}
          opacity={0.42}
          reduced={reduced}
        />
        <Windmill
          x={520}
          y={278}
          scale={0.82}
          duration={9}
          delay={-1.5}
          opacity={0.48}
          reduced={reduced}
        />
        <Windmill
          x={920}
          y={282}
          scale={0.68}
          duration={11}
          delay={-4}
          opacity={0.4}
          reduced={reduced}
        />
        <Windmill
          x={1285}
          y={280}
          scale={0.76}
          duration={9.5}
          delay={-6}
          opacity={0.44}
          reduced={reduced}
        />

        {/* Near ground */}
        <path
          d="M0 348 C200 328 360 342 520 330 C720 314 880 344 1080 332 C1240 322 1360 340 1440 336 L1440 420 L0 420 Z"
          fill="url(#hero-ground)"
        />

        {/* Near turbines — largest, slightly faster */}
        <Windmill
          x={260}
          y={342}
          scale={1.05}
          duration={7.5}
          delay={0}
          opacity={0.52}
          reduced={reduced}
        />
        <Windmill
          x={680}
          y={336}
          scale={1.18}
          duration={7}
          delay={-2.2}
          opacity={0.56}
          reduced={reduced}
        />
        <Windmill
          x={1085}
          y={340}
          scale={1.08}
          duration={8}
          delay={-4.5}
          opacity={0.5}
          reduced={reduced}
        />

        {/* Ground edge line — quiet horizon cue */}
        <path
          d="M0 348 C200 328 360 342 520 330 C720 314 880 344 1080 332 C1240 322 1360 340 1440 336"
          fill="none"
          stroke="rgba(230, 116, 10, 0.16)"
          strokeWidth="1.25"
        />

        {/* Sparse terrain marks */}
        <g stroke="rgba(200, 220, 230, 0.06)" strokeWidth="1" fill="none">
          <path d="M40 372 C180 366 320 378 460 370" />
          <path d="M520 378 C680 372 820 384 980 376" />
          <path d="M1040 380 C1180 374 1300 382 1400 378" />
        </g>
      </svg>
    </div>
  );
}

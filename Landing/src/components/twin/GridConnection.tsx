"use client";

type GridConnectionProps = {
  x: number;
  y: number;
  selected?: boolean;
  onSelect?: () => void;
  id?: string;
};

export function GridConnection({
  x,
  y,
  selected,
  onSelect,
  id,
}: GridConnectionProps) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      className={onSelect ? "cursor-pointer" : undefined}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      aria-label={id ?? "Grid connection"}
    >
      <rect
        x={0}
        y={8}
        width={48}
        height={32}
        rx={4}
        fill={selected ? "rgba(230,116,10,0.1)" : "rgba(255,255,255,0.03)"}
        stroke={selected ? "rgba(230,116,10,0.55)" : "rgba(255,255,255,0.16)"}
        strokeWidth={1.25}
      />
      <path
        d="M10 24 H18 L22 14 L28 34 L32 20 H38"
        fill="none"
        stroke="#e6740a"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
    </g>
  );
}

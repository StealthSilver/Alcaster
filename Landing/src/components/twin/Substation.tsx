"use client";

type SubstationProps = {
  x: number;
  y: number;
  selected?: boolean;
  onSelect?: () => void;
  id?: string;
};

export function Substation({
  x,
  y,
  selected,
  onSelect,
  id,
}: SubstationProps) {
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
      aria-label={id ?? "Substation"}
    >
      <rect
        x={0}
        y={0}
        width={56}
        height={44}
        rx={5}
        fill={selected ? "rgba(230,116,10,0.12)" : "rgba(255,255,255,0.035)"}
        stroke={selected ? "rgba(230,116,10,0.65)" : "rgba(255,255,255,0.18)"}
        strokeWidth={1.25}
      />
      <path
        d="M12 34 V12 M28 34 V8 M44 34 V14"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M8 18 H48"
        stroke="rgba(230,116,10,0.45)"
        strokeWidth={1}
      />
    </g>
  );
}

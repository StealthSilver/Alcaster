"use client";

type TransformerProps = {
  x: number;
  y: number;
  selected?: boolean;
  onSelect?: () => void;
  id?: string;
};

export function Transformer({
  x,
  y,
  selected,
  onSelect,
  id,
}: TransformerProps) {
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
      aria-label={id ?? "Transformer"}
    >
      <rect
        x={0}
        y={4}
        width={40}
        height={36}
        rx={5}
        fill={selected ? "rgba(230,116,10,0.12)" : "rgba(255,255,255,0.04)"}
        stroke={selected ? "rgba(230,116,10,0.65)" : "rgba(255,255,255,0.18)"}
        strokeWidth={1.25}
      />
      <circle
        cx={20}
        cy={18}
        r={8}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1.5}
      />
      <circle
        cx={20}
        cy={28}
        r={8}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
    </g>
  );
}

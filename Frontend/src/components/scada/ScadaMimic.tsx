import type { ScadaNode, ScadaStatus } from "@/lib/scadaModel";
import { panelClass, sectionTitleClass } from "@/components/dashboard/panel";

type ScadaMimicProps = {
  nodes: ScadaNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
};

const ORDER = ["array", "combiner", "inverter", "transformer", "substation", "grid"] as const;

const statusStroke: Record<ScadaStatus, string> = {
  RUN: "#3dcf8e",
  WARN: "#e8a54b",
  FAULT: "#e06b75",
  STOP: "color-mix(in srgb, var(--alcaster-fg) 25%, transparent)",
};

export function ScadaMimic({
  nodes,
  selectedId,
  onSelect,
  compact = false,
}: ScadaMimicProps) {
  const stages = ORDER.map((kind) => nodes.find((node) => node.kind === kind)).filter(
    (node): node is ScadaNode => Boolean(node),
  );
  const met = nodes.find((node) => node.kind === "met") ?? null;

  return (
    <section className={`${panelClass} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={sectionTitleClass}>Process single-line</h2>
        </div>
        {met ? (
          <button
            type="button"
            onClick={() => onSelect(met.id)}
            className={`rounded-md border px-2.5 py-1.5 text-left transition-colors ${
              selectedId === met.id
                ? "border-accent/50 bg-accent/12"
                : "border-edge-strong bg-fill hover:border-edge-strong"
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
              {met.name}
            </p>
            <p className="text-xs font-medium tabular-nums text-fg">
              {met.primary}
            </p>
          </button>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 920 ${compact ? 148 : 168}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label="SCADA process single-line"
        >
          <defs>
            <linearGradient id="scada-flow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(230,116,10,0.15)" />
              <stop offset="50%" stopColor="rgba(230,116,10,0.55)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.45)" />
            </linearGradient>
          </defs>
          <path
            d="M70 72 H850"
            fill="none"
            stroke="rgba(59,130,246,0.22)"
            strokeWidth={3}
          />
          <path
            d="M70 72 H850"
            fill="none"
            stroke="url(#scada-flow)"
            strokeWidth={2.4}
            strokeDasharray="8 12"
            className="alcaster-flow-dash"
          />
          {stages.map((node, index) => {
            const x = 70 + index * 156;
            const active = selectedId === node.id;
            const stroke = active ? "#e6740a" : statusStroke[node.status];
            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => onSelect(node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(node.id);
                  }
                }}
              >
                <rect
                  x={x - 52}
                  y={28}
                  width={104}
                  height={88}
                  rx={8}
                  fill={
                    active
                      ? "rgba(230,116,10,0.1)"
                      : "var(--alcaster-diagram-equipment)"
                  }
                  stroke={stroke}
                  strokeWidth={active ? 1.8 : 1.2}
                />
                <circle cx={x - 40} cy={40} r={3.5} fill={stroke} />
                <text
                  x={x}
                  y={48}
                  textAnchor="middle"
                  fill="color-mix(in srgb, var(--alcaster-fg) 45%, transparent)"
                  fontSize={9}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  letterSpacing={0.8}
                >
                  {node.name}
                </text>
                <text
                  x={x}
                  y={72}
                  textAnchor="middle"
                  fill="var(--alcaster-fg)"
                  fontSize={15}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontWeight={600}
                >
                  {node.primary}
                </text>
                <text
                  x={x}
                  y={92}
                  textAnchor="middle"
                  fill="color-mix(in srgb, var(--alcaster-fg) 40%, transparent)"
                  fontSize={10}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {node.secondary}
                </text>
                <text
                  x={x}
                  y={132}
                  textAnchor="middle"
                  fill={statusStroke[node.status]}
                  fontSize={9}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontWeight={600}
                >
                  {node.status}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

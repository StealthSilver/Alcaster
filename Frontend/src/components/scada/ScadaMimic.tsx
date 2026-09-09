import type { ScadaNode, ScadaStatus } from "@/lib/scadaModel";

type ScadaMimicProps = {
  nodes: ScadaNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const ORDER = ["array", "combiner", "inverter", "transformer", "substation", "grid"] as const;

const statusStroke: Record<ScadaStatus, string> = {
  RUN: "rgba(120, 180, 140, 0.85)",
  WARN: "#e6740a",
  FAULT: "#f07167",
  STOP: "color-mix(in srgb, var(--alcaster-fg) 25%, transparent)",
};

export function ScadaMimic({ nodes, selectedId, onSelect }: ScadaMimicProps) {
  const stages = ORDER.map((kind) => nodes.find((node) => node.kind === kind)).filter(
    (node): node is ScadaNode => Boolean(node),
  );
  const met = nodes.find((node) => node.kind === "met") ?? null;

  return (
    <section className="rounded-2xl border border-edge bg-fill p-4 shadow-[var(--alcaster-shadow)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">
            Process view
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Single-line mimic · select a bay for tags
          </p>
        </div>
        {met ? (
          <button
            type="button"
            onClick={() => onSelect(met.id)}
            className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
              selectedId === met.id
                ? "border-[#e6740a]/50 bg-accent/12"
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
          viewBox="0 0 920 168"
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label="SCADA process single-line"
        >
          <path
            d="M70 72 H850"
            fill="none"
            stroke="color-mix(in srgb, var(--alcaster-fg) 10%, transparent)"
            strokeWidth={2}
          />
          <path
            d="M70 72 H850"
            fill="none"
            stroke="rgba(230,116,10,0.55)"
            strokeWidth={1.6}
            strokeDasharray="6 10"
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
                  rx={10}
                  fill={
                    active
                      ? "rgba(230,116,10,0.1)"
                      : "var(--alcaster-diagram-equipment)"
                  }
                  stroke={stroke}
                  strokeWidth={active ? 1.6 : 1.1}
                />
                <text
                  x={x}
                  y={48}
                  textAnchor="middle"
                  fill="color-mix(in srgb, var(--alcaster-fg) 45%, transparent)"
                  fontSize={9}
                  fontFamily="Inter, system-ui, sans-serif"
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
                  fontFamily="Inter, system-ui, sans-serif"
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
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {node.secondary}
                </text>
                <text
                  x={x}
                  y={132}
                  textAnchor="middle"
                  fill={statusStroke[node.status]}
                  fontSize={9}
                  fontFamily="Inter, system-ui, sans-serif"
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

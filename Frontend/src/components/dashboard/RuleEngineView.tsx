import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  CircleAlert,
  Pause,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";

import type { ProjectDashboardPayload } from "@/lib/api";
import { downloadCsv } from "@/lib/chartActions";
import {
  buildAutomationRules,
  buildEvalLog,
  buildFormulas,
  readRuleEngineConfig,
  SEVERITY_COLOR,
  type AutomationRule,
  type RuleSeverity,
} from "@/lib/ruleEngineData";
import { usePanelFullscreen } from "@/hooks/usePanelFullscreen";
import { ChartToolbar } from "./ChartToolbar";
import {
  compactSearchClass,
  iconButtonClass,
  panelClass,
  sectionHintClass,
  sectionTitleClass,
} from "./panel";

type RuleEngineViewProps = {
  data: ProjectDashboardPayload;
};

export function RuleEngineView({ data }: RuleEngineViewProps) {
  const config = useMemo(
    () => readRuleEngineConfig(data.project.id),
    [data.project.id],
  );

  const [now, setNow] = useState(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [countdown, setCountdown] = useState(config.evalIntervalSec);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | RuleSeverity>(
    "all",
  );
  const [resultFilter, setResultFilter] = useState<
    "all" | "pass" | "fail" | "skip"
  >("all");
  const [selectedFormula, setSelectedFormula] = useState<string | null>(null);

  const formulaFs = usePanelFullscreen();
  const rulesFs = usePanelFullscreen();
  const logFs = usePanelFullscreen();

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    setCountdown(config.evalIntervalSec);
  }, [config.evalIntervalSec, refreshKey]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setRefreshKey((k) => k + 1);
          return config.evalIntervalSec;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [config.evalIntervalSec]);

  const formulas = useMemo(
    () => buildFormulas(data, config, refreshKey),
    [data, config, refreshKey],
  );

  const rules = useMemo(
    () => buildAutomationRules(data, refreshKey, enabledMap),
    [data, refreshKey, enabledMap],
  );

  const logs = useMemo(
    () => buildEvalLog(rules, now, refreshKey, data.project.id),
    [rules, now, refreshKey, data.project.id],
  );

  useEffect(() => {
    if (!selectedFormula && formulas[0]) setSelectedFormula(formulas[0].id);
  }, [formulas, selectedFormula]);

  const filteredRules = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rules.filter((r) => {
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;
      if (resultFilter !== "all" && r.lastResult !== resultFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.condition.toLowerCase().includes(q)
      );
    });
  }, [rules, query, severityFilter, resultFilter]);

  const activeCount = rules.filter((r) => r.enabled).length;
  const failing = rules.filter(
    (r) => r.enabled && r.lastResult === "fail",
  ).length;
  const warnFormulas = formulas.filter((f) => f.status !== "ok").length;

  const stamp = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const selected = formulas.find((f) => f.id === selectedFormula) ?? formulas[0];

  function refresh() {
    setSpinning(true);
    setRefreshKey((k) => k + 1);
    setCountdown(config.evalIntervalSec);
    window.setTimeout(() => setSpinning(false), 650);
  }

  function toggleRule(id: string) {
    setEnabledMap((prev) => {
      const current = prev[id] ?? true;
      return { ...prev, [id]: !current };
    });
  }

  function exportRules() {
    downloadCsv(`rule-engine-${data.project.id}`, [
      ["Name", "Condition", "Threshold", "Severity", "Enabled", "Last result", "Message"],
      ...rules.map((r) => [
        r.name,
        r.condition,
        r.threshold,
        r.severity,
        r.enabled ? "yes" : "no",
        r.lastResult,
        r.lastMessage,
      ]),
    ]);
  }

  function exportLog() {
    downloadCsv(`rule-eval-log-${data.project.id}`, [
      ["Time", "Rule", "Result", "Message", "Duration ms"],
      ...logs.map((l) => [
        l.time,
        l.rule,
        l.result,
        l.message,
        String(l.durationMs),
      ]),
    ]);
  }

  function exportFormulas() {
    downloadCsv(`formulas-${data.project.id}`, [
      ["Name", "Expression", "Unit", "Last value", "Status"],
      ...formulas.map((f) => [
        f.name,
        f.expression,
        f.unit,
        String(f.lastValue),
        f.status,
      ]),
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-fg">Rule Engine</h2>
          <p className={sectionHintClass}>
            Formulas · automation rules · evaluation log
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tabular-nums text-muted">{stamp}</span>
          <span className="inline-flex h-8 items-center rounded-md border border-edge px-2.5 text-[11px] tabular-nums text-secondary">
            Next eval {countdown}s
          </span>
          <button
            type="button"
            className={iconButtonClass}
            aria-label="Evaluate now"
            title="Evaluate now"
            onClick={refresh}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <MetaTile label="Language" value={config.language} />
        <MetaTile
          label="Eval interval"
          value={`${config.evalIntervalSec}s`}
        />
        <MetaTile
          label="Alert on fail"
          value={config.alertOnFail ? "Yes" : "No"}
        />
        <MetaTile label="Active rules" value={String(activeCount)} />
        <MetaTile label="Failing" value={String(failing)} />
        <MetaTile label="Formula warnings" value={String(warnFormulas)} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <section
          ref={formulaFs.ref as React.RefObject<HTMLElement>}
          className={`${panelClass} xl:col-span-5 ${formulaFs.active ? "overflow-auto bg-page p-3" : ""}`}
        >
          <div className="flex items-center justify-between border-b border-edge px-3 py-2.5">
            <div>
              <h3 className={sectionTitleClass}>Formula library</h3>
              <p className={sectionHintClass}>
                {config.language} · {formulas.length} formulas
              </p>
            </div>
            <ChartToolbar
              onExport={exportFormulas}
              onFullscreen={formulaFs.toggle}
              fullscreen={formulaFs.active}
            />
          </div>
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
            <ul className="max-h-[320px] overflow-auto border-b border-edge sm:border-b-0 sm:border-r">
              {formulas.map((f) => {
                const on = selected?.id === f.id;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedFormula(f.id)}
                      className={[
                        "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs transition-colors",
                        on ? "bg-accent/10" : "hover:bg-fill",
                      ].join(" ")}
                    >
                      <span>
                        <span className="block font-medium text-fg">
                          {f.name}
                        </span>
                        <span className="text-[10px] text-muted">
                          {f.lastValue}
                          {f.unit ? ` ${f.unit}` : ""}
                        </span>
                      </span>
                      <StatusPill status={f.status} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="px-3 py-3">
              {selected ? (
                <>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-accent" />
                    <h4 className="text-sm font-semibold text-fg">
                      {selected.name}
                    </h4>
                  </div>
                  <p className="mt-3 rounded-md border border-edge bg-fill/40 p-3 font-mono text-[11px] leading-relaxed text-secondary">
                    {selected.expression}
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted">
                        Last value
                      </p>
                      <motion.p
                        key={`${selected.id}-${refreshKey}`}
                        initial={{ opacity: 0.4, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-semibold tabular-nums text-fg"
                      >
                        {selected.lastValue}
                        <span className="ml-1 text-sm font-medium text-muted">
                          {selected.unit}
                        </span>
                      </motion.p>
                    </div>
                    <StatusPill status={selected.status} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted">No formulas configured.</p>
              )}
            </div>
          </div>
        </section>

        <section
          ref={rulesFs.ref as React.RefObject<HTMLElement>}
          className={`${panelClass} xl:col-span-7 ${rulesFs.active ? "overflow-auto bg-page p-3" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge px-3 py-2.5">
            <div>
              <h3 className={sectionTitleClass}>Automation rules</h3>
              <p className={sectionHintClass}>
                Enable / disable · severity · last result
              </p>
            </div>
            <ChartToolbar
              onExport={exportRules}
              onFullscreen={rulesFs.toggle}
              fullscreen={rulesFs.active}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search rules"
                  className={`${compactSearchClass} w-[140px]`}
                />
              </div>
              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value as "all" | RuleSeverity)
                }
                className="h-8 rounded-md border border-edge-strong bg-input px-2 text-xs text-fg outline-none"
                aria-label="Severity filter"
              >
                <option value="all">All severity</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
                <option value="P4">P4</option>
              </select>
              <select
                value={resultFilter}
                onChange={(e) =>
                  setResultFilter(
                    e.target.value as "all" | "pass" | "fail" | "skip",
                  )
                }
                className="h-8 rounded-md border border-edge-strong bg-input px-2 text-xs text-fg outline-none"
                aria-label="Result filter"
              >
                <option value="all">All results</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="skip">Skip</option>
              </select>
            </ChartToolbar>
          </div>

          <div className="max-h-[360px] overflow-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-edge text-muted">
                  <th className="px-3 py-2 font-medium">Rule</th>
                  <th className="px-2 py-2 font-medium">Severity</th>
                  <th className="px-2 py-2 font-medium">Threshold</th>
                  <th className="px-2 py-2 font-medium">Result</th>
                  <th className="px-2 py-2 font-medium">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((r) => (
                  <RuleRow key={r.id} rule={r} onToggle={() => toggleRule(r.id)} />
                ))}
                {filteredRules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-muted"
                    >
                      No rules match filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section
        ref={logFs.ref as React.RefObject<HTMLElement>}
        className={`${panelClass} ${logFs.active ? "overflow-auto bg-page p-3" : ""}`}
      >
        <div className="flex items-center justify-between border-b border-edge px-3 py-2.5">
          <div>
            <h3 className={sectionTitleClass}>Evaluation log</h3>
            <p className={sectionHintClass}>
              Live cycle every {config.evalIntervalSec}s
              {config.alertOnFail ? " · failing rules raise alerts" : ""}
            </p>
          </div>
          <ChartToolbar
            onExport={exportLog}
            onFullscreen={logFs.toggle}
            fullscreen={logFs.active}
          />
        </div>
        <div className="max-h-[280px] overflow-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[11px]">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-edge text-muted">
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-2 py-2 font-medium">Rule</th>
                <th className="px-2 py-2 font-medium">Result</th>
                <th className="px-2 py-2 font-medium">Message</th>
                <th className="px-2 py-2 font-medium">ms</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-edge/60 text-secondary hover:bg-fill/60"
                >
                  <td className="px-3 py-1.5 tabular-nums">{l.time}</td>
                  <td className="px-2 py-1.5 text-fg">{l.rule}</td>
                  <td className="px-2 py-1.5">
                    <ResultBadge result={l.result} />
                  </td>
                  <td className="px-2 py-1.5">{l.message}</td>
                  <td className="px-2 py-1.5 tabular-nums">{l.durationMs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {config.alertOnFail && failing > 0 ? (
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            {failing} rule{failing === 1 ? "" : "s"} failing — alerts will be
            raised on the next evaluation cycle.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function RuleRow({
  rule,
  onToggle,
}: {
  rule: AutomationRule;
  onToggle: () => void;
}) {
  return (
    <tr className="border-b border-edge/60 text-secondary hover:bg-fill/40">
      <td className="px-3 py-2">
        <p className="font-medium text-fg">{rule.name}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted">
          {rule.condition}
        </p>
      </td>
      <td className="px-2 py-2">
        <span
          className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ color: SEVERITY_COLOR[rule.severity] }}
        >
          {rule.severity}
        </span>
      </td>
      <td className="px-2 py-2 tabular-nums">{rule.threshold}</td>
      <td className="px-2 py-2">
        <ResultBadge result={rule.lastResult} />
        <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-muted">
          {rule.lastMessage}
        </p>
      </td>
      <td className="px-2 py-2">
        <button
          type="button"
          onClick={onToggle}
          className={[
            "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] transition-colors",
            rule.enabled
              ? "border-accent/40 bg-accent/10 text-fg"
              : "border-edge text-muted hover:text-fg",
          ].join(" ")}
          aria-pressed={rule.enabled}
        >
          {rule.enabled ? (
            <>
              <Pause className="h-3 w-3" /> On
            </>
          ) : (
            <>
              <Play className="h-3 w-3" /> Off
            </>
          )}
        </button>
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: "ok" | "warn" | "fail" }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-edge px-1.5 py-0.5 text-[10px] text-muted">
        <CheckCircle2 className="h-3 w-3 text-[color:#2a9d6e]" /> OK
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
        <AlertTriangle className="h-3 w-3" /> Warn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-danger/40 bg-danger/10 px-1.5 py-0.5 text-[10px] text-danger">
      <CircleAlert className="h-3 w-3" /> Fail
    </span>
  );
}

function ResultBadge({ result }: { result: "pass" | "fail" | "skip" }) {
  const map = {
    pass: "border-edge bg-fill text-secondary",
    fail: "border-danger/40 bg-danger/10 text-danger",
    skip: "border-edge text-muted",
  } as const;
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${map[result]}`}
    >
      {result}
    </span>
  );
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <article className={`${panelClass} px-3 py-2.5`}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-fg">
        {value}
      </p>
    </article>
  );
}

import type { ProjectDashboardPayload } from "@/lib/api";
import {
  defaultDataEntryState,
  getProductValues,
  readDataEntryState,
} from "@/lib/dataEntryStore";

export type FormulaLanguage = "alcaster" | "sql" | "js";

export type RuleSeverity = "P1" | "P2" | "P3" | "P4";

export type FormulaDef = {
  id: string;
  name: string;
  expression: string;
  unit: string;
  lastValue: number;
  status: "ok" | "warn" | "fail";
};

export type AutomationRule = {
  id: string;
  name: string;
  condition: string;
  threshold: string;
  severity: RuleSeverity;
  enabled: boolean;
  lastResult: "pass" | "fail" | "skip";
  lastMessage: string;
};

export type RuleEvalLog = {
  id: string;
  time: string;
  rule: string;
  result: "pass" | "fail" | "skip";
  message: string;
  durationMs: number;
};

export type RuleEngineConfig = {
  language: FormulaLanguage;
  coreFormulas: string[];
  evalIntervalSec: number;
  alertOnFail: boolean;
};

function hashSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

const FORMULA_EXPRESSIONS: Record<
  string,
  { unit: string; alcaster: string; sql: string; js: string }
> = {
  PR: {
    unit: "%",
    alcaster: "PR = Energy_AC / (Irradiance_POA * Capacity_STC) * 100",
    sql: "SELECT 100.0 * SUM(energy_ac) / NULLIF(SUM(poa)*capacity_stc,0) AS pr",
    js: "const pr = (energyAc / (poaKwh * capacityStc)) * 100",
  },
  Availability: {
    unit: "%",
    alcaster: "Availability = Uptime_Hours / Period_Hours * 100",
    sql: "SELECT 100.0 * uptime_h / NULLIF(period_h,0) AS availability",
    js: "const availability = (uptimeH / periodH) * 100",
  },
  "Specific yield": {
    unit: "kWh/kWp",
    alcaster: "SpecificYield = Energy_AC_kWh / Capacity_kWp",
    sql: "SELECT SUM(energy_ac_kwh) / NULLIF(capacity_kwp,0) AS specific_yield",
    js: "const specificYield = energyAcKwh / capacityKwp",
  },
  "Inverter efficiency": {
    unit: "%",
    alcaster: "InvEff = P_AC / NULLIF(P_DC, 0) * 100",
    sql: "SELECT 100.0 * AVG(p_ac / NULLIF(p_dc,0)) AS inv_eff",
    js: "const invEff = (pAc / Math.max(pDc, 1e-6)) * 100",
  },
  "Tracker availability": {
    unit: "%",
    alcaster: "TrkAvail = Trackers_OK / Trackers_Total * 100",
    sql: "SELECT 100.0 * COUNT(*) FILTER (WHERE ok) / COUNT(*) AS trk_avail",
    js: "const trkAvail = (trackersOk / trackersTotal) * 100",
  },
  "Block A/B split": {
    unit: "MW",
    alcaster: "BlockSplit = { A: SUM(INV_A.P), B: SUM(INV_B.P) }",
    sql: "SELECT block, SUM(p_ac) FROM inv GROUP BY block",
    js: "const split = { A: sumA, B: sumB }",
  },
};

function normalizeFormulaName(raw: string) {
  const t = raw.trim();
  if (!t) return null;
  const known = Object.keys(FORMULA_EXPRESSIONS).find(
    (k) => k.toLowerCase() === t.toLowerCase(),
  );
  return known ?? t;
}

export function readRuleEngineConfig(projectId: string): RuleEngineConfig {
  const values = getProductValues(
    readDataEntryState(projectId) ?? defaultDataEntryState(),
    "rule-engine",
  );
  const lang = (values.formulaLanguage || "alcaster") as FormulaLanguage;
  const formulas = (values.coreFormulas || "PR, Availability, Specific yield")
    .split(/[,/\n]+/)
    .map((s) => normalizeFormulaName(s))
    .filter((s): s is string => Boolean(s));

  return {
    language: ["alcaster", "sql", "js"].includes(lang) ? lang : "alcaster",
    coreFormulas: formulas.length ? formulas : ["PR", "Availability"],
    evalIntervalSec: Math.max(1, Number(values.ruleEvaluationIntervalSec) || 60),
    alertOnFail: (values.alertOnRuleFail || "yes").toLowerCase() === "yes",
  };
}

export function buildFormulas(
  data: ProjectDashboardPayload,
  config: RuleEngineConfig,
  refreshKey = 0,
): FormulaDef[] {
  const rand = mulberry32(
    hashSeed(`${data.project.id}:formulas:${refreshKey}`),
  );
  const prBase = 78 + rand() * 8;
  const avail = data.kpis.availabilityPct;

  return config.coreFormulas.map((name, i) => {
    const exprSet = FORMULA_EXPRESSIONS[name];
    const expression = exprSet
      ? exprSet[config.language]
      : `${name} = f(tags…)`;
    const unit = exprSet?.unit ?? "";

    let lastValue = round(50 + rand() * 40, 2);
    if (name === "PR") lastValue = round(prBase + (rand() - 0.5) * 2, 2);
    if (name === "Availability")
      lastValue = round(avail + (rand() - 0.5) * 1.5, 2);
    if (name === "Specific yield")
      lastValue = round(3.8 + rand() * 1.4, 2);
    if (name === "Inverter efficiency")
      lastValue = round(96.5 + rand() * 2, 2);
    if (name === "Tracker availability")
      lastValue = round(92 + rand() * 6, 2);
    if (name === "Block A/B split")
      lastValue = round(data.kpis.currentOutputMw * (0.45 + rand() * 0.1), 2);

    const status: FormulaDef["status"] =
      lastValue < 70 && unit === "%"
        ? "fail"
        : lastValue < 80 && unit === "%"
          ? "warn"
          : "ok";

    return {
      id: `formula-${i}-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      expression,
      unit,
      lastValue,
      status,
    };
  });
}

const DEFAULT_RULES: Omit<
  AutomationRule,
  "lastResult" | "lastMessage" | "enabled"
>[] = [
  {
    id: "rule-pr-low",
    name: "Low performance ratio",
    condition: "PR < threshold",
    threshold: "75 %",
    severity: "P2",
  },
  {
    id: "rule-inv-fault",
    name: "Inverter fault cascade",
    condition: "INV.FAULT_COUNT >= threshold",
    threshold: "2",
    severity: "P1",
  },
  {
    id: "rule-ghi-spike",
    name: "Irradiance sensor spike",
    condition: "ABS(MET.GHI - MET.POA) > threshold",
    threshold: "250 W/m²",
    severity: "P3",
  },
  {
    id: "rule-avail",
    name: "Plant availability drop",
    condition: "Availability < threshold",
    threshold: "95 %",
    severity: "P2",
  },
  {
    id: "rule-export-limit",
    name: "Export limit approach",
    condition: "GRID.P_EXPORT > threshold * Capacity",
    threshold: "0.95",
    severity: "P3",
  },
  {
    id: "rule-tracker",
    name: "Tracker stall cluster",
    condition: "TRK.STALL_COUNT > threshold",
    threshold: "5",
    severity: "P4",
  },
];

export function buildAutomationRules(
  data: ProjectDashboardPayload,
  refreshKey = 0,
  enabledMap?: Record<string, boolean>,
): AutomationRule[] {
  const rand = mulberry32(hashSeed(`${data.project.id}:rules:${refreshKey}`));

  return DEFAULT_RULES.map((rule) => {
    const roll = rand();
    const lastResult: AutomationRule["lastResult"] =
      roll > 0.82 ? "fail" : roll > 0.12 ? "pass" : "skip";
    const lastMessage =
      lastResult === "fail"
        ? `Condition breached — ${rule.condition}`
        : lastResult === "pass"
          ? "Within limits"
          : "Skipped (tag quality UNCERTAIN)";

    return {
      ...rule,
      enabled: enabledMap?.[rule.id] ?? true,
      lastResult,
      lastMessage,
    };
  });
}

export function buildEvalLog(
  rules: AutomationRule[],
  now: Date,
  refreshKey: number,
  projectId: string,
): RuleEvalLog[] {
  const rand = mulberry32(hashSeed(`${projectId}:eval:${refreshKey}`));
  const active = rules.filter((r) => r.enabled);

  return Array.from({ length: Math.min(12, active.length * 2) }, (_, i) => {
    const rule = active[i % active.length];
    const at = new Date(now.getTime() - i * (15_000 + rand() * 40_000));
    const roll = rand();
    const result: RuleEvalLog["result"] =
      !rule.enabled
        ? "skip"
        : roll > 0.85
          ? "fail"
          : roll > 0.1
            ? "pass"
            : "skip";

    return {
      id: `eval-${refreshKey}-${i}`,
      time: at.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      rule: rule.name,
      result,
      message:
        result === "fail"
          ? rule.lastMessage
          : result === "pass"
            ? "Evaluation OK"
            : "Deferred — quality gate",
      durationMs: Math.round(8 + rand() * 40),
    };
  });
}

export const SEVERITY_COLOR: Record<RuleSeverity, string> = {
  P1: "#e06b75",
  P2: "#e8a54b",
  P3: "rgba(232,165,75,0.75)",
  P4: "color-mix(in srgb, var(--alcaster-fg) 45%, transparent)",
};

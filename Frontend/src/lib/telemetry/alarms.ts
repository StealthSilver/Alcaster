import type { Alarm, AlarmSeverity } from "./types";

export function alarmKey(assetId: string, code: string): string {
  return `${assetId}::${code}`;
}

export function makeAlarmId(assetId: string, code: string): string {
  return `ALM-${assetId}-${code}`;
}

/**
 * Upsert one active alarm per assetId+code. Clears when active=false.
 * Returns a new array (immutable).
 */
export function upsertAlarm(
  alarms: Alarm[],
  input: {
    assetId: string;
    code: string;
    severity: AlarmSeverity;
    message: string;
    active: boolean;
    now: string;
  },
): Alarm[] {
  const id = makeAlarmId(input.assetId, input.code);
  const existing = alarms.find((a) => a.alarmId === id);
  if (!input.active) {
    if (!existing || !existing.active) return alarms;
    return alarms.map((a) =>
      a.alarmId === id
        ? {
            ...a,
            active: false,
            clearedAt: input.now,
            timestamp: input.now,
          }
        : a,
    );
  }
  if (existing?.active) {
    // Keep createdAt; refresh message/severity/timestamp if changed
    if (
      existing.message === input.message &&
      existing.severity === input.severity
    ) {
      return alarms;
    }
    return alarms.map((a) =>
      a.alarmId === id
        ? {
            ...a,
            severity: input.severity,
            message: input.message,
            timestamp: input.now,
          }
        : a,
    );
  }
  const next: Alarm = {
    alarmId: id,
    assetId: input.assetId,
    severity: input.severity,
    code: input.code,
    message: input.message,
    timestamp: input.now,
    createdAt: existing?.createdAt ?? input.now,
    active: true,
    acknowledged: false,
    clearedAt: undefined,
  };
  if (existing) {
    return alarms.map((a) => (a.alarmId === id ? next : a));
  }
  return [...alarms, next];
}

export function activeAlarms(alarms: Alarm[]): Alarm[] {
  return alarms
    .filter((a) => a.active)
    .sort((a, b) => {
      const sev = severityRank(b.severity) - severityRank(a.severity);
      if (sev !== 0) return sev;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

function severityRank(s: AlarmSeverity): number {
  if (s === "CRITICAL") return 3;
  if (s === "WARNING") return 2;
  return 1;
}

export function plantHealthFromAlarms(
  alarms: Alarm[],
): "HEALTHY" | "ATTENTION" | "CRITICAL" {
  const active = alarms.filter((a) => a.active);
  if (active.some((a) => a.severity === "CRITICAL")) return "CRITICAL";
  if (active.some((a) => a.severity === "WARNING")) return "ATTENTION";
  return "HEALTHY";
}

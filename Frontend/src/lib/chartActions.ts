/** Shared chart panel actions: CSV export + element fullscreen. */

export function downloadCsv(filename: string, rows: string[][]) {
  const escape = (cell: string) => {
    if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
    return cell;
  };
  const body = rows.map((row) => row.map((c) => escape(String(c ?? ""))).join(",")).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function toggleElementFullscreen(el: HTMLElement | null) {
  if (!el) return;
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void>;
  };
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };

  const active =
    document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;

  if (active === el) {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    return;
  }

  if (el.requestFullscreen) await el.requestFullscreen();
  else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
}

export function isElementFullscreen(el: HTMLElement | null) {
  if (!el) return false;
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return (
    document.fullscreenElement === el || doc.webkitFullscreenElement === el
  );
}

export function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function formatDisplayRange(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  return `${fmt(start)} — ${fmt(end)}`;
}

export type DateRangeValue = {
  start: Date;
  end: Date;
  preset: "today" | "mtd" | "ytd" | "custom";
};

export function rangeFromPreset(
  preset: "today" | "mtd" | "ytd",
  now = new Date(),
): DateRangeValue {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "today") {
    return { start: new Date(end), end, preset };
  }
  if (preset === "mtd") {
    return {
      start: new Date(end.getFullYear(), end.getMonth(), 1),
      end,
      preset,
    };
  }
  return {
    start: new Date(end.getFullYear(), 0, 1),
    end,
    preset,
  };
}

export function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

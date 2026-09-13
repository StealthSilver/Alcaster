import { useEffect, useState } from "react";

type PlantDashboardMetaProps = {
  plantName: string;
  plantCode?: string;
};

export function PlantDashboardMeta({
  plantName,
  plantCode,
}: PlantDashboardMetaProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stamp = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const code =
    plantCode ||
    plantName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 18);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted">
      <span className="tabular-nums">{stamp}</span>
      <span className="inline-flex h-8 items-center rounded-md border border-edge px-2.5 font-medium text-secondary">
        {code}
      </span>
    </div>
  );
}

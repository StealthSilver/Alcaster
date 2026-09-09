import { AlertTriangle, Circle } from "lucide-react";
import { Link } from "react-router-dom";

import type { AlertSeverity, OperationalAlert } from "@/data/dashboard";

import { panelClass, sectionTitleClass } from "./panel";

type OperationalAlertsProps = {
  alerts: OperationalAlert[];
  viewAllHref?: string;
};

const severityIcon: Record<
  AlertSeverity,
  { Icon: typeof AlertTriangle; className: string }
> = {
  warning: {
    Icon: AlertTriangle,
    className: "text-accent",
  },
  critical: {
    Icon: AlertTriangle,
    className: "text-accent",
  },
  info: {
    Icon: Circle,
    className: "text-muted",
  },
};

export function OperationalAlerts({
  alerts,
  viewAllHref = "/alerts",
}: OperationalAlertsProps) {
  return (
    <section className={panelClass} aria-label="Operational alerts">
      <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3">
        <h2 className={sectionTitleClass}>Alerts</h2>
        <Link
          to={viewAllHref}
          className="text-xs font-medium text-muted transition-colors hover:text-fg"
        >
          View all
        </Link>
      </div>

      {alerts.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">No alerts right now.</p>
      ) : (
        <ul className="divide-y divide-edge">
          {alerts.map((alert) => {
            const { Icon, className } = severityIcon[alert.severity];
            return (
              <li key={alert.id} className="flex gap-3 px-4 py-3">
                <Icon
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${className}`}
                  strokeWidth={1.75}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-fg">{alert.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {alert.plant}
                    <span className="text-subtle"> · </span>
                    {alert.timeAgo}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

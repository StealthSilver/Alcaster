import type { ActivityItem } from "@/data/dashboard";

import { panelClass, sectionTitleClass } from "./panel";

type RecentActivityProps = {
  activity: ActivityItem[];
};

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <section className={panelClass} aria-label="Recent activity">
      <div className="border-b border-edge px-4 py-3">
        <h2 className={sectionTitleClass}>Activity</h2>
      </div>

      {activity.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">No recent activity.</p>
      ) : (
        <ol className="divide-y divide-edge">
          {activity.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <p className="text-xs tabular-nums text-muted">{item.time}</p>
              <p className="mt-0.5 text-sm text-secondary">{item.description}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

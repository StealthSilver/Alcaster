import type { TaskItem, TaskStatus } from "@/lib/api";
import {
  formatTimeAgo,
  taskStatusColor,
  taskStatusLabel,
} from "@/lib/labels";

import { panelClass, sectionHintClass, sectionTitleClass } from "./panel";

type RecentTasksProps = {
  tasks: TaskItem[];
  subtitle?: string;
};

export function RecentTasks({
  tasks,
  subtitle = "Latest work across projects",
}: RecentTasksProps) {
  return (
    <section className={panelClass} aria-label="Recent tasks">
      <div className="border-b border-edge px-4 py-3">
        <h2 className={sectionTitleClass}>Recent tasks</h2>
        <p className={sectionHintClass}>{subtitle}</p>
      </div>

      {tasks.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted">
          No tasks yet. They appear when projects are created.
        </p>
      ) : (
        <ul className="divide-y divide-edge">
          {tasks.map((task) => (
            <li key={task.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-fg">{task.title}</p>
                <TaskBadge status={task.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {task.projectName}
                <span className="text-subtle"> · </span>
                {formatTimeAgo(task.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className="shrink-0 text-xs font-medium"
      style={{ color: taskStatusColor[status] }}
    >
      {taskStatusLabel[status]}
    </span>
  );
}

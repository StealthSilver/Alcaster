import { motion } from "framer-motion";

import type { TaskItem, TaskStatus } from "@/lib/api";
import {
  formatTimeAgo,
  taskStatusColor,
  taskStatusLabel,
} from "@/lib/labels";

type RecentTasksProps = {
  tasks: TaskItem[];
  subtitle?: string;
};

export function RecentTasks({
  tasks,
  subtitle = "Latest work across projects",
}: RecentTasksProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.22)]"
      aria-label="Recent tasks"
    >
      <h2 className="text-base font-semibold tracking-tight text-white">
        Recent Tasks
      </h2>
      <p className="mt-1 text-sm text-white/40">{subtitle}</p>

      {tasks.length === 0 ? (
        <p className="mt-8 text-sm text-white/40">
          No tasks yet. They appear when projects are created.
        </p>
      ) : (
        <ol className="relative mt-5 space-y-0">
          <div className="absolute bottom-2 left-[3.5px] top-2 w-px bg-white/[0.06]" />
          {tasks.map((task, index) => (
            <motion.li
              key={task.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.34 + index * 0.05, duration: 0.4 }}
              className="relative flex gap-4 py-2.5 pl-1"
            >
              <span className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full border border-white/25 bg-[#010609]">
                <motion.span
                  className="absolute inset-0 rounded-full bg-[#e6740a]/50"
                  animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.4, 1] }}
                  transition={{
                    duration: 3,
                    delay: index * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white/80">{task.title}</p>
                  <TaskBadge status={task.status} />
                </div>
                <p className="mt-0.5 text-xs text-white/40">
                  {task.projectName}
                  <span className="text-white/25"> · </span>
                  {formatTimeAgo(task.createdAt)}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </motion.section>
  );
}

function TaskBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em]"
      style={{ color: taskStatusColor[status] }}
    >
      {taskStatusLabel[status]}
    </span>
  );
}

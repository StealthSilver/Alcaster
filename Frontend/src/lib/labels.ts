import type { ProjectStatus, ProjectType, SiteStatus, TaskStatus } from "@/lib/api";

export const siteStatusLabel: Record<SiteStatus, string> = {
  active: "Active",
  pending: "Pending",
  on_hold: "On Hold",
};

export const siteStatusColor: Record<SiteStatus, string> = {
  active: "rgba(120, 180, 140, 0.95)",
  pending: "#e6740a",
  on_hold: "rgba(255,255,255,0.35)",
};

export const projectTypeLabel: Record<ProjectType, string> = {
  solar: "Solar",
  wind: "Wind",
  hybrid: "Hybrid",
  bess: "BESS",
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  active: "Active",
  pending: "Pending",
  on_hold: "On Hold",
  completed: "Completed",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
};

export const projectStatusColor: Record<ProjectStatus, string> = {
  active: "rgba(120, 180, 140, 0.95)",
  pending: "#e6740a",
  on_hold: "rgba(255,255,255,0.35)",
  completed: "rgba(120, 180, 140, 0.7)",
};

export const taskStatusColor: Record<TaskStatus, string> = {
  open: "rgba(255,255,255,0.45)",
  in_progress: "#e6740a",
  completed: "rgba(120, 180, 140, 0.95)",
};

export function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const delta = Math.max(0, Date.now() - then);
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

import type { ProjectStatus, ProjectType, SiteStatus, TaskStatus } from "@/lib/api";

export const siteStatusLabel: Record<SiteStatus, string> = {
  active: "Active",
  pending: "Pending",
  on_hold: "On Hold",
};

export const siteStatusColor: Record<SiteStatus, string> = {
  active: "var(--alcaster-success)",
  pending: "var(--alcaster-accent)",
  on_hold: "var(--alcaster-muted)",
};

export const siteStatusLozenge: Record<SiteStatus, string> = {
  active: "bg-[var(--lozenge-active-bg)] text-[var(--lozenge-active-fg)]",
  pending: "bg-[var(--lozenge-pending-bg)] text-[var(--lozenge-pending-fg)]",
  on_hold: "bg-[var(--lozenge-hold-bg)] text-[var(--lozenge-hold-fg)]",
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
  active: "var(--alcaster-success)",
  pending: "var(--alcaster-accent)",
  on_hold: "var(--alcaster-muted)",
  completed: "var(--alcaster-success)",
};

export const projectStatusLozenge: Record<ProjectStatus, string> = {
  active: "bg-[var(--lozenge-active-bg)] text-[var(--lozenge-active-fg)]",
  pending: "bg-[var(--lozenge-pending-bg)] text-[var(--lozenge-pending-fg)]",
  on_hold: "bg-[var(--lozenge-hold-bg)] text-[var(--lozenge-hold-fg)]",
  completed: "bg-[var(--lozenge-active-bg)] text-[var(--lozenge-active-fg)]",
};

export const taskStatusColor: Record<TaskStatus, string> = {
  open: "var(--alcaster-muted)",
  in_progress: "var(--alcaster-accent)",
  completed: "var(--alcaster-success)",
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

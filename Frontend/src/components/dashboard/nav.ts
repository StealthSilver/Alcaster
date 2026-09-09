import { LayoutDashboard } from "lucide-react";

export type SidebarNavItem = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  match?: "dashboard" | "exact";
};

export function isNavActive(pathname: string, href: string, match?: string) {
  if (match === "dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }
  if (match === "exact") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

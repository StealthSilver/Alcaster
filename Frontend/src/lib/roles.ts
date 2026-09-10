function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

const ADMIN_ROLES = new Set(["admin", "organization manager"]);
const SITE_EDITOR_ROLES = new Set([
  "admin",
  "organization manager",
  "site manager",
]);

export function isAdmin(role: string) {
  return ADMIN_ROLES.has(normalizeRole(role));
}

export function canEditSite(role: string) {
  return SITE_EDITOR_ROLES.has(normalizeRole(role));
}

export function canDeleteSite(role: string) {
  return isAdmin(role);
}

export function canEditProject(role: string) {
  return canEditSite(role);
}

export function canDeleteProject(role: string) {
  return canDeleteSite(role);
}

export function canManageTeam(role: string) {
  return SITE_EDITOR_ROLES.has(normalizeRole(role));
}

export function canAssignAdmin(role: string) {
  return isAdmin(role);
}

export function canManageUsers(role: string) {
  return isAdmin(role);
}

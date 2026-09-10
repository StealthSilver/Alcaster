const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInValues = {
  email: string;
  password: string;
};

export const ACCESS_ROLES = [
  "Admin",
  "Site Manager",
  "Site Engineer",
  "Developer",
] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;

export const TEAM_PASSWORD_HINT =
  "Password must be 4–15 characters and include uppercase, lowercase, a number, and a special character.";

export type AccessRole = (typeof ACCESS_ROLES)[number];
export type Gender = (typeof GENDERS)[number];

export type RequestAccessValues = {
  fullName: string;
  email: string;
  company: string;
  role: AccessRole;
  message: string;
};

export type UpdateProfileValues = {
  name: string;
  currentPassword: string;
  newPassword: string;
};

export function validateSignIn(values: SignInValues) {
  const fields: Partial<SignInValues> = {};

  const email = values.email.trim();
  if (!email) fields.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) fields.email = "Enter a valid email address.";

  if (!values.password) fields.password = "Password is required.";

  return fields;
}

export function validateRequestAccess(values: RequestAccessValues) {
  const fields: Partial<Record<keyof RequestAccessValues, string>> = {};

  const fullName = values.fullName.trim();
  if (!fullName) fields.fullName = "Full name is required.";
  else if (fullName.length < 2) fields.fullName = "Enter your full name.";

  const email = values.email.trim();
  if (!email) fields.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) fields.email = "Enter a valid email address.";

  const company = values.company.trim();
  if (!company) fields.company = "Company is required.";
  else if (company.length < 2) fields.company = "Enter your company name.";

  if (!ACCESS_ROLES.includes(values.role)) {
    fields.role = "Select a role.";
  }

  const message = values.message.trim();
  if (!message) fields.message = "Message is required.";
  else if (message.length < 10) {
    fields.message = "Tell us a bit more about why you need access.";
  }

  return fields;
}

export function isTeamPassword(value: string) {
  return (
    value.length >= 4 &&
    value.length <= 15 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export function validateUpdateProfile(values: UpdateProfileValues) {
  const fields: Partial<UpdateProfileValues> = {};

  const name = values.name.trim();
  if (!name) fields.name = "Full name is required.";
  else if (name.length < 2) fields.name = "Enter your full name.";

  const newPassword = values.newPassword.trim();
  if (newPassword && newPassword.length < 8) {
    fields.newPassword = "New password must be at least 8 characters.";
  }
  if (newPassword && !values.currentPassword) {
    fields.currentPassword = "Enter your current password to set a new one.";
  }

  return fields;
}

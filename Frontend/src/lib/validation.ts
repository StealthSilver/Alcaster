const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInValues = {
  email: string;
  password: string;
};

export type RequestAccessValues = {
  fullName: string;
  email: string;
  company: string;
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
  const fields: Partial<RequestAccessValues> = {};

  const fullName = values.fullName.trim();
  if (!fullName) fields.fullName = "Full name is required.";
  else if (fullName.length < 2) fields.fullName = "Enter your full name.";

  const email = values.email.trim();
  if (!email) fields.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) fields.email = "Enter a valid email address.";

  const company = values.company.trim();
  if (!company) fields.company = "Company is required.";
  else if (company.length < 2) fields.company = "Enter your company name.";

  const message = values.message.trim();
  if (!message) fields.message = "Message is required.";
  else if (message.length < 10) {
    fields.message = "Tell us a bit more about why you need access.";
  }

  return fields;
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

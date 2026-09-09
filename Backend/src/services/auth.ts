import { HttpError } from "../errors.js";
import { toPublicUser, verifyPassword } from "../lib/crypto.js";
import {
  createAccessRequest,
  findAccessRequestByEmail,
  findUserByEmail,
  findUserById,
  getDummyPasswordHash,
} from "../data/store.js";
import type { PublicUser, RequestAccessInput, SignInInput } from "../types.js";

export async function signIn(input: SignInInput): Promise<PublicUser> {
  const user = await findUserByEmail(input.email);
  const pending = await findAccessRequestByEmail(input.email);

  if (!user && pending) {
    throw new HttpError(
      403,
      "Your access request is still pending. We'll get back to you soon.",
    );
  }

  const passwordHash = user?.passwordHash ?? getDummyPasswordHash();
  const passwordOk = passwordHash
    ? await verifyPassword(input.password, passwordHash)
    : false;

  if (!user || !passwordOk) {
    throw new HttpError(401, "Invalid email or password.");
  }

  return toPublicUser(user);
}

export async function requestAccess(
  input: RequestAccessInput,
): Promise<{ message: string }> {
  if (await findUserByEmail(input.email)) {
    throw new HttpError(
      409,
      "An account with this email already exists. Sign in instead.",
    );
  }

  if (await findAccessRequestByEmail(input.email)) {
    throw new HttpError(
      409,
      "You've already requested access with this email. We'll get back to you soon.",
    );
  }

  try {
    await createAccessRequest(input);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new HttpError(
        409,
        "You've already requested access with this email. We'll get back to you soon.",
      );
    }
    throw error;
  }

  return {
    message: "We've received your request and will get back to you.",
  };
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
  return toPublicUser(user);
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

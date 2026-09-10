import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { config } from "../config.js";
import type { PublicUser } from "../types.js";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

type TokenPayload = {
  sub: string;
  email: string;
};

export function signAuthToken(user: PublicUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email } satisfies TokenPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export function verifyAuthToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.sub !== "string" ||
    typeof decoded.email !== "string"
  ) {
    throw new Error("Invalid token payload.");
  }
  return { sub: decoded.sub, email: decoded.email };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  const second = parts[1];
  if (!second) return first.slice(0, 1).toUpperCase();
  return (first.slice(0, 1) + second.slice(0, 1)).toUpperCase();
}

export function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string | null;
  organizationName?: string | null;
  siteIds?: string[];
  createdAt?: string | null;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: getInitials(user.name),
    organizationId: user.organizationId ?? null,
    organizationName: user.organizationName ?? null,
    siteIds: user.siteIds ?? [],
    createdAt: user.createdAt ?? null,
  };
}

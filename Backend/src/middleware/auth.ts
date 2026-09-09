import type { NextFunction, Request, Response } from "express";

import { config } from "../config.js";
import { HttpError } from "../errors.js";
import { findUserById } from "../data/store.js";
import { toPublicUser, verifyAuthToken } from "../lib/crypto.js";
import type { PublicUser } from "../types.js";

export type AuthenticatedRequest = Request & { user: PublicUser };

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[config.cookieName];
  if (typeof token !== "string" || token.length === 0) {
    next(new HttpError(401, "Please sign in to continue."));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await findUserById(payload.sub);
    if (!user) {
      next(
        new HttpError(401, "Your session has expired. Please sign in again."),
      );
      return;
    }
    (req as AuthenticatedRequest).user = toPublicUser(user);
    next();
  } catch {
    next(new HttpError(401, "Your session has expired. Please sign in again."));
  }
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type AttemptState = { count: number; resetAt: number };
const signInAttempts = new Map<string, AttemptState>();

export function signInRateLimit(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = signInAttempts.get(key);

  if (!current || now >= current.resetAt) {
    signInAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_ATTEMPTS) {
    next(
      new HttpError(
        429,
        "Too many sign-in attempts. Please try again in a few minutes.",
      ),
    );
    return;
  }

  current.count += 1;
  next();
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.fields ? { fields: err.fields } : {}),
    });
    return;
  }

  if (err instanceof SyntaxError) {
    res.status(400).json({ message: "Invalid JSON body." });
    return;
  }

  console.error(err);
  res.status(500).json({
    message: "Something went wrong. Please try again.",
  });
}

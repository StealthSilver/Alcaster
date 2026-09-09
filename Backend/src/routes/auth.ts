import { Router, type CookieOptions, type Request, type Response } from "express";

import { config } from "../config.js";
import {
  parseBody,
  requestAccessSchema,
  signInSchema,
} from "../lib/validation.js";
import { signAuthToken } from "../lib/crypto.js";
import { requireAuth, signInRateLimit, type AuthenticatedRequest } from "../middleware/auth.js";
import { getCurrentUser, requestAccess, signIn } from "../services/auth.js";

export const authRouter = Router();

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: config.cookieSameSite,
    secure: config.cookieSecure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

authRouter.post(
  "/signin",
  signInRateLimit,
  async (req: Request, res: Response, next) => {
    try {
      const input = parseBody(signInSchema, req.body);
      const user = await signIn(input);
      const token = signAuthToken(user);

      res.cookie(config.cookieName, token, cookieOptions());
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post("/request-access", async (req: Request, res: Response, next) => {
  try {
    const input = parseBody(requestAccessSchema, req.body);
    const result = await requestAccess(input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req: Request, res: Response, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    res.status(200).json({ user: await getCurrentUser(user.id) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/signout", (_req: Request, res: Response) => {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    sameSite: config.cookieSameSite,
    secure: config.cookieSecure,
    path: "/",
  });
  res.status(200).json({ message: "Signed out." });
});

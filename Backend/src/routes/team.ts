import { Router, type Request, type Response } from "express";

import { HttpError } from "../errors.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  createTeamMemberSchema,
  parseBody,
  updateTeamMemberSchema,
} from "../lib/validation.js";
import {
  createTeamMember,
  deleteTeamMember,
  listTeamMembers,
  updateTeamMember,
} from "../services/team.js";

export const teamRouter = Router();

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function routeUserId(req: Request): string {
  const value = req.params.userId;
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, "Select a valid team member.");
  }
  return value;
}

teamRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const siteId = queryString(req.query.siteId);
      if (!siteId) {
        throw new HttpError(400, "Select a site.", {
          siteId: "Select a site.",
        });
      }
      const members = await listTeamMembers(user, siteId);
      res.status(200).json({ members });
    } catch (error) {
      next(error);
    }
  },
);

teamRouter.post(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const input = parseBody(createTeamMemberSchema, req.body);
      const member = await createTeamMember(user, input);
      res.status(201).json({ member });
    } catch (error) {
      next(error);
    }
  },
);

teamRouter.patch(
  "/:userId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const input = parseBody(updateTeamMemberSchema, req.body);
      const member = await updateTeamMember(user, routeUserId(req), input);
      res.status(200).json({ member });
    } catch (error) {
      next(error);
    }
  },
);

teamRouter.delete(
  "/:userId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      await deleteTeamMember(user, routeUserId(req));
      res.status(200).json({ message: "Team member deleted." });
    } catch (error) {
      next(error);
    }
  },
);

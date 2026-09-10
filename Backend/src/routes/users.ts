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
import { canManageUsers } from "../lib/roles.js";
import {
  createTeamMember,
  deleteTeamMember,
  getOrgUser,
  listOrgUsers,
  updateTeamMember,
} from "../services/team.js";

export const usersRouter = Router();

function requireUsersAdmin(req: AuthenticatedRequest) {
  if (!canManageUsers(req.user.role)) {
    throw new HttpError(403, "You do not have permission to manage users.");
  }
}

function routeUserId(req: Request): string {
  const value = req.params.userId;
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, "Select a valid user.");
  }
  return value;
}

usersRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      requireUsersAdmin(req as AuthenticatedRequest);
      const users = await listOrgUsers(user);
      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.get(
  "/:userId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      requireUsersAdmin(req as AuthenticatedRequest);
      const found = await getOrgUser(user, routeUserId(req));
      res.status(200).json({ user: found });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.post(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      requireUsersAdmin(req as AuthenticatedRequest);
      const input = parseBody(createTeamMemberSchema, req.body);
      const created = await createTeamMember(user, input);
      res.status(201).json({ user: created });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.patch(
  "/:userId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      requireUsersAdmin(req as AuthenticatedRequest);
      const input = parseBody(updateTeamMemberSchema, req.body);
      const updated = await updateTeamMember(user, routeUserId(req), input);
      res.status(200).json({ user: updated });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.delete(
  "/:userId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      requireUsersAdmin(req as AuthenticatedRequest);
      await deleteTeamMember(user, routeUserId(req));
      res.status(200).json({ message: "User deleted." });
    } catch (error) {
      next(error);
    }
  },
);

import { Router, type Request, type Response } from "express";

import { HttpError } from "../errors.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import {
  createProjectSchema,
  createSiteSchema,
  createTwinSchema,
  parseBody,
} from "../lib/validation.js";
import {
  createProject,
  getDashboard,
  getProject,
  getProjectDashboard,
  listProjects,
} from "../services/projects.js";
import { createSite, listSites } from "../services/sites.js";
import { getTwin, upsertTwin } from "../services/twins.js";

export const dashboardRouter = Router();
export const projectsRouter = Router();
export const sitesRouter = Router();

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function routeProjectId(req: Request): string {
  const value = req.params.projectId;
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, "Select a valid project.");
  }
  return value;
}

dashboardRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const dashboard = await getDashboard(user, queryString(req.query.siteId));
      res.status(200).json(dashboard);
    } catch (error) {
      next(error);
    }
  },
);

sitesRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const sites = await listSites(user);
      res.status(200).json({ sites });
    } catch (error) {
      next(error);
    }
  },
);

sitesRouter.post(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const input = parseBody(createSiteSchema, req.body);
      const site = await createSite(user, input);
      res.status(201).json({ site });
    } catch (error) {
      next(error);
    }
  },
);

projectsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const projects = await listProjects(user, queryString(req.query.siteId));
      res.status(200).json({ projects });
    } catch (error) {
      next(error);
    }
  },
);

projectsRouter.post(
  "/",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const input = parseBody(createProjectSchema, req.body);
      const project = await createProject(user, input);
      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  },
);

projectsRouter.get(
  "/:projectId/twin",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const twin = await getTwin(user, routeProjectId(req));
      res.status(200).json({ twin });
    } catch (error) {
      next(error);
    }
  },
);

projectsRouter.post(
  "/:projectId/twin",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const input = parseBody(createTwinSchema, req.body);
      const twin = await upsertTwin(user, routeProjectId(req), input);
      res.status(201).json({ twin });
    } catch (error) {
      next(error);
    }
  },
);

projectsRouter.get(
  "/:projectId/dashboard",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const dashboard = await getProjectDashboard(user, routeProjectId(req));
      res.status(200).json(dashboard);
    } catch (error) {
      next(error);
    }
  },
);

projectsRouter.get(
  "/:projectId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const project = await getProject(user, routeProjectId(req));
      res.status(200).json({ project });
    } catch (error) {
      next(error);
    }
  },
);

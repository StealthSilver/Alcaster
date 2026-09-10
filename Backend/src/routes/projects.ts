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
  updateProjectSchema,
  updateSiteSchema,
} from "../lib/validation.js";
import {
  createProject,
  deleteProject,
  getDashboard,
  getProject,
  getProjectDashboard,
  listProjects,
  updateProject,
} from "../services/projects.js";
import {
  createSite,
  deleteSite,
  listSites,
  updateSite,
} from "../services/sites.js";
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

function routeSiteId(req: Request): string {
  const value = req.params.siteId;
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, "Select a valid site.");
  }
  return value;
}

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

sitesRouter.patch(
  "/:siteId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const input = parseBody(updateSiteSchema, req.body);
      const site = await updateSite(user, routeSiteId(req), input);
      res.status(200).json({ site });
    } catch (error) {
      next(error);
    }
  },
);

sitesRouter.delete(
  "/:siteId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      await deleteSite(user, routeSiteId(req));
      res.status(200).json({ message: "Site deleted." });
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

projectsRouter.patch(
  "/:projectId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const input = parseBody(updateProjectSchema, req.body);
      const project = await updateProject(user, routeProjectId(req), input);
      res.status(200).json({ project });
    } catch (error) {
      next(error);
    }
  },
);

projectsRouter.delete(
  "/:projectId",
  requireAuth,
  async (req: Request, res: Response, next) => {
    try {
      const { user } = req as AuthenticatedRequest;
      await deleteProject(user, routeProjectId(req));
      res.status(200).json({ message: "Project deleted." });
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

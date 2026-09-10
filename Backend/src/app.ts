import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express from "express";

import { config } from "./config.js";
import { errorHandler } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter, projectsRouter, sitesRouter } from "./routes/projects.js";
import { teamRouter } from "./routes/team.js";
import { usersRouter } from "./routes/users.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    } satisfies CorsOptions),
  );
  app.use(express.json({ limit: "16kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/sites", sitesRouter);
  app.use("/api/team", teamRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/projects", projectsRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: "Not found." });
  });

  app.use(errorHandler);

  return app;
}

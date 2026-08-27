import express from "express";
import cors from "cors";
import session from "express-session";
import { config } from "./config";
import healthRoutes from "./routes/health.routes";
import teamRoutes from "./routes/team.routes";
import songRoutes from "./routes/song.routes";
import gameRoutes from "./routes/game.routes";
import adminRoutes from "./routes/admin.routes";
import { notFound, errorHandler } from "./middleware/errorHandler";

export function createApp(): express.Application {
  const app = express();

  app.use(
    session({
      name: "flute.sid",
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: config.isProduction ? "none" : "lax",
        secure: config.isProduction,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        domain: process.env.NODE_ENV === "production" ? ".vercel.app" : undefined, // 👈 Important !
      },
    })
  );

  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );
  app.use(express.json());

  app.use("/api", healthRoutes);
  app.use("/api", teamRoutes);
  app.use("/api", songRoutes);
  app.use("/api", gameRoutes);
  app.use("/api", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

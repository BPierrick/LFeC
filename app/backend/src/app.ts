import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from 'pg';

import { config } from "./config";
import healthRoutes from "./routes/health.routes";
import teamRoutes from "./routes/team.routes";
import songRoutes from "./routes/song.routes";
import gameRoutes from "./routes/game.routes";
import adminRoutes from "./routes/admin.routes";
import { notFound, errorHandler } from "./middleware/errorHandler";

export function createApp(): express.Application {

  const PgSession = connectPgSimple(session);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);
  app.use(
    session({
      store: config.isProduction ? new PgSession({ pool, tableName: 'session', createTableIfMissing: true }) : undefined,
      name: "flute.sid",
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.isProduction,
        httpOnly: true,
        sameSite: "lax",
        // domain: "l-fe-c.vercel.app", // 👈 Important !
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE',],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  app.use("/api", healthRoutes);
  app.use("/api", teamRoutes);
  app.use("/api", songRoutes);
  app.use("/api", gameRoutes);
  app.use("/api", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

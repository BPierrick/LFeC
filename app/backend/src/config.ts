import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Variable d'environnement manquante en production : ${name}`);
    }
    return fallback ?? "";
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 5001),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  sessionSecret: required("SESSION_SECRET", "dev-secret-change-me"),
  adminPassword: required("ADMIN_PASSWORD", "dev-admin-change-me"),
  isProduction: process.env.NODE_ENV === "production",
};

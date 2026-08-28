import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route introuvable." });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  
  // ⚠️ Vérifie si une réponse a déjà été envoyée
  if (res.headersSent) {
    return next(err); // Passe l'erreur au middleware par défaut d'Express
  }

  console.error("[error]", err.message);
  res.status(500).json({ error: "Erreur interne du serveur." });
}

import type { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.isAdmin) {
    res.status(403).json({ error: "Accès réservé à l'administrateur." });
    return;
  }
  next();
}

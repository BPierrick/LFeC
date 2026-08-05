import { Router } from "express";
import { config } from "../config";

const router = Router();

router.post("/admin/login", (req, res) => {
  const password = (req.body?.password ?? "").toString();

  if (!password) {
    res.status(400).json({ error: "Le mot de passe est requis." });
    return;
  }
  if (password !== config.adminPassword) {
    res.status(401).json({ error: "Mot de passe incorrect." });
    return;
  }

  req.session.isAdmin = true;
  res.json({ success: true });
});

router.post("/admin/logout", (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

router.get("/admin/session", (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

export default router;

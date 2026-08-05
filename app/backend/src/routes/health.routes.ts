import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend opérationnel 🚀" });
});

export default router;

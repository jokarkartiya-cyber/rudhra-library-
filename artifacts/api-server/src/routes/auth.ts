import { Router } from "express";
import rateLimit from "express-rate-limit";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    loginAttempts?: number;
  }
}

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Bahut zyada attempts. 15 minute baad try karo." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/auth/login", loginLimiter, (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env["ADMIN_PASSWORD"];

  if (!adminPassword) {
    res.status(500).json({ error: "Admin password not configured on server." });
    return;
  }

  if (!password || password !== adminPassword) {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    req.log.warn({ ip }, "Failed login attempt");
    res.status(401).json({ error: "Galat password hai. Dobara try karo." });
    return;
  }

  req.session.isAdmin = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session save failed." });
      return;
    }
    res.json({ ok: true });
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ isAdmin: !!req.session?.isAdmin });
});

export default router;

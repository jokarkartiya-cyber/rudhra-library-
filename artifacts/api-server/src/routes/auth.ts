import { Router } from "express";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
  }
}

const router = Router();

router.post("/auth/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env["ADMIN_PASSWORD"];

  if (!adminPassword) {
    res.status(500).json({ error: "Admin password not configured on server." });
    return;
  }

  if (!password || password !== adminPassword) {
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

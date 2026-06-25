import { Router } from "express";
import { prisma } from "../prisma.js";

export const usersRouter = Router();

// POST /users — create or retrieve user by username
usersRouter.post("/", async (req, res) => {
  const { username } = req.body as { username: string };
  if (!username || username.trim().length === 0) {
    res.status(400).json({ error: "username is required" });
    return;
  }
  try {
    const user = await prisma.user.upsert({
      where: { username: username.trim() },
      update: {},
      create: { username: username.trim() },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// GET /users/:id
usersRouter.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

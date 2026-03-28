import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { exerciseEntriesTable } from "@workspace/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/exercise", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const days = parseInt(req.query["days"] as string || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split("T")[0]!;

  const entries = await db.select().from(exerciseEntriesTable)
    .where(and(eq(exerciseEntriesTable.userId, userId), gte(exerciseEntriesTable.date, sinceDate)))
    .orderBy(desc(exerciseEntriesTable.date));

  res.json(entries);
});

router.post("/exercise", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { date, type, duration, intensity, calories, notes } = req.body;

  const [entry] = await db.insert(exerciseEntriesTable).values({
    userId, date, type, duration, intensity, calories, notes
  }).returning();

  res.status(201).json(entry);
});

export default router;

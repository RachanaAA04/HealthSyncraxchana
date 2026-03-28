import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { symptomEntriesTable } from "@workspace/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/symptoms", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const days = parseInt(req.query["days"] as string || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split("T")[0]!;

  const entries = await db.select().from(symptomEntriesTable)
    .where(and(eq(symptomEntriesTable.userId, userId), gte(symptomEntriesTable.date, sinceDate)))
    .orderBy(desc(symptomEntriesTable.date));

  res.json(entries);
});

router.post("/symptoms", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { date, mood, energyLevel, painLevel, weight, cycleDay, symptoms, notes } = req.body;

  const [entry] = await db.insert(symptomEntriesTable).values({
    userId, date, mood, energyLevel, painLevel, weight, cycleDay, symptoms: symptoms || [], notes
  }).returning();

  res.status(201).json(entry);
});

export default router;

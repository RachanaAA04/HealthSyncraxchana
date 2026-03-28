import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { nutritionEntriesTable } from "@workspace/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/nutrition", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const days = parseInt(req.query["days"] as string || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split("T")[0]!;

  const entries = await db.select().from(nutritionEntriesTable)
    .where(and(eq(nutritionEntriesTable.userId, userId), gte(nutritionEntriesTable.date, sinceDate)))
    .orderBy(desc(nutritionEntriesTable.date));

  res.json(entries);
});

router.post("/nutrition", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { date, meal, foods, calories, protein, carbs, fat, notes } = req.body;

  const [entry] = await db.insert(nutritionEntriesTable).values({
    userId, date, meal, foods: foods || [], calories, protein, carbs, fat, notes
  }).returning();

  res.status(201).json(entry);
});

export default router;

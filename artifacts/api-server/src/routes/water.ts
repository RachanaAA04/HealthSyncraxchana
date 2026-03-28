import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { waterIntakeTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/water", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0];

  const [intake] = await db.select().from(waterIntakeTable)
    .where(and(eq(waterIntakeTable.userId, userId), eq(waterIntakeTable.date, today)));

  if (!intake) {
    res.json({ userId, date: today, glasses: 0, goalGlasses: 8 });
    return;
  }
  res.json(intake);
});

router.post("/water", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0];
  const { glasses, goalGlasses } = req.body;

  const [existing] = await db.select().from(waterIntakeTable)
    .where(and(eq(waterIntakeTable.userId, userId), eq(waterIntakeTable.date, today)));

  if (existing) {
    const [updated] = await db.update(waterIntakeTable)
      .set({ glasses, goalGlasses: goalGlasses ?? existing.goalGlasses })
      .where(and(eq(waterIntakeTable.userId, userId), eq(waterIntakeTable.date, today)))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(waterIntakeTable)
      .values({ userId, date: today, glasses, goalGlasses: goalGlasses ?? 8 })
      .returning();
    res.json(created);
  }
});

export default router;

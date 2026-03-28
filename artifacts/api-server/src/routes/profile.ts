import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProfilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  let [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId));
  if (!profile) {
    [profile] = await db.insert(userProfilesTable).values({ userId }).returning();
  }
  res.json(profile);
});

router.put("/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { age, weight, height, condition, emergencyContact, emergencyPhone, cycleLength, lastPeriodDate, thyroidType } = req.body;

  let [existing] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId));
  if (!existing) {
    [existing] = await db.insert(userProfilesTable).values({ userId }).returning();
  }

  const [updated] = await db
    .update(userProfilesTable)
    .set({ age, weight, height, condition, emergencyContact, emergencyPhone, cycleLength, lastPeriodDate, thyroidType, updatedAt: new Date() })
    .where(eq(userProfilesTable.userId, userId))
    .returning();

  res.json(updated);
});

export default router;

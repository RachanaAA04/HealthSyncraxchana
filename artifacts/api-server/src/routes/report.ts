import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  medicationsTable,
  medicationLogsTable,
  symptomEntriesTable,
  exerciseEntriesTable,
  waterIntakeTable,
  nutritionEntriesTable,
  riskAssessmentsTable,
} from "@workspace/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/report", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const days = parseInt(req.query["days"] as string || "30");

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split("T")[0]!;

  const [medications, symptomTrends, exerciseLogs, waterLogs, nutritionLogs, riskHistory] = await Promise.all([
    db.select().from(medicationsTable).where(and(eq(medicationsTable.userId, userId), eq(medicationsTable.isActive, true))),
    db.select().from(symptomEntriesTable)
      .where(and(eq(symptomEntriesTable.userId, userId), gte(symptomEntriesTable.date, sinceDate)))
      .orderBy(desc(symptomEntriesTable.date)),
    db.select().from(exerciseEntriesTable)
      .where(and(eq(exerciseEntriesTable.userId, userId), gte(exerciseEntriesTable.date, sinceDate))),
    db.select().from(waterIntakeTable)
      .where(and(eq(waterIntakeTable.userId, userId), gte(waterIntakeTable.date, sinceDate))),
    db.select().from(nutritionEntriesTable)
      .where(and(eq(nutritionEntriesTable.userId, userId), gte(nutritionEntriesTable.date, sinceDate))),
    db.select().from(riskAssessmentsTable)
      .where(and(eq(riskAssessmentsTable.userId, userId), gte(riskAssessmentsTable.assessedAt, since)))
      .orderBy(desc(riskAssessmentsTable.assessedAt)),
  ]);

  let medicationAdherence = 0;
  if (medications.length > 0) {
    const medLogs = await db.select().from(medicationLogsTable)
      .where(and(eq(medicationLogsTable.userId, userId), gte(medicationLogsTable.date, sinceDate)));

    const expectedDoses = medications.length * days;
    medicationAdherence = expectedDoses > 0 ? Math.min((medLogs.length / expectedDoses) * 100, 100) : 0;
  }

  const totalMinutes = exerciseLogs.reduce((sum, e) => sum + e.duration, 0);
  const exerciseSummary = {
    totalSessions: exerciseLogs.length,
    totalMinutes,
    avgIntensity: exerciseLogs.length > 0
      ? (exerciseLogs.filter(e => e.intensity === "high").length > exerciseLogs.length / 2 ? "High" :
         exerciseLogs.filter(e => e.intensity === "medium").length > exerciseLogs.length / 2 ? "Medium" : "Low")
      : "N/A",
  };

  const waterWithGoal = waterLogs.filter(w => w.goalGlasses > 0);
  const waterAdherence = waterWithGoal.length > 0
    ? (waterWithGoal.filter(w => w.glasses >= w.goalGlasses).length / days) * 100
    : 0;

  const avgCalories = nutritionLogs.length > 0
    ? nutritionLogs.reduce((sum, n) => sum + (n.calories ?? 0), 0) / nutritionLogs.length
    : null;
  const avgProtein = nutritionLogs.length > 0
    ? nutritionLogs.reduce((sum, n) => sum + (n.protein ?? 0), 0) / nutritionLogs.length
    : null;

  res.json({
    userId,
    period: `Last ${days} days`,
    medicationAdherence,
    symptomTrends,
    exerciseSummary,
    waterAdherence,
    riskHistory,
    nutritionSummary: { avgCalories, avgProtein },
  });
});

export default router;

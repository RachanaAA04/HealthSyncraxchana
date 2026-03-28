import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  medicationsTable,
  medicationLogsTable,
  waterIntakeTable,
  symptomEntriesTable,
  exerciseEntriesTable,
  riskAssessmentsTable,
} from "@workspace/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0]!;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0]!;

  const [medications, takenLogs, waterIntake, latestSymptom, weekExercise, latestRisk] = await Promise.all([
    db.select().from(medicationsTable).where(and(eq(medicationsTable.userId, userId), eq(medicationsTable.isActive, true))),
    db.select().from(medicationLogsTable).where(and(eq(medicationLogsTable.userId, userId), eq(medicationLogsTable.date, today))),
    db.select().from(waterIntakeTable).where(and(eq(waterIntakeTable.userId, userId), eq(waterIntakeTable.date, today))).then(r => r[0]),
    db.select().from(symptomEntriesTable).where(eq(symptomEntriesTable.userId, userId)).orderBy(desc(symptomEntriesTable.date)).limit(1).then(r => r[0]),
    db.select().from(exerciseEntriesTable).where(and(eq(exerciseEntriesTable.userId, userId), gte(exerciseEntriesTable.date, weekAgoStr))),
    db.select().from(riskAssessmentsTable).where(eq(riskAssessmentsTable.userId, userId)).orderBy(desc(riskAssessmentsTable.assessedAt)).limit(1).then(r => r[0]),
  ]);

  const takenIds = new Set(takenLogs.map(l => l.medicationId));
  const todaysMedications = medications.map(med => ({ ...med, takenToday: takenIds.has(med.id) }));

  const streak = await calculateStreak(userId);

  res.json({
    todaysMedications,
    waterIntake: waterIntake ?? { userId, date: today, glasses: 0, goalGlasses: 8 },
    latestSymptoms: latestSymptom ?? null,
    riskLevel: latestRisk?.riskLevel ?? null,
    weeklyExerciseCount: weekExercise.length,
    streak,
  });
});

async function calculateStreak(userId: string): Promise<number> {
  let streak = 0;
  const checkDate = new Date();

  for (let i = 0; i < 30; i++) {
    const dateStr = checkDate.toISOString().split("T")[0]!;
    const [entry] = await db.select().from(symptomEntriesTable)
      .where(and(eq(symptomEntriesTable.userId, userId), eq(symptomEntriesTable.date, dateStr)))
      .limit(1);

    if (!entry) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

export default router;

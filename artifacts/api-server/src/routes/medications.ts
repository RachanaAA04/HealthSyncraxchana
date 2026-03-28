import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { medicationsTable, medicationLogsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/medications", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const today = new Date().toISOString().split("T")[0];

  const medications = await db.select().from(medicationsTable)
    .where(and(eq(medicationsTable.userId, userId), eq(medicationsTable.isActive, true)));

  const takenLogs = await db.select().from(medicationLogsTable)
    .where(and(eq(medicationLogsTable.userId, userId), eq(medicationLogsTable.date, today)));

  const takenIds = new Set(takenLogs.map(l => l.medicationId));

  const result = medications.map(med => ({
    ...med,
    takenToday: takenIds.has(med.id),
  }));

  res.json(result);
});

router.post("/medications", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { name, dosage, frequency, time, notes } = req.body;

  const [med] = await db.insert(medicationsTable).values({
    userId, name, dosage, frequency, time, notes, isActive: true
  }).returning();

  res.status(201).json({ ...med, takenToday: false });
});

router.put("/medications/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const id = parseInt(req.params["id"]!);
  const { name, dosage, frequency, time, notes } = req.body;

  const [updated] = await db.update(medicationsTable)
    .set({ name, dosage, frequency, time, notes })
    .where(and(eq(medicationsTable.id, id), eq(medicationsTable.userId, userId)))
    .returning();

  const today = new Date().toISOString().split("T")[0];
  const [log] = await db.select().from(medicationLogsTable)
    .where(and(eq(medicationLogsTable.medicationId, id), eq(medicationLogsTable.date, today)));

  res.json({ ...updated, takenToday: !!log });
});

router.delete("/medications/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const id = parseInt(req.params["id"]!);

  await db.update(medicationsTable)
    .set({ isActive: false })
    .where(and(eq(medicationsTable.id, id), eq(medicationsTable.userId, userId)));

  res.json({ success: true });
});

router.post("/medications/:id/taken", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const id = parseInt(req.params["id"]!);
  const today = new Date().toISOString().split("T")[0];

  const [existing] = await db.select().from(medicationLogsTable)
    .where(and(eq(medicationLogsTable.medicationId, id), eq(medicationLogsTable.date, today)));

  if (!existing) {
    await db.insert(medicationLogsTable).values({ medicationId: id, userId, date: today });
  }

  res.json({ success: true, message: "Medication marked as taken" });
});

export default router;

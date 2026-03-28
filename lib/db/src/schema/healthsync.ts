import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  age: integer("age"),
  weight: real("weight"),
  height: real("height"),
  condition: text("condition"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  cycleLength: integer("cycle_length"),
  lastPeriodDate: text("last_period_date"),
  thyroidType: text("thyroid_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  time: text("time").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicationSchema = createInsertSchema(medicationsTable).omit({ id: true, createdAt: true });
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type Medication = typeof medicationsTable.$inferSelect;

export const medicationLogsTable = pgTable("medication_logs", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull(),
  userId: text("user_id").notNull(),
  takenAt: timestamp("taken_at").defaultNow().notNull(),
  date: date("date").notNull(),
});

export const insertMedicationLogSchema = createInsertSchema(medicationLogsTable).omit({ id: true, takenAt: true });
export type InsertMedicationLog = z.infer<typeof insertMedicationLogSchema>;
export type MedicationLog = typeof medicationLogsTable.$inferSelect;

export const waterIntakeTable = pgTable("water_intake", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  glasses: integer("glasses").default(0).notNull(),
  goalGlasses: integer("goal_glasses").default(8).notNull(),
});

export const insertWaterIntakeSchema = createInsertSchema(waterIntakeTable).omit({ id: true });
export type InsertWaterIntake = z.infer<typeof insertWaterIntakeSchema>;
export type WaterIntake = typeof waterIntakeTable.$inferSelect;

export const symptomEntriesTable = pgTable("symptom_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  mood: integer("mood"),
  energyLevel: integer("energy_level"),
  painLevel: integer("pain_level"),
  weight: real("weight"),
  cycleDay: integer("cycle_day"),
  symptoms: jsonb("symptoms").$type<string[]>().default([]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSymptomEntrySchema = createInsertSchema(symptomEntriesTable).omit({ id: true, createdAt: true });
export type InsertSymptomEntry = z.infer<typeof insertSymptomEntrySchema>;
export type SymptomEntry = typeof symptomEntriesTable.$inferSelect;

export const exerciseEntriesTable = pgTable("exercise_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  type: text("type").notNull(),
  duration: integer("duration").notNull(),
  intensity: text("intensity").notNull(),
  calories: integer("calories"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExerciseEntrySchema = createInsertSchema(exerciseEntriesTable).omit({ id: true, createdAt: true });
export type InsertExerciseEntry = z.infer<typeof insertExerciseEntrySchema>;
export type ExerciseEntry = typeof exerciseEntriesTable.$inferSelect;

export const nutritionEntriesTable = pgTable("nutrition_entries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  meal: text("meal").notNull(),
  foods: jsonb("foods").$type<string[]>().default([]).notNull(),
  calories: integer("calories"),
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNutritionEntrySchema = createInsertSchema(nutritionEntriesTable).omit({ id: true, createdAt: true });
export type InsertNutritionEntry = z.infer<typeof insertNutritionEntrySchema>;
export type NutritionEntry = typeof nutritionEntriesTable.$inferSelect;

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;

export const riskAssessmentsTable = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  riskLevel: text("risk_level").notNull(),
  score: integer("score").notNull(),
  factors: jsonb("factors").$type<string[]>().default([]).notNull(),
  recommendations: jsonb("recommendations").$type<string[]>().default([]).notNull(),
  assessedAt: timestamp("assessed_at").defaultNow().notNull(),
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessmentsTable).omit({ id: true, assessedAt: true });
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type RiskAssessment = typeof riskAssessmentsTable.$inferSelect;

export const emergencyLogsTable = pgTable("emergency_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmergencyLogSchema = createInsertSchema(emergencyLogsTable).omit({ id: true, createdAt: true });
export type InsertEmergencyLog = z.infer<typeof insertEmergencyLogSchema>;
export type EmergencyLog = typeof emergencyLogsTable.$inferSelect;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { emergencyLogsTable, userProfilesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/emergency/sos", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { latitude, longitude, message } = req.body;

  const [log] = await db.insert(emergencyLogsTable).values({
    userId, latitude, longitude, message
  }).returning();

  const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId));

  req.log.warn({
    userId,
    lat: latitude,
    lng: longitude,
    emergencyContact: profile?.emergencyContact,
    emergencyPhone: profile?.emergencyPhone,
  }, "SOS ALERT TRIGGERED");

  res.json({
    success: true,
    message: `SOS alert sent. ${profile?.emergencyContact ? `Emergency contact ${profile.emergencyContact} has been notified.` : "Set an emergency contact in your profile for SMS notifications."}`
  });
});

export default router;

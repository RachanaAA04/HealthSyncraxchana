import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { riskAssessmentsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function calculateRisk(input: {
  symptoms: string[];
  irregularCycles?: boolean;
  weightGain?: boolean;
  hairLoss?: boolean;
  acne?: boolean;
  fatigue?: boolean;
  hormoneIssues?: boolean;
  thyroidSymptoms?: boolean;
  familyHistory?: boolean;
}) {
  let score = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];

  if (input.irregularCycles) {
    score += 20;
    factors.push("Irregular menstrual cycles");
    recommendations.push("Track your cycle and consult a gynecologist for hormonal evaluation");
  }

  if (input.weightGain) {
    score += 15;
    factors.push("Unexplained weight gain");
    recommendations.push("Adopt a low-glycemic diet and regular exercise routine");
  }

  if (input.hairLoss) {
    score += 10;
    factors.push("Hair loss or thinning");
    recommendations.push("Get androgen levels tested and consider a dermatologist consultation");
  }

  if (input.acne) {
    score += 10;
    factors.push("Hormonal acne");
    recommendations.push("Reduce sugar intake and consider hormonal assessment");
  }

  if (input.fatigue) {
    score += 10;
    factors.push("Chronic fatigue");
    recommendations.push("Check thyroid function and iron levels. Improve sleep hygiene");
  }

  if (input.hormoneIssues) {
    score += 20;
    factors.push("Known hormone imbalances");
    recommendations.push("Regular monitoring with endocrinologist is recommended");
  }

  if (input.thyroidSymptoms) {
    score += 15;
    factors.push("Thyroid-related symptoms");
    recommendations.push("Get TSH, T3, T4 levels tested. Consult an endocrinologist");
  }

  if (input.familyHistory) {
    score += 10;
    factors.push("Family history of PCOS/thyroid conditions");
    recommendations.push("Regular preventive screenings are important given family history");
  }

  const symptomScore = Math.min(input.symptoms.length * 3, 20);
  score += symptomScore;
  if (input.symptoms.length > 3) {
    factors.push(`Multiple concurrent symptoms (${input.symptoms.length} reported)`);
  }

  if (recommendations.length === 0) {
    recommendations.push("Maintain a healthy diet and exercise routine");
    recommendations.push("Schedule annual gynecological check-ups");
    recommendations.push("Monitor stress levels and maintain good sleep hygiene");
  }

  const riskLevel = score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  return { score, riskLevel, factors, recommendations };
}

router.get("/risk-assessment", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const [latest] = await db.select().from(riskAssessmentsTable)
    .where(eq(riskAssessmentsTable.userId, userId))
    .orderBy(desc(riskAssessmentsTable.assessedAt))
    .limit(1);

  if (!latest) {
    res.json({
      userId,
      riskLevel: "Unknown",
      score: 0,
      factors: [],
      recommendations: ["Complete the risk assessment to get your personalized health insights"],
      assessedAt: new Date().toISOString(),
    });
    return;
  }

  res.json(latest);
});

router.post("/risk-assessment", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const input = req.body;

  const { score, riskLevel, factors, recommendations } = calculateRisk(input);

  const [assessment] = await db.insert(riskAssessmentsTable).values({
    userId, riskLevel, score, factors, recommendations
  }).returning();

  res.json(assessment);
});

export default router;

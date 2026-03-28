import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const PCOS_KNOWLEDGE_BASE: Record<string, string> = {
  pcos: "PCOS (Polycystic Ovary Syndrome) is a hormonal disorder common among women of reproductive age. Symptoms include irregular periods, excess androgen levels, and polycystic ovaries. Management includes lifestyle changes, diet modification, and medications.",
  pcod: "PCOD (Polycystic Ovarian Disease) refers to enlarged ovaries with small cysts on the outer edges. It's similar to PCOS but generally considered less severe. With the right diet and lifestyle changes, symptoms can be well managed.",
  thyroid: "Thyroid disorders include hypothyroidism (underactive thyroid) and hyperthyroidism (overactive thyroid). Symptoms vary but may include weight changes, fatigue, mood swings, and temperature sensitivity. Regular medication and monitoring are key.",
  diet: "For PCOS/PCOD, focus on a low-glycemic diet: whole grains, lean proteins, healthy fats, and plenty of vegetables. Avoid processed foods, refined sugars, and excessive dairy. Anti-inflammatory foods like berries, fatty fish, and turmeric can help.",
  exercise: "Regular exercise is crucial for PCOS management. Aim for 30 minutes of moderate activity 5 days a week. Yoga, walking, swimming, and strength training are all beneficial. Exercise helps with insulin resistance and hormone balance.",
  stress: "Chronic stress can worsen PCOS and thyroid conditions by affecting hormone levels. Practice stress management through yoga, meditation, deep breathing, adequate sleep (7-9 hours), and mindfulness.",
  weight: "Weight management is important for PCOS management. Even a 5-10% weight loss can improve symptoms. Focus on sustainable lifestyle changes rather than crash diets.",
  periods: "Irregular periods are a hallmark of PCOS. Tracking your cycle is important. Period regularity often improves with lifestyle changes, stress management, and appropriate medication.",
  hair: "Hair loss (alopecia) and excess facial hair (hirsutism) are common in PCOS due to elevated androgens. Treatments include anti-androgen medications, topical treatments, and lifestyle improvements.",
  acne: "Hormonal acne in PCOS often appears on the jaw, chin, and neck. Managing insulin resistance through diet, and hormonal treatments can help. Gentle skincare routine with non-comedogenic products is recommended.",
  fertility: "PCOS is a leading cause of infertility but many women with PCOS can conceive with proper treatment. Options include lifestyle changes, ovulation induction medications, and assisted reproductive technologies.",
  supplements: "Supplements that may help PCOS include: Inositol (myo-inositol and D-chiro-inositol), Vitamin D, Omega-3, Magnesium, and Zinc. Always consult your doctor before starting supplements.",
  insulin: "Insulin resistance affects 70-80% of women with PCOS. Managing it through diet (low-glycemic foods), exercise, and sometimes metformin is important for overall health.",
  sleep: "Poor sleep can worsen hormone imbalances in PCOS and thyroid conditions. Aim for 7-9 hours of quality sleep. Maintain a regular sleep schedule and create a calming bedtime routine.",
};

function generateAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  for (const [keyword, response] of Object.entries(PCOS_KNOWLEDGE_BASE)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! I'm your HealthSync AI assistant. I'm here to help you with questions about PCOS, PCOD, thyroid health, nutrition, exercise, and general wellness. How can I help you today?";
  }

  if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
    return "I can help you with: \n• Information about PCOS and PCOD symptoms and management\n• Thyroid health guidance\n• Diet and nutrition advice for hormonal health\n• Exercise recommendations\n• Stress management tips\n• Understanding your symptoms\n• General wellness for reproductive health\n\nWhat would you like to know?";
  }

  if (lowerMessage.includes("medication") || lowerMessage.includes("medicine")) {
    return "For specific medication advice, always consult your healthcare provider. Common medications for PCOS include oral contraceptives for cycle regulation, metformin for insulin resistance, and anti-androgens for hair/skin issues. Thyroid medication (like levothyroxine) requires regular monitoring and dosage adjustment by your doctor.";
  }

  if (lowerMessage.includes("symptom") || lowerMessage.includes("feeling")) {
    return "Tracking your symptoms is a great way to understand your health patterns. Common PCOS symptoms include irregular periods, weight gain, acne, hair loss, fatigue, and mood changes. If you're experiencing severe symptoms, please consult your healthcare provider. You can log your symptoms in the Health Tracking section of HealthSync.";
  }

  if (lowerMessage.includes("doctor") || lowerMessage.includes("specialist")) {
    return "Regular check-ups with your gynecologist or endocrinologist are important for managing PCOS/thyroid conditions. I'd recommend visiting a doctor at least every 6 months, or more frequently if symptoms change. You can find nearby healthcare providers using the Hospital Locator feature in HealthSync.";
  }

  return "That's a great question about your health! While I can provide general wellness information for PCOS and thyroid conditions, I recommend consulting with your healthcare provider for personalized medical advice. Is there a specific aspect of PCOS, thyroid health, diet, or exercise you'd like to learn more about?";
}

router.get("/chat", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.json(messages);
});

router.post("/chat", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const { message } = req.body;

  await db.insert(chatMessagesTable).values({ userId, role: "user", content: message });

  const aiResponse = generateAIResponse(message);

  const [aiMessage] = await db.insert(chatMessagesTable)
    .values({ userId, role: "assistant", content: aiResponse })
    .returning();

  res.json(aiMessage);
});

export default router;

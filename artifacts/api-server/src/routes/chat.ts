import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are HealthSync AI, a compassionate and expert health assistant specializing in female endocrine health, specifically PCOS (Polycystic Ovary Syndrome), PCOD (Polycystic Ovarian Disease), and Thyroid disorders. 

Your goals:
1. Provide evidence-based information on symptoms, lifestyle management, and nutrition.
2. Maintain a supportive, non-judgmental, and empowering tone.
3. Use the following knowledge base facts as your core foundation, but feel free to expand with helpful details.
4. IMPORTANT: Always include a gentle reminder that you are an AI assistant and users should consult their primary healthcare provider for medical prescriptions or severe symptoms.

Knowledge Base Foundation:
- PCOS: Hormonal disorder with irregular periods, excess androgens, and polycystic ovaries. Managed via lifestyle, diet, and meds.
- PCOD: Ovaries release immature eggs, leading to cysts. Often manageable with diet and exercise.
- Thyroid: Overactive (hyper) or underactive (hypo) thyroid affects metabolism, energy, and mood.
- Diet: Focus on low-GI foods, whole grains, lean proteins. Avoid processed sugars and excessive dairy.
- Exercise: 30 mins moderate activity (yoga, walking, strength training) helps insulin resistance.
- Mental Health: Stress management is crucial as cortisol affects hormonal balance.`;

const PCOS_KNOWLEDGE_BASE: Record<string, string> = {
  pcos: "PCOS (Polycystic Ovary Syndrome) is a hormonal disorder common among women of reproductive age. Symptoms include irregular periods, excess androgen levels, and polycystic ovaries. Management includes lifestyle changes, diet modification, and medications.",
  pcod: "PCOD (Polycystic Ovarian Disease) refers to enlarged ovaries with small cysts on the outer edges. It's similar to PCOS but generally considered less severe. With the right diet and lifestyle changes, symptoms can be well managed.",
  thyroid: "Thyroid disorders include hypothyroidism (underactive thyroid) and hyperthyroidism (overactive thyroid). Symptoms vary but may include weight changes, fatigue, mood swings, and temperature sensitivity. Regular medication and monitoring are key.",
  diet: "For PCOS/PCOD, focus on a low-glycemic diet: whole grains, lean proteins, healthy fats, and plenty of vegetables. Avoid processed foods, refined sugars, and excessive dairy. Anti-inflammatory foods like berries, fatty fish, and turmeric can help.",
  exercise: "Regular exercise is crucial for PCOS management. Aim for 30 minutes of moderate activity 5 days a week. Yoga, walking, swimming, and strength training are all beneficial. Exercise helps with insulin resistance and hormone balance.",
};

async function getGeminiResponse(userId: string, userMessage: string, history: any[]): Promise<string> {
  const API_KEY = process.env.GEMINI_API_KEY;
  const isKeyValid = API_KEY && API_KEY !== "YOUR_GEMINI_API_KEY";
  
  if (!isKeyValid) {
    const lowerMessage = userMessage.toLowerCase();
    for (const [keyword, response] of Object.entries(PCOS_KNOWLEDGE_BASE)) {
      if (lowerMessage.includes(keyword)) return response;
    }
    return "I'm currently in Basic Mode. Please ensure your GEMINI_API_KEY is correctly set in your .env file and restart your server.";
  }

  // Update models to the latest ones available via the Gemini API
  const modelNames = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-pro"
  ];
  
  for (const modelName of modelNames) {
    try {
      console.log(`[Chat Debug] Attempting AI generation with model: ${modelName}`);
      const genAI = new GoogleGenerativeAI(API_KEY!);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        // Move system prompt into history for models that don't support systemInstruction yet
        generationConfig: {
            maxOutputTokens: 1000,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ]
      });

      // Prepare context: Start with System Prompt as the first user/model interaction
      const chatHistory = [
        { role: "user", parts: [{ text: "Context: " + SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Understood. I am HealthSync AI, and I am ready to help with PCOS, PCOD, and thyroid health in a compassionate manner." }] },
        ...history.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        }))
      ];

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      
      return response.text();
    } catch (error: any) {
      console.warn(`[Chat Warning] Model ${modelName} failed:`, error.message);
      
      // If the error specifically says model not found, we continue to the next model
      if (error.message?.includes("not found") || error.message?.includes("404")) {
          continue;
      }
      
      // If it's a critical error like invalid key or leaked key, stop here
      if (error.message?.includes("API_KEY_INVALID")) {
          return "Your Gemini API Key is invalid. Please double-check it in Google AI Studio.";
      }
      if (error.message?.includes("PERMISSION_DENIED") || error.message?.includes("leaked") || error.message?.includes("403")) {
          return "Your Gemini API Key has been revoked or reported as leaked. Please generate a new key at https://aistudio.google.com/apikey and update your .env file.";
      }

      // If we've reached the last model and it still failed
      if (modelName === modelNames[modelNames.length - 1]) {
          console.error("[Chat Error Detail]", error);
          return "I hit a snag while generating your answer. Please try rephrasing your question or check back later!";
      }
    }
  }

  return "I'm having trouble connecting to my AI brain (Gemini). I will help you in basic mode instead!";
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

  const history = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, userId))
    .orderBy(asc(chatMessagesTable.createdAt))
    .limit(10);

  const aiResponse = await getGeminiResponse(userId, message, history.slice(0, -1));

  const [aiMessage] = await db.insert(chatMessagesTable)
    .values({ userId, role: "assistant", content: aiResponse })
    .returning();

  res.json(aiMessage);
});

export default router;

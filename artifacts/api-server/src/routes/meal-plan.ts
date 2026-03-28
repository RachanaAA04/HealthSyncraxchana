import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { userProfilesTable, exerciseEntriesTable, symptomEntriesTable } from "@workspace/db/schema";
import { eq, and, gte } from "drizzle-orm";

const router: IRouter = Router();

// ─── Rule-Based Knowledge Base ────────────────────────────────────────────────

const PCOS_MEALS = {
  breakfast: [
    {
      name: "Berry Protein Smoothie Bowl",
      foods: ["Mixed berries", "Greek yogurt", "Chia seeds", "Almonds", "Cinnamon"],
      calories: 380,
      protein: 22,
      benefits: ["Anti-inflammatory berries", "Cinnamon stabilizes blood sugar", "High protein reduces cravings"],
    },
    {
      name: "Avocado & Egg Toast",
      foods: ["Whole grain toast", "Avocado", "Poached eggs", "Spinach", "Lemon"],
      calories: 420,
      protein: 18,
      benefits: ["Healthy fats balance hormones", "High fiber low-GI bread", "Eggs provide choline"],
    },
    {
      name: "Oats with Seeds",
      foods: ["Rolled oats", "Flaxseeds", "Pumpkin seeds", "Blueberries", "Honey (1 tsp)"],
      calories: 360,
      protein: 14,
      benefits: ["Beta-glucan fiber reduces insulin", "Flax seeds balance estrogen", "Zinc from pumpkin seeds"],
    },
    {
      name: "Quinoa Breakfast Bowl",
      foods: ["Quinoa", "Almond milk", "Walnuts", "Cinnamon", "Apple slices"],
      calories: 400,
      protein: 16,
      benefits: ["Complete protein from quinoa", "Omega-3 from walnuts", "Apple fiber slows glucose spike"],
    },
  ],
  lunch: [
    {
      name: "Mediterranean Salmon Salad",
      foods: ["Grilled salmon", "Mixed greens", "Cucumber", "Olives", "Olive oil dressing", "Lemon"],
      calories: 480,
      protein: 34,
      benefits: ["Omega-3 reduces PCOS inflammation", "Anti-inflammatory olive oil", "Low-carb, high-protein"],
    },
    {
      name: "Lentil & Veggie Bowl",
      foods: ["Green lentils", "Roasted sweet potato", "Broccoli", "Turmeric tahini dressing"],
      calories: 440,
      protein: 20,
      benefits: ["Lentil fiber stabilizes blood sugar", "Turmeric fights inflammation", "Iron for hormonal health"],
    },
    {
      name: "Chicken & Quinoa Power Bowl",
      foods: ["Grilled chicken breast", "Quinoa", "Roasted bell peppers", "Avocado", "Lime"],
      calories: 520,
      protein: 40,
      benefits: ["Lean protein manages weight", "Complete amino acids", "Vitamin C boosts iron absorption"],
    },
    {
      name: "Chickpea Spinach Curry",
      foods: ["Chickpeas", "Spinach", "Tomato", "Ginger", "Cumin", "Brown rice (small portion)"],
      calories: 460,
      protein: 18,
      benefits: ["High plant protein & fiber", "Ginger reduces bloating", "Iron & folate from spinach"],
    },
  ],
  dinner: [
    {
      name: "Baked Salmon with Greens",
      foods: ["Salmon fillet", "Asparagus", "Roasted cherry tomatoes", "Garlic", "Dill"],
      calories: 500,
      protein: 38,
      benefits: ["Omega-3 supports hormone production", "Asparagus is a natural diuretic", "Light carb for better sleep"],
    },
    {
      name: "Turkey & Vegetable Stir-fry",
      foods: ["Ground turkey", "Zucchini", "Mushrooms", "Bok choy", "Tamari sauce", "Sesame seeds"],
      calories: 460,
      protein: 36,
      benefits: ["Lean protein for muscle health", "Mushrooms provide Vitamin D", "Low-carb evening meal"],
    },
    {
      name: "Stuffed Bell Peppers",
      foods: ["Bell peppers", "Ground chicken", "Cauliflower rice", "Onions", "Herbs"],
      calories: 420,
      protein: 32,
      benefits: ["Cauliflower rice is low-GI", "Vitamin C rich peppers", "Supports progesterone production"],
    },
    {
      name: "Egg & Veggie Frittata",
      foods: ["Eggs", "Kale", "Feta cheese (small)", "Onions", "Olive oil"],
      calories: 380,
      protein: 28,
      benefits: ["Eggs contain choline for liver health", "Kale provides calcium & magnesium", "Easy to digest at night"],
    },
  ],
  snacks: [
    "Apple + 2 tbsp almond butter",
    "Handful of walnuts + dark chocolate (1 piece)",
    "Greek yogurt + cinnamon",
    "Celery + hummus",
    "Pumpkin seeds + dried cranberries",
    "Boiled egg + avocado slices",
  ],
  avoid: [
    "White rice and white bread (high GI)",
    "Sugary drinks and sodas",
    "Processed snacks and chips",
    "Full-fat dairy (may worsen inflammation)",
    "Alcohol (disrupts hormone balance)",
    "Soy products in large quantities",
    "Excessive caffeine (raises cortisol)",
    "Fried and fast foods",
  ],
  tips: [
    "Eat every 3-4 hours to keep blood sugar stable",
    "Include protein with every meal to reduce cravings",
    "Add cinnamon to meals — it helps insulin sensitivity",
    "Drink spearmint tea twice daily to reduce androgens",
    "Avoid eating large meals at night",
    "Stay hydrated — water helps with hormonal detox",
    "Try intermittent fasting (12-14 hrs) if tolerated",
    "Include anti-inflammatory spices: turmeric, ginger, cinnamon",
  ],
};

const THYROID_MEALS = {
  breakfast: [
    {
      name: "Brazil Nut & Berry Smoothie",
      foods: ["Brazil nuts (2)", "Banana", "Blueberries", "Almond milk", "Flaxseeds"],
      calories: 360,
      protein: 12,
      benefits: ["Brazil nuts are the richest selenium source", "Flax provides iodine support", "Antioxidants protect thyroid"],
    },
    {
      name: "Seaweed & Egg Scramble",
      foods: ["Eggs", "Nori sheets", "Tomatoes", "Onion", "Olive oil"],
      calories: 340,
      protein: 22,
      benefits: ["Seaweed provides natural iodine", "Eggs contain selenium & zinc", "Supports T3/T4 production"],
    },
    {
      name: "Oatmeal with Pumpkin Seeds",
      foods: ["Oats", "Pumpkin seeds", "Strawberries", "Honey", "Cinnamon"],
      calories: 380,
      protein: 14,
      benefits: ["Zinc from pumpkin seeds activates thyroid", "Low-GI oats give steady energy", "Anti-fatigue morning fuel"],
    },
    {
      name: "Whole Grain Toast with Tuna",
      foods: ["Whole grain toast", "Canned tuna", "Avocado", "Lemon", "Arugula"],
      calories: 420,
      protein: 30,
      benefits: ["Tuna is rich in iodine & selenium", "Healthy fats support hormone conversion", "High energy for hypothyroid fatigue"],
    },
  ],
  lunch: [
    {
      name: "Baked Cod with Sweet Potato",
      foods: ["Baked cod fillet", "Roasted sweet potato", "Green beans", "Olive oil", "Lemon"],
      calories: 460,
      protein: 34,
      benefits: ["Cod is an excellent iodine source", "Sweet potato has B vitamins", "Selenium supports thyroid enzymes"],
    },
    {
      name: "Chicken & Brown Rice Bowl",
      foods: ["Grilled chicken", "Brown rice", "Steamed cooked broccoli (small)", "Carrots", "Turmeric"],
      calories: 500,
      protein: 38,
      benefits: ["Cooked broccoli is safer than raw for thyroid", "Brown rice provides sustained energy", "Turmeric is anti-inflammatory"],
    },
    {
      name: "Lentil Soup with Seaweed",
      foods: ["Red lentils", "Kelp flakes (small)", "Tomato", "Onion", "Garlic", "Cumin"],
      calories: 420,
      protein: 18,
      benefits: ["Plant-based iodine from kelp", "Iron from lentils combats fatigue", "Gut health supports thyroid absorption"],
    },
    {
      name: "Sardine & Quinoa Salad",
      foods: ["Sardines in olive oil", "Quinoa", "Cucumber", "Red onion", "Parsley"],
      calories: 440,
      protein: 32,
      benefits: ["Sardines are high in selenium & iodine", "Omega-3 reduces thyroid inflammation", "Complete protein quinoa"],
    },
  ],
  dinner: [
    {
      name: "Shrimp & Veggie Stir-fry",
      foods: ["Shrimp", "Cooked bok choy", "Bell peppers", "Garlic", "Brown rice"],
      calories: 480,
      protein: 36,
      benefits: ["Shrimp is rich in iodine & zinc", "Cooked greens are thyroid-safe", "Zinc activates thyroid hormones"],
    },
    {
      name: "Turkey Meatballs with Zucchini Noodles",
      foods: ["Turkey meatballs", "Zucchini noodles", "Marinara sauce", "Parmesan"],
      calories: 440,
      protein: 34,
      benefits: ["Turkey provides tyrosine for T3/T4", "Low-carb dinner aids metabolism", "Zinc and B12 support thyroid"],
    },
    {
      name: "Roasted Chicken with Root Vegetables",
      foods: ["Chicken thigh", "Parsnips", "Carrots", "Beetroot", "Rosemary", "Olive oil"],
      calories: 520,
      protein: 38,
      benefits: ["Root veggies provide natural sugars for energy", "Rosemary is anti-inflammatory", "Balanced meal for hypothyroid"],
    },
    {
      name: "Baked Tilapia with Asparagus",
      foods: ["Tilapia fillet", "Asparagus", "Lemon butter sauce", "Brown rice"],
      calories: 460,
      protein: 36,
      benefits: ["Tilapia is lean iodine-rich protein", "Asparagus supports liver detox", "Thyroid-friendly light dinner"],
    },
  ],
  snacks: [
    "Brazil nuts (2-3 only) — best selenium source",
    "Seaweed snacks with hummus",
    "Tuna on whole grain crackers",
    "Pumpkin seeds + raisins",
    "Hard boiled egg + carrots",
    "Almond butter on apple slices",
  ],
  avoid: [
    "Raw cruciferous vegetables (broccoli, cabbage, kale — cook them instead)",
    "Soy and soy-based products (blocks thyroid hormone absorption)",
    "Gluten (if Hashimoto's diagnosed)",
    "Processed and ultra-processed foods",
    "Excessive iodine supplements (can worsen hyperthyroid)",
    "Fluoridated water in large amounts",
    "Alcohol and cigarettes",
    "Millet (a goitrogen grain)",
  ],
  tips: [
    "Take thyroid medication on an empty stomach, 30-60 min before eating",
    "Avoid calcium or iron supplements within 4 hours of thyroid medication",
    "Eat selenium-rich foods daily — it activates thyroid hormones",
    "Cook cruciferous vegetables rather than eating them raw",
    "Eat regular meals to support a sluggish metabolism",
    "Morning sunlight exposure helps regulate thyroid rhythm",
    "Gut health is crucial — include probiotic foods daily",
    "Stay warm and hydrated — hypothyroid makes you cold and dry",
  ],
};

const GENERAL_MEALS = {
  breakfast: PCOS_MEALS.breakfast.slice(0, 2).concat(THYROID_MEALS.breakfast.slice(0, 2)),
  lunch: PCOS_MEALS.lunch.slice(0, 2).concat(THYROID_MEALS.lunch.slice(0, 2)),
  dinner: PCOS_MEALS.dinner.slice(0, 2).concat(THYROID_MEALS.dinner.slice(0, 2)),
  snacks: [...new Set([...PCOS_MEALS.snacks.slice(0, 3), ...THYROID_MEALS.snacks.slice(0, 3)])],
  avoid: ["Processed foods", "Sugary drinks", "Excessive alcohol", "Fried foods", "Refined carbohydrates"],
  tips: ["Eat balanced meals with protein, healthy fats, and complex carbs", "Stay hydrated throughout the day", "Include colorful vegetables in every meal"],
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickSeeded<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

function generatePlan(condition: string | null, seed: number) {
  let db_meals: typeof PCOS_MEALS;

  if (condition?.toLowerCase().includes("thyroid") && !condition?.toLowerCase().includes("pcos")) {
    db_meals = THYROID_MEALS;
  } else if (condition?.toLowerCase().includes("pcos") || condition?.toLowerCase().includes("pcod")) {
    db_meals = PCOS_MEALS;
  } else if (condition?.toLowerCase().includes("both")) {
    // For both conditions, prioritize PCOS meals (more restrictive)
    db_meals = PCOS_MEALS;
  } else {
    db_meals = PCOS_MEALS; // default fallback
  }

  const today = {
    breakfast: pickSeeded(db_meals.breakfast, seed),
    lunch: pickSeeded(db_meals.lunch, seed + 1),
    dinner: pickSeeded(db_meals.dinner, seed + 2),
    snacks: [db_meals.snacks[seed % db_meals.snacks.length]!, db_meals.snacks[(seed + 3) % db_meals.snacks.length]!],
  };

  const weeklyPlan = DAYS.map((day, i) => ({
    day,
    breakfast: pickSeeded(db_meals.breakfast, seed + i).name,
    lunch: pickSeeded(db_meals.lunch, seed + i + 1).name,
    dinner: pickSeeded(db_meals.dinner, seed + i + 2).name,
  }));

  return {
    condition: condition || "General",
    today,
    weeklyPlan,
    avoid: db_meals.avoid,
    tips: db_meals.tips.slice(0, 4),
    generatedAt: new Date().toISOString(),
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/meal-plan", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const userId = req.user.id;
    const [profile] = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId));

    // Use a daily seed so the plan stays consistent for a day but changes daily
    // Adding a "refresh" offset from query param for manual refresh
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const refreshOffset = parseInt(req.query.refresh as string) || 0;
    const seed = (dayOfYear + refreshOffset) * 3;

    const plan = generatePlan(profile?.condition ?? null, seed);

    res.json({
      ...plan,
      userProfile: {
        condition: profile?.condition,
        age: profile?.age,
        weight: profile?.weight,
      },
    });
  } catch (err) {
    console.error("Meal plan error:", err);
    res.status(500).json({ error: "Failed to generate meal plan" });
  }
});

// Save a favorite meal
router.post("/meal-plan/favorite", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { mealName, mealType, foods } = req.body;
  // Store favorites in user's localStorage via client — just acknowledge here
  res.json({ success: true, saved: { mealName, mealType, foods } });
});

export default router;

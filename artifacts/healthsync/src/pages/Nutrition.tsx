import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetNutritionLogs, useLogNutrition, getGetNutritionLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Apple, Plus, Bell, BellOff, Loader2, X, Check, RefreshCw,
  Star, Heart, AlertTriangle, Lightbulb, ChevronDown, ChevronUp,
  Utensils, CalendarDays
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMealPlan, useFavoriteMeals, type MealItem } from "@/hooks/useMealPlan";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const DEFAULT_REMINDER_TIMES: Record<string, string> = {
  Breakfast: "08:00",
  Lunch: "13:00",
  Dinner: "19:00",
  Snack: "16:00",
};

const MEAL_LOG_COLORS: Record<string, string> = {
  Breakfast: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Lunch: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  Dinner: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  Snack: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
};

const MEAL_EMOJIS: Record<string, string> = {
  Breakfast: "🌅", breakfast: "🌅",
  Lunch: "☀️", lunch: "☀️",
  Dinner: "🌙", dinner: "🌙",
  Snack: "🍎", snack: "🍎",
};

const PCOS_FOODS = [
  "Berries", "Leafy Greens", "Quinoa", "Salmon", "Chicken", "Lentils",
  "Eggs", "Avocado", "Sweet Potato", "Broccoli", "Nuts", "Seeds",
  "Greek Yogurt", "Oats", "Brown Rice", "Tofu", "Chickpeas", "Olive Oil",
  "Turmeric", "Ginger", "Cinnamon",
];

function scheduleReminder(meal: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(hours!, minutes!, 0, 0);
  if (reminderTime <= now) reminderTime.setDate(reminderTime.getDate() + 1);
  const msUntil = reminderTime.getTime() - now.getTime();
  return window.setTimeout(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`⏰ Time for ${meal}!`, {
        body: `It's time to log your ${meal.toLowerCase()}. Eat mindfully for hormonal balance.`,
        icon: "/favicon.ico",
        tag: `meal-reminder-${meal.toLowerCase()}`,
      });
    }
  }, msUntil);
}

const TABS = ["Smart Plan", "Log Meal", "My Logs", "Favorites"] as const;
type Tab = typeof TABS[number];

export default function Nutrition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: logs, isLoading: logsLoading } = useGetNutritionLogs({ days: 7 });
  const { data: mealPlan, isLoading: planLoading, refresh: refreshPlan, isFetching: planFetching } = useMealPlan();
  const { favorites, saveFavorite, removeFavorite, isFavorite } = useFavoriteMeals();

  const logMutation = useLogNutrition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNutritionLogsQueryKey() });
        setActiveTab("My Logs");
        resetForm();
        toast({ title: "Meal logged!", description: "Keep up the great work 🌿" });
      },
    },
  });

  const [activeTab, setActiveTab] = useState<Tab>("Smart Plan");
  const [showWeekly, setShowWeekly] = useState(false);
  const [showAvoid, setShowAvoid] = useState(false);

  // Log form
  const [selectedMeal, setSelectedMeal] = useState("Breakfast");
  const [foodInput, setFoodInput] = useState("");
  const [foods, setFoods] = useState<string[]>([]);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [notes, setNotes] = useState("");

  // Reminders
  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState<Record<string, { enabled: boolean; time: string }>>(() => {
    try { return JSON.parse(localStorage.getItem("nutrition-reminders") || "{}"); } catch { return {}; }
  });
  const [timerIds, setTimerIds] = useState<Record<string, number>>({});
  const [notifPermission, setNotifPermission] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );

  useEffect(() => {
    const merged = Object.fromEntries(
      MEAL_TYPES.map(m => [m, reminders[m] ?? { enabled: false, time: DEFAULT_REMINDER_TIMES[m]! }])
    );
    localStorage.setItem("nutrition-reminders", JSON.stringify(merged));
    Object.values(timerIds).forEach(id => clearTimeout(id));
    const newIds: Record<string, number> = {};
    Object.entries(merged).forEach(([meal, config]) => {
      if (config.enabled) newIds[meal] = scheduleReminder(meal, config.time);
    });
    setTimerIds(newIds);
    return () => Object.values(newIds).forEach(id => clearTimeout(id));
  }, [reminders]);

  const enableReminder = async (meal: string) => {
    if (notifPermission !== "granted") {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm !== "granted") {
        toast({ title: "Notifications blocked", description: "Enable notifications in browser settings.", variant: "destructive" });
        return;
      }
    }
    const isEnabled = reminders[meal]?.enabled ?? false;
    setReminders(prev => ({ ...prev, [meal]: { ...(prev[meal] ?? { time: DEFAULT_REMINDER_TIMES[meal]! }), enabled: !isEnabled } }));
    toast({ title: isEnabled ? `${meal} reminder off` : `${meal} reminder set!`, description: isEnabled ? "Reminder cancelled." : `Daily reminder at ${reminders[meal]?.time ?? DEFAULT_REMINDER_TIMES[meal]}.` });
  };

  const resetForm = () => {
    setFoods([]); setFoodInput(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setNotes(""); setSelectedMeal("Breakfast");
  };

  const addFood = (food: string) => {
    const t = food.trim();
    if (t && !foods.includes(t)) setFoods(p => [...p, t]);
    setFoodInput("");
  };

  const handleSubmit = () => {
    if (foods.length === 0) { toast({ title: "Add at least one food item", variant: "destructive" }); return; }
    logMutation.mutate({ data: { date: new Date().toISOString().split("T")[0]!, meal: selectedMeal, foods, calories: calories ? parseInt(calories) : undefined, protein: protein ? parseFloat(protein) : undefined, carbs: carbs ? parseFloat(carbs) : undefined, fat: fat ? parseFloat(fat) : undefined, notes: notes || undefined } });
  };

  const activeReminders = Object.values(reminders).filter(r => r.enabled).length;

  const MealCard = ({ meal, mealKey }: { meal: MealItem; mealKey: string }) => {
    const fav = isFavorite(meal.name);
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xl mb-1">{MEAL_EMOJIS[mealKey] ?? "🍽️"}</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{mealKey}</div>
            <div className="font-bold text-base mt-0.5">{meal.name}</div>
          </div>
          <button
            onClick={() => { fav ? removeFavorite(meal.name) : saveFavorite(meal); toast({ title: fav ? "Removed from favorites" : "Saved to favorites ⭐" }); }}
            className={`p-2 rounded-xl transition-all ${fav ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"}`}
          >
            <Star className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {meal.foods.map(f => (
            <span key={f} className="text-xs bg-secondary/60 text-secondary-foreground px-2 py-0.5 rounded-md">{f}</span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-3 pb-3 border-b border-border/50">
          <span className="text-foreground font-semibold">{meal.calories} kcal</span>
          <span>{meal.protein}g protein</span>
        </div>

        <div className="space-y-1.5">
          {meal.benefits.map(b => (
            <div key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Heart className="w-3 h-3 mt-0.5 text-pink-400 shrink-0" /> <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Nutrition"
        description="Mindful eating for hormonal balance. Personalized for your condition."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowReminders(v => !v); if (notifPermission === "default") Notification.requestPermission().then(p => setNotifPermission(p)); }}
              className={`relative px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all border ${activeReminders > 0 ? "bg-amber-500 text-white border-amber-600 shadow-md" : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"}`}
            >
              <Bell className="w-4 h-4" />
              Reminders
              {activeReminders > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{activeReminders}</span>
              )}
            </button>
          </div>
        }
      />

      <div className="px-4 sm:px-8 space-y-6">
        {/* Reminder Panel */}
        <AnimatePresence>
          {showReminders && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Meal Reminders</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Set daily alarms to remind you to eat mindfully</p>
                  </div>
                  <button onClick={() => setShowReminders(false)} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MEAL_TYPES.map(meal => {
                    const config = reminders[meal] ?? { enabled: false, time: DEFAULT_REMINDER_TIMES[meal]! };
                    return (
                      <div key={meal} className={`flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-card transition-all ${config.enabled ? "border-amber-300 shadow-sm" : "border-border"}`}>
                        <span className="text-2xl">{MEAL_EMOJIS[meal]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{meal}</div>
                          <input type="time" value={config.time} onChange={e => setReminders(p => ({ ...p, [meal]: { ...(p[meal] ?? { enabled: false }), time: e.target.value } }))} className="text-xs text-muted-foreground bg-transparent border-none outline-none cursor-pointer mt-0.5 w-full" />
                        </div>
                        <button onClick={() => enableReminder(meal)} className={`p-2 rounded-xl transition-all ${config.enabled ? "bg-amber-500 text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-amber-100 hover:text-amber-600"}`}>
                          {config.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {notifPermission === "denied" && <p className="text-xs text-destructive mt-4 text-center">⚠️ Notifications are blocked. Enable them in browser settings.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Bar */}
        <div className="flex gap-1 p-1 bg-muted rounded-2xl w-full sm:w-auto sm:inline-flex">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
              {tab === "Favorites" && favorites.length > 0 && (
                <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full px-1.5 py-0.5">{favorites.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Tab: Smart Plan ─── */}
        {activeTab === "Smart Plan" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Utensils className="w-5 h-5 text-green-500" /> Today's Personalized Plan</h2>
                {mealPlan?.userProfile?.condition && (
                  <p className="text-sm text-muted-foreground mt-0.5">Tailored for {mealPlan.userProfile.condition} · {mealPlan.userProfile.age ? `Age ${mealPlan.userProfile.age}` : "Update your profile for better suggestions"}</p>
                )}
              </div>
              <button onClick={refreshPlan} disabled={planFetching} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-all disabled:opacity-50 shadow-md shadow-green-500/20">
                <RefreshCw className={`w-4 h-4 ${planFetching ? "animate-spin" : ""}`} />
                {planFetching ? "Generating..." : "New Plan"}
              </button>
            </div>

            {planLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-56 bg-muted rounded-2xl"></div>)}
              </div>
            ) : mealPlan ? (
              <>
                {/* Today's meals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(["breakfast", "lunch", "dinner"] as const).map(k => (
                    <MealCard key={k} meal={mealPlan.today[k]} mealKey={k} />
                  ))}
                </div>

                {/* Snacks */}
                <div className="bg-card border border-border/50 rounded-2xl p-5">
                  <div className="font-semibold mb-3 flex items-center gap-2 text-sm">🍎 Recommended Snacks</div>
                  <div className="flex flex-wrap gap-2">
                    {mealPlan.today.snacks.map(s => (
                      <span key={s} className="text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                  <div className="font-semibold mb-3 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Lightbulb className="w-4 h-4" /> Nutrition Tips for You
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mealPlan.tips.map(tip => (
                      <div key={tip} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <span className="mt-1 text-blue-400">✓</span> <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Foods to Avoid */}
                <div className="border border-border/50 rounded-2xl overflow-hidden">
                  <button onClick={() => setShowAvoid(v => !v)} className="w-full flex items-center justify-between p-5 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <div className="font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-4 h-4" /> Foods to Avoid
                    </div>
                    {showAvoid ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {showAvoid && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mealPlan.avoid.map(item => (
                            <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-red-400 mt-0.5 shrink-0">✕</span> <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Weekly Plan */}
                <div className="border border-border/50 rounded-2xl overflow-hidden">
                  <button onClick={() => setShowWeekly(v => !v)} className="w-full flex items-center justify-between p-5 bg-card hover:bg-muted/50 transition-colors">
                    <div className="font-semibold flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-primary" /> Weekly Meal Plan Overview
                    </div>
                    {showWeekly ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {showWeekly && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="divide-y divide-border/50">
                          {mealPlan.weeklyPlan.map(day => (
                            <div key={day.day} className="p-4 grid grid-cols-4 gap-3 text-sm hover:bg-muted/20 transition-colors">
                              <div className="font-semibold text-primary">{day.day.slice(0, 3)}</div>
                              <div className="text-muted-foreground">🌅 {day.breakfast}</div>
                              <div className="text-muted-foreground">☀️ {day.lunch}</div>
                              <div className="text-muted-foreground">🌙 {day.dinner}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Could not generate meal plan. Set your condition in your profile.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Tab: Log Meal ─── */}
        {activeTab === "Log Meal" && (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Log a Meal</h3>

            <div className="flex flex-wrap gap-2 mb-6">
              {MEAL_TYPES.map(m => (
                <button key={m} onClick={() => setSelectedMeal(m)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedMeal === m ? MEAL_LOG_COLORS[m] : "bg-secondary text-secondary-foreground border-transparent hover:bg-muted"}`}>
                  {MEAL_EMOJIS[m]} {m}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium mb-2">Foods Eaten</label>
              <div className="flex gap-2 mb-3">
                <input type="text" value={foodInput} onChange={e => setFoodInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addFood(foodInput)} placeholder="Type a food and press Enter..." className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                <button onClick={() => addFood(foodInput)} className="px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium">Add</button>
              </div>
              {foods.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {foods.map(f => (
                    <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {f}
                      <button onClick={() => setFoods(p => p.filter(x => x !== f))} className="opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-2">Quick add PCOS-friendly foods:</p>
              <div className="flex flex-wrap gap-1.5">
                {PCOS_FOODS.slice(0, 14).map(f => (
                  <button key={f} onClick={() => addFood(f)} disabled={foods.includes(f)} className="px-2.5 py-1 bg-secondary/60 hover:bg-primary/10 hover:text-primary text-secondary-foreground rounded-lg text-xs transition-all disabled:opacity-30">
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: "Calories", value: calories, setter: setCalories, unit: "kcal" },
                { label: "Protein", value: protein, setter: setProtein, unit: "g" },
                { label: "Carbs", value: carbs, setter: setCarbs, unit: "g" },
                { label: "Fat", value: fat, setter: setFat, unit: "g" },
              ].map(({ label, value, setter, unit }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label} ({unit})</label>
                  <input type="number" value={value} onChange={e => setter(e.target.value)} placeholder="—" className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did this meal make you feel?" className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-h-[80px] resize-none" />
            </div>

            <button onClick={handleSubmit} disabled={logMutation.isPending} className="w-full sm:w-auto px-8 py-3 bg-foreground text-background rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {logMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Meal</>}
            </button>
          </div>
        )}

        {/* ─── Tab: My Logs ─── */}
        {activeTab === "My Logs" && (
          <div>
            <h2 className="text-xl font-bold mb-5">This Week's Meals</h2>
            {logsLoading ? (
              <div className="space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}</div>
            ) : logs?.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-3xl p-12 text-center">
                <Apple className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-40" />
                <h3 className="text-lg font-semibold mb-2">No meals logged yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">Start tracking your meals to see patterns in how food affects your symptoms.</p>
                <button onClick={() => setActiveTab("Log Meal")} className="mt-5 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:shadow-md transition-all">
                  Log First Meal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {logs?.map((log, i) => (
                  <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{MEAL_EMOJIS[log.meal] ?? "🍽️"}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${MEAL_LOG_COLORS[log.meal] ?? "bg-muted text-muted-foreground border-border"}`}>{log.meal}</span>
                            <span className="text-sm text-muted-foreground">{format(new Date(log.date), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {log.foods.map(f => <span key={f} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">{f}</span>)}
                          </div>
                        </div>
                      </div>
                      {(log.calories || log.protein || log.carbs || log.fat) && (
                        <div className="flex gap-3 text-center shrink-0">
                          {log.calories && <div className="bg-muted/50 px-3 py-1.5 rounded-xl"><div className="text-sm font-bold">{log.calories}</div><div className="text-[10px] text-muted-foreground">kcal</div></div>}
                          {log.protein && <div className="bg-muted/50 px-3 py-1.5 rounded-xl"><div className="text-sm font-bold">{log.protein}g</div><div className="text-[10px] text-muted-foreground">protein</div></div>}
                        </div>
                      )}
                    </div>
                    {log.notes && <p className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-xl">{log.notes}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Tab: Favorites ─── */}
        {activeTab === "Favorites" && (
          <div>
            <h2 className="text-xl font-bold mb-5">Saved Favorite Meals ⭐</h2>
            {favorites.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-3xl p-12 text-center">
                <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400 opacity-40" />
                <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground text-sm">Tap the ⭐ star on any meal in the Smart Plan to save it here.</p>
                <button onClick={() => setActiveTab("Smart Plan")} className="mt-5 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:shadow-md transition-all">
                  Browse Meal Plan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((meal, i) => (
                  <motion.div key={meal.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold">{meal.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{meal.calories} kcal · {meal.protein}g protein</div>
                      </div>
                      <button onClick={() => { removeFavorite(meal.name); toast({ title: "Removed from favorites" }); }} className="p-1.5 text-yellow-500 hover:text-muted-foreground rounded-lg transition-colors">
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {meal.foods.map(f => <span key={f} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">{f}</span>)}
                    </div>
                    <button onClick={() => { setFoods(meal.foods); setActiveTab("Log Meal"); }} className="text-xs text-primary hover:underline font-medium">
                      + Log this meal
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

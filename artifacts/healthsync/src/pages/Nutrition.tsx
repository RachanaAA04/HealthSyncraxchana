import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetNutritionLogs, useLogNutrition, getGetNutritionLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Apple, Plus, Bell, BellOff, Loader2, Trash2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const DEFAULT_REMINDER_TIMES: Record<string, string> = {
  Breakfast: "08:00",
  Lunch: "13:00",
  Dinner: "19:00",
  Snack: "16:00",
};

const MEAL_COLORS: Record<string, string> = {
  Breakfast: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Lunch: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  Dinner: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  Snack: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
};

const MEAL_EMOJIS: Record<string, string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
  Snack: "🍎",
};

const PCOS_FOODS = [
  "Berries", "Leafy Greens", "Quinoa", "Salmon", "Chicken", "Lentils",
  "Eggs", "Avocado", "Sweet Potato", "Broccoli", "Nuts", "Seeds",
  "Greek Yogurt", "Oats", "Brown Rice", "Tofu", "Chickpeas", "Olive Oil",
  "Turmeric", "Ginger", "Cinnamon", "Green Tea", "Whole Grain Bread",
];

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function scheduleReminder(meal: string, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(hours!, minutes!, 0, 0);

  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const msUntilReminder = reminderTime.getTime() - now.getTime();

  const timerId = window.setTimeout(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`⏰ Time for ${meal}!`, {
        body: `It's time to log your ${meal.toLowerCase()}. Eat mindfully for hormonal balance.`,
        icon: "/favicon.ico",
        tag: `meal-reminder-${meal.toLowerCase()}`,
      });
    }
  }, msUntilReminder);

  return timerId;
}

export default function Nutrition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: logs, isLoading } = useGetNutritionLogs({ days: 7 });
  const logMutation = useLogNutrition({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNutritionLogsQueryKey() });
        setIsLogging(false);
        resetForm();
        toast({ title: "Meal logged!", description: "Keep up the great work 🌿" });
      },
    },
  });

  const [isLogging, setIsLogging] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("Breakfast");
  const [foodInput, setFoodInput] = useState("");
  const [foods, setFoods] = useState<string[]>([]);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [notes, setNotes] = useState("");

  const [reminders, setReminders] = useState<Record<string, { enabled: boolean; time: string }>>(() => {
    const saved = localStorage.getItem("nutrition-reminders");
    if (saved) return JSON.parse(saved);
    return Object.fromEntries(
      MEAL_TYPES.map((m) => [m, { enabled: false, time: DEFAULT_REMINDER_TIMES[m]! }])
    );
  });

  const [timerIds, setTimerIds] = useState<Record<string, number>>({});
  const [notifPermission, setNotifPermission] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );

  useEffect(() => {
    localStorage.setItem("nutrition-reminders", JSON.stringify(reminders));

    Object.values(timerIds).forEach((id) => clearTimeout(id));
    const newTimerIds: Record<string, number> = {};

    Object.entries(reminders).forEach(([meal, config]) => {
      if (config.enabled) {
        newTimerIds[meal] = scheduleReminder(meal, config.time);
      }
    });

    setTimerIds(newTimerIds);
    return () => Object.values(newTimerIds).forEach((id) => clearTimeout(id));
  }, [reminders]);

  const enableReminder = async (meal: string) => {
    if (notifPermission !== "granted") {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission !== "granted") {
        toast({
          title: "Notifications blocked",
          description: "Please allow notifications in your browser settings.",
          variant: "destructive",
        });
        return;
      }
    }
    setReminders((prev) => ({
      ...prev,
      [meal]: { ...prev[meal]!, enabled: !prev[meal]!.enabled },
    }));
    toast({
      title: reminders[meal]!.enabled ? `${meal} reminder off` : `${meal} reminder set!`,
      description: reminders[meal]!.enabled
        ? "Reminder cancelled."
        : `You'll be notified at ${reminders[meal]!.time} daily.`,
    });
  };

  const updateReminderTime = (meal: string, time: string) => {
    setReminders((prev) => ({ ...prev, [meal]: { ...prev[meal]!, time } }));
  };

  const resetForm = () => {
    setFoods([]);
    setFoodInput("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setNotes("");
    setSelectedMeal("Breakfast");
  };

  const addFood = (food: string) => {
    const trimmed = food.trim();
    if (trimmed && !foods.includes(trimmed)) {
      setFoods((prev) => [...prev, trimmed]);
    }
    setFoodInput("");
  };

  const handleSubmit = () => {
    if (foods.length === 0) {
      toast({ title: "Add at least one food item", variant: "destructive" });
      return;
    }
    logMutation.mutate({
      data: {
        date: new Date().toISOString().split("T")[0]!,
        meal: selectedMeal,
        foods,
        calories: calories ? parseInt(calories) : undefined,
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
        notes: notes || undefined,
      },
    });
  };

  const activeReminders = Object.values(reminders).filter((r) => r.enabled).length;

  return (
    <div className="pb-12">
      <PageHeader
        title="Nutrition"
        description="Mindful eating for hormonal balance. Log your meals and set reminders."
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowReminders((v) => !v); requestNotificationPermission(); }}
              className={`relative px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all border ${
                activeReminders > 0
                  ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              }`}
            >
              <Bell className="w-4 h-4" />
              Reminders
              {activeReminders > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeReminders}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsLogging(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-primary/20"
            >
              <Plus className="w-5 h-5" /> Log Meal
            </button>
          </div>
        }
      />

      <div className="px-4 sm:px-8 space-y-6">
        {/* Reminder Panel */}
        <AnimatePresence>
          {showReminders && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Bell className="w-5 h-5 text-amber-500" />
                      Meal Reminders
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Set daily alarms to remind you to log each meal
                    </p>
                  </div>
                  <button onClick={() => setShowReminders(false)} className="text-muted-foreground hover:text-foreground p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MEAL_TYPES.map((meal) => {
                    const config = reminders[meal]!;
                    return (
                      <div
                        key={meal}
                        className={`flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-card transition-all ${
                          config.enabled ? "border-amber-300 shadow-sm" : "border-border"
                        }`}
                      >
                        <span className="text-2xl">{MEAL_EMOJIS[meal]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{meal}</div>
                          <input
                            type="time"
                            value={config.time}
                            onChange={(e) => updateReminderTime(meal, e.target.value)}
                            className="text-xs text-muted-foreground bg-transparent border-none outline-none cursor-pointer mt-0.5 w-full"
                          />
                        </div>
                        <button
                          onClick={() => enableReminder(meal)}
                          className={`p-2 rounded-xl transition-all ${
                            config.enabled
                              ? "bg-amber-500 text-white shadow-md"
                              : "bg-muted text-muted-foreground hover:bg-amber-100 hover:text-amber-600"
                          }`}
                        >
                          {config.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {notifPermission === "denied" && (
                  <p className="text-xs text-destructive mt-4 text-center">
                    ⚠️ Notifications are blocked. Please enable them in your browser settings to use reminders.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Log Meal Form */}
        <AnimatePresence>
          {isLogging && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Log a Meal</h3>
                  <button onClick={() => { setIsLogging(false); resetForm(); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Meal type selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {MEAL_TYPES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMeal(m)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        selectedMeal === m
                          ? MEAL_COLORS[m]
                          : "bg-secondary text-secondary-foreground border-transparent hover:bg-muted"
                      }`}
                    >
                      {MEAL_EMOJIS[m]} {m}
                    </button>
                  ))}
                </div>

                {/* Food input */}
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2">Foods Eaten</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={foodInput}
                      onChange={(e) => setFoodInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addFood(foodInput)}
                      placeholder="Type a food and press Enter..."
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                    <button
                      onClick={() => addFood(foodInput)}
                      className="px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>

                  {foods.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {foods.map((f) => (
                        <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {f}
                          <button onClick={() => setFoods((prev) => prev.filter((x) => x !== f))} className="opacity-60 hover:opacity-100">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-2">PCOS-friendly foods:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PCOS_FOODS.slice(0, 12).map((f) => (
                        <button
                          key={f}
                          onClick={() => addFood(f)}
                          disabled={foods.includes(f)}
                          className="px-2.5 py-1 bg-secondary/60 hover:bg-primary/10 hover:text-primary text-secondary-foreground rounded-lg text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {[
                    { label: "Calories", value: calories, setter: setCalories, unit: "kcal", type: "number" },
                    { label: "Protein", value: protein, setter: setProtein, unit: "g", type: "number" },
                    { label: "Carbs", value: carbs, setter: setCarbs, unit: "g", type: "number" },
                    { label: "Fat", value: fat, setter: setFat, unit: "g", type: "number" },
                  ].map(({ label, value, setter, unit }) => (
                    <div key={label}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label} ({unit})</label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        placeholder="—"
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      />
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did this meal make you feel?"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-h-[80px] resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={logMutation.isPending}
                  className="w-full sm:w-auto px-8 py-3 bg-foreground text-background rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {logMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Meal</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Meal Logs */}
        <div>
          <h2 className="text-xl font-bold mb-5">This Week's Meals</h2>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-card border border-border/50 rounded-2xl" />
              ))}
            </div>
          ) : logs?.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-3xl p-12 text-center">
              <Apple className="w-16 h-16 mx-auto mb-4 text-green-400 opacity-40" />
              <h3 className="text-lg font-semibold mb-2">No meals logged yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Start tracking your meals to see patterns in how food affects your PCOS and thyroid symptoms.
              </p>
              <button
                onClick={() => setIsLogging(true)}
                className="mt-5 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:shadow-md transition-all"
              >
                Log First Meal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {logs?.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{MEAL_EMOJIS[log.meal] ?? "🍽️"}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${MEAL_COLORS[log.meal] ?? "bg-muted text-muted-foreground border-border"}`}>
                            {log.meal}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(log.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {log.foods.map((f) => (
                            <span key={f} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(log.calories || log.protein || log.carbs || log.fat) && (
                      <div className="flex gap-3 text-center shrink-0">
                        {log.calories && (
                          <div className="bg-muted/50 px-3 py-1.5 rounded-xl">
                            <div className="text-sm font-bold">{log.calories}</div>
                            <div className="text-[10px] text-muted-foreground">kcal</div>
                          </div>
                        )}
                        {log.protein && (
                          <div className="bg-muted/50 px-3 py-1.5 rounded-xl">
                            <div className="text-sm font-bold">{log.protein}g</div>
                            <div className="text-[10px] text-muted-foreground">protein</div>
                          </div>
                        )}
                        {log.carbs && (
                          <div className="bg-muted/50 px-3 py-1.5 rounded-xl">
                            <div className="text-sm font-bold">{log.carbs}g</div>
                            <div className="text-[10px] text-muted-foreground">carbs</div>
                          </div>
                        )}
                        {log.fat && (
                          <div className="bg-muted/50 px-3 py-1.5 rounded-xl">
                            <div className="text-sm font-bold">{log.fat}g</div>
                            <div className="text-[10px] text-muted-foreground">fat</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {log.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-xl mt-2">
                      {log.notes}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/shared/PageHeader";
import { useGetDashboard, getGetDashboardQueryKey, useMarkMedicationTaken } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { Droplets, Pill, Activity, Dumbbell, ShieldCheck, CheckCircle2, Circle, RefreshCw, Utensils, Heart, Star, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useMealPlan, useFavoriteMeals } from "@/hooks/useMealPlan";

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
};

const CONDITION_COLORS: Record<string, string> = {
  PCOS: "from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800",
  PCOD: "from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800",
  Thyroid: "from-teal-500/10 to-blue-500/10 border-teal-200 dark:border-teal-800",
  Both: "from-violet-500/10 to-teal-500/10 border-violet-200 dark:border-violet-800",
  General: "from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetDashboard();
  const queryClient = useQueryClient();
  const { data: mealPlan, isLoading: mealLoading, refresh: refreshMealPlan, isFetching: mealFetching } = useMealPlan();
  const { saveFavorite, removeFavorite, isFavorite } = useFavoriteMeals();

  const markTakenMutation = useMarkMedicationTaken({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse space-y-8">
        <div className="h-10 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  const today = format(new Date(), "EEEE, MMMM do");
  const waterPercentage = data ? Math.min(100, (data.waterIntake.glasses / data.waterIntake.goalGlasses) * 100) : 0;
  const conditionKey = mealPlan?.userProfile?.condition || "General";
  const gradientClass = CONDITION_COLORS[conditionKey] ?? CONDITION_COLORS["General"]!;

  return (
    <div className="pb-12">
      <PageHeader
        title={`Good morning, ${user?.firstName || user?.username || 'Beautiful'} ✨`}
        description={`Today is ${today}. Here is your daily sync.`}
      />

      <div className="px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Risk Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-card to-secondary/50 border border-border/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
            <span className="font-medium text-muted-foreground">AI Risk Level</span>
          </div>
          <div>
            <span className={`text-2xl font-bold font-display ${
              data?.riskLevel === 'High' ? 'text-destructive' :
              data?.riskLevel === 'Medium' ? 'text-orange-500' : 'text-success'
            }`}>
              {data?.riskLevel || 'Low'} Risk
            </span>
            <Link href="/risk"><span className="text-xs text-primary block mt-1 hover:underline cursor-pointer">Re-assess</span></Link>
          </div>
        </motion.div>

        {/* Water */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"><Droplets className="w-5 h-5" /></div>
              <span className="font-medium text-muted-foreground">Water</span>
            </div>
            <div className="text-2xl font-bold font-display text-foreground">
              {data?.waterIntake.glasses} <span className="text-sm text-muted-foreground font-sans font-normal">/ {data?.waterIntake.goalGlasses}</span>
            </div>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="8"
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - waterPercentage / 100)}`}
              />
            </svg>
          </div>
        </motion.div>

        {/* Exercise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl"><Dumbbell className="w-5 h-5" /></div>
            <span className="font-medium text-muted-foreground">Activity</span>
          </div>
          <div>
            <span className="text-2xl font-bold font-display text-foreground">{data?.weeklyExerciseCount}</span>
            <span className="text-sm text-muted-foreground ml-2">workouts this week</span>
          </div>
        </motion.div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-accent to-accent/80 text-white p-6 rounded-3xl shadow-lg shadow-accent/20 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 opacity-20"><Activity className="w-24 h-24" /></div>
          <div className="relative z-10">
            <div className="font-medium text-white/80 mb-2">Sync Streak</div>
            <div className="text-4xl font-bold font-display">{data?.streak} <span className="text-xl font-normal">days</span></div>
          </div>
        </motion.div>
      </div>

      {/* ─── Today's Smart Meal Plan ─── */}
      <div className="px-4 sm:px-8 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-500" />
                Today's Smart Meal Plan
              </h2>
              {mealPlan?.userProfile?.condition && (
                <span className="text-xs text-muted-foreground mt-0.5 block">
                  Personalized for {mealPlan.userProfile.condition}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshMealPlan}
                disabled={mealFetching}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${mealFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link href="/nutrition">
                <span className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1">
                  Full Plan <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>

          {mealLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-44 bg-muted rounded-2xl"></div>)}
            </div>
          ) : mealPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["breakfast", "lunch", "dinner"] as const).map((mealKey, i) => {
                const meal = mealPlan.today[mealKey];
                const fav = isFavorite(meal.name);
                return (
                  <motion.div
                    key={mealKey}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.07 }}
                    className={`bg-gradient-to-br border rounded-2xl p-5 relative overflow-hidden ${gradientClass}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-lg">{MEAL_EMOJIS[mealKey]}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                          {mealKey}
                        </div>
                        <div className="font-bold text-sm mt-0.5 leading-tight">{meal.name}</div>
                      </div>
                      <button
                        onClick={() => fav ? removeFavorite(meal.name) : saveFavorite(meal)}
                        className={`p-1.5 rounded-lg transition-all ${fav ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}`}
                        title={fav ? "Remove favorite" : "Save as favorite"}
                      >
                        <Star className={`w-4 h-4 ${fav ? "fill-current" : ""}`} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {meal.foods.slice(0, 3).map(f => (
                        <span key={f} className="text-xs bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md">
                          {f}
                        </span>
                      ))}
                      {meal.foods.length > 3 && (
                        <span className="text-xs text-muted-foreground px-1">+{meal.foods.length - 3} more</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold">{meal.calories} kcal</span>
                      <span>·</span>
                      <span>{meal.protein}g protein</span>
                    </div>

                    {meal.benefits[0] && (
                      <div className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
                        <Heart className="w-3 h-3 mt-0.5 text-pink-400 shrink-0" />
                        <span>{meal.benefits[0]}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : null}

          {/* Snacks row */}
          {mealPlan && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Snacks:</span>
              {mealPlan.today.snacks.map(s => (
                <span key={s} className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full">
                  🍎 {s}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Medications */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Today's Reminders</h2>
            <Link href="/medications"><span className="text-sm text-primary hover:underline cursor-pointer">Manage All</span></Link>
          </div>
          <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
            {data?.todaysMedications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No medications scheduled for today.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {data?.todaysMedications.map((med) => (
                  <div key={med.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => !med.takenToday && markTakenMutation.mutate({ id: med.id })}
                        disabled={med.takenToday || markTakenMutation.isPending}
                        className={`transition-colors ${med.takenToday ? 'text-success' : 'text-muted-foreground hover:text-primary'}`}
                      >
                        {med.takenToday ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                      </button>
                      <div>
                        <div className={`font-semibold text-lg ${med.takenToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {med.name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">{med.time}</span>
                          · {med.dosage}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Latest Log */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Latest Entry</h2>
            <Link href="/tracking"><span className="text-sm text-primary hover:underline cursor-pointer">Log Today</span></Link>
          </div>
          {data?.latestSymptoms ? (
            <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-muted-foreground">{format(new Date(data.latestSymptoms.date), "MMM do, yyyy")}</span>
                {data.latestSymptoms.cycleDay && (
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-medium">
                    Cycle Day {data.latestSymptoms.cycleDay}
                  </span>
                )}
              </div>
              <div className="flex gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.latestSymptoms.mood}/5</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Mood</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.latestSymptoms.energyLevel}/5</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Energy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.latestSymptoms.painLevel}/5</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Pain</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Symptoms Noticed</div>
                <div className="flex flex-wrap gap-2">
                  {data.latestSymptoms.symptoms.map(s => (
                    <span key={s} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-8 text-center">
              <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-4">You haven't logged any symptoms recently.</p>
              <Link href="/tracking">
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                  Log Now
                </button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

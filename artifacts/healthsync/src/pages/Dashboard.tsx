import { PageHeader } from "@/components/shared/PageHeader";
import { useGetDashboard, getGetDashboardQueryKey, useMarkMedicationTaken } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { motion } from "framer-motion";
import { Droplets, Pill, Activity, Dumbbell, ShieldCheck, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetDashboard();
  const queryClient = useQueryClient();
  
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
          {/* Circular Progress */}
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

      <div className="px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Medications */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
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
                          • {med.dosage}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
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

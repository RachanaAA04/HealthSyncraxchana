import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetSymptoms, useLogSymptom, getGetSymptomsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isSameMonth, addMonths, subMonths, isToday
} from "date-fns";
import { Activity, Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from "lucide-react";

const COMMON_SYMPTOMS = [
  "Bloating", "Cramps", "Headache", "Fatigue", "Brain Fog",
  "Acne", "Hair Loss", "Anxiety", "Mood Swings", "Irregular Period",
  "Nausea", "Breast Tenderness", "Insomnia", "Weight Gain"
];

export default function Tracking() {
  const queryClient = useQueryClient();
  const { data: symptomsLogs, isLoading: loadingLogs } = useGetSymptoms({ days: 90 });
  const logMutation = useLogSymptom({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSymptomsQueryKey() });
        setIsLogging(false);
        resetForm();
      }
    }
  });

  const [isLogging, setIsLogging] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Form State
  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [pain, setPain] = useState<number>(1);
  const [weight, setWeight] = useState<string>("");
  const [cycleDay, setCycleDay] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setMood(3); setEnergy(3); setPain(1); setWeight(""); setCycleDay("");
    setSelectedSymptoms([]); setNotes("");
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleLog = () => {
    logMutation.mutate({
      data: {
        date: new Date().toISOString().split("T")[0]!,
        mood,
        energyLevel: energy,
        painLevel: pain,
        weight: weight ? parseFloat(weight) : undefined,
        cycleDay: cycleDay ? parseInt(cycleDay) : undefined,
        symptoms: selectedSymptoms,
        notes: notes || undefined
      }
    });
  };

  // Build calendar
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun
  const endPadding = 6 - getDay(monthEnd);

  // Prev/next month overflow days
  const prevMonthDays: Date[] = [];
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - i - 1);
    prevMonthDays.push(d);
  }
  const nextMonthDays: Date[] = [];
  for (let i = 1; i <= endPadding; i++) {
    const d = new Date(monthEnd);
    d.setDate(d.getDate() + i);
    nextMonthDays.push(d);
  }

  const allCalDays = [...prevMonthDays, ...daysInMonth, ...nextMonthDays];

  const loggedDates = new Set(
    (symptomsLogs ?? []).map(l => l.date.split("T")[0])
  );

  const getDayColor = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    if (isToday(day)) return "today";
    if (!isSameMonth(day, calendarDate)) return "other";
    if (loggedDates.has(dateStr)) return "logged";
    return "empty";
  };

  const moodLabels = ["😞", "😕", "😐", "🙂", "😊"];
  const energyLabels = ["😴", "🥱", "😌", "⚡", "🔥"];
  const painLabels = ["✅", "😣", "😖", "🤕", "🚨"];

  return (
    <div className="pb-12">
      <PageHeader
        title="Health Tracking"
        description="Listen to your body. Log your daily stats."
        action={
          !isLogging && (
            <button
              onClick={() => setIsLogging(true)}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-primary/20"
            >
              <Plus className="w-5 h-5" /> Log Today
            </button>
          )
        }
      />

      <div className="px-4 sm:px-8 space-y-8">

        {/* Log Form */}
        {isLogging && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl shadow-black/5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">New Entry</h3>
              <button onClick={() => setIsLogging(false)} className="text-muted-foreground hover:text-foreground text-sm">Cancel</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {[
                { label: "Mood", value: mood, setter: setMood, labels: moodLabels, color: "accent-primary" },
                { label: "Energy", value: energy, setter: setEnergy, labels: energyLabels, color: "accent-primary" },
                { label: "Pain", value: pain, setter: setPain, labels: painLabels, color: "accent-destructive" },
              ].map(({ label, value, setter, labels, color }) => (
                <div key={label}>
                  <label className="block text-sm font-medium mb-3">{label} — {labels[value - 1]}</label>
                  <input
                    type="range" min="1" max="5" value={value}
                    onChange={(e) => setter(parseInt(e.target.value))}
                    className={`w-full ${color}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    {labels.map((l, i) => <span key={i}>{l}</span>)}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg, optional)</label>
                <input
                  type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 65.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cycle Day (optional)</label>
                <input
                  type="number" value={cycleDay} onChange={(e) => setCycleDay(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 14"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-3">Symptoms Noticed</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map(s => {
                  const sel = selectedSymptoms.includes(s);
                  return (
                    <button
                      key={s} onClick={() => toggleSymptom(s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${sel
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-secondary text-secondary-foreground hover:bg-primary/10'}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                placeholder="Any extra details..."
              />
            </div>

            <button
              onClick={handleLog} disabled={logMutation.isPending}
              className="w-full sm:w-auto px-8 py-3 bg-foreground text-background rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {logMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Entry'}
            </button>
          </motion.div>
        )}

        {/* ─── CALENDAR ─── */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold">My Calendar</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track your symptoms by logging them every day or at least once a week.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setCalendarDate(new Date())}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-full text-xs font-semibold shadow-md hover:bg-teal-600 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {format(new Date(), "MMMM do, yyyy")}
              </button>
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCalendarDate(d => subMonths(d, 12))}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Previous year"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCalendarDate(d => subMonths(d, 1))}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-bold text-primary">
              {format(calendarDate, "MMM yyyy")}
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCalendarDate(d => addMonths(d, 1))}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCalendarDate(d => addMonths(d, 12))}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Next year"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {allCalDays.map((day, idx) => {
              const state = getDayColor(day);
              const dayNum = format(day, "d");

              return (
                <div
                  key={idx}
                  className={`aspect-square flex items-center justify-center rounded-xl transition-all ${
                    state === "today"
                      ? "bg-teal-500 text-white font-bold shadow-md shadow-teal-500/30"
                      : state === "logged"
                      ? "bg-primary/15 text-primary font-semibold border border-primary/20"
                      : state === "other"
                      ? "text-muted-foreground/40"
                      : "bg-muted/40 text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <span className="text-sm">{parseInt(dayNum) < 10 ? `0${dayNum}` : dayNum}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-5 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded-md bg-teal-500"></div> Today
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded-md bg-primary/15 border border-primary/20"></div> Logged
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded-md bg-muted/40"></div> No entry
            </div>
          </div>
        </div>

        {/* Recent History */}
        <div>
          <h2 className="text-xl font-bold mb-5">Recent History</h2>

          {loadingLogs ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card border border-border/50 rounded-2xl w-full"></div>)}
            </div>
          ) : symptomsLogs?.length === 0 ? (
            <div className="bg-card rounded-3xl border border-border/50 p-12 text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-2">No entries yet</h3>
              <p className="text-muted-foreground">Start logging to track your patterns over time.</p>
            </div>
          ) : (
            symptomsLogs?.slice(0, 10).map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow mb-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="font-semibold text-lg">{format(new Date(log.date), "EEEE, MMMM do")}</div>
                    {log.cycleDay && <div className="text-sm text-primary font-medium">Cycle Day {log.cycleDay}</div>}
                  </div>
                  <div className="flex gap-4">
                    {log.mood != null && (
                      <div className="text-center bg-muted/50 px-3 py-1 rounded-lg">
                        <div className="text-sm font-bold">{log.mood}/5</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Mood</div>
                      </div>
                    )}
                    {log.energyLevel != null && (
                      <div className="text-center bg-muted/50 px-3 py-1 rounded-lg">
                        <div className="text-sm font-bold">{log.energyLevel}/5</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Energy</div>
                      </div>
                    )}
                    {log.painLevel != null && (
                      <div className="text-center bg-muted/50 px-3 py-1 rounded-lg">
                        <div className="text-sm font-bold">{log.painLevel}/5</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Pain</div>
                      </div>
                    )}
                  </div>
                </div>

                {log.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {log.symptoms.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {log.notes && <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">{log.notes}</p>}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

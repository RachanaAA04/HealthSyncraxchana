import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetSymptoms, useLogSymptom, getGetSymptomsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Activity, Plus, Loader2 } from "lucide-react";

const COMMON_SYMPTOMS = [
  "Bloating", "Cramps", "Headache", "Fatigue", "Brain Fog", 
  "Acne", "Hair Loss", "Anxiety", "Mood Swings", "Irregular Period", 
  "Nausea", "Breast Tenderness", "Insomnia", "Weight Gain"
];

export default function Tracking() {
  const queryClient = useQueryClient();
  const { data: symptomsLogs, isLoading: loadingLogs } = useGetSymptoms({ days: 30 });
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
        date: new Date().toISOString(),
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

      <div className="px-4 sm:px-8">
        {isLogging && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl shadow-black/5 mb-8 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-bold">New Entry</h3>
              <button onClick={() => setIsLogging(false)} className="text-muted-foreground hover:text-foreground text-sm">Cancel</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <label className="block text-sm font-medium mb-3">Mood (1-5)</label>
                <input type="range" min="1" max="5" value={mood} onChange={(e) => setMood(parseInt(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>Low</span><span>Great</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Energy Level (1-5)</label>
                <input type="range" min="1" max="5" value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>Exhausted</span><span>Energetic</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Pain Level (1-5)</label>
                <input type="range" min="1" max="5" value={pain} onChange={(e) => setPain(parseInt(e.target.value))} className="w-full accent-destructive" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>None</span><span>Severe</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
               <div>
                <label className="block text-sm font-medium mb-2">Weight (optional)</label>
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
                  const isSelected = selectedSymptoms.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                          : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
                      }`}
                    >
                      {s}
                    </button>
                  )
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
              onClick={handleLog}
              disabled={logMutation.isPending}
              className="w-full sm:w-auto px-8 py-3 bg-foreground text-background rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {logMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Entry'}
            </button>
          </motion.div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold mb-6">Recent History</h2>
          
          {loadingLogs ? (
            <div className="space-y-4 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-card border border-border/50 rounded-2xl w-full"></div>)}
            </div>
          ) : symptomsLogs?.length === 0 ? (
            <div className="bg-card rounded-3xl border border-border/50 p-12 text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-2">No entries yet</h3>
              <p className="text-muted-foreground">Start logging to track your patterns over time.</p>
            </div>
          ) : (
            symptomsLogs?.map((log, index) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="font-semibold text-lg">{format(new Date(log.date), "EEEE, MMMM do")}</div>
                    {log.cycleDay && <div className="text-sm text-primary font-medium">Cycle Day {log.cycleDay}</div>}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center bg-muted/50 px-3 py-1 rounded-lg">
                      <div className="text-sm font-bold">{log.mood}/5</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Mood</div>
                    </div>
                    <div className="text-center bg-muted/50 px-3 py-1 rounded-lg">
                      <div className="text-sm font-bold">{log.energyLevel}/5</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Energy</div>
                    </div>
                    <div className="text-center bg-muted/50 px-3 py-1 rounded-lg">
                      <div className="text-sm font-bold">{log.painLevel}/5</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Pain</div>
                    </div>
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

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetExerciseLogs, useLogExercise, getGetExerciseLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Dumbbell, Plus, Flame, Timer, Activity, Loader2 } from "lucide-react";

export default function Exercise() {
  const queryClient = useQueryClient();
  const { data: logs, isLoading } = useGetExerciseLogs();
  
  const logMutation = useLogExercise({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExerciseLogsQueryKey() });
        setShowForm(false);
      }
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("Yoga");
  const [duration, setDuration] = useState("30");
  const [intensity, setIntensity] = useState("Low");

  const handleLog = () => {
    logMutation.mutate({
      data: {
        date: new Date().toISOString(),
        type,
        duration: parseInt(duration),
        intensity,
      }
    });
  };

  return (
    <div className="pb-12">
      <PageHeader 
        title="Movement" 
        description="Track your active minutes to manage insulin resistance."
        action={
          !showForm && (
            <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg shadow-orange-500/20 transition-all">
              <Plus className="w-5 h-5" /> Log Workout
            </button>
          )
        }
      />

      <div className="px-4 sm:px-8">
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-card border border-border p-6 rounded-3xl shadow-xl mb-8 overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:border-orange-500">
                    <option>Yoga</option><option>Walking</option><option>Strength Training</option><option>Pilates</option><option>Cycling</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Intensity</label>
                  <select value={intensity} onChange={e => setIntensity(e.target.value)} className="w-full px-4 py-3 rounded-xl border outline-none focus:border-orange-500">
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
             </div>
             <div className="flex justify-end gap-3">
               <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl hover:bg-muted font-medium">Cancel</button>
               <button onClick={handleLog} disabled={logMutation.isPending} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold flex items-center gap-2">
                 {logMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Workout'}
               </button>
             </div>
          </motion.div>
        )}

        {isLoading ? (
           <div className="space-y-4 animate-pulse">
             {[1,2].map(i => <div key={i} className="h-24 bg-card rounded-2xl w-full"></div>)}
           </div>
        ) : logs?.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border/50 p-12 text-center">
             <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
             <p className="text-muted-foreground">No workouts logged yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {logs?.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border/50 p-5 rounded-2xl flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                  {log.type === 'Yoga' ? <Activity className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{log.type}</h4>
                  <div className="text-sm text-muted-foreground mb-2">{format(new Date(log.date), "MMM do, h:mm a")}</div>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-sm font-medium"><Timer className="w-4 h-4 text-primary" /> {log.duration} min</span>
                    <span className="flex items-center gap-1 text-sm font-medium"><Flame className="w-4 h-4 text-destructive" /> {log.intensity}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

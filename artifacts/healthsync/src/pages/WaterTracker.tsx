import { PageHeader } from "@/components/shared/PageHeader";
import { useGetWaterIntake, useLogWater, getGetWaterIntakeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Droplets, Plus, Minus, Settings } from "lucide-react";
import { useState } from "react";

export default function WaterTracker() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetWaterIntake();
  
  const logMutation = useLogWater({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWaterIntakeQueryKey() })
    }
  });

  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [newGoal, setNewGoal] = useState("8");

  const current = data?.glasses || 0;
  const goal = data?.goalGlasses || 8;
  const percentage = Math.min(100, (current / goal) * 100);

  const handleUpdate = (change: number) => {
    const newVal = Math.max(0, current + change);
    logMutation.mutate({ data: { glasses: newVal, goalGlasses: goal } });
  };

  const handleSetGoal = () => {
    logMutation.mutate({ data: { glasses: current, goalGlasses: parseInt(newGoal) || 8 } });
    setShowGoalSettings(false);
  };

  if (isLoading) {
    return <div className="p-8 animate-pulse"><div className="w-64 h-64 mx-auto rounded-full bg-muted"></div></div>;
  }

  return (
    <div className="pb-12 h-[calc(100vh-100px)] flex flex-col">
      <PageHeader 
        title="Hydration" 
        description="Water supports metabolism and hormone balance."
        action={
          <button onClick={() => setShowGoalSettings(!showGoalSettings)} className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        }
      />

      {showGoalSettings && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 sm:px-8 mb-8">
           <div className="bg-card border border-border p-4 rounded-2xl flex items-end gap-4 max-w-sm">
             <div className="flex-1">
               <label className="block text-xs font-medium mb-1">Daily Goal (glasses)</label>
               <input type="number" value={newGoal} onChange={e => setNewGoal(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-primary" />
             </div>
             <button onClick={handleSetGoal} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Save</button>
           </div>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 mb-12">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="6%" className="text-muted/30" />
            <motion.circle 
              cx="50%" cy="50%" r="45%" fill="none" stroke="url(#blue-gradient)" strokeWidth="8%" strokeLinecap="round"
              initial={{ strokeDasharray: "283% 283%", strokeDashoffset: "283%" }}
              animate={{ strokeDashoffset: `${283 * (1 - percentage / 100)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <Droplets className="w-10 h-10 text-blue-500 mb-2 opacity-80" />
              <span className="text-6xl font-display font-bold text-foreground tracking-tighter">{current}</span>
              <span className="text-lg text-muted-foreground font-medium mt-1">/ {goal} glasses</span>
            </motion.div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => handleUpdate(-1)} disabled={current === 0 || logMutation.isPending}
            className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <Minus className="w-8 h-8" />
          </button>
          
          <button 
            onClick={() => handleUpdate(1)} disabled={logMutation.isPending}
            className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all"
          >
            <Plus className="w-10 h-10" />
          </button>
        </div>
        
        {percentage >= 100 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 px-4 py-2 bg-success/10 text-success rounded-full font-medium text-sm">
            Goal reached! Great job staying hydrated. 💧
          </motion.div>
        )}
      </div>
    </div>
  );
}

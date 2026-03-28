import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetMedications, useCreateMedication, useDeleteMedication, useMarkMedicationTaken, getGetMedicationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Pill, Plus, CheckCircle2, Circle, Trash2, Clock, Loader2 } from "lucide-react";

export default function Medications() {
  const queryClient = useQueryClient();
  const { data: meds, isLoading } = useGetMedications();
  
  const createMutation = useCreateMedication({ onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMedicationsQueryKey() }); setShowAdd(false); resetForm(); } });
  const deleteMutation = useDeleteMedication({ onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMedicationsQueryKey() }) });
  const markMutation = useMarkMedicationTaken({ onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMedicationsQueryKey() }) });

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [time, setTime] = useState("08:00");

  const resetForm = () => { setName(""); setDosage(""); setFrequency("Daily"); setTime("08:00"); };

  const handleAdd = () => {
    createMutation.mutate({ data: { name, dosage, frequency, time } });
  };

  return (
    <div className="pb-12">
      <PageHeader 
        title="Medications" 
        description="Never miss a dose. Manage your prescriptions and supplements."
        action={
          !showAdd && (
            <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all shadow-primary/20">
              <Plus className="w-5 h-5" /> Add New
            </button>
          )
        }
      />

      <div className="px-4 sm:px-8">
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl shadow-black/5 mb-8">
            <h3 className="text-xl font-display font-bold mb-6">Add Medication</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. Metformin" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Dosage</label>
                <input value={dosage} onChange={(e) => setDosage(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. 500mg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none">
                  <option>Daily</option>
                  <option>Twice a day</option>
                  <option>Weekly</option>
                  <option>As needed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="px-6 py-2 rounded-xl text-muted-foreground hover:bg-muted font-medium">Cancel</button>
              <button onClick={handleAdd} disabled={!name || !dosage || createMutation.isPending} className="px-6 py-2 bg-foreground text-background rounded-xl font-bold disabled:opacity-50 flex items-center gap-2">
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Save
              </button>
            </div>
          </motion.div>
        )}

        {isLoading ? (
           <div className="space-y-4 animate-pulse">
             {[1,2,3].map(i => <div key={i} className="h-24 bg-card border border-border/50 rounded-2xl w-full"></div>)}
           </div>
        ) : meds?.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border/50 p-12 text-center">
            <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-2">No medications</h3>
            <p className="text-muted-foreground">Add your prescriptions or supplements to get reminders.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {meds?.map((med, index) => (
              <motion.div key={med.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                className="bg-card border border-border/50 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => !med.takenToday && markMutation.mutate({ id: med.id })}
                    disabled={med.takenToday || markMutation.isPending}
                    className={`transition-colors ${med.takenToday ? 'text-success' : 'text-muted-foreground hover:text-primary'} flex-shrink-0`}
                  >
                    {med.takenToday ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                  </button>
                  <div>
                    <h4 className={`text-lg font-bold font-display ${med.takenToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{med.name}</h4>
                    <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center gap-1"><Pill className="w-3 h-3" /> {med.dosage}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {med.time} ({med.frequency})</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => confirm("Delete this medication?") && deleteMutation.mutate({ id: med.id })}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

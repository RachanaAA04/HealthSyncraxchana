import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useRunRiskAssessment, useGetRiskAssessment, getGetRiskAssessmentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ShieldAlert, Loader2, AlertCircle } from "lucide-react";

export default function RiskAssessment() {
  const queryClient = useQueryClient();
  const { data: currentRisk, isLoading } = useGetRiskAssessment();
  const runMutation = useRunRiskAssessment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRiskAssessmentQueryKey() });
        setShowForm(false);
      }
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    irregularCycles: false, weightGain: false, hairLoss: false,
    acne: false, fatigue: false, hormoneIssues: false, thyroidSymptoms: false, familyHistory: false
  });

  const handleRun = () => {
    // Generate symptoms array based on true booleans
    const symptoms = Object.entries(form).filter(([_, v]) => v).map(([k]) => k);
    runMutation.mutate({ data: { ...form, symptoms } });
  };

  return (
    <div className="pb-12">
      <PageHeader 
        title="Risk Assessment" 
        description="Evaluate your symptoms to understand potential health risks."
      />

      <div className="px-4 sm:px-8 max-w-3xl">
        {!showForm && currentRisk ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border p-8 rounded-3xl shadow-sm text-center mb-8">
             <ShieldAlert className={`w-20 h-20 mx-auto mb-6 ${
                currentRisk.riskLevel === 'High' ? 'text-destructive' : 
                currentRisk.riskLevel === 'Medium' ? 'text-orange-500' : 'text-success'
             }`} />
             <h2 className="text-3xl font-display font-bold mb-2">
               {currentRisk.riskLevel} Risk Profile
             </h2>
             <p className="text-muted-foreground mb-8">Based on your latest assessment on {new Date(currentRisk.assessedAt).toLocaleDateString()}</p>
             
             {currentRisk.recommendations?.length > 0 && (
               <div className="bg-muted/30 rounded-2xl p-6 text-left mb-8">
                 <h4 className="font-bold mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-primary"/> Recommendations</h4>
                 <ul className="space-y-2 text-sm text-foreground/80 list-disc pl-5">
                   {currentRisk.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                 </ul>
               </div>
             )}

             <button onClick={() => setShowForm(true)} className="px-6 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors">
               Re-take Assessment
             </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-8 rounded-3xl shadow-lg">
            <h3 className="text-xl font-display font-bold mb-6">Select all that apply to you currently:</h3>
            <div className="space-y-4 mb-8">
              {Object.entries({
                irregularCycles: "Irregular or missed periods",
                weightGain: "Unexplained weight gain or difficulty losing weight",
                hairLoss: "Thinning hair or hair loss",
                acne: "Severe acne or oily skin",
                fatigue: "Chronic fatigue or low energy",
                hormoneIssues: "Known hormonal imbalances",
                thyroidSymptoms: "Feeling constantly cold/hot, dry skin, mood changes",
                familyHistory: "Family history of PCOS or Thyroid issues"
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={form[key as keyof typeof form]} 
                    onChange={(e) => setForm({...form, [key]: e.target.checked})}
                    className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary" 
                  />
                  <span className="font-medium text-foreground">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-4">
              {currentRisk && <button onClick={() => setShowForm(false)} className="px-6 py-3 font-medium text-muted-foreground hover:text-foreground">Cancel</button>}
              <button 
                onClick={handleRun} disabled={runMutation.isPending}
                className="px-8 py-3 bg-foreground text-background font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                {runMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Report'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

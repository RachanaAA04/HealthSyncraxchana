import { PageHeader } from "@/components/shared/PageHeader";
import { useGetReport } from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ProgressReport() {
  const { data, isLoading } = useGetReport({ days: 30 });

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  // Transform data for charts
  const symptomData = data?.symptomTrends.map(t => ({
    date: format(new Date(t.date), "MMM d"),
    mood: t.mood || 0,
    energy: t.energyLevel || 0
  })) || [];

  return (
    <div className="pb-12">
      <PageHeader 
        title="Doctor's Report" 
        description="Monthly summary to share with your healthcare provider."
        action={
          <button className="px-5 py-2.5 bg-secondary text-secondary-foreground font-bold rounded-xl flex items-center gap-2 hover:bg-secondary/80 transition-colors">
            <Download className="w-5 h-5" /> Download PDF
          </button>
        }
      />

      <div className="px-4 sm:px-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-5 rounded-2xl text-center">
            <div className="text-3xl font-display font-bold text-primary mb-1">{data?.medicationAdherence}%</div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Meds Adherence</div>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl text-center">
            <div className="text-3xl font-display font-bold text-blue-500 mb-1">{data?.waterAdherence}%</div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Water Goal Met</div>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl text-center">
            <div className="text-3xl font-display font-bold text-orange-500 mb-1">{data?.exerciseSummary.totalSessions}</div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Workouts</div>
          </div>
           <div className="bg-card border border-border p-5 rounded-2xl text-center">
            <div className="text-3xl font-display font-bold text-foreground mb-1">{data?.riskHistory?.[0]?.riskLevel || 'N/A'}</div>
            <div className="text-xs text-muted-foreground uppercase font-medium">Current Risk</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-lg mb-6">Mood & Energy Trends</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={symptomData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} domain={[0, 5]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} name="Mood" />
                  <Line type="monotone" dataKey="energy" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} name="Energy" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-lg mb-6">Common Symptoms Logged</h3>
             <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
               Symptom frequency chart will appear here as more data is logged.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

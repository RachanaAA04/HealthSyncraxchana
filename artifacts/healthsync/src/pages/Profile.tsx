import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { UserCircle, Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetProfile();
  
  const updateMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() })
    }
  });

  const [form, setForm] = useState({
    age: "", weight: "", height: "", condition: "", 
    emergencyContact: "", emergencyPhone: "", thyroidType: ""
  });

  useEffect(() => {
    if (profile) {
      setForm({
        age: profile.age?.toString() || "",
        weight: profile.weight?.toString() || "",
        height: profile.height?.toString() || "",
        condition: profile.condition || "",
        emergencyContact: profile.emergencyContact || "",
        emergencyPhone: profile.emergencyPhone || "",
        thyroidType: profile.thyroidType || ""
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateMutation.mutate({
      data: {
        age: form.age ? parseInt(form.age) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        condition: form.condition,
        emergencyContact: form.emergencyContact,
        emergencyPhone: form.emergencyPhone,
        thyroidType: form.thyroidType
      }
    });
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="pb-12">
      <PageHeader title="Profile Settings" description="Manage your personal and health information." />

      <div className="px-4 sm:px-8 max-w-4xl">
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
             <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground border-4 border-background shadow-md">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserCircle className="w-12 h-12" />
                )}
             </div>
             <div>
               <h2 className="text-2xl font-bold font-display">{user?.firstName} {user?.lastName}</h2>
               <p className="text-muted-foreground">{user?.username}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <h3 className="md:col-span-2 text-lg font-bold font-display mt-2">Health Baseline</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Primary Condition</label>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none">
                <option value="">Select...</option><option>PCOS</option><option>PCOD</option><option>Thyroid Disorder</option><option>Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thyroid Type (if applicable)</label>
              <select value={form.thyroidType} onChange={e => setForm({...form, thyroidType: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none">
                <option value="">None</option><option>Hypothyroidism</option><option>Hyperthyroidism</option><option>Hashimoto's</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none" />
            </div>

            <h3 className="md:col-span-2 text-lg font-bold font-display mt-6 border-t pt-6">Emergency Contact</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input value={form.emergencyPhone} onChange={e => setForm({...form, emergencyPhone: e.target.value})} className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex justify-end">
            <button 
              onClick={handleSave} disabled={updateMutation.isPending}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin"/>} Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/shared/PageHeader";
import { Apple } from "lucide-react";

export default function Nutrition() {
  return (
    <div className="pb-12">
      <PageHeader 
        title="Nutrition" 
        description="Mindful eating for hormonal balance."
      />
      <div className="px-4 sm:px-8">
        <div className="bg-card rounded-3xl border border-border/50 p-12 text-center shadow-sm">
          <Apple className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
          <h3 className="text-xl font-display font-bold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We are building a specialized nutrition logger tailored for PCOS and Thyroid diets, focusing on macros and anti-inflammatory foods.
          </p>
        </div>
      </div>
    </div>
  );
}

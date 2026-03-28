import { PageHeader } from "@/components/shared/PageHeader";
import { MapPin, Navigation, Phone, Globe } from "lucide-react";

export default function HospitalLocator() {
  return (
    <div className="pb-12">
      <PageHeader 
        title="Find Care" 
        description="Locate specialized endocrinologists and gynecologists nearby."
      />

      <div className="px-4 sm:px-8">
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm mb-8">
          <div className="h-64 bg-muted flex flex-col items-center justify-center relative">
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <MapPin className="w-12 h-12 text-primary mb-3 z-10" />
             <p className="text-foreground font-medium z-10 mb-4">Location access required</p>
             <button className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold z-10 shadow-md">
               Grant Permission
             </button>
             <p className="text-xs text-muted-foreground absolute bottom-4">Connect Google Maps API key to show live map</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold mb-4">Specialists Near You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Women's Health Clinic", type: "Gynecology & PCOS Center", dist: "1.2 miles" },
            { name: "City Endocrinology", type: "Thyroid Specialist", dist: "2.5 miles" },
            { name: "Holistic Hormone Center", type: "Integrative Medicine", dist: "4.0 miles" },
          ].map((h, i) => (
            <div key={i} className="bg-card border border-border p-5 rounded-2xl flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg">{h.name}</h4>
                  <p className="text-sm text-primary font-medium">{h.type}</p>
                </div>
                <span className="text-sm bg-muted px-2 py-1 rounded-md text-muted-foreground">{h.dist}</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <button className="flex-1 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary/80">
                  <Navigation className="w-4 h-4" /> Directions
                </button>
                <button className="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 border border-border rounded-lg text-muted-foreground hover:text-foreground">
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

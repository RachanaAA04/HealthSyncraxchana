import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTriggerSOS } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { TriangleAlert, ShieldCheck } from "lucide-react";

export default function EmergencySOS() {
  const triggerMutation = useTriggerSOS();
  const [triggered, setTriggered] = useState(false);

  const handleSOS = () => {
    // In a real app, we'd request Geolocation API here
    triggerMutation.mutate({ 
      data: { message: "Emergency assistance needed.", latitude: 0, longitude: 0 } 
    }, {
      onSuccess: () => setTriggered(true)
    });
  };

  return (
    <div className="pb-12 h-[calc(100vh-100px)] flex flex-col">
      <PageHeader 
        title="Emergency SOS" 
        description="Immediately alert your emergency contacts."
      />

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {triggered ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">SOS Sent Successfully</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Your emergency contacts have been notified with your location.</p>
            <button onClick={() => setTriggered(false)} className="mt-8 text-primary font-medium hover:underline">Reset</button>
          </motion.div>
        ) : (
          <motion.div className="relative">
            {/* Pulsing background */}
            <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            
            <button 
              onClick={handleSOS}
              disabled={triggerMutation.isPending}
              className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-b from-destructive to-red-700 text-white rounded-full shadow-2xl shadow-destructive/50 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-300 disabled:opacity-80 disabled:hover:scale-100"
            >
              <TriangleAlert className="w-20 h-20 mb-4" />
              <span className="text-4xl font-display font-black tracking-widest uppercase">SOS</span>
            </button>
          </motion.div>
        )}
        
        {!triggered && (
          <p className="mt-12 text-center text-muted-foreground max-w-md">
            Pressing this button will instantly share your location and a distress message to the emergency contact listed in your Profile.
          </p>
        )}
      </div>
    </div>
  );
}

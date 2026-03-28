import { useAuth } from "@workspace/replit-auth-web";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin text-primary">
          <Activity className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Image/Branding */}
      <div className="md:w-1/2 relative hidden md:block overflow-hidden bg-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 mix-blend-multiply z-10" />
        <img 
          src={`${import.meta.env.BASE_URL}images/login-hero.png`} 
          alt="Health and wellness abstract" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center p-12">
          <div className="w-20 h-20 bg-white/30 backdrop-blur-xl rounded-3xl mb-8 flex items-center justify-center shadow-2xl border border-white/40">
             <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-display font-bold text-white drop-shadow-md mb-4">
            Your Body. Your Rhythm.
          </h2>
          <p className="text-white/90 text-lg max-w-md drop-shadow font-medium">
            AI-powered insights and compassionate tracking for women managing PCOS, PCOD, and thyroid health.
          </p>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <div className="absolute top-8 left-8 md:hidden flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold">
            HS
          </div>
          <span className="font-display font-bold text-xl">HealthSync</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border p-8 rounded-3xl shadow-xl shadow-primary/5">
            <h1 className="text-3xl font-display font-bold mb-2 text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mb-8">Sign in to sync your health journey.</p>
            
            <button
              onClick={login}
              className="w-full py-4 px-6 rounded-2xl bg-foreground text-background font-semibold text-lg flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 active:translate-y-0"
            >
              Continue with Replit
            </button>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

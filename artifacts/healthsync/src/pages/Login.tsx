import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Mail, Lock, User, ArrowRight, Loader2, Sparkles, Heart, Brain, ChevronRight, ChevronLeft } from "lucide-react";

const HEALTH_FLASHCARDS = [
  {
    title: "Understanding PCOD",
    subtitle: "Causes, Symptoms & Natural Management",
    content: "PCOD is a hormonal disorder where ovaries release immature eggs, leading to small cysts. Common signs include irregular periods, weight gain, and acne.",
    tip: "Tip: Manage naturally through a low-GI diet, 30 mins of movement, and stress reduction.",
    accent: "from-pink-500/20 to-rose-500/20",
    icon: <Heart className="w-8 h-8 text-rose-500" />
  },
  {
    title: "PCOS: Beyond the Surface",
    subtitle: "Symptoms & Metabolic Health",
    content: "PCOS is a metabolic and hormonal condition affecting up to 10% of women. It often presents with stubborn weight, skin changes, and fertility challenges.",
    tip: "Insight: Early detection and tracking cycles help regulate metabolic health and balance hormones.",
    accent: "from-purple-500/20 to-indigo-500/20",
    icon: <Sparkles className="w-8 h-8 text-purple-500" />
  },
  {
    title: "Thyroid Health",
    subtitle: "The Engine of Your Vitality",
    content: "Your thyroid regulates your entire metabolism. Disorders can cause persistent fatigue, cold sensitivity, and unexplained mood or weight shifts.",
    tip: "Action: Consistency in monitoring and balanced nutrition are key to keeping your energy engine running.",
    accent: "from-teal-500/20 to-emerald-500/20",
    icon: <Brain className="w-8 h-8 text-teal-500" />
  }
];

export default function Login() {
  const { isAuthenticated, isLoading, login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flashcard carousel state
  const [currentCard, setCurrentCard] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % HEALTH_FLASHCARDS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signup({ email, password, firstName, lastName });
      } else {
        await login({ email, password });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 overflow-x-hidden relative">
      {/* Fixed Background Image */}
      <div 
        className="fixed inset-0 z-0 opacity-30 blur-2xl pointer-events-none transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${import.meta.env.BASE_URL}images/wellness-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* 0.25 Height Glass Header */}
      <header className="sticky top-0 z-50 h-[25vh] w-full flex flex-col items-center justify-center px-4 backdrop-blur-xl bg-white/30 dark:bg-black/30 border-b border-white/20 shadow-sm">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x mb-2">
            Health Sync
          </h1>
          <p className="text-muted-foreground font-medium tracking-widest uppercase text-xs md:text-sm">
            Your Body. Your Rhythm. Your Health, Synced.
          </p>
        </motion.div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row items-start gap-12 md:gap-20 relative z-10">
        
        {/* Left Side - Interactive Flashcards */}
        <div className="w-full md:w-1/2 space-y-8 flex flex-col items-center">
          <div className="w-full max-w-lg relative min-h-[440px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={`absolute inset-0 bg-gradient-to-br ${HEALTH_FLASHCARDS[currentCard].accent} border border-white/40 backdrop-blur-md p-10 rounded-[2.5rem] shadow-2xl shadow-primary/5 flex flex-col`}
              >
                <div className="mb-6 bg-white/40 dark:bg-black/40 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner">
                  {HEALTH_FLASHCARDS[currentCard].icon}
                </div>
                
                <h3 className="text-3xl font-display font-bold text-foreground mb-2">
                  {HEALTH_FLASHCARDS[currentCard].title}
                </h3>
                <p className="text-primary font-semibold text-sm uppercase tracking-wide mb-6">
                  {HEALTH_FLASHCARDS[currentCard].subtitle}
                </p>
                
                <p className="text-foreground/80 text-lg leading-relaxed mb-8 flex-1">
                  {HEALTH_FLASHCARDS[currentCard].content}
                </p>
                
                <div className="p-4 bg-white/20 dark:bg-black/20 rounded-2xl border border-white/20">
                  <p className="text-sm font-medium italic text-foreground">
                    {HEALTH_FLASHCARDS[currentCard].tip}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentCard((prev) => (prev - 1 + HEALTH_FLASHCARDS.length) % HEALTH_FLASHCARDS.length)}
              className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {HEALTH_FLASHCARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentCard(i)}
                  className={`h-2 transition-all duration-300 rounded-full ${i === currentCard ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}`}
                />
              ))}
            </div>
            <button 
              onClick={() => setCurrentCard((prev) => (prev + 1) % HEALTH_FLASHCARDS.length)}
              className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="bg-card border border-border p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Activity className="w-32 h-32" />
              </div>

              <h2 className="text-3xl font-display font-bold mb-2 text-foreground relative z-10">
                {isSignUp ? "Join HealthSync" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground mb-8 relative z-10">
                {isSignUp ? "Create an account to start syncing." : "Sign in to access your insights."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <AnimatePresence mode="wait">
                  {isSignUp && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">First Name</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-2xl focus:outline-none transition-all font-medium"
                            placeholder="Jane"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Last Name</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-2xl focus:outline-none transition-all font-medium"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-2xl focus:outline-none transition-all font-medium text-lg"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Security Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-background rounded-2xl focus:outline-none transition-all font-medium text-lg"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-semibold text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-foreground text-background font-black text-lg flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 active:translate-y-0 disabled:opacity-70 group mt-4"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Begin Your Journey" : "Continue to Dashboard"}
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-border flex flex-col items-center gap-6 relative z-10">
                <button 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-primary font-black hover:underline transition-all"
                >
                  {isSignUp ? "Already a member? Sign In" : "New to Health Sync? Create Account"}
                </button>
                
                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest max-w-[200px]">
                  Securely encrypted health data and private insights.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer / Credit Section */}
      <footer className="py-12 px-4 border-t border-border mt-20 relative z-10 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl text-center space-y-4">
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
            Health Sync is an educational platform providing insights into female endocrine health. 
            Information provided is for awareness and should not replace professional medical advice.
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">Privacy First</span>
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">AI-Powered</span>
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">Community Led</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

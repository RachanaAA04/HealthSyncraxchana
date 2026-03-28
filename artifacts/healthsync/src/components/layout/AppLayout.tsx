import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Activity, Pill, Droplets, Dumbbell, 
  Apple, MessageSquareHeart, ShieldAlert, MapPin, 
  FileBarChart, TriangleAlert, UserCircle, LogOut, Menu, X 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tracking", label: "Health Tracking", icon: Activity },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/water", label: "Water Tracker", icon: Droplets },
  { href: "/exercise", label: "Exercise Log", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Apple },
  { href: "/chat", label: "AI Chatbot", icon: MessageSquareHeart },
  { href: "/risk", label: "Risk Assessment", icon: ShieldAlert },
  { href: "/hospitals", label: "Hospital Locator", icon: MapPin },
  { href: "/report", label: "Progress Report", icon: FileBarChart },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold">
            HS
          </div>
          <span className="font-display font-bold text-lg">HealthSync</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileMenuOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-72 bg-sidebar border-r border-sidebar-border flex flex-col",
              "md:relative md:w-64 lg:w-72 md:translate-x-0"
            )}
          >
            <div className="p-6 hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
                HS
              </div>
              <span className="font-display font-bold text-xl tracking-tight">HealthSync</span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-sidebar-border space-y-2">
              <Link href="/sos">
                <div 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-destructive/10 text-destructive font-semibold hover:bg-destructive hover:text-white transition-colors cursor-pointer"
                >
                  <TriangleAlert className="w-5 h-5" />
                  Emergency SOS
                </div>
              </Link>
              
              <div className="flex items-center justify-between pt-2">
                <Link href="/profile">
                  <div 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground border border-border">
                      {user?.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <UserCircle className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium truncate max-w-[100px]">{user?.firstName || user?.username || 'Profile'}</span>
                    </div>
                  </div>
                </Link>
                <button 
                  onClick={logout}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-background">
        <div className="max-w-5xl mx-auto w-full min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

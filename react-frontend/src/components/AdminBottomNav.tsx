import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { allAdminLinks } from "./Sidebar";
import { apiFetch } from "../lib/api";

export default function AdminBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>("ADMIN");
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiFetch(`/api/auth/me`);
        if (res.ok) {
          const data = await res.json();
          setRole(data.user?.role || null);
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/auth/logout`, { method: "POST" });
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const visibleLinks = allAdminLinks.filter(link => role && link.roles.includes(role));
  
  // Quick links for the bottom bar
  const mainLinks = visibleLinks.slice(0, 3);
  // Links for the "More" bottom sheet
  const moreLinks = visibleLinks.slice(3);

  const toggleMore = () => setIsMoreOpen(!isMoreOpen);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 pt-2 bg-gradient-to-t from-[#111] via-[#111] to-transparent md:hidden pointer-events-none">
        <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex justify-between items-center pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href || (location.pathname.startsWith(`${link.href}/`) && link.href !== "/admin");
            
            return (
              <Link key={link.name} to={link.href} onClick={() => setIsMoreOpen(false)} className="relative flex flex-col items-center justify-center w-1/4 py-2 group">
                {isActive && (
                  <motion.div 
                    layoutId="adminBottomNavBubble"
                    className="absolute inset-0 bg-[#ccff00]/10 border border-[#ccff00]/20 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`h-5 w-5 relative z-10 transition-colors ${isActive ? 'text-[#ccff00]' : 'text-gray-400 group-hover:text-gray-200'}`} />
                <span className={`text-[9px] mt-1 font-medium relative z-10 transition-colors ${isActive ? 'text-[#ccff00]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
          
          <button onClick={toggleMore} className="relative flex flex-col items-center justify-center w-1/4 py-2 group">
            {isMoreOpen && (
              <motion.div 
                layoutId="adminBottomNavBubble"
                className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {isMoreOpen ? <X className="h-5 w-5 relative z-10 text-white" /> : <Menu className="h-5 w-5 relative z-10 text-gray-400 group-hover:text-gray-200" />}
            <span className={`text-[9px] mt-1 font-medium relative z-10 transition-colors ${isMoreOpen ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
              More
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMore}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-[70px] left-2 right-2 bg-[#1a1a1a] border border-white/10 rounded-3xl z-40 flex flex-col shadow-2xl md:hidden overflow-hidden"
            >
              <div className="p-4 grid grid-cols-3 gap-2">
                {moreLinks.map((link) => {
                  const isKiosk = link.href.startsWith("/kiosk");
                  const isActive = !isKiosk && (location.pathname === link.href || (location.pathname.startsWith(`${link.href}/`) && link.href !== "/admin"));
                  const Icon = link.icon;

                  const linkContent = (
                    <div className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                      isActive 
                        ? "bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20" 
                        : "bg-black/20 text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-white/5"
                    }`}>
                      <Icon className={`h-6 w-6 mb-2 ${isActive ? "text-[#ccff00]" : "text-gray-500"}`} />
                      <span className="text-[10px] font-medium text-center">{link.name}</span>
                    </div>
                  );

                  if (isKiosk) {
                    return (
                      <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" onClick={toggleMore}>
                        {linkContent}
                      </a>
                    );
                  }

                  return (
                    <Link key={link.name} to={link.href} onClick={toggleMore}>
                      {linkContent}
                    </Link>
                  );
                })}
              </div>
              <div className="p-4 border-t border-white/5 bg-black/20">
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-all">
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

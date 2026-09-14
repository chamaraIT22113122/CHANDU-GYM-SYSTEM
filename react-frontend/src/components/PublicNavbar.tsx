import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicNavbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path ? "text-[#ccff00]" : "text-white hover:text-[#ccff00]";
  };

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#ccff00]/50 bg-white/5 p-0.5">
              <img 
                src="/logo.jpg" 
                alt="Chandu GYM" 
                className="object-contain w-full h-full rounded-full"
              />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">CHANDU<span className="text-[#ccff00]">GYM</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className={`${isActive("/")} transition-colors`}>Home</Link>
            <Link to="/programs" className={`${isActive("/programs")} transition-colors`}>Programs</Link>
            <Link to="/trainers" className={`${isActive("/trainers")} transition-colors`}>Trainers</Link>
            <Link to="/pricing" className={`${isActive("/pricing")} transition-colors`}>Pricing</Link>
            <a href="#contact" className="text-white hover:text-[#ccff00] transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="bg-[#ccff00] text-black px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(204,255,0,0.3)]">
              LOGIN
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-white p-2">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[280px] bg-[#111] border-l border-white/10 z-50 flex flex-col shadow-2xl md:hidden"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                <span className="font-bold text-white tracking-wider text-lg">MENU</span>
                <button onClick={toggleMenu} className="text-gray-400 hover:text-white p-2">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col p-6 gap-6">
                <Link to="/" onClick={toggleMenu} className={`text-lg font-medium ${isActive("/")}`}>Home</Link>
                <Link to="/programs" onClick={toggleMenu} className={`text-lg font-medium ${isActive("/programs")}`}>Programs</Link>
                <Link to="/trainers" onClick={toggleMenu} className={`text-lg font-medium ${isActive("/trainers")}`}>Trainers</Link>
                <Link to="/pricing" onClick={toggleMenu} className={`text-lg font-medium ${isActive("/pricing")}`}>Pricing</Link>
                <a href="#contact" onClick={toggleMenu} className="text-lg font-medium text-white hover:text-[#ccff00]">Contact</a>
              </div>
              <div className="mt-auto p-6 border-t border-white/5">
                <Link to="/login" onClick={toggleMenu} className="bg-[#ccff00] text-black w-full py-3 rounded-xl font-bold flex items-center justify-center transition-transform hover:scale-105">
                  LOGIN
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

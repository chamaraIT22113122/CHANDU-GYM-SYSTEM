import { Link, useLocation } from "react-router-dom";

export default function PublicNavbar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? "text-[#ccff00]" : "text-white hover:text-[#ccff00]";
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="bg-[#ccff00] text-black px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(204,255,0,0.3)]">
            LOGIN
          </Link>
        </div>
      </div>
    </nav>
  );
}

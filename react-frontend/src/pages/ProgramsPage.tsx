import PublicNavbar from "../components/PublicNavbar";
import { Link } from "react-router-dom";
import { Dumbbell, ArrowRight, Activity, Flame } from "lucide-react";

export default function ProgramsPage() {
  const programs = [
    {
      title: "Strength Training",
      description: "Build muscle, increase your strength, and improve your overall body composition with our free weights and resistance machines.",
      icon: <Dumbbell className="h-8 w-8 text-[#ccff00]" />
    },
    {
      title: "Cardio & Endurance",
      description: "Boost your stamina and heart health with our state-of-the-art treadmills, ellipticals, and stationary bikes.",
      icon: <Activity className="h-8 w-8 text-[#ccff00]" />
    },
    {
      title: "HIIT Sessions",
      description: "High-Intensity Interval Training designed to burn maximum calories in minimum time.",
      icon: <Flame className="h-8 w-8 text-[#ccff00]" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#ccff00] selection:text-black pt-20">
      <PublicNavbar />
      
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight mb-6">Our Programs</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Discover a variety of workout programs designed by experts to help you achieve your fitness goals safely and effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {programs.map((program, idx) => (
            <div key={idx} className="bg-[#141414] p-8 rounded-3xl border border-white/5 hover:border-[#ccff00]/50 transition-colors group">
              <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#ccff00]/10 transition-colors">
                {program.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{program.title}</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                {program.description}
              </p>
              <Link to="/pricing" className="text-[#ccff00] font-bold inline-flex items-center gap-2 hover:gap-4 transition-all">
                View Pricing <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

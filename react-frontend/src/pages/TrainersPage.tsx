import PublicNavbar from "../components/PublicNavbar";
import { Users, Star } from "lucide-react";

export default function TrainersPage() {
  const trainers = [
    {
      name: "Chandu",
      specialty: "Head Coach & Founder",
      bio: "With over 10 years of experience, Chandu leads our training programs with a focus on form, discipline, and absolute results.",
      rating: 5.0
    },
    {
      name: "Sarah Jenkins",
      specialty: "Nutrition & HIIT",
      bio: "Sarah specializes in high-intensity interval training and custom nutrition plans to help you shred fat and build lean muscle.",
      rating: 4.9
    },
    {
      name: "Marcus Cole",
      specialty: "Strength & Conditioning",
      bio: "A former professional athlete, Marcus brings elite-level strength and conditioning protocols to everyday fitness enthusiasts.",
      rating: 4.8
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#ccff00] selection:text-black pt-20">
      <PublicNavbar />
      
      <main className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight mb-6">Expert Trainers</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Train with industry professionals who are dedicated to pushing your limits and maximizing your potential.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trainers.map((trainer, idx) => (
            <div key={idx} className="bg-[#141414] p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center group hover:bg-white/5 transition-colors">
              <div className="h-32 w-32 bg-gradient-to-tr from-[#ccff00] to-[#b3e600] rounded-full p-1 mb-6">
                <div className="h-full w-full bg-[#141414] rounded-full flex items-center justify-center">
                  <Users className="h-12 w-12 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">{trainer.name}</h3>
              <p className="text-[#ccff00] font-medium mb-4">{trainer.specialty}</p>
              <div className="flex items-center gap-1 mb-6 bg-white/5 px-3 py-1 rounded-full">
                <Star className="h-4 w-4 text-[#ccff00] fill-[#ccff00]" />
                <span className="text-sm font-bold">{trainer.rating}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {trainer.bio}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

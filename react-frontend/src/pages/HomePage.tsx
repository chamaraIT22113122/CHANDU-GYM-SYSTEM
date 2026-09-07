import { apiFetch } from "../lib/api";
import { Link } from "react-router-dom";
import { ArrowRight, Play, CheckCircle, Users, Star, Dumbbell, Flame, Zap, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import PublicNavbar from "../components/PublicNavbar";

export default function HomePage() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    apiFetch(`/api/plans`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#ccff00] selection:text-black overflow-x-hidden">
      
      <PublicNavbar />

      {/* HERO SECTION */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 right-0 w-[50vw] h-[50vw] bg-[#ccff00]/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#ccff00]"></span>
              <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">New Features Just Launched</span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter mb-6">
              NO EXCUSES.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-[#b3e600]">ONLY RESULTS.</span>
            </h1>
            
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              Join a results-driven fitness community with certified trainers, modern equipment, and personalized programs designed to transform your body and mindset.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/login" className="w-full sm:w-auto bg-[#ccff00] text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-[#b3e600] transition-colors flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(204,255,0,0.4)]">
                Start Free Trial <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="#programs" className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg border border-white/20 hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                <Play className="h-5 w-5" /> Explore Programs
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[2.5rem] bg-gradient-to-tr from-[#141414] to-[#2a2a2a] border border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center">
              {/* Placeholder for Hero Image */}
              <Dumbbell className="h-32 w-32 text-white/5 absolute" />
              
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50 grayscale transition-opacity duration-700 hover:grayscale-0 hover:opacity-80"></div>
              
              {/* Floating Stats Card */}
              <div className="absolute bottom-10 left-[-20px] md:left-[-40px] bg-[#141414]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-600 border-2 border-[#141414]"></div>
                    <div className="h-10 w-10 rounded-full bg-gray-500 border-2 border-[#141414]"></div>
                    <div className="h-10 w-10 rounded-full bg-[#ccff00] border-2 border-[#141414] flex items-center justify-center"><Users className="h-4 w-4 text-black"/></div>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">10,000+</p>
                    <p className="text-xs text-gray-400">Happy Members</p>
                  </div>
                </div>
              </div>

              {/* Floating Rating Card */}
              <div className="absolute top-10 right-[-10px] bg-[#141414]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3">
                <div className="h-10 w-10 bg-[#ccff00]/20 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-[#ccff00] fill-[#ccff00]" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl leading-none">4.9</p>
                  <p className="text-xs text-gray-400 mt-1">Gym Rating</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* BENTO BOX FEATURES */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">Why Train With Us?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#141414] rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Dumbbell className="h-48 w-48" />
              </div>
              <div className="relative z-10">
                <div className="h-12 w-12 bg-[#ccff00] rounded-xl flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Modern Equipment</h3>
                <p className="text-gray-400 max-w-md">
                  Train with world-class machines and advanced fitness technology. Our facility is equipped with everything you need to push your limits safely.
                </p>
              </div>
            </div>

            <div className="bg-[#141414] rounded-3xl p-8 border border-white/5 group hover:border-[#ccff00]/50 transition-colors">
              <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#ccff00] transition-colors">
                <Users className="h-6 w-6 text-white group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">Certified Trainers</h3>
              <p className="text-gray-400 text-sm">
                Get expert guidance from our team of certified professionals dedicated to your success.
              </p>
            </div>

            <div className="bg-[#141414] rounded-3xl p-8 border border-white/5 group hover:border-[#ccff00]/50 transition-colors">
              <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#ccff00] transition-colors">
                <Flame className="h-6 w-6 text-white group-hover:text-black transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">Personalized Nutrition</h3>
              <p className="text-gray-400 text-sm">
                Custom diet plans tailored to your body type and fitness lifestyle.
              </p>
            </div>

            <div className="md:col-span-2 bg-gradient-to-r from-[#ccff00] to-[#b3e600] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between text-black">
              <div>
                <h3 className="text-2xl font-black uppercase mb-2">Ready to transform?</h3>
                <p className="font-medium opacity-80">Join our motivating community today and never look back.</p>
              </div>
              <Link to="/login" className="mt-6 md:mt-0 bg-black text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[#ccff00]/5 blur-[200px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">Choose Your Plan</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">No hidden fees. Flexible options to fit your lifestyle and fitness goals.</p>
          </div>

          {plans.length === 0 ? (
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-4">
                <div className="h-64 w-64 bg-white/5 rounded-3xl"></div>
                <div className="h-64 w-64 bg-white/5 rounded-3xl"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`bg-[#141414] rounded-3xl p-8 border ${plan.isPopular ? 'border-[#ccff00] shadow-[0_0_30px_rgba(204,255,0,0.15)] relative scale-105 z-10' : 'border-white/10'} flex flex-col`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#ccff00] text-black font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full">
                      Most Popular
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                  
                  <div className="mb-8">
                    <span className="text-4xl font-black text-white">LKR {plan.price.toLocaleString()}</span>
                    <span className="text-gray-500 font-medium ml-1">/ {plan.duration}</span>
                    {plan.registrationFee > 0 && (
                      <div className="text-sm font-semibold text-[#ccff00] mt-2 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> 
                        + LKR {plan.registrationFee.toLocaleString()} Registration Fee
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow space-y-4 mb-8">
                    {JSON.parse(plan.features || "[]").map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-[#ccff00] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link 
                    to="/login" 
                    className={`block w-full py-4 text-center rounded-xl font-bold transition-all ${plan.isPopular ? 'bg-[#ccff00] text-black hover:bg-[#b3e600]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

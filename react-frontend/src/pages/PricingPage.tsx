import { apiFetch } from "../lib/api";
import PublicNavbar from "../components/PublicNavbar";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function PricingPage() {
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
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#ccff00] selection:text-black overflow-x-hidden pt-20">
      <PublicNavbar />
      
      <section className="py-24 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[#ccff00]/5 blur-[200px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight mb-6">Choose Your Plan</h1>
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

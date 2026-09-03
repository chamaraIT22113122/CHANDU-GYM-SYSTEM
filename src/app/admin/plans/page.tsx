"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Edit, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    name: "", description: "", price: "", registrationFee: "", duration: "", features: "", isPopular: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plans");
      if (res.ok) setPlans(await res.json());
    } catch (err) {
      console.error("Failed to fetch plans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openPlanModal = (plan: any = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        description: plan.description || "",
        price: plan.price.toString(),
        registrationFee: plan.registrationFee ? plan.registrationFee.toString() : "",
        duration: plan.duration,
        features: JSON.parse(plan.features || "[]").join("\n"),
        isPopular: plan.isPopular
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: "", description: "", price: "", registrationFee: "", duration: "", features: "", isPopular: false
      });
    }
    setSubmitError("");
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : "/api/plans";
      const method = editingPlan ? "PUT" : "POST";
      
      const payload = {
        ...planForm,
        features: planForm.features.split("\n").filter((f: string) => f.trim() !== "")
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsPlanModalOpen(false);
        fetchPlans();
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || "Failed to save plan");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
      if (res.ok) fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Manage Plans</h1>
          <p className="text-gray-400 mt-1">Create and manage membership plans that appear on the homepage.</p>
        </div>
        <button 
          onClick={() => openPlanModal()}
          className="flex items-center gap-2 px-6 py-2.5 bg-gym-primary text-black font-bold rounded-xl hover:bg-gym-primary/90 transition-colors shadow-lg shadow-gym-primary/20"
        >
          <Plus className="h-5 w-5" /> Add New Plan
        </button>
      </div>

      <div className="glass-panel overflow-hidden p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gym-primary" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 opacity-20" />
            </div>
            <p className="text-lg">No plans available. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="glass-panel p-6 relative border border-white/5 flex flex-col bg-black/40">
                {plan.isPopular && (
                  <span className="absolute top-0 right-6 -translate-y-1/2 bg-gym-primary text-black text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md shadow-gym-primary/30">
                    Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1 mb-4 flex-grow">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-white">LKR {plan.price.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm"> / {plan.duration}</span>
                  {plan.registrationFee > 0 && (
                    <p className="text-xs text-gray-400 mt-1">+ LKR {plan.registrationFee.toLocaleString()} registration fee</p>
                  )}
                </div>
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  <button 
                    onClick={() => openPlanModal(plan)}
                    className="flex-1 py-2 bg-blue-500/10 text-blue-400 text-sm font-bold rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="flex-1 py-2 bg-red-500/10 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Modal */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsPlanModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-lg bg-gym-card relative z-10 p-6 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl"
            >
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6">{editingPlan ? "Edit Plan" : "Create New Plan"}</h2>
              
              <form onSubmit={handleSavePlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">Plan Name *</label>
                    <input 
                      type="text" required
                      value={planForm.name} onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none transition-shadow"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">Price (LKR) *</label>
                    <input 
                      type="number" required min="0" step="0.01"
                      value={planForm.price} onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none transition-shadow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">Registration Fee (LKR)</label>
                    <input 
                      type="number" min="0" step="0.01"
                      value={planForm.registrationFee} onChange={(e) => setPlanForm({...planForm, registrationFee: e.target.value})}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none transition-shadow"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-400">Duration * (e.g. 1 Month)</label>
                    <input 
                      type="text" required
                      value={planForm.duration} onChange={(e) => setPlanForm({...planForm, duration: e.target.value})}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none transition-shadow"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Description (Short)</label>
                  <input 
                    type="text"
                    value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none text-sm transition-shadow"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-400">Features (One feature per line)</label>
                  <textarea 
                    rows={4}
                    value={planForm.features} onChange={(e) => setPlanForm({...planForm, features: e.target.value})}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none text-sm transition-shadow resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center gap-2 mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                  <input 
                    type="checkbox" 
                    id="isPopular"
                    checked={planForm.isPopular}
                    onChange={(e) => setPlanForm({...planForm, isPopular: e.target.checked})}
                    className="rounded border-white/10 bg-black/40 text-gym-primary focus:ring-gym-primary h-4 w-4"
                  />
                  <label htmlFor="isPopular" className="text-sm text-gray-300 cursor-pointer select-none">
                    Mark as Popular <span className="text-gray-500 text-xs ml-1">(Highlights plan on public page)</span>
                  </label>
                </div>

                {submitError && <p className="text-red-400 text-xs font-medium">{submitError}</p>}

                <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg bg-gym-primary hover:bg-gym-accent text-black font-bold flex items-center justify-center min-w-[120px] transition-colors text-sm"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

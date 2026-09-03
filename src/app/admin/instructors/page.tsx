"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter, MoreVertical, X, Loader2, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstructorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/instructors");
      const data = await res.json();
      setInstructors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/instructors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          firstName: "", lastName: "", email: "", password: "", phone: "", specialization: ""
        });
        fetchInstructors(); // Refresh list
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Instructors Directory</h1>
          <p className="text-gray-400 mt-1">Manage gym staff, trainers, and instructors.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gym-primary hover:bg-gym-accent text-black px-4 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-gym-primary/20"
        >
          <Plus className="h-4 w-4" />
          Add Instructor
        </motion.button>
      </div>

      <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search instructors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gym-primary/50 text-sm transition-all"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 text-gym-primary animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs uppercase bg-black/20 text-gray-500 border-b border-white/5">
                <tr>
                  <th scope="col" className="px-6 py-4">Instructor</th>
                  <th scope="col" className="px-6 py-4">Specialization</th>
                  <th scope="col" className="px-6 py-4">Contact</th>
                  <th scope="col" className="px-6 py-4">Join Date</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((instructor, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={instructor.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gym-card border border-white/10 flex items-center justify-center font-bold text-gym-primary">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{instructor.firstName} {instructor.lastName}</div>
                          <div className="text-xs text-gray-500">ID: {instructor.id.substring(0,8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {instructor.specialCases || "General Trainer"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{instructor.phone || "No phone"}</div>
                      <div className="text-xs text-gray-500">{instructor.email}</div>
                    </td>
                    <td className="px-6 py-4">{new Date(instructor.joinDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {instructors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No instructors found. Add your first staff member!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Instructor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-2xl bg-gym-card relative z-10 p-6 md:p-8"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">Register New Instructor</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">First Name</label>
                    <input 
                      type="text" required
                      value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Last Name</label>
                    <input 
                      type="text" required
                      value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Email Address</label>
                    <input 
                      type="email" required
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Password</label>
                    <input 
                      type="password" required
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Phone Number</label>
                    <input 
                      type="tel" required
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-300">Specialization</label>
                    <input 
                      type="text" placeholder="e.g. Weightlifting, Crossfit, Yoga"
                      value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gym-primary hover:bg-gym-accent text-black font-bold flex items-center justify-center min-w-[150px] transition-colors"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Instructor"}
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

"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Filter, MoreVertical, X, Loader2, ChevronRight, ChevronLeft, Check, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [gymPlans, setGymPlans] = useState<any[]>([]);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    membershipId: "",
    nic: "",
    imageUrl: "",
    phone: "",
    height: "",
    weight: "",
    targetWeight: "",
    specialCases: "",
    injuries: "",
    dietAlerts: "",
    branch: "",
    packageTime: "",
    packageName: "",
    packageDuration: "",
    planStartDate: new Date().toISOString().split('T')[0], // Default to today
    planEndDate: "",
    baseFee: "",
    height: "",
    initialWeight: "",
    targetWeight: ""
  });
  const [selectedPlan, setSelectedPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = editingMemberId ? 2 : 3;

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.membershipId || !formData.phone) {
        setSubmitError("Please fill in all required personal details.");
        return;
      }
    }
    setSubmitError("");
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setSubmitError("");
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      setMembers(data);
      
      const planRes = await fetch("/api/plans");
      const planData = await planRes.json();
      setGymPlans(planData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData({ ...formData, imageUrl: data.url });
      } else {
        alert("Failed to upload image.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const method = editingMemberId ? "PUT" : "POST";
      const url = editingMemberId ? `/api/members/${editingMemberId}` : "/api/members";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingMemberId(null);
        setFormData({
          firstName: "", lastName: "", email: "", membershipId: "", phone: "",
          specialCases: "", injuries: "", dietAlerts: "",
          branch: "", packageTime: "", packageName: "", packageDuration: "",
          planStartDate: new Date().toISOString().split('T')[0], planEndDate: "", baseFee: "", maintenanceFee: "",
          height: "", initialWeight: "", targetWeight: ""
        });
        setSelectedPlan("");
        fetchMembers(); // Refresh list
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || "Failed to save member");
      }
    } catch (err) {
      console.error(err);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, member: any) => {
    e.stopPropagation();
    setEditingMemberId(member.id);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      membershipId: member.membershipId || "",
      phone: member.phone || "",
      specialCases: member.specialCases || "",
      injuries: member.injuries || "",
      dietAlerts: member.dietAlerts || "",
      branch: member.memberships?.[0]?.branch || "",
      packageTime: member.memberships?.[0]?.packageTime || "",
      packageName: member.memberships?.[0]?.packageName || "",
      packageDuration: member.memberships?.[0]?.packageDuration || "",
      planStartDate: "", // Don't pre-fill plan for edit to simplify
      planEndDate: "",
      baseFee: "",
      maintenanceFee: "",
      height: member.height?.toString() || "",
      initialWeight: member.metrics?.[0]?.weight?.toString() || "",
      targetWeight: member.targetWeight?.toString() || ""
    });
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this member? This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlanSelection = (months: number, fee: number) => {
    setSelectedPlan(months.toString());
    
    if (months === 0) {
      // Custom
      setFormData(prev => ({ ...prev, planEndDate: "", baseFee: "" }));
      return;
    }

    const start = new Date(formData.planStartDate || new Date());
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    
    setFormData(prev => ({
      ...prev,
      planEndDate: end.toISOString().split('T')[0],
      baseFee: fee.toString()
    }));
  };

  const handleOpenAddModal = async () => {
    setEditingMemberId(null);
    setSubmitError("");
    setFormData({
      firstName: "", lastName: "", email: "", membershipId: "Loading...", phone: "",
      specialCases: "", injuries: "", dietAlerts: "",
      branch: "", packageTime: "", packageName: "", packageDuration: "",
      planStartDate: new Date().toISOString().split('T')[0], planEndDate: "", baseFee: "",
      height: "", initialWeight: "", targetWeight: ""
    });
    setCurrentStep(1);
    setIsModalOpen(true);
    
    // Auto-generate membership ID
    try {
      const res = await fetch("/api/members/next-id");
      const data = await res.json();
      if (data.nextId) {
        setFormData(prev => ({ ...prev, membershipId: data.nextId }));
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, membershipId: "" })); // fallback
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Members Directory</h1>
          <p className="text-gray-400 mt-1">Manage and view all registered gym members.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 bg-gym-primary hover:bg-gym-accent text-black px-4 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-gym-primary/20"
        >
          <Plus className="h-4 w-4" />
          Add New Member
        </motion.button>
      </div>

      <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
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
                  <th scope="col" className="px-6 py-4">Member</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Join Date</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => {
                  const status = member.memberships?.[0]?.status || "NO PLAN";
                  return (
                    <motion.tr 
                      onClick={() => router.push(`/admin/members/${member.id}`)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={member.id} 
                      className="border-b border-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gym-card border border-white/10 flex items-center justify-center font-bold text-white overflow-hidden">
                            {member.imageUrl ? (
                              <img src={member.imageUrl} alt={member.firstName} className="w-full h-full object-cover" />
                            ) : (
                              member.firstName.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{member.firstName} {member.lastName}</div>
                            <div className="text-xs text-gray-500">{member.membershipId || member.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          status === 'OVERDUE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{new Date(member.joinDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => handleEditClick(e, member)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gym-primary/10 text-gym-primary hover:bg-gym-primary hover:text-black transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(e, member.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No members found. Add one to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
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
              className="glass-panel w-full max-w-2xl bg-gym-card relative z-10 p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {editingMemberId ? "Edit Member Profile" : "Register New Member"}
              </h2>
              
              {/* Step Indicators */}
              <div className="flex items-center gap-2 mb-8 mt-4 overflow-x-auto">
                {[
                  { num: 1, label: "Personal Details" },
                  { num: 2, label: "Health Info" },
                  ...(!editingMemberId ? [{ num: 3, label: "Membership Plan" }] : [])
                ].map((step, idx, arr) => (
                  <div key={step.num} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-colors ${
                      currentStep === step.num 
                        ? 'border-gym-primary bg-gym-primary text-black' 
                        : currentStep > step.num 
                          ? 'border-emerald-500 bg-emerald-500 text-black' 
                          : 'border-white/10 bg-black/20 text-gray-500'
                    }`}>
                      {currentStep > step.num ? <Check className="h-4 w-4" /> : step.num}
                    </div>
                    <span className={`ml-2 text-sm font-medium hidden sm:block ${
                      currentStep === step.num ? 'text-white' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                    {idx < arr.length - 1 && (
                      <div className="w-8 sm:w-12 h-[2px] mx-2 sm:mx-4 bg-white/10">
                        <div className={`h-full bg-emerald-500 transition-all ${currentStep > step.num ? 'w-full' : 'w-0'}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* STEP 1: PERSONAL DETAILS */}
                <div className={currentStep === 1 ? 'block space-y-6' : 'hidden'}>
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
                    <label className="text-sm font-medium text-gray-300">Email Address (Optional)</label>
                    <input 
                      type="email"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Membership ID</label>
                    <input type="text" required value={formData.membershipId} onChange={e => setFormData({...formData, membershipId: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="col-span-1 md:col-span-2 mb-4">
                    <label className="text-sm font-medium text-gray-300 block mb-2">Profile Image</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-black/20 border border-white/10 overflow-hidden flex items-center justify-center">
                        {formData.imageUrl ? (
                          <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <label className="px-4 py-2 bg-gym-card border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/5 cursor-pointer transition-colors">
                        Upload Image
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">NIC Number</label>
                    <input type="text" value={formData.nic} onChange={e => setFormData({...formData, nic: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" placeholder="e.g. 123456789V" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Phone Number</label>
                    <input 
                      type="tel" required
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                    />
                  </div>
                </div>

                {/* STEP 2: HEALTH INFO */}
                <div className={currentStep === 2 ? 'block space-y-6' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Special Cases / Notes</label>
                      <input 
                        type="text" placeholder="e.g. Asthma, High Blood Pressure"
                        value={formData.specialCases} onChange={e => setFormData({...formData, specialCases: e.target.value})}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Past Injuries</label>
                      <input 
                        type="text" placeholder="e.g. Lower back pain, Knee surgery"
                        value={formData.injuries} onChange={e => setFormData({...formData, injuries: e.target.value})}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Dietary Restrictions</label>
                      <input 
                        type="text" placeholder="e.g. Vegan, Lactose Intolerant"
                        value={formData.dietAlerts} onChange={e => setFormData({...formData, dietAlerts: e.target.value})}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                  </div>
                  
                  {/* NEW FIELDS: Height, Weight, Target Weight */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Height (cm)</label>
                      <input 
                        type="number" step="0.1" placeholder="e.g. 175"
                        value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Initial Weight (kg)</label>
                      <input 
                        type="number" step="0.1" placeholder="e.g. 70.5"
                        value={formData.initialWeight} onChange={e => setFormData({...formData, initialWeight: e.target.value})}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Target Weight (kg)</label>
                      <input 
                        type="number" step="0.1" placeholder="e.g. 65"
                        value={formData.targetWeight} onChange={e => setFormData({...formData, targetWeight: e.target.value})}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                  </div>
                </div>

                {/* STEP 3: MEMBERSHIP PLAN (Only for New Members) */}
                {!editingMemberId && (
                  <div className={currentStep === 3 ? 'block space-y-6' : 'hidden'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Branch</label>
                        <select 
                          value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}
                          className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                        >
                          <option value="">Select Branch</option>
                          <option value="Main Branch">Main Branch</option>
                          <option value="City Center">City Center</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Time</label>
                        <select 
                          value={formData.packageTime} onChange={e => setFormData({...formData, packageTime: e.target.value})}
                          className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                        >
                          <option value="">Select Time</option>
                          <option value="Full Time">Full Time</option>
                          <option value="Off Peak">Off Peak</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Package Name</label>
                        <select 
                          value={formData.packageName} 
                          onChange={e => {
                            const plan = gymPlans.find(p => p.name === e.target.value);
                            setFormData({
                              ...formData, 
                              packageName: e.target.value,
                              packageDuration: plan ? plan.duration : formData.packageDuration,
                              baseFee: plan ? plan.price.toString() : formData.baseFee,
                              maintenanceFee: plan ? (plan.registrationFee || 0).toString() : formData.maintenanceFee
                            });
                          }}
                          className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                        >
                          <option value="">Select Package Name</option>
                          {gymPlans.map(plan => (
                            <option key={plan.id} value={plan.name}>{plan.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Membership Duration</label>
                        <select 
                          value={formData.packageDuration} onChange={e => setFormData({...formData, packageDuration: e.target.value})}
                          className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                        >
                          <option value="">Select Duration</option>
                          <option value="Daily">Daily</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Bi-Annual">Bi-Annual</option>
                          <option value="Annual">Annual</option>
                        </select>
                      </div>
                    </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Start Date</label>
                      <input 
                        type="date" required
                        value={formData.planStartDate} 
                        onChange={e => {
                          setFormData({...formData, planStartDate: e.target.value});
                          setSelectedPlan(""); // Reset package selection since they manually changed dates
                        }}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">End Date</label>
                      <input 
                        type="date" required
                        value={formData.planEndDate} 
                        onChange={e => {
                          setFormData({...formData, planEndDate: e.target.value});
                          setSelectedPlan(""); // Reset package selection
                        }}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Base Fee (Rs.)</label>
                      <input 
                        type="number" required
                        value={formData.baseFee} 
                        onChange={e => {
                          setFormData({...formData, baseFee: e.target.value});
                          setSelectedPlan(""); // Reset package selection
                        }}
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                  </div>
                  </div>
                )}

                {submitError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {submitError}
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (currentStep === 1) setIsModalOpen(false);
                      else prevStep();
                    }}
                    className="px-6 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    {currentStep === 1 ? "Cancel" : <><ChevronLeft className="h-4 w-4"/> Back</>}
                  </button>
                  
                  {currentStep < totalSteps ? (
                    <button 
                      type="button" 
                      onClick={nextStep}
                      className="px-6 py-2.5 rounded-xl bg-white text-black font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      Next <ChevronRight className="h-4 w-4"/>
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-gym-primary hover:bg-gym-accent text-black font-bold flex items-center justify-center min-w-[140px] transition-colors"
                    >
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editingMemberId ? "Update Member" : "Save Member"}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

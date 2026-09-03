"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, CreditCard, AlertCircle, CheckCircle2, TrendingUp, Filter, Wallet, Receipt, Calendar, History, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2 } from "lucide-react";

type Membership = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  baseFee: number;
  maintenanceFee: number;
  penaltyFee: number;
  user: {
    id: string;
    membershipId: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  description: string;
  date: string;
  membershipId: string | null;
  user: {
    firstName: string;
    lastName: string;
  }
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"billing" | "history">("billing");
  
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, ACTIVE, OVERDUE, SUSPENDED

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentDescription, setPaymentDescription] = useState("Monthly Renewal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");



  const fetchData = async () => {
    setLoading(true);
    try {
      const [billingRes, paymentsRes] = await Promise.all([
        fetch("/api/billing"),
        fetch("/api/payments")
      ]);
      
      if (billingRes.ok) setMemberships(await billingRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPaymentModal = (m: Membership) => {
    setSelectedMembership(m);
    setEditingPaymentId(null);
    setPaymentAmount((m.baseFee + m.maintenanceFee + m.penaltyFee).toString());
    setPaymentMethod("CASH");
    setPaymentDescription("Monthly Renewal");
    setSubmitError("");
    setIsPaymentModalOpen(true);
  };

  const openEditPaymentModal = (m: Membership, p: Payment) => {
    setSelectedMembership(m);
    setEditingPaymentId(p.id);
    setPaymentAmount(p.amount.toString());
    setPaymentMethod(p.method);
    setPaymentDescription(p.description || "");
    setSubmitError("");
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMembership || !paymentAmount) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const url = editingPaymentId ? `/api/payments/${editingPaymentId}` : "/api/payments";
      const method = editingPaymentId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMembership.user.id,
          membershipId: selectedMembership.id,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          description: paymentDescription
        })
      });

      if (res.ok) {
        setIsPaymentModalOpen(false);
        fetchData(); // Refresh both lists
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || "Failed to record payment");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoPayment = async () => {
    if (!editingPaymentId) return;
    
    if (!confirm("Are you sure you want to undo this payment? This will revert the member's renewal date.")) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/payments/${editingPaymentId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setIsPaymentModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || "Failed to undo payment");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };



  const filteredMemberships = memberships.filter(m => {
    const matchName = `${m.user.firstName} ${m.user.lastName} ${m.user.membershipId || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "ALL" || m.status === filterStatus;
    return matchName && matchStatus;
  });

  const filteredPayments = payments.filter(p => {
    return `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate high-level metrics
  const totalRevenue = memberships.reduce((acc, m) => acc + (m.status === 'ACTIVE' ? (m.baseFee + m.maintenanceFee) : 0), 0);
  const totalOutstanding = memberships.reduce((acc, m) => acc + (m.status === 'OVERDUE' || m.status === 'SUSPENDED' ? (m.baseFee + m.maintenanceFee + m.penaltyFee) : 0), 0);
  const overdueCount = memberships.filter(m => m.status === 'OVERDUE').length;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Billing</h1>
          <p className="text-gray-400 mt-1">Financial oversight and payment management.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 border-l-4 border-l-gym-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Expected MRR (Active)</h3>
            <div className="p-2 bg-gym-primary/10 rounded-lg"><TrendingUp className="h-5 w-5 text-gym-primary" /></div>
          </div>
          <p className="text-3xl font-bold text-white">LKR {totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-2">Monthly Recurring Revenue</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Outstanding Balance</h3>
            <div className="p-2 bg-red-500/10 rounded-lg"><AlertCircle className="h-5 w-5 text-red-500" /></div>
          </div>
          <p className="text-3xl font-bold text-white">LKR {totalOutstanding.toLocaleString()}</p>
          <p className="text-sm text-red-400/80 mt-2 flex items-center gap-1">
            {overdueCount} accounts overdue
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Collection Rate</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
          </div>
          <p className="text-3xl font-bold text-white">
             {memberships.length > 0 ? Math.round((memberships.filter(m => m.status === 'ACTIVE').length / memberships.length) * 100) : 0}%
          </p>
          <p className="text-sm text-emerald-500/80 mt-2">Members in good standing</p>
        </motion.div>
      </div>

      <div className="glass-panel overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-black/40">
          <button 
            onClick={() => setActiveTab("billing")}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'billing' ? 'border-gym-primary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <Wallet className="h-4 w-4" /> Due Payments
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'history' ? 'border-gym-primary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <History className="h-4 w-4" /> Payment History
          </button>
        </div>

        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20">
          {activeTab === "billing" ? (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg text-sm text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gym-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="OVERDUE">Overdue</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          ) : <div></div>}
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search member..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-gym-primary transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-gym-primary animate-spin" />
          </div>
        ) : activeTab === "billing" ? (
          filteredMemberships.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <CreditCard className="h-12 w-12 mb-4 opacity-20" />
              <p>No billing records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 bg-black/10">
                    <th className="px-6 py-4 font-medium">Member</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Renewal Date</th>
                    <th className="px-6 py-4 font-medium text-right">Total Due</th>
                    <th className="px-6 py-4 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberships.map((m, idx) => {
                    const endDate = new Date(m.endDate);
                    const totalDue = m.baseFee + m.maintenanceFee + m.penaltyFee;

                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={m.id} 
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-white font-medium block">
                            {m.user.firstName} {m.user.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {m.user.membershipId ? `#${m.user.membershipId} • ` : ""}
                            {m.user.phone || "No phone"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                            m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            m.status === 'OVERDUE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {endDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-white font-bold text-right">
                          LKR {totalDue.toLocaleString()}
                          <div className="text-[10px] text-gray-500 font-normal">Base: {m.baseFee} | Reg: {m.maintenanceFee} | Pen: {m.penaltyFee}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(() => {
                            const latestPayment = payments.find(p => p.membershipId === m.id);
                            const isPaymentRecentlyDone = latestPayment && (new Date().getTime() - new Date(latestPayment.date).getTime() < 14 * 24 * 60 * 60 * 1000);
                            
                            if (isPaymentRecentlyDone) {
                              return (
                                <div className="flex flex-col items-center gap-2">
                                  <span className="text-emerald-500 font-bold text-[10px] px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">Payment Done</span>
                                  <button 
                                    onClick={() => openEditPaymentModal(m, latestPayment)}
                                    className="text-gray-400 hover:text-white text-xs underline decoration-white/20 transition-colors"
                                  >
                                    Edit Payment
                                  </button>
                                </div>
                              );
                            } else {
                              return (
                                <button 
                                  onClick={() => openPaymentModal(m)}
                                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-medium text-xs px-3 py-1.5 rounded-lg border border-blue-500/20 transition-colors"
                                >
                                  Record Payment
                                </button>
                              );
                            }
                          })()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredPayments.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <History className="h-12 w-12 mb-4 opacity-20" />
              <p>No payment history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 bg-black/10">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Member</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={p.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(p.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {p.user.firstName} {p.user.lastName}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {p.description || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/10 text-white border border-white/20">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-bold text-right">
                        LKR {p.amount.toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedMembership && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsPaymentModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md bg-gym-card relative z-10 p-6"
            >
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-1">{editingPaymentId ? "Edit Payment" : "Record Payment"}</h2>
              <p className="text-sm text-gray-400 mb-6">For {selectedMembership.user.firstName} {selectedMembership.user.lastName}</p>
              
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Total Amount Received (LKR)</label>
                  <input 
                    type="number" 
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["CASH", "CARD", "OTHER"].map(m => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-colors ${paymentMethod === m ? 'bg-gym-primary text-black border-gym-primary' : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Description / Note</label>
                  <input 
                    type="text"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none text-sm"
                  />
                </div>

                {submitError && <p className="text-red-400 text-xs">{submitError}</p>}

                <div className="flex justify-between items-center gap-3 pt-4 border-t border-white/10">
                  <div>
                    {editingPaymentId && (
                      <button 
                        type="button"
                        onClick={handleUndoPayment}
                        className="text-red-400 hover:text-red-300 text-xs font-bold px-3 py-2 transition-colors border border-red-500/20 bg-red-500/10 rounded-lg hover:bg-red-500/20"
                      >
                        Undo Payment
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center min-w-[120px] transition-colors text-sm"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPaymentId ? "Update Payment" : "Confirm Payment"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { apiFetch } from "../lib/api";
"use client";

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { QrCode, Loader2, Calendar, Coffee, Flame, Users, TrendingDown, CheckCircle2, Activity, Footprints, Droplets, Plus, CalendarClock, Clock, X, CreditCard, Scale, ActivitySquare, ChevronRight, Home, CalendarDays, Dumbbell, TrendingUp, Wallet, AlertCircle, Utensils, CalendarCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MemberPage() {
  const location = useLocation();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [completedSets, setCompletedSets] = useState<Record<number, number[]>>({});
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [qrToken, setQrToken] = useState<string | null>(null);
  
  // Date State for Workout & Diet
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [scheduleModalMode, setScheduleModalMode] = useState<"NEW" | "EDIT">("NEW");
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>("");
  const [newScheduleStartTime, setNewScheduleStartTime] = useState("");
  const [newScheduleEndTime, setNewScheduleEndTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  // Calendar State for Schedules
  const [currentScheduleMonth, setCurrentScheduleMonth] = useState(new Date());

  // Payments State
  const [payments, setPayments] = useState<any[]>([]);

  // Health Metrics State
  const [weightInput, setWeightInput] = useState("");
  const [metricDateInput, setMetricDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [bodyFatInput, setBodyFatInput] = useState("");
  const [muscleMassInput, setMuscleMassInput] = useState("");
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "diet" | "payments">("overview");

  // Video State
  const [videoMap, setVideoMap] = useState<Record<string, string>>({});
  const [activeVideo, setActiveVideo] = useState<{name: string, url: string} | null>(null);

  useEffect(() => {
    const fetchVideoMap = async () => {
      try {
        const res = await apiFetch(`/api/exercises/videos`);
        if (res.ok) {
          const data = await res.json();
          setVideoMap(data);
        }
      } catch (err) {
        console.error('Failed to fetch video map:', err);
      }
    };
    fetchVideoMap();
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['overview', 'schedule', 'diet', 'payments', 'pass'].includes(hash)) {
      setActiveTab(hash as any);
    } else if (!hash) {
      setActiveTab('overview');
    }
  }, [location.hash]);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const res = await apiFetch(`/api/members/me`);
        const data = await res.json();
        
        if (res.ok) {
          if (data.dietPlans?.length > 0 && data.dietPlans[0].details) {
            try { data.dietPlanData = JSON.parse(data.dietPlans[0].details); } catch(e){}
          }
          if (data.workoutPlans?.length > 0 && data.workoutPlans[0].schedule) {
            try { data.workoutPlanData = JSON.parse(data.workoutPlans[0].schedule); } catch(e){}
          }
          setMember(data);
          
          // Fetch bookings and payments for this member
          const [bookingsRes, paymentsRes, tokenRes] = await Promise.all([
            apiFetch(`/api/bookings?userId=${data.id}`),
            apiFetch(`/api/payments?userId=${data.id}`),
            apiFetch(`/api/attendance/token`)
          ]);

          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json();
            setBookings(bookingsData);
          }
          
          if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json();
            setPayments(paymentsData);
          }
          
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            setQrToken(tokenData.token);
          } else {
            setQrToken("ERROR");
          }
        }
      } catch (err) {
        console.error(err);
        setQrToken("ERROR");
      } finally {
        setLoading(false);
      }
    };
    fetchMemberData();
  }, []);

  // ── Dynamic QR Token: refresh every 30 seconds ────────────────────────────
  const fetchQrToken = async () => {
    try {
      const res = await apiFetch('/api/attendance/token');
      if (res.ok) {
        const data = await res.json();
        setQrToken(data.token);
      } else {
        setQrToken("ERROR");
      }
    } catch {
      setQrToken("ERROR");
    }
  };

  useEffect(() => {
    // Start polling only when the pass tab is active
    if (activeTab !== 'pass') return;
    fetchQrToken();
    const interval = setInterval(fetchQrToken, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchBookings = async () => {
    if (!member) return;
    try {
      const res = await apiFetch(`/api/bookings?userId=${member.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleDate || !newScheduleStartTime || !newScheduleEndTime) {
      setRescheduleError("Please select a date and start/end times.");
      return;
    }
    
    setIsRescheduling(true);
    try {
      // If EDIT mode, first delete old booking
      if (scheduleModalMode === "EDIT" && selectedBooking) {
        await apiFetch(`/api/bookings/${selectedBooking.id}`, { method: "DELETE" });
      }

      // Convert date string to day name for legacy support if needed
      const dayName = new Date(selectedScheduleDate).toLocaleDateString('en-US', { weekday: 'long' });

      // Create new booking
      const res = await apiFetch(`/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: member.id,
          dayOfWeek: dayName,
          bookingDate: selectedScheduleDate,
          startTime: newScheduleStartTime,
          endTime: newScheduleEndTime
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setRescheduleError(data.error || "Failed to schedule slot");
      } else {
        setIsRescheduleModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      setRescheduleError("An unexpected error occurred");
    } finally {
      setIsRescheduling(false);
    }
  };

  const openBookModal = (dateStr: string) => {
    setSelectedBooking(null);
    setScheduleModalMode("NEW");
    setSelectedScheduleDate(dateStr);
    setNewScheduleStartTime("06:00");
    setNewScheduleEndTime("07:00");
    setRescheduleError("");
    setIsRescheduleModalOpen(true);
  };

  const openRescheduleModal = (booking: any, dateStr: string) => {
    setSelectedBooking(booking);
    setScheduleModalMode("EDIT");
    setSelectedScheduleDate(dateStr);
    setNewScheduleStartTime(booking.startTime);
    setNewScheduleEndTime(booking.endTime);
    setRescheduleError("");
    setIsRescheduleModalOpen(true);
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      if (res.ok) {
        fetchBookings();
      } else {
        alert("Failed to cancel booking.");
      }
    } catch (err) {
      console.error(err);
      alert("Error canceling booking.");
    }
  };

  // Reset completed sets when day changes
  useEffect(() => {
    setCompletedSets({});
    const fetchHistory = async () => {
      try {
        const res = await apiFetch(`/api/members/me/workout-history?date=${selectedDateStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data.completedSets && Object.keys(data.completedSets).length > 0) {
            setCompletedSets(data.completedSets);
          }
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, [selectedDateStr]);

  const handleSaveWorkout = async () => {
    setIsSavingWorkout(true);
    try {
      const res = await apiFetch(`/api/members/me/workout-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDateStr,
          dayName: selectedDateStr,
          completedSets
        })
      });
      if (res.ok) {
        alert("Workout saved successfully!");
      } else {
        alert("Failed to save workout. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving workout.");
    } finally {
      setIsSavingWorkout(false);
    }
  };

  const toggleSet = (eIdx: number, sIdx: number) => {
    setCompletedSets(prev => {
      const current = prev[eIdx] || [];
      if (current.includes(sIdx)) {
        return { ...prev, [eIdx]: current.filter(i => i !== sIdx) };
      } else {
        return { ...prev, [eIdx]: [...current, sIdx] };
      }
    });
  };

  const handleLogWeight = async () => {
    if (!weightInput || isNaN(parseFloat(weightInput))) return;
    setIsLoggingWeight(true);
    try {
      const payload: any = { weight: parseFloat(weightInput), date: metricDateInput };
      if (bodyFatInput) payload.bodyFat = parseFloat(bodyFatInput);
      if (muscleMassInput) payload.muscleMass = parseFloat(muscleMassInput);

      const res = await apiFetch(`/api/members/me/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setWeightInput("");
        setBodyFatInput("");
        setMuscleMassInput("");
        // Reload member data to get new metric
        const memRes = await apiFetch(`/api/members/me`);
        if (memRes.ok) {
          const data = await memRes.json();
          setMember(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingWeight(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gym-primary animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center mt-20 text-gray-400">
        <p>No active member found.</p>
        <p className="text-sm mt-2">Please register a member in the Admin panel first.</p>
      </div>
    );
  }

  const membership = member.memberships?.[0];
  let daysUntilPayment = 0;
  if (membership?.endDate) {
    const timeDiff = new Date(membership.endDate).getTime() - new Date().getTime();
    daysUntilPayment = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }


  // Real Progress Data
  const currentStreak = member.currentStreak || 0;
  const currentWeight = member.metrics?.[(member.metrics?.length || 1) - 1]?.weight || 0;
  
  // To calculate weight lost, we need the initial weight (oldest metric) or target weight.
  const initialWeight = member.metrics?.[0]?.weight || currentWeight;
  const weightLost = initialWeight > 0 ? (initialWeight - currentWeight) : 0;
  
  const heightInMeters = member.height ? member.height / 100 : 0;
  
  // Calculate BMI
  let bmi = 0;
  let bmiCategory = "Unknown";
  let bmiColor = "text-gray-400";
  let bmiBg = "bg-gray-500/10 border-gray-500/20";
  
  if (currentWeight > 0 && heightInMeters > 0) {
    bmi = parseFloat((currentWeight / (heightInMeters * heightInMeters)).toFixed(1));
    if (bmi < 18.5) {
      bmiCategory = "Underweight";
      bmiColor = "text-blue-400";
      bmiBg = "bg-blue-500/10 border-blue-500/20";
    } else if (bmi >= 18.5 && bmi < 25) {
      bmiCategory = "Normal";
      bmiColor = "text-emerald-400";
      bmiBg = "bg-emerald-500/10 border-emerald-500/20";
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = "Overweight";
      bmiColor = "text-orange-400";
      bmiBg = "bg-orange-500/10 border-orange-500/20";
    } else {
      bmiCategory = "Obese";
      bmiColor = "text-red-400";
      bmiBg = "bg-red-500/10 border-red-500/20";
    }
  }

  const targetWeight = member.targetWeight || null;
  
  // Real Gym Capacity
  const capacityPct = member.capacityPct || 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Hi, {member.firstName} 👋</h1>
            {currentStreak > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-orange-500/20 border border-orange-500/30 px-2 py-1 rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-500">{currentStreak} Day Streak!</span>
              </motion.div>
            )}
          </div>
          <p className="text-gray-400 mt-1">Ready to crush your goals today?</p>
        </div>
        <div className="text-left md:text-right flex items-center md:block gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Next Payment</p>
            <p className={`text-sm font-medium mt-1 ${daysUntilPayment < 5 ? 'text-red-500' : 'text-gym-primary'}`}>
              {daysUntilPayment > 0 ? `In ${daysUntilPayment} Day${daysUntilPayment !== 1 ? 's' : ''}` : 'OVERDUE'}
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-white/10 sticky top-16 z-30 bg-gym-dark/90 backdrop-blur-xl -mx-4 px-4 md:mx-0 md:px-0">
        {[
          { id: 'overview', label: 'Overview', icon: Home },
          { id: 'schedule', label: 'Schedule & Workouts', icon: CalendarDays },
          { id: 'diet', label: 'Diet', icon: Utensils },
          { id: 'payments', label: 'Payments', icon: Wallet }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              window.location.hash = tab.id;
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-gym-primary text-black shadow-[0_0_15px_rgba(208,255,0,0.3)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* RENEWAL NOTIFICATION BANNER */}
      {membership && (daysUntilPayment <= 3) && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} 
          className={`p-4 rounded-xl border-l-4 shadow-lg flex items-start gap-4 ${
            daysUntilPayment < 0 
              ? 'bg-red-500/10 border-red-500 text-red-100' 
              : 'bg-orange-500/10 border-orange-500 text-orange-100'
          }`}
        >
          <AlertCircle className={`h-6 w-6 flex-shrink-0 mt-0.5 ${daysUntilPayment < 0 ? 'text-red-500' : 'text-orange-500'}`} />
          <div>
            <h3 className={`font-bold text-lg ${daysUntilPayment < 0 ? 'text-red-400' : 'text-orange-400'}`}>
              {daysUntilPayment < 0 ? 'Membership Overdue!' : 'Upcoming Renewal Notice'}
            </h3>
            <p className="text-sm opacity-90 mt-1">
              {daysUntilPayment < 0 
                ? `Your membership expired ${Math.abs(daysUntilPayment)} days ago. Please visit the front desk to settle your payment to avoid interruption of services.`
                : `Your membership will renew in ${daysUntilPayment} days (${new Date(membership.endDate).toLocaleDateString()}). Please ensure your payment is ready.`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Live Capacity & Progress Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 border-l-4 border-l-blue-500 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Users className="h-24 w-24 text-blue-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${capacityPct > 80 ? 'bg-red-400' : capacityPct > 50 ? 'bg-orange-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${capacityPct > 80 ? 'bg-red-500' : capacityPct > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
            </span>
            Live Gym Capacity
          </h3>
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-white">{capacityPct}% Full</p>
              <p className={`text-xs mt-1 ${capacityPct > 80 ? 'text-red-400' : capacityPct > 50 ? 'text-orange-400' : 'text-emerald-400'}`}>
                {capacityPct > 80 ? 'Very Busy right now' : capacityPct > 50 ? 'Moderately Busy' : 'Quiet right now'}
              </p>
            </div>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 mt-2">
            <div className={`h-2 rounded-full transition-all duration-1000 ${capacityPct > 80 ? 'bg-red-500' : capacityPct > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${capacityPct}%` }}></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 border-l-4 border-l-emerald-500">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-emerald-500" />
            Weight Goal Progress
          </h3>
          <div className="flex items-end gap-6">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Current</span>
              <p className="text-2xl font-bold text-white">{currentWeight} <span className="text-sm font-normal text-gray-400">kg</span></p>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Target</span>
              <p className="text-lg font-semibold text-gray-300">{targetWeight} <span className="text-xs font-normal text-gray-500">kg</span></p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider block">Lost So Far</span>
              <p className="text-lg font-bold text-emerald-500">-{weightLost.toFixed(1)} <span className="text-xs font-normal text-emerald-500/70">kg</span></p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
      )}

      {/* SCHEDULE & WORKOUTS TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-gym-primary" />
              {currentScheduleMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentScheduleMonth(new Date(currentScheduleMonth.getFullYear(), currentScheduleMonth.getMonth() - 1, 1))}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
              <button 
                onClick={() => setCurrentScheduleMonth(new Date())}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold text-white transition-colors"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentScheduleMonth(new Date(currentScheduleMonth.getFullYear(), currentScheduleMonth.getMonth() + 1, 1))}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="glass-panel p-6 border border-white/5">
            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-sm font-bold text-gray-400 uppercase tracking-wider">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const today = new Date();
                const year = currentScheduleMonth.getFullYear();
                const month = currentScheduleMonth.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                const cells = [];
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="min-h-[100px] bg-black/10 rounded-xl border border-white/5 opacity-30"></div>);
                }
                
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const booking = bookings.find(b => b.status === "SCHEDULED" && b.bookingDate === dateString);
                  
                  cells.push(
                    <div 
                      key={`day-${day}`}
                      onClick={() => setSelectedDateStr(dateString)}
                      className={`p-3 min-h-[100px] rounded-xl flex flex-col cursor-pointer transition-all ${
                        selectedDateStr === dateString ? 'bg-gym-primary/20 border-2 border-gym-primary' : 'bg-black/20 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`text-lg font-bold ${selectedDateStr === dateString ? 'text-gym-primary' : 'text-white'}`}>{day}</span>
                      {booking && <div className="mt-auto text-[10px] bg-gym-primary/20 text-gym-primary px-1 rounded truncate font-bold">{booking.startTime}</div>}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Workout for {selectedDateStr}</h3>
              {(() => {
                const booking = bookings.find(b => b.bookingDate === selectedDateStr);
                if (booking) {
                  return (
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-400 font-bold">{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <button 
                        onClick={() => openRescheduleModal(booking, selectedDateStr)} 
                        className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg font-medium transition-colors border border-white/10"
                      >
                        Reschedule
                      </button>
                      <button 
                        onClick={() => cancelBooking(booking.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Cancel Booking"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                }
                return (
                  <button onClick={() => openBookModal(selectedDateStr)} className="text-sm bg-gym-primary text-black px-4 py-2 rounded-lg font-bold shadow-[0_0_15px_rgba(208,255,0,0.2)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" /> Book Session
                  </button>
                );
              })()}
            </div>
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedDateStr + 'workout'}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col mt-4"
              >
                {member.workoutPlanData ? (
                  (() => {
                    const currentWorkout = member?.workoutPlanData?.days?.find((d: any) => d.dayName === selectedDateStr) || { exercises: [] };
                    return currentWorkout.exercises?.length > 0 ? (
                      <div className="space-y-4 flex-1">
                        {(() => {
                        let totalSets = 0;
                        let totalDone = 0;
                        currentWorkout.exercises.forEach((ex: any, idx: number) => {
                          totalSets += parseInt(ex.sets) || 0;
                          totalDone += (completedSets[idx] || []).length;
                        });
                        const progressPct = totalSets > 0 ? (totalDone / totalSets) * 100 : 0;
                        
                        return (
                          <div className="bg-gym-primary/10 border border-gym-primary/20 p-4 rounded-xl mb-4 relative overflow-hidden">
                            <div className="flex justify-between items-center relative z-10 mb-2">
                              <h4 className="text-sm font-bold text-gym-primary tracking-wide flex items-center gap-2">
                                <Flame className="h-4 w-4" /> Assigned Workout
                              </h4>
                              <span className="text-xs font-bold text-gym-primary bg-black/40 px-2 py-1 rounded-lg">
                                {totalDone} / {totalSets} Sets Completed
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-black/40 rounded-full h-1.5 mt-2 relative z-10 overflow-hidden">
                              <motion.div 
                                className="h-1.5 rounded-full bg-gradient-to-r from-gym-primary to-emerald-400" 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentWorkout.exercises.map((ex: any, eIdx: number) => {
                          const targetSets = parseInt(ex.sets) || 1;
                          const doneSets = completedSets[eIdx] || [];
                          const isCompleted = doneSets.length === targetSets && targetSets > 0;
                          const videoUrl = videoMap[ex.name?.trim().toLowerCase()];

                          return (
                            <motion.div 
                              key={eIdx}
                              layout
                              className={`flex flex-col rounded-2xl border transition-all duration-300 shadow-lg overflow-hidden relative group ${
                                isCompleted 
                                  ? 'bg-emerald-900/20 border-emerald-500/50 shadow-emerald-500/10' 
                                  : 'bg-black/40 border-white/10 hover:border-gym-primary/50'
                              }`}
                            >
                              {/* Video Section - Top */}
                              <div className="w-full aspect-[4/3] bg-black/80 relative overflow-hidden flex items-center justify-center">
                                {videoUrl ? (
                                  <video 
                                    src={videoUrl} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    controls
                                    preload="metadata"
                                    className={`w-full h-full object-contain transition-opacity duration-500 ${isCompleted ? 'opacity-40 grayscale' : 'opacity-90 group-hover:opacity-100'}`}
                                  />
                                ) : (
                                  <Dumbbell className={`h-12 w-12 transition-opacity ${isCompleted ? 'text-emerald-500/30' : 'text-gray-600'}`} />
                                )}
                                
                                {/* Completion Overlay */}
                                <AnimatePresence>
                                  {isCompleted && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.5 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.5 }}
                                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                      <div className="bg-emerald-500/20 p-4 rounded-full backdrop-blur-sm border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                
                                {/* Overlay Gradient for Text Readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
                              </div>
                              
                              {/* Info & Controls Section - Bottom */}
                              <div className="p-4 flex-1 flex flex-col relative z-10 -mt-6 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                                <h5 className={`font-bold text-lg mb-1 line-clamp-2 leading-tight ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                                  {ex.name}
                                </h5>
                                <p className="text-xs text-gray-400 mb-6">{ex.sets} Sets × {ex.reps} Reps</p>

                                {/* Sets Tracking Grid */}
                                <div className="mt-auto">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Progress</span>
                                    <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-400' : 'text-gym-primary'}`}>
                                      {doneSets.length} / {targetSets} Sets
                                    </span>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    {Array.from({ length: targetSets }).map((_, sIdx) => {
                                      const isSetDone = doneSets.includes(sIdx);
                                      return (
                                        <button 
                                          key={sIdx}
                                          onClick={(e) => { e.stopPropagation(); toggleSet(eIdx, sIdx); }}
                                          className={`h-10 flex-1 min-w-[40px] rounded-xl border-2 flex items-center justify-center transition-all duration-300 font-bold text-sm hover:scale-105 active:scale-95 ${
                                            isSetDone 
                                              ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                              : 'bg-black/60 border-white/10 text-gray-400 hover:border-gym-primary hover:text-gym-primary'
                                          }`}
                                        >
                                          {isSetDone ? <CheckCircle2 className="h-5 w-5" /> : sIdx + 1}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {member.workoutPlanData.notes && (
                        <div className="mt-6 p-4 bg-black/30 border border-white/5 rounded-xl border-l-2 border-l-gym-primary">
                          <span className="text-[10px] text-gym-primary uppercase tracking-widest font-bold block mb-1">Trainer Notes</span>
                          <p className="text-sm text-gray-300 italic">"{member.workoutPlanData.notes}"</p>
                        </div>
                      )}
                      
                      {currentWorkout.exercises.length > 0 && (
                        <div className="mt-8 flex justify-center">
                          <button
                            onClick={handleSaveWorkout}
                            disabled={isSavingWorkout}
                            className="bg-gym-primary text-black font-bold text-lg px-12 py-4 rounded-xl shadow-[0_0_20px_rgba(208,255,0,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                          >
                            {isSavingWorkout ? (
                              <>
                                <div className="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-6 w-6" /> Complete Workout
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-xl bg-black/20 min-h-[300px]">
                      <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Coffee className="h-8 w-8 text-gym-primary/50" />
                      </div>
                      <p className="text-lg font-bold text-white mb-1">Rest Day</p>
                      <p className="text-sm text-gray-400">Your muscles grow when you rest. Enjoy your recovery!</p>
                    </div>
                  );
                  })()
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-black/10 min-h-[300px]">
                    <p className="text-gray-400">No workout schedule found.</p>
                    <p className="text-sm text-gray-500 mt-2">Talk to your instructor to build your program!</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Due Payment Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`glass-panel p-6 border ${daysUntilPayment <= 5 ? (daysUntilPayment < 0 ? 'border-red-500/50 bg-red-500/5' : 'border-orange-500/50 bg-orange-500/5') : 'border-white/5'}`}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className={`h-5 w-5 ${daysUntilPayment < 0 ? 'text-red-500' : 'text-gym-primary'}`} />
              Payment Status
            </h3>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/20 rounded-xl p-4">
              <div>
                <p className="text-sm text-gray-400">Next Payment Due</p>
                <p className={`text-xl font-bold mt-1 ${daysUntilPayment < 0 ? 'text-red-500' : (daysUntilPayment <= 5 ? 'text-orange-500' : 'text-white')}`}>
                  {membership?.endDate ? new Date(membership.endDate).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {daysUntilPayment > 0 ? `In ${daysUntilPayment} Days` : (daysUntilPayment < 0 ? `${Math.abs(daysUntilPayment)} Days Overdue` : 'Due Today')}
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-sm text-gray-400">Amount Due</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  Rs. {((membership?.baseFee || 0) + (membership?.maintenanceFee || 0)).toLocaleString()}
                </p>
                {membership?.packageName && (
                  <p className="text-xs text-gray-500 mt-1">Plan: {membership.packageName}</p>
                )}
              </div>
            </div>
          </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="glass-panel p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          Payment History
        </h3>
        {payments.length === 0 ? (
          <p className="text-gray-400 text-sm">No payment history found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map(p => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-sm text-gray-300">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-3 text-sm text-gray-400">{p.description}</td>
                    <td className="py-3 text-sm">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">{p.method}</span>
                    </td>
                    <td className="py-3 text-sm font-bold text-emerald-400 text-right">Rs. {p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
      </div>
      )}

      {/* DIET TAB */}
      {activeTab === 'diet' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* CALENDAR HEADER */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-b-2 border-orange-500/20 sticky top-20 z-30 backdrop-blur-2xl">
        <Calendar className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />
        {(() => {
          // Generate an array of 7 days starting from today or aligned to the week
          const days = [];
          for (let i = -3; i <= 3; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const isToday = i === 0;
            const shortName = d.toLocaleDateString('en-US', { weekday: 'short' });
            
            days.push(
              <button 
                key={dateString}
                onClick={() => setSelectedDateStr(dateString)}
                className={`flex flex-col items-center flex-1 min-w-[70px] py-2 rounded-xl transition-all border ${selectedDateStr === dateString ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 scale-105 border-orange-500' : isToday ? 'bg-white/10 text-white border-white/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'}`}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-80">{shortName}</span>
                <span className="text-sm mt-0.5">{d.getDate()}</span>
              </button>
            );
          }
          return days;
        })()}
      </motion.div>

      <div className="relative">
        {/* Assigned Diet Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="glass-panel p-6 flex flex-col" id="diet">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Diet Plan ({new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})</h3>
            {member.dietPlanData ? (
              <span className="text-xs font-medium bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-full tracking-wider border border-orange-500/20">ACTIVE</span>
            ) : (
              <span className="text-xs font-medium bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full tracking-wider">NOT ASSIGNED</span>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDateStr + 'diet'}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {member.dietPlanData ? (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
                      <div className="text-gray-400 text-[10px] uppercase mb-1">Calories</div>
                      <div className="text-white font-bold text-sm">{member.dietPlanData.calories || 0}</div>
                    </div>
                    <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
                      <div className="text-gray-400 text-[10px] uppercase mb-1">Protein</div>
                      <div className="text-orange-500 font-bold text-sm">{member.dietPlanData.protein || 0}g</div>
                    </div>
                    <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
                      <div className="text-gray-400 text-[10px] uppercase mb-1">Carbs</div>
                      <div className="text-white font-bold text-sm">{member.dietPlanData.carbs || 0}g</div>
                    </div>
                    <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
                      <div className="text-gray-400 text-[10px] uppercase mb-1">Fats</div>
                      <div className="text-white font-bold text-sm">{member.dietPlanData.fats || 0}g</div>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 relative border-l-2 border-white/10 ml-3 pl-5 py-2">
                    {member.dietPlanData.meal1 && (
                      <div className="relative bg-white/5 p-4 rounded-xl border border-white/5 shadow-md hover:bg-white/10 transition-colors">
                        <div className="absolute w-3 h-3 bg-orange-500 rounded-full -left-[27px] top-5 border-[3px] border-black"></div>
                        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Breakfast</span>
                        <p className="text-sm text-white mt-1 leading-relaxed">{member.dietPlanData.meal1}</p>
                      </div>
                    )}
                    {member.dietPlanData.meal2 && (
                      <div className="relative bg-white/5 p-4 rounded-xl border border-white/5 shadow-md hover:bg-white/10 transition-colors">
                        <div className="absolute w-3 h-3 bg-orange-500 rounded-full -left-[27px] top-5 border-[3px] border-black"></div>
                        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Lunch</span>
                        <p className="text-sm text-white mt-1 leading-relaxed">{member.dietPlanData.meal2}</p>
                      </div>
                    )}
                    {member.dietPlanData.meal3 && (
                      <div className="relative bg-white/5 p-4 rounded-xl border border-white/5 shadow-md hover:bg-white/10 transition-colors">
                        <div className="absolute w-3 h-3 bg-orange-500 rounded-full -left-[27px] top-5 border-[3px] border-black"></div>
                        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Dinner</span>
                        <p className="text-sm text-white mt-1 leading-relaxed">{member.dietPlanData.meal3}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-black/10 min-h-[300px]">
                  <p className="text-gray-400">You don't have a custom diet plan yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Talk to your instructor to get one assigned!</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      </div>
      )}

      {/* PASS TAB */}
      {activeTab === 'pass' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center pt-8 pb-20">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel p-8 flex flex-col items-center justify-center text-center max-w-sm w-full mx-auto relative overflow-hidden mt-8"
          >
            {/* Background design */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-gym-primary/20 to-transparent opacity-50" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gym-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gym-primary/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full">
              <h2 className="text-2xl font-bold text-white mb-1">Gym Pass</h2>
              <p className="text-gray-400 text-sm mb-8">Scan this at the entrance</p>

              {/* Anti-fraud animated border wrapper */}
              <div className="relative mx-auto mb-6" style={{ width: 208, height: 208 }}>
                {/* Animated spinning ring — proves this is a live app, not a screenshot */}
                <div className="absolute inset-0 rounded-2xl" style={{
                  background: 'conic-gradient(from 0deg, #ccff00, #00ff88, #00ccff, #ccff00)',
                  animation: 'spin 3s linear infinite',
                  padding: 3
                }}>
                  <div className="w-full h-full rounded-2xl bg-[#111]" />
                </div>
                <div className="absolute inset-[3px] bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                  {qrToken && qrToken !== "ERROR" ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrToken)}`} 
                      alt="QR Code" 
                      className="w-full h-full object-contain p-2"
                    />
                  ) : qrToken === "ERROR" ? (
                    <div className="flex flex-col items-center justify-center text-red-500 px-4">
                      <span className="text-xs text-center font-bold">Failed to load</span>
                      <button onClick={fetchQrToken} className="text-[10px] text-gym-primary mt-2 underline">Retry</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-xs text-center">Generating...</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-600 mb-3">🔄 Refreshes every 30 seconds</p>

              {/* Copy token button — for manual entry on scanner */}
              {qrToken && qrToken !== "ERROR" && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrToken);
                    alert("Token copied! Paste it in the scanner's Manual Entry box.");
                  }}
                  className="text-xs text-gym-primary border border-gym-primary/30 px-4 py-1.5 rounded-full hover:bg-gym-primary/10 transition-all mb-4"
                >
                  📋 Copy Token for Manual Entry
                </button>
              )}

              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Member ID</p>
                <p className="text-xl font-mono text-gym-primary font-bold tracking-widest">{member.membershipId || member.id.substring(0, 8).toUpperCase()}</p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 w-full flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                {daysUntilPayment < 0 ? (
                  <span className="text-red-500 font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> INACTIVE</span>
                ) : (
                  <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> ACTIVE</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reschedule Modal */}
      <AnimatePresence>
        {isRescheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsRescheduleModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md bg-gym-card relative z-10 p-6"
            >
              <button 
                onClick={() => setIsRescheduleModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-4">
                {scheduleModalMode === "EDIT" ? "Reschedule Booking" : "Book Session"}
              </h2>
              
              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Selected Date</label>
                  <input 
                    type="date"
                    required
                    style={{ colorScheme: 'dark' }}
                    readOnly={scheduleModalMode === "NEW"} // Keep it fixed for new to the clicked day
                    value={selectedScheduleDate}
                    onChange={(e) => setSelectedScheduleDate(e.target.value)}
                    className={`w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none ${scheduleModalMode === "NEW" ? 'opacity-70' : ''}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Start Time</label>
                    <input 
                      type="time"
                      required
                      style={{ colorScheme: 'dark' }}
                      value={newScheduleStartTime}
                      onChange={(e) => setNewScheduleStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">End Time</label>
                    <input 
                      type="time"
                      required
                      style={{ colorScheme: 'dark' }}
                      value={newScheduleEndTime}
                      onChange={(e) => setNewScheduleEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none"
                    />
                  </div>
                </div>

                {rescheduleError && <p className="text-red-400 text-xs">{rescheduleError}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setIsRescheduleModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isRescheduling}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center justify-center min-w-[120px] transition-colors text-sm"
                  >
                    {isRescheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Change"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setActiveVideo(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-2xl bg-gym-card relative z-10 p-4 border border-gym-primary/30"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gym-primary">{activeVideo.name}</h2>
                <button 
                  onClick={() => setActiveVideo(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10 relative">
                <video 
                  src={activeVideo.url} 
                  controls 
                  autoPlay 
                  loop
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

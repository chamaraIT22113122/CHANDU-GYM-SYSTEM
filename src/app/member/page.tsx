"use client";

import { useState, useEffect } from "react";
import { QrCode, Loader2, Calendar, Coffee, Flame, Users, TrendingDown, CheckCircle2, Activity, Footprints, Droplets, Plus, CalendarClock, Clock, X, CreditCard, Scale, ActivitySquare, ChevronRight, Home, CalendarDays, Dumbbell, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MemberDashboard() {
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Default to current day
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const [selectedDay, setSelectedDay] = useState(weekDays.includes(today) ? today : 'Mon');
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  
  // Bookings State
  const [bookings, setBookings] = useState<any[]>([]);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newScheduleDays, setNewScheduleDays] = useState<string[]>([]);
  const [newScheduleStartTime, setNewScheduleStartTime] = useState("");
  const [newScheduleEndTime, setNewScheduleEndTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

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
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'workout' || hash === 'diet') {
        setActiveTab('workout-diet');
      } else if (['overview', 'schedule', 'progress', 'payments'].includes(hash)) {
        setActiveTab(hash);
      } else if (!hash) {
        setActiveTab('overview');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const res = await fetch("/api/members/me");
        const data = await res.json();
        
        if (res.ok) {
          if (data.dietPlans?.length > 0) {
            data.dietPlanData = JSON.parse(data.dietPlans[0].details);
          }
          if (data.workoutPlans?.length > 0) {
            data.workoutPlanData = JSON.parse(data.workoutPlans[0].schedule);
          }
          setMember(data);
          
          // Fetch bookings and payments for this member
          const [bookingsRes, paymentsRes] = await Promise.all([
            fetch(`/api/bookings?userId=${data.id}`),
            fetch(`/api/payments?userId=${data.id}`)
          ]);

          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json();
            setBookings(bookingsData);
          }
          
          if (paymentsRes.ok) {
            const paymentsData = await paymentsRes.json();
            setPayments(paymentsData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberData();
  }, []);

  const fetchBookings = async () => {
    if (!member) return;
    try {
      const res = await fetch(`/api/bookings?userId=${member.id}`);
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
    if (newScheduleDays.length === 0 || !newScheduleStartTime || !newScheduleEndTime || !selectedBooking) {
      setRescheduleError("Please select at least one day and start/end times.");
      return;
    }
    
    setIsRescheduling(true);
    try {
      // First delete old booking
      await fetch(`/api/bookings/${selectedBooking.id}`, { method: "DELETE" });

      // Create new bookings for selected days
      const promises = newScheduleDays.map(dayOfWeek => 
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: member.id,
            dayOfWeek,
            startTime: newScheduleStartTime,
            endTime: newScheduleEndTime
          })
        }).then(res => res.json().then(data => ({ ok: res.ok, data })))
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.ok);

      if (errors.length > 0) {
        setRescheduleError(errors.map(e => e.data.error).join(", ") || "Failed to reschedule some slots");
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

  const openRescheduleModal = (booking: any) => {
    setSelectedBooking(booking);
    setNewScheduleDays([booking.dayOfWeek]);
    setNewScheduleStartTime(booking.startTime);
    setNewScheduleEndTime(booking.endTime);
    setRescheduleError("");
    setIsRescheduleModalOpen(true);
  };

  // Reset completed exercises when day changes
  useEffect(() => {
    setCompletedExercises([]);
  }, [selectedDay]);

  const toggleExercise = (index: number) => {
    if (completedExercises.includes(index)) {
      setCompletedExercises(completedExercises.filter(i => i !== index));
    } else {
      setCompletedExercises([...completedExercises, index]);
    }
  };

  const handleLogWeight = async () => {
    if (!weightInput || isNaN(parseFloat(weightInput))) return;
    setIsLoggingWeight(true);
    try {
      const payload: any = { weight: parseFloat(weightInput), date: metricDateInput };
      if (bodyFatInput) payload.bodyFat = parseFloat(bodyFatInput);
      if (muscleMassInput) payload.muscleMass = parseFloat(muscleMassInput);

      const res = await fetch("/api/members/me/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setWeightInput("");
        setBodyFatInput("");
        setMuscleMassInput("");
        // Reload member data to get new metric
        const memRes = await fetch("/api/members/me");
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

  const dayIndex = weekDays.indexOf(selectedDay);
  
  const selectedFullDay = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun': 'Sunday'
  }[selectedDay];

  let currentWorkout = member.workoutPlanData?.days?.find((d: any) => d.dayName === selectedFullDay);
  
  if (!currentWorkout) {
    const fallbackWorkout = member.workoutPlanData?.days?.[dayIndex];
    if (fallbackWorkout && (!fallbackWorkout.dayName || fallbackWorkout.dayName.startsWith("Day "))) {
      currentWorkout = fallbackWorkout;
    }
  }

  // Real Progress Data
  const currentStreak = member.currentStreak || 0;
  const currentWeight = member.metrics?.[0]?.weight || 0;
  
  // To calculate weight lost, we need the initial weight (oldest metric) or target weight.
  const initialWeight = member.metrics?.[member.metrics.length - 1]?.weight || currentWeight;
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
              {daysUntilPayment > 0 ? `In ${daysUntilPayment} Days` : 'OVERDUE'}
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-white/10 sticky top-16 z-30 bg-gym-dark/90 backdrop-blur-xl -mx-4 px-4 md:mx-0 md:px-0">
        {[
          { id: 'overview', label: 'Overview', icon: Home },
          { id: 'schedule', label: 'Schedule', icon: CalendarDays },
          { id: 'workout-diet', label: 'Workout & Diet', icon: Dumbbell },
          { id: 'progress', label: 'Progress', icon: TrendingUp },
          { id: 'payments', label: 'Payments', icon: Wallet }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
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

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Upcoming Bookings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-panel p-6 border border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-400" />
          My Schedule
        </h3>
        {bookings.filter(b => b.status === "SCHEDULED").length === 0 ? (
          <p className="text-gray-400 text-sm">You have no upcoming bookings. Contact your trainer to schedule a slot.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.filter(b => b.status === "SCHEDULED").map(booking => (
              <div key={booking.id} className="bg-black/20 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{booking.dayOfWeek}</p>
                  <p className="text-gray-400 text-sm flex items-center gap-1 mt-1"><Clock className="h-3 w-3" /> {booking.startTime} - {booking.endTime}</p>
                </div>
                <button 
                  onClick={() => openRescheduleModal(booking)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  Reschedule
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
      </div>
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Payment History */}
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

      {/* PROGRESS TAB */}
      {activeTab === 'progress' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-emerald-500" />
                Weight Progress
              </h3>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Starting (In)</span>
                  <p className="text-xl font-semibold text-gray-300">{initialWeight} <span className="text-xs font-normal text-gray-500">kg</span></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Current (Out)</span>
                  <p className="text-3xl font-bold text-white">{currentWeight} <span className="text-sm font-normal text-gray-400">kg</span></p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 border-l-4 border-l-blue-500 flex flex-col justify-between">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <ActivitySquare className="h-4 w-4 text-blue-500" />
                Body Mass Index
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{bmi > 0 ? bmi : "--"}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${bmiBg} ${bmiColor}`}>
                    {bmiCategory}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5 border-l-4 border-l-gym-primary flex flex-col justify-between">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-gym-primary" />
                Target & Change
              </h3>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Target</span>
                  <p className="text-xl font-semibold text-gray-300">{targetWeight} <span className="text-xs font-normal text-gray-500">kg</span></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Change So Far</span>
                  <p className="text-3xl font-bold text-gym-primary">
                    {weightLost > 0 ? `-${weightLost.toFixed(1)}` : `+${Math.abs(weightLost).toFixed(1)}`} 
                    <span className="text-sm font-normal text-gym-primary/70"> kg</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Weight Chart (Takes up 2/3 space) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gym-primary" /> Progress Over Time
                </h3>
              </div>
              <div className="h-[300px] w-full">
                {member.metrics && member.metrics.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...(member.metrics || [])].reverse().map(m => ({
                      date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      weight: m.weight
                    }))}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dcfce7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#dcfce7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#dcfce7' }}
                      />
                      <Area type="monotone" dataKey="weight" stroke="#dcfce7" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No weight data logged yet.
                  </div>
                )}
              </div>
            </motion.div>

            {/* Log Metric Form */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Scale className="h-5 w-5 text-gym-primary" /> Log Measurement
                </h3>
              </div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1">Date</label>
                  <input 
                    type="date"
                    value={metricDateInput}
                    onChange={e => setMetricDateInput(e.target.value)}
                    className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 block mb-1">Weight (kg) *</label>
                  <input 
                    type="number" step="0.1" 
                    value={weightInput} onChange={e => setWeightInput(e.target.value)}
                    placeholder="e.g. 71.5"
                    className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50 text-sm placeholder-gray-600"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                    className="text-xs font-medium text-gym-primary hover:text-white transition-colors flex items-center gap-1"
                  >
                    {showAdvancedMetrics ? "Hide Advanced Metrics" : "Show Advanced Metrics"}
                  </button>
                </div>

                <AnimatePresence>
                  {showAdvancedMetrics && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">Body Fat (%)</label>
                        <input 
                          type="number" step="0.1" 
                          value={bodyFatInput} onChange={e => setBodyFatInput(e.target.value)}
                          placeholder="e.g. 15.5"
                          className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50 text-sm placeholder-gray-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 block mb-1">Muscle Mass (kg)</label>
                        <input 
                          type="number" step="0.1" 
                          value={muscleMassInput} onChange={e => setMuscleMassInput(e.target.value)}
                          placeholder="e.g. 35.2"
                          className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50 text-sm placeholder-gray-600"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleLogWeight}
                disabled={isLoggingWeight || !weightInput}
                className="mt-6 w-full py-3 rounded-xl bg-gym-primary hover:bg-gym-accent text-black font-bold flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {isLoggingWeight ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Entry"}
              </button>
            </motion.div>
          </div>

          {/* History List */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Measurement History</h3>
            {member.metrics && member.metrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Weight</th>
                      <th className="pb-3 px-2">Body Fat</th>
                      <th className="pb-3 px-2">Muscle Mass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {member.metrics.map((m: any, idx: number) => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-2 text-sm text-gray-300">{new Date(m.date).toLocaleDateString()}</td>
                        <td className="py-3 px-2 text-sm font-bold text-white">{m.weight} kg</td>
                        <td className="py-3 px-2 text-sm text-gray-400">{m.bodyFat ? `${m.bodyFat}%` : '-'}</td>
                        <td className="py-3 px-2 text-sm text-gray-400">{m.muscleMass ? `${m.muscleMass} kg` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No measurements recorded yet.</p>
            )}
          </motion.div>
          {/* Status & Pass */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="pass">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="glass-panel p-6">
              <h3 className="text-gray-400 font-medium mb-1">Status</h3>
              <p className={`text-3xl font-bold ${membership?.status === 'ACTIVE' ? 'text-white' : 'text-red-500'}`}>
                {membership?.status || "NO PLAN"}
              </p>
              <p className="text-sm text-gray-500 mt-2">Membership ID: {member.membershipId}</p>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Visits This Month</p>
                  <p className="text-xl font-bold text-white">{member.visitsThisMonth || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Avg. Duration</p>
                  <p className="text-xl font-bold text-white">{member.avgDurationStr || "N/A"}</p>
                </div>
              </div>
            </motion.div>

            {/* Dynamic QR Pass */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="glass-panel p-6 bg-gradient-to-br from-gym-primary to-blue-600 border-gym-primary/50 flex items-center justify-between gap-4">
              <div>
                <div className="p-3 rounded-xl bg-white/10 w-fit backdrop-blur-md mb-4">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Digital Entry Pass</h3>
                <p className="text-blue-100 text-sm mt-1 opacity-90 max-w-[200px]">Hold this code near the scanner at the front desk to check in automatically.</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-lg flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                <QRCodeSVG value={`chandugym://checkin/${member.id}?timestamp=${Date.now()}`} size={100} level="H" fgColor="#0f172a" />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* WORKOUT & DIET TAB */}
      {activeTab === 'workout-diet' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* CALENDAR HEADER */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-b-2 border-gym-primary/20 sticky top-20 z-30 backdrop-blur-2xl">
        <Calendar className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />
        {weekDays.map((day) => (
          <button 
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 min-w-[60px] py-2 rounded-xl text-sm font-medium transition-all ${selectedDay === day ? 'bg-gym-primary text-black font-bold shadow-lg shadow-gym-primary/30 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {day}
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        
        {/* INTERACTIVE WORKOUT (Moved to left for priority) */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="glass-panel p-6 flex flex-col" id="workout">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Workout ({selectedDay})</h3>
            {member.workoutPlanData ? (
              <span className="text-xs font-medium bg-gym-primary/20 text-gym-primary px-2.5 py-1 rounded-full tracking-wider border border-gym-primary/20">ACTIVE</span>
            ) : (
              <span className="text-xs font-medium bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full tracking-wider">NOT ASSIGNED</span>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDay + 'workout'}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {member.workoutPlanData ? (
                currentWorkout && currentWorkout.exercises?.length > 0 ? (
                  <div className="space-y-4 flex-1">
                    <div className="bg-gym-primary/10 border border-gym-primary/20 p-3 rounded-xl mb-4 flex justify-between items-center">
                      <h4 className="text-sm font-bold text-gym-primary tracking-wide">{currentWorkout.dayName}</h4>
                      <span className="text-xs text-gym-primary/70">{completedExercises.length} / {currentWorkout.exercises.length} Completed</span>
                    </div>
                    
                    <div className="space-y-3">
                      {currentWorkout.exercises.map((ex: any, eIdx: number) => {
                        const isCompleted = completedExercises.includes(eIdx);
                        return (
                          <motion.div 
                            key={eIdx}
                            onClick={() => toggleExercise(eIdx)}
                            whileTap={{ scale: 0.98 }}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 shadow-md ${
                              isCompleted 
                                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-gym-primary/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-gray-500 text-transparent'}`}>
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <p className={`text-[15px] font-medium transition-all ${isCompleted ? 'text-emerald-400 line-through opacity-70' : 'text-white'}`}>{ex.name}</p>
                            </div>
                            <div className={`flex gap-4 sm:ml-auto transition-opacity ${isCompleted ? 'opacity-50' : 'opacity-100'}`}>
                              <div className="text-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-0.5">Sets</span>
                                <span className="text-sm text-gray-200 font-bold">{ex.sets}</span>
                              </div>
                              <div className="text-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest block mb-0.5">Reps</span>
                                <span className="text-sm text-gray-200 font-bold">{ex.reps}</span>
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
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-xl bg-black/20 min-h-[300px]">
                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Coffee className="h-8 w-8 text-gym-primary/50" />
                    </div>
                    <p className="text-lg font-bold text-white mb-1">Rest Day</p>
                    <p className="text-sm text-gray-400">Your muscles grow when you rest. Enjoy your recovery!</p>
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-black/10 min-h-[300px]">
                  <p className="text-gray-400">No workout schedule found.</p>
                  <p className="text-sm text-gray-500 mt-2">Talk to your instructor to build your program!</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Assigned Diet Plan */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="glass-panel p-6 flex flex-col" id="diet">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Diet Plan ({selectedDay})</h3>
            {member.dietPlanData ? (
              <span className="text-xs font-medium bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-full tracking-wider border border-orange-500/20">ACTIVE</span>
            ) : (
              <span className="text-xs font-medium bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full tracking-wider">NOT ASSIGNED</span>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDay + 'diet'}
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
              
              <h2 className="text-xl font-bold text-white mb-4">Reschedule Booking</h2>
              
              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Select Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${newScheduleDays.includes(day) ? 'bg-gym-primary/20 border-gym-primary text-gym-primary' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={newScheduleDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) setNewScheduleDays([...newScheduleDays, day]);
                            else setNewScheduleDays(newScheduleDays.filter(d => d !== day));
                          }}
                        />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Start Time</label>
                    <input 
                      type="time"
                      required
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
    </div>
  );
}

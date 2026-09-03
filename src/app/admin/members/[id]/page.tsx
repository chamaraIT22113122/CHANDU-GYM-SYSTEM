"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, Dumbbell, Utensils, Save, CheckCircle2, Plus, Trash2, CalendarClock, X, Activity, Scale, CalendarCheck, TrendingDown, Target } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useRouter } from "next/navigation";

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "workout" | "diet" | "schedule">("overview");
  const router = useRouter();

  // Edit Info State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);

  // Renewal State
  const [selectedPlan, setSelectedPlan] = useState("");
  const [renewalEndDate, setRenewalEndDate] = useState("");
  const [renewalBaseFee, setRenewalBaseFee] = useState("");
  const [renewalPackageName, setRenewalPackageName] = useState("");
  const [renewalPackageDuration, setRenewalPackageDuration] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(false);

  // Plan State
  const [dietPlan, setDietPlan] = useState({ calories: "", protein: "", carbs: "", fats: "", meal1: "", meal2: "", meal3: "" });
  
  // Advanced Workout State
  type Exercise = { id: string; name: string; sets: string; reps: string };
  type WorkoutDay = { id: string; dayName: string; exercises: Exercise[] };
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([
    { id: "1", dayName: "", exercises: [{ id: "e1", name: "", sets: "", reps: "" }] }
  ]);
  const [workoutNotes, setWorkoutNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Schedule State
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [scheduleStartTime, setScheduleStartTime] = useState("06:00");
  const [scheduleEndTime, setScheduleEndTime] = useState("07:00");
  const [bookings, setBookings] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [gymPlans, setGymPlans] = useState<any[]>([]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?userId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleDays.length === 0 || !scheduleStartTime || !scheduleEndTime) {
      setScheduleError("Please select at least one day and start/end times.");
      return;
    }
    
    setIsScheduling(true);
    setScheduleError("");
    setSaveSuccess(false);

    try {
      const promises = scheduleDays.map(dayOfWeek => 
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: id,
            dayOfWeek,
            startTime: scheduleStartTime,
            endTime: scheduleEndTime
          })
        }).then(res => res.json().then(data => ({ ok: res.ok, data })))
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.ok);

      if (errors.length > 0) {
        setScheduleError(errors.map(e => e.data.error).join(", ") || "Failed to schedule some slots");
      } else {
        setSaveSuccess(true);
        setScheduleDays([]);
        fetchBookings();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setScheduleError("An unexpected error occurred");
    } finally {
      setIsScheduling(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      if (res.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        const updated = await res.json();
        setMember(updated);
        setIsEditModalOpen(false);
      } else {
        alert("Failed to update member.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating member.");
    } finally {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/members/${id}`);
        const data = await res.json();
        setMember(data);

        // Pre-fill existing plans if they exist
        if (data.dietPlans?.length > 0) {
          const parsedDiet = JSON.parse(data.dietPlans[0].details);
          setDietPlan(parsedDiet);
        }
        if (data.workoutPlans?.length > 0) {
          const parsedWorkout = JSON.parse(data.workoutPlans[0].schedule);
          if (parsedWorkout.days) {
            setWorkoutDays(parsedWorkout.days);
            setWorkoutNotes(parsedWorkout.notes || "");
          } else {
             // Fallback for old schema
             setWorkoutNotes(parsedWorkout.notes || "");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchGymPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        setGymPlans(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchMember();
    fetchBookings();
    fetchGymPlans();
  }, [id]);

  const handleSavePlan = async (type: "workout" | "diet") => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        type,
        title: type === "workout" ? "Advanced Workout Plan" : "Assigned Diet Plan",
        data: type === "workout" ? { days: workoutDays, notes: workoutNotes } : dietPlan
      };

      const res = await fetch(`/api/members/${id}/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const addWorkoutDay = () => {
    setWorkoutDays([...workoutDays, { id: Date.now().toString(), dayName: "", exercises: [] }]);
  };

  const removeWorkoutDay = (dayId: string) => {
    setWorkoutDays(workoutDays.filter(d => d.id !== dayId));
  };

  const addExercise = (dayId: string) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return { ...day, exercises: [...day.exercises, { id: Date.now().toString(), name: "", sets: "", reps: "" }] };
      }
      return day;
    }));
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return { ...day, exercises: day.exercises.filter(e => e.id !== exerciseId) };
      }
      return day;
    }));
  };

  const updateDayName = (dayId: string, name: string) => {
    setWorkoutDays(workoutDays.map(day => day.id === dayId ? { ...day, dayName: name } : day));
  };

  const updateExercise = (dayId: string, exerciseId: string, field: "name"|"sets"|"reps", value: string) => {
    setWorkoutDays(workoutDays.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: day.exercises.map(ex => ex.id === exerciseId ? { ...ex, [field]: value } : ex)
        };
      }
      return day;
    }));
  };

  const handlePlanSelection = (plan: any) => {
    setSelectedPlan(plan.id);
    
    // Parse months from duration
    const lower = plan.duration.toLowerCase();
    let months = parseInt(lower) || 1;
    if (lower.includes('year') || lower.includes('annual')) months *= 12;
    if (lower.includes('day')) months = 0; // Special case for daily, we might just add 1 day
    
    // Calculate new end date based on CURRENT end date (if active) or TODAY (if expired)
    const currentMembership = member?.memberships?.[0];
    let startDateForRenewal = new Date();
    
    if (currentMembership && currentMembership.status === 'ACTIVE') {
      const currentEnd = new Date(currentMembership.endDate);
      if (currentEnd > new Date()) {
        startDateForRenewal = currentEnd;
      }
    }

    const newEnd = new Date(startDateForRenewal);
    if (months === 0) {
      newEnd.setDate(newEnd.getDate() + 1); // 1 day
    } else {
      newEnd.setMonth(newEnd.getMonth() + months);
    }
    
    setRenewalEndDate(newEnd.toISOString().split('T')[0]);
    setRenewalBaseFee(plan.price.toString());
    setRenewalPackageName(plan.name);
    setRenewalPackageDuration(plan.duration);
  };

  const handleRenewPlan = async () => {
    if (!renewalEndDate || !renewalBaseFee) return;
    
    setIsRenewing(true);
    setRenewSuccess(false);
    
    try {
      const res = await fetch(`/api/members/${id}/membership`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endDate: renewalEndDate,
          baseFee: renewalBaseFee,
          packageName: renewalPackageName,
          packageDuration: renewalPackageDuration
        })
      });

      if (res.ok) {
        setRenewSuccess(true);
        setSelectedPlan("");
        // Refresh member data
        const updatedRes = await fetch(`/api/members/${id}`);
        const updatedData = await updatedRes.json();
        setMember(updatedData);
        
        setTimeout(() => setRenewSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Renewal failed:", err);
    } finally {
      setIsRenewing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-gym-primary min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="text-gray-400 font-medium">Loading member data...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center mt-20 text-gray-400 bg-black/20 p-8 rounded-2xl border border-white/5">
        <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-600 opacity-50" />
        <p className="text-lg">No member found.</p>
        <Link href="/admin/members" className="text-gym-primary hover:underline text-sm mt-4 inline-block">Return to Directory</Link>
      </div>
    );
  }

  // Derive stats for overview dashboard
  const currentWeight = member.metrics?.[member.metrics.length - 1]?.weight || 0;
  const initialWeight = member.metrics?.[0]?.weight || currentWeight;
  const weightLost = initialWeight > 0 ? (initialWeight - currentWeight) : 0;
  
  const heightInMeters = member.height ? member.height / 100 : 0;
  let bmi = 0;
  let bmiCategory = "Unknown";
  let bmiColor = "text-gray-400";
  
  if (currentWeight > 0 && heightInMeters > 0) {
    bmi = parseFloat((currentWeight / (heightInMeters * heightInMeters)).toFixed(1));
    if (bmi < 18.5) { bmiCategory = "Underweight"; bmiColor = "text-blue-400"; }
    else if (bmi >= 18.5 && bmi < 24.9) { bmiCategory = "Normal"; bmiColor = "text-emerald-400"; }
    else if (bmi >= 25 && bmi < 29.9) { bmiCategory = "Overweight"; bmiColor = "text-orange-400"; }
    else { bmiCategory = "Obese"; bmiColor = "text-red-500"; }
  }

  const attendanceCount = member.attendances?.length || 0;
  const recentAttendances = member.attendances?.slice(0, 5) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/members" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">{member.firstName} {member.lastName}</h1>
          <p className="text-gray-400 mt-1">ID: {member.membershipId || member.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            setEditFormData(member);
            setIsEditModalOpen(true);
          }} className="px-4 py-2 text-sm font-medium bg-gym-primary/10 text-gym-primary hover:bg-gym-primary hover:text-black rounded-lg transition-colors border border-gym-primary/20">
            Edit Info
          </button>
          <button 
            onClick={async () => {
              if (!confirm("Are you sure you want to delete this member? This cannot be undone.")) return;
              const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
              if (res.ok) router.push("/admin/members");
            }}
            className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-black/20 rounded-xl w-fit border border-white/5 overflow-x-auto max-w-full">
        <button onClick={() => setActiveTab("overview")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "overview" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>Overview</button>
        <button onClick={() => setActiveTab("schedule")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "schedule" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-gray-400 hover:text-white"}`}>Schedule</button>
        <button onClick={() => setActiveTab("workout")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "workout" ? "bg-gym-primary text-black font-bold shadow-lg shadow-gym-primary/20" : "text-gray-400 hover:text-white"}`}>Workout Plan</button>
        <button onClick={() => setActiveTab("diet")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "diet" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>Diet Plan</button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-gray-400 mb-1"><Target className="h-4 w-4" /> <span className="text-sm font-medium">BMI Status</span></div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${bmiColor}`}>{bmi || "--"}</span>
                  <span className={`text-sm font-medium ml-1 ${bmiColor}`}>{bmiCategory}</span>
                </div>
              </div>
              <div className="glass-panel p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-gray-400 mb-1"><Scale className="h-4 w-4" /> <span className="text-sm font-medium">Current Weight</span></div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{currentWeight || "--"}</span>
                  <span className="text-sm text-gray-500">kg</span>
                </div>
              </div>
              <div className="glass-panel p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-gray-400 mb-1"><TrendingDown className="h-4 w-4" /> <span className="text-sm font-medium">Weight Lost</span></div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gym-primary">{weightLost > 0 ? weightLost.toFixed(1) : "0"}</span>
                  <span className="text-sm text-gray-500">kg</span>
                </div>
              </div>
              <div className="glass-panel p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-gray-400 mb-1"><CalendarCheck className="h-4 w-4" /> <span className="text-sm font-medium">Total Check-ins</span></div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{attendanceCount}</span>
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Progress Chart & Attendance */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel p-6 h-[350px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white font-semibold"><Activity className="h-5 w-5 text-gym-primary" /> Weight Progress</div>
                  </div>
                  <div className="flex-1 min-h-0">
                    {member.metrics?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={member.metrics} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#33" vertical={false} />
                          <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                          <YAxis domain={['auto', 'auto']} stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                          />
                          <Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={3} dot={{ r: 4, fill: '#d4ff00', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <Scale className="h-8 w-8 mb-2 opacity-20" />
                        <p>No weight logs available.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">Recent Attendance</h3>
                  {recentAttendances.length > 0 ? (
                    <div className="space-y-3">
                      {recentAttendances.map((record: any) => (
                        <div key={record.id} className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div>
                            <p className="text-white font-medium text-sm">{new Date(record.checkIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-gray-400 mt-0.5">In: {new Date(record.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {record.checkOut ? `• Out: ${new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}</p>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full border ${record.checkOut ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            {record.checkOut ? 'Completed' : 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No recent check-ins.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Profile & Membership */}
              <div className="space-y-6">
                <div className="glass-panel p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 flex justify-between items-center">
                    Profile Details
                    <span className="text-xs font-normal text-gray-400">ID: {member.membershipId}</span>
                  </h3>
                  <div className="space-y-3">
                    <div><span className="text-gray-500 text-xs block uppercase tracking-wider">Email</span> <p className="text-white text-sm">{member.email || "N/A"}</p></div>
                    <div><span className="text-gray-500 text-xs block uppercase tracking-wider">Phone</span> <p className="text-white text-sm">{member.phone || "N/A"}</p></div>
                    <div><span className="text-gray-500 text-xs block uppercase tracking-wider">Join Date</span> <p className="text-white text-sm">{new Date(member.joinDate).toLocaleDateString()}</p></div>
                  </div>

                  <h3 className="text-lg font-semibold text-gym-primary border-b border-white/10 pb-2 mt-6">Health & Notes</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500 text-xs block uppercase tracking-wider">Medical / Special Cases</span>
                      <p className="text-white text-sm">{member.specialCases || "None reported"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block uppercase tracking-wider">Past Injuries</span>
                      <p className="text-orange-400 text-sm">{member.injuries || "None reported"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block uppercase tracking-wider">Dietary Restrictions</span>
                      <p className="text-emerald-400 text-sm">{member.dietAlerts || "None reported"}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 flex justify-between items-center">
                    Membership Management
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                      member.memberships?.[0]?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      member.memberships?.[0]?.status === 'OVERDUE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {member.memberships?.[0]?.status || "NO PLAN"}
                    </span>
                  </h3>

              {member.memberships?.[0] ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="col-span-2 pb-2 border-b border-white/5 mb-2">
                      <span className="text-xs text-gray-500 uppercase">Package details</span>
                      <p className="text-gym-primary font-medium text-lg">
                        {member.memberships[0].packageName || "Custom Plan"}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {member.memberships[0].branch ? `${member.memberships[0].branch} • ` : ""}
                        {member.memberships[0].packageTime ? `${member.memberships[0].packageTime} • ` : ""}
                        {member.memberships[0].packageDuration || "Active"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Current Start Date</span>
                      <p className="text-white font-medium">{new Date(member.memberships[0].startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Current End Date</span>
                      <p className="text-white font-medium">{new Date(member.memberships[0].endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Base Fee</span>
                      <p className="text-gray-300">Rs. {member.memberships[0].baseFee}</p>
                    </div>
                    {member.memberships[0].penaltyFee > 0 && (
                      <div>
                        <span className="text-xs text-red-400 uppercase">Penalties</span>
                        <p className="text-red-400 font-medium">Rs. {member.memberships[0].penaltyFee}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-medium text-gym-primary">Renew / Extend Plan</h4>
                    
                    {gymPlans.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No plans available in the system.</p>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {gymPlans.map(plan => (
                          <button 
                            key={plan.id}
                            type="button" 
                            onClick={() => handlePlanSelection(plan)} 
                            className={`px-3 py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors ${selectedPlan === plan.id ? "bg-gym-primary/20 border-gym-primary text-gym-primary" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-300"}`}
                          >
                            <span className="text-sm font-bold text-center leading-tight">{plan.name}</span>
                            <span className="text-xs font-medium">Rs. {plan.price.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-500">{plan.duration}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedPlan && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gym-primary/10 border border-gym-primary/20 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">New Expiration Date:</span>
                          <span className="text-white font-bold">{new Date(renewalEndDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">Renewal Fee:</span>
                          <span className="text-white font-bold">Rs. {Number(renewalBaseFee).toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={handleRenewPlan}
                          disabled={isRenewing}
                          className="w-full py-2 bg-gym-primary hover:bg-gym-accent text-black font-bold rounded-lg transition-colors flex justify-center items-center gap-2 mt-2"
                        >
                          {isRenewing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Renewal"}
                        </button>
                      </motion.div>
                    )}
                    
                    {renewSuccess && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 text-sm flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Membership renewed successfully!
                      </motion.p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">This user does not have an active membership record.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

        {activeTab === "schedule" && (
          <div className="glass-panel p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400"><CalendarClock className="h-5 w-5" /></div>
              <h3 className="text-lg font-semibold text-white">Member Scheduling</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Schedule Form */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gym-primary uppercase tracking-wider">Book a Time Slot</h4>
                <form onSubmit={handleScheduleSubmit} className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">Select Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <label key={day} className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${scheduleDays.includes(day) ? 'bg-gym-primary/20 border-gym-primary text-gym-primary' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={scheduleDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) setScheduleDays([...scheduleDays, day]);
                              else setScheduleDays(scheduleDays.filter(d => d !== day));
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
                        value={scheduleStartTime}
                        onChange={(e) => setScheduleStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400">End Time</label>
                      <input 
                        type="time"
                        required
                        value={scheduleEndTime}
                        onChange={(e) => setScheduleEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none"
                      />
                    </div>
                  </div>

                  {scheduleError && <p className="text-red-400 text-xs">{scheduleError}</p>}
                  {saveSuccess && <p className="text-emerald-400 text-xs">Slot scheduled successfully!</p>}

                  <button 
                    type="submit" 
                    disabled={isScheduling}
                    className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book Slot"}
                  </button>
                </form>
              </div>

              {/* Upcoming Bookings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gym-primary uppercase tracking-wider">Upcoming Bookings</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {bookings.filter(b => b.status === "SCHEDULED").length === 0 ? (
                    <p className="text-gray-500 text-sm italic bg-black/20 p-4 rounded-xl border border-white/5 text-center">No upcoming bookings.</p>
                  ) : (
                    bookings.filter(b => b.status === "SCHEDULED").map(booking => (
                      <div key={booking.id} className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center justify-between group">
                        <div>
                          <p className="text-white font-medium text-sm">{booking.dayOfWeek}</p>
                          <p className="text-gray-400 text-xs">{booking.startTime} - {booking.endTime}</p>
                        </div>
                        <button onClick={() => cancelBooking(booking.id)} className="text-gray-500 hover:text-red-500 p-1.5 bg-white/5 rounded-md transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "workout" && (
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gym-primary/20 text-gym-primary"><Dumbbell className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold text-white">Advanced Workout Builder</h3>
              </div>
              <button onClick={addWorkoutDay} className="flex items-center gap-2 text-sm text-gym-primary hover:text-white bg-gym-primary/10 hover:bg-gym-primary/30 px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="h-4 w-4" /> Add Day
              </button>
            </div>
            
            <div className="space-y-6">
              <AnimatePresence>
                {workoutDays.map((day, dIdx) => (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    key={day.id} 
                    className="border border-white/10 rounded-xl bg-black/20 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <select
                        value={day.dayName}
                        onChange={e => updateDayName(day.id, e.target.value)}
                        className="bg-transparent text-white font-medium border-b border-white/20 focus:border-gym-primary outline-none px-1 py-1 w-64 transition-colors"
                      >
                        <option value="" disabled className="bg-black text-gray-400">Select a Day</option>
                        {Array.from(new Set(bookings.map((b: any) => b.dayOfWeek))).length > 0 ? (
                          Array.from(new Set(bookings.map((b: any) => b.dayOfWeek))).map(d => (
                            <option key={d as string} value={d as string} className="bg-black text-white">{d as string}</option>
                          ))
                        ) : (
                          <option value="" disabled className="bg-black text-gray-500">No scheduled days found</option>
                        )}
                      </select>
                      <button onClick={() => removeWorkoutDay(day.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-2 hidden sm:grid">
                        <div className="col-span-6">Exercise</div>
                        <div className="col-span-2">Sets</div>
                        <div className="col-span-3">Reps</div>
                        <div className="col-span-1"></div>
                      </div>
                      
                      {day.exercises.map((ex, eIdx) => (
                        <div key={ex.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5 group">
                          <div className="col-span-1 sm:col-span-6">
                            <input 
                              type="text" placeholder="Exercise name (e.g. Bench Press)"
                              value={ex.name} onChange={e => updateExercise(day.id, ex.id, "name", e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-gym-primary outline-none"
                            />
                          </div>
                          <div className="col-span-1 sm:col-span-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500 sm:hidden w-10">Sets:</span>
                            <input 
                              type="text" placeholder="e.g. 4"
                              value={ex.sets} onChange={e => updateExercise(day.id, ex.id, "sets", e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-gym-primary outline-none text-center"
                            />
                          </div>
                          <div className="col-span-1 sm:col-span-3 flex items-center gap-2">
                            <span className="text-xs text-gray-500 sm:hidden w-10">Reps:</span>
                            <input 
                              type="text" placeholder="e.g. 8-12"
                              value={ex.reps} onChange={e => updateExercise(day.id, ex.id, "reps", e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-md px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-gym-primary outline-none text-center"
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button onClick={() => removeExercise(day.id, ex.id)} className="text-gray-600 hover:text-red-500 p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button onClick={() => addExercise(day.id)} className="text-xs font-medium text-gym-primary hover:text-white transition-colors flex items-center gap-1 ml-2">
                      <Plus className="h-3 w-3" /> Add Exercise
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Overall Trainer Notes</label>
                <textarea rows={2} value={workoutNotes} onChange={e => setWorkoutNotes(e.target.value)} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" placeholder="e.g. Rest 60s between sets. Focus on form."></textarea>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                {saveSuccess ? <span className="text-emerald-500 flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4"/> Saved Successfully</span> : <span></span>}
                <button onClick={() => handleSavePlan("workout")} disabled={isSaving} className="px-6 py-2 rounded-xl bg-gym-primary text-black font-bold flex items-center gap-2 hover:bg-gym-accent transition-colors shadow-lg shadow-gym-primary/20">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Workout Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "diet" && (
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-500"><Utensils className="h-5 w-5" /></div>
              <h3 className="text-lg font-semibold text-white">Assign Diet Plan</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Calories (kcal)</label>
                <input type="number" value={dietPlan.calories} onChange={e => setDietPlan({...dietPlan, calories: e.target.value})} className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/20 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Protein (g)</label>
                <input type="number" value={dietPlan.protein} onChange={e => setDietPlan({...dietPlan, protein: e.target.value})} className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/20 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Carbs (g)</label>
                <input type="number" value={dietPlan.carbs} onChange={e => setDietPlan({...dietPlan, carbs: e.target.value})} className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/20 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Fats (g)</label>
                <input type="number" value={dietPlan.fats} onChange={e => setDietPlan({...dietPlan, fats: e.target.value})} className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/20 text-white" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Meal 1 (Breakfast)</label>
                <input type="text" value={dietPlan.meal1} onChange={e => setDietPlan({...dietPlan, meal1: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Meal 2 (Lunch)</label>
                <input type="text" value={dietPlan.meal2} onChange={e => setDietPlan({...dietPlan, meal2: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Meal 3 (Dinner)</label>
                <input type="text" value={dietPlan.meal3} onChange={e => setDietPlan({...dietPlan, meal3: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white" />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                {saveSuccess ? <span className="text-emerald-500 flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4"/> Saved Successfully</span> : <span></span>}
                <button onClick={() => handleSavePlan("diet")} disabled={isSaving} className="px-6 py-2 rounded-xl bg-orange-500 text-white font-medium flex items-center gap-2 hover:bg-orange-600 transition-colors">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Diet Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Edit Info Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gym-card border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Edit Member Info</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">First Name</label>
                    <input type="text" required value={editFormData.firstName || ""} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Last Name</label>
                    <input type="text" required value={editFormData.lastName || ""} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Email</label>
                    <input type="email" value={editFormData.email || ""} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Phone</label>
                    <input type="text" value={editFormData.phone || ""} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Height (cm)</label>
                    <input type="number" step="0.1" value={editFormData.height || ""} onChange={e => setEditFormData({...editFormData, height: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Current Weight (kg)</label>
                    <input type="number" step="0.1" value={editFormData.weight || ""} onChange={e => setEditFormData({...editFormData, weight: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Target Weight (kg)</label>
                    <input type="number" step="0.1" value={editFormData.targetWeight || ""} onChange={e => setEditFormData({...editFormData, targetWeight: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gym-primary">Health & Notes</h3>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Medical / Special Cases</label>
                    <textarea value={editFormData.specialCases || ""} onChange={e => setEditFormData({...editFormData, specialCases: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Past Injuries</label>
                    <textarea value={editFormData.injuries || ""} onChange={e => setEditFormData({...editFormData, injuries: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" rows={2} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Dietary Restrictions</label>
                    <textarea value={editFormData.dietAlerts || ""} onChange={e => setEditFormData({...editFormData, dietAlerts: e.target.value})} className="w-full px-4 py-2 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" rows={2} />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10 gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 rounded-xl font-medium text-gray-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isEditing} className="px-6 py-2 bg-gym-primary text-black rounded-xl font-bold hover:bg-gym-primary/90 transition-colors flex items-center gap-2">
                    {isEditing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
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

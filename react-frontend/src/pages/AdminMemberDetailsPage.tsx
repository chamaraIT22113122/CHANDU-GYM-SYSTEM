import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Dumbbell, Utensils, Save, CheckCircle2, Plus, Trash2, CalendarClock, X, Activity, Scale, CalendarCheck, TrendingDown, Target, CalendarDays, Copy, Clipboard } from "lucide-react";
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminMemberDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "diet" | "schedule">("overview");
  const navigate = useNavigate();

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
  const [exerciseList, setExerciseList] = useState<Record<string, Record<string, string[]>>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedWorkout, setCopiedWorkout] = useState<Exercise[] | null>(null);

  // Schedule State
  const [scheduleDays, setScheduleDays] = useState<string[]>([]); // array of YYYY-MM-DD
  const [scheduleStartTime, setScheduleStartTime] = useState("06:00");
  const [scheduleEndTime, setScheduleEndTime] = useState("07:00");
  const [currentScheduleMonth, setCurrentScheduleMonth] = useState(new Date());
  
  // Workout Calendar State
  const [currentWorkoutMonth, setCurrentWorkoutMonth] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  
  // Reschedule State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [gymPlans, setGymPlans] = useState<any[]>([]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/bookings?userId=${id}`);
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
      const unbookedDays = scheduleDays.filter(d => !bookings.find(b => b.status === "SCHEDULED" && b.bookingDate === d));
      
      const promises = unbookedDays.map(dateStr => {
        const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
        return fetch(`${import.meta.env.VITE_API_URL || ""}/api/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: id,
            dayOfWeek: dayName,
            bookingDate: dateStr,
            startTime: scheduleStartTime,
            endTime: scheduleEndTime
          })
        }).then(res => res.json().then(data => ({ ok: res.ok, data })))
      });

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
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/bookings/${bookingId}`, { method: "DELETE" });
      if (res.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleStartTime || !rescheduleEndTime) {
      setRescheduleError("Please select a date and start/end times.");
      return;
    }
    
    setIsRescheduling(true);
    try {
      if (selectedBooking) {
        await fetch(`${import.meta.env.VITE_API_URL || ""}/api/bookings/${selectedBooking.id}`, { method: "DELETE" });
      }

      const dayName = new Date(rescheduleDate).toLocaleDateString('en-US', { weekday: 'long' });

      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          dayOfWeek: dayName,
          bookingDate: rescheduleDate,
          startTime: rescheduleStartTime,
          endTime: rescheduleEndTime
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/members/${id}`, {
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
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/members/${id}`);
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
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/plans`);
        const data = await res.json();
        setGymPlans(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchExerciseList = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/exercises/list`);
        if (res.ok) {
          const data = await res.json();
          setExerciseList(data);
        }
      } catch (err) {
        console.error("Failed to fetch exercise list:", err);
      }
    };
    
    fetchMember();
    fetchBookings();
    fetchGymPlans();
    fetchExerciseList();
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

      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/members/${id}/plans`, {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/members/${id}/membership`, {
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
        const updatedRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/members/${id}`);
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
        <Link to="/admin/members" className="text-gym-primary hover:underline text-sm mt-4 inline-block">Return to Directory</Link>
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
        <Link to="/admin/members" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition-colors">
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
              const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/members/${member.id}`, { method: "DELETE" });
              if (res.ok) navigate("/admin/members");
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
        <button onClick={() => setActiveTab("schedule")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "schedule" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold" : "text-gray-400 hover:text-white"}`}>Schedule & Workouts</button>
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
              {/* Left Column: Calendar & Bookings */}
              <div className="space-y-6">
                
                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <CalendarCheck className="h-5 w-5 text-gym-primary" />
                      {currentScheduleMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setCurrentScheduleMonth(new Date(currentScheduleMonth.getFullYear(), currentScheduleMonth.getMonth() - 1, 1))}
                        className="p-1.5 rounded bg-black/40 hover:bg-white/10 text-white transition-colors border border-white/10"
                      >
                        &larr;
                      </button>
                      <button 
                        onClick={() => setCurrentScheduleMonth(new Date())}
                        className="px-3 py-1.5 rounded bg-black/40 hover:bg-white/10 text-xs font-bold text-white transition-colors border border-white/10"
                      >
                        Today
                      </button>
                      <button 
                        onClick={() => setCurrentScheduleMonth(new Date(currentScheduleMonth.getFullYear(), currentScheduleMonth.getMonth() + 1, 1))}
                        className="p-1.5 rounded bg-black/40 hover:bg-white/10 text-white transition-colors border border-white/10"
                      >
                        &rarr;
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const today = new Date();
                        const year = currentScheduleMonth.getFullYear();
                        const month = currentScheduleMonth.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        
                        const cells = [];
                        
                        for (let i = 0; i < firstDay; i++) {
                          cells.push(<div key={`empty-${i}`} className="aspect-square bg-black/10 rounded-md"></div>);
                        }
                        
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(year, month, day);
                          const isToday = date.toDateString() === today.toDateString();
                          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          
                          const hasBooking = bookings.find(b => b.status === "SCHEDULED" && b.bookingDate === dateString);
                          const isSelected = scheduleDays.includes(dateString);
                          const isPast = date < new Date(today.setHours(0,0,0,0));
                          
                          cells.push(
                            <button
                              key={`day-${day}`}
                              type="button"
                              disabled={isPast}
                              onClick={() => {
                                if (isSelected) setScheduleDays(scheduleDays.filter(d => d !== dateString));
                                else setScheduleDays([...scheduleDays, dateString]);
                              }}
                              className={`aspect-square rounded-md flex flex-col items-center justify-center relative transition-all border ${
                                isPast ? 'opacity-30 cursor-not-allowed bg-black/10 border-transparent text-gray-500' :
                                isSelected ? 'bg-gym-primary text-black border-gym-primary font-bold shadow-lg shadow-gym-primary/20 scale-105 z-10' :
                                hasBooking ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30' :
                                isToday ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' :
                                'bg-black/20 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20'
                              }`}
                            >
                              <span className="text-sm">{day}</span>
                              {hasBooking && <span className="text-[7px] uppercase tracking-tighter mt-0.5 opacity-80 bg-blue-500 text-white px-1 rounded-sm">Booked</span>}
                            </button>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Right Column: Context Action Panel */}
              <div className="space-y-6">
                {scheduleDays.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-xl bg-black/10 min-h-[400px]">
                    <CalendarClock className="h-12 w-12 text-gray-600 mb-4" />
                    <p className="text-lg font-bold text-gray-400">Select Dates</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-[250px]">Click on the calendar to book time slots and assign workout plans to specific days.</p>
                  </div>
                ) : (
                  <>
                    {/* Time Slots Bulk Action */}
                    <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                      <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gym-primary uppercase tracking-wider">Time Slots</h4>
                        <span className="text-xs text-gray-400 bg-black/40 px-2 py-1 rounded-full">{scheduleDays.length} day(s) selected</span>
                      </div>
                      
                      {(() => {
                        const unbookedDays = scheduleDays.filter(d => !bookings.find(b => b.status === "SCHEDULED" && b.bookingDate === d));
                        const bookedDays = scheduleDays.filter(d => bookings.find(b => b.status === "SCHEDULED" && b.bookingDate === d));

                        return (
                          <div className="p-4 space-y-4">
                            {unbookedDays.length > 0 && (
                              <form onSubmit={handleScheduleSubmit} className={`space-y-4 ${bookedDays.length > 0 ? 'border-b border-white/5 pb-4' : ''}`}>
                                <p className="text-xs text-gray-400 mb-2">Book the {unbookedDays.length} unbooked day(s) selected.</p>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-xs text-gray-400">Start Time</label>
                                    <input type="time" required value={scheduleStartTime} onChange={(e) => setScheduleStartTime(e.target.value)} className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/60 text-white focus:ring-1 focus:ring-gym-primary outline-none" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs text-gray-400">End Time</label>
                                    <input type="time" required value={scheduleEndTime} onChange={(e) => setScheduleEndTime(e.target.value)} className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/60 text-white focus:ring-1 focus:ring-gym-primary outline-none" />
                                  </div>
                                </div>
                                {scheduleError && <p className="text-red-400 text-xs">{scheduleError}</p>}
                                <button type="submit" disabled={isScheduling} className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                  {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book Slots"}
                                </button>
                              </form>
                            )}
                            
                            {bookedDays.length > 0 && (
                              <div className="space-y-2 pt-2">
                                <p className="text-xs text-gray-400 mb-2">Manage {bookedDays.length} booked day(s).</p>
                                {bookedDays.map(dateStr => {
                                  const booking = bookings.find(b => b.status === "SCHEDULED" && b.bookingDate === dateStr);
                                  return (
                                    <div key={dateStr} className="flex items-center justify-between bg-black/40 p-2 rounded border border-white/5">
                                      <div className="text-xs font-bold text-white">
                                        {dateStr} <span className="text-blue-400 ml-2">{booking.startTime} - {booking.endTime}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setSelectedBooking(booking);
                                            setRescheduleDate(dateStr);
                                            setRescheduleStartTime(booking.startTime);
                                            setRescheduleEndTime(booking.endTime);
                                            setRescheduleError("");
                                            setIsRescheduleModalOpen(true);
                                          }}
                                          className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                                        >
                                          Reschedule
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => cancelBooking(booking.id)}
                                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Workout Builder */}
                    <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gym-primary uppercase tracking-wider">Workout Plans</h4>
                        <div className="flex gap-2">
                          <button onClick={() => handleSavePlan("workout")} disabled={isSaving} className="text-xs px-3 py-1 rounded bg-gym-primary text-black font-bold flex items-center gap-1 hover:bg-gym-accent transition-colors">
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Workouts
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                        <AnimatePresence>
                          {scheduleDays.map(dateStr => {
                            const day = workoutDays.find(w => w.dayName === dateStr);
                            if (!day) {
                              return (
                                <motion.div key={dateStr} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-white/5 rounded-xl bg-black/40 p-4 flex items-center justify-between">
                                  <div>
                                    <p className="text-white font-medium text-sm">{dateStr}</p>
                                    <p className="text-xs text-gray-500">No workout assigned</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {copiedWorkout && (
                                      <button onClick={() => {
                                        const copiedExercises = copiedWorkout.map(ex => ({...ex, id: Date.now().toString() + Math.random().toString(36)}));
                                        const newDay = { id: Date.now().toString(), dayName: dateStr, exercises: copiedExercises };
                                        setWorkoutDays([...workoutDays, newDay]);
                                      }} className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                        <Clipboard className="h-3 w-3" /> Paste
                                      </button>
                                    )}
                                    <button onClick={() => {
                                      const newDay = { id: Date.now().toString(), dayName: dateStr, exercises: [{ id: Date.now().toString() + 'e', name: "", sets: "", reps: "" }] };
                                      setWorkoutDays([...workoutDays, newDay]);
                                    }} className="text-xs text-gym-primary hover:text-white bg-gym-primary/10 hover:bg-gym-primary/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                      <Plus className="h-3 w-3" /> Add Workout
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            }
                            
                            return (
                              <motion.div key={day.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="border border-gym-primary/20 rounded-xl bg-black/40 p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="bg-transparent text-white font-bold px-1 py-1 text-sm border-b border-gym-primary/30">
                                    {day.dayName} ({new Date(day.dayName).toLocaleDateString('en-US', { weekday: 'short' })})
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => {
                                      const exercisesToCopy = day.exercises.map(ex => ({...ex, id: Date.now().toString() + Math.random().toString(36)}));
                                      setCopiedWorkout(exercisesToCopy);
                                      
                                      if (scheduleDays.length > 1) {
                                        const newWorkoutDays = [...workoutDays];
                                        let hasAdded = false;
                                        scheduleDays.forEach(dateStr => {
                                          if (dateStr !== day.dayName) {
                                            const existingIndex = newWorkoutDays.findIndex(w => w.dayName === dateStr);
                                            const copiedExercises = exercisesToCopy.map(ex => ({...ex, id: Date.now().toString() + Math.random().toString(36)}));
                                            
                                            if (existingIndex >= 0) {
                                              newWorkoutDays[existingIndex].exercises = copiedExercises;
                                            } else {
                                              newWorkoutDays.push({ id: Date.now().toString() + Math.random().toString(36), dayName: dateStr, exercises: copiedExercises });
                                            }
                                            hasAdded = true;
                                          }
                                        });
                                        if (hasAdded) setWorkoutDays(newWorkoutDays);
                                      }
                                    }} className="text-gray-500 hover:text-blue-400 transition-colors p-1" title="Copy Workout (or to selected dates)">
                                      <Copy className="h-4 w-4" />
                                    </button>
                                    
                                    {copiedWorkout && (
                                      <button onClick={() => {
                                        if (confirm("Overwrite this workout with the copied workout?")) {
                                          const newWorkoutDays = [...workoutDays];
                                          const existingIndex = newWorkoutDays.findIndex(w => w.dayName === day.dayName);
                                          const copiedExercises = copiedWorkout.map(ex => ({...ex, id: Date.now().toString() + Math.random().toString(36)}));
                                          newWorkoutDays[existingIndex].exercises = copiedExercises;
                                          setWorkoutDays(newWorkoutDays);
                                        }
                                      }} className="text-gray-500 hover:text-blue-400 transition-colors p-1" title="Paste Workout">
                                        <Clipboard className="h-4 w-4" />
                                      </button>
                                    )}

                                    <button onClick={() => removeWorkoutDay(day.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1" title="Remove workout">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="grid grid-cols-12 gap-1 text-[10px] font-semibold text-gray-500 uppercase px-1 hidden sm:grid">
                                    <div className="col-span-6">Exercise</div>
                                    <div className="col-span-2 text-center">Sets</div>
                                    <div className="col-span-3 text-center">Reps</div>
                                    <div className="col-span-1"></div>
                                  </div>
                                  
                                  {day.exercises.map((ex) => (
                                    <div key={ex.id} className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-center bg-white/5 p-1 rounded border border-white/5 group">
                                      <div className="col-span-1 sm:col-span-6">
                                        <select value={ex.name} onChange={e => updateExercise(day.id, ex.id, "name", e.target.value)} className="w-full bg-black/60 border border-white/5 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-gym-primary outline-none">
                                          <option value="" disabled>Select...</option>
                                          {Object.entries(exerciseList).map(([category, muscleGroups]) => 
                                            Object.entries(muscleGroups).map(([muscleGroup, exercises]) => (
                                              <optgroup key={`${category}-${muscleGroup}`} label={`${category} - ${muscleGroup}`} className="bg-black text-white font-bold">
                                                {exercises.map(exerciseName => <option key={exerciseName} value={exerciseName} className="font-normal text-gray-300">{exerciseName}</option>)}
                                              </optgroup>
                                            ))
                                          )}
                                        </select>
                                      </div>
                                      <div className="col-span-1 sm:col-span-2 flex items-center gap-1">
                                        <span className="text-[10px] text-gray-500 sm:hidden w-8">Sets:</span>
                                        <input type="text" placeholder="e.g. 4" value={ex.sets} onChange={e => updateExercise(day.id, ex.id, "sets", e.target.value)} className="w-full bg-black/60 border border-white/5 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-gym-primary outline-none text-center" />
                                      </div>
                                      <div className="col-span-1 sm:col-span-3 flex items-center gap-1">
                                        <span className="text-[10px] text-gray-500 sm:hidden w-8">Reps:</span>
                                        <input type="text" placeholder="e.g. 8-12" value={ex.reps} onChange={e => updateExercise(day.id, ex.id, "reps", e.target.value)} className="w-full bg-black/60 border border-white/5 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-gym-primary outline-none text-center" />
                                      </div>
                                      <div className="col-span-1 flex justify-end">
                                        <button onClick={() => removeExercise(day.id, ex.id)} className="text-gray-600 hover:text-red-500 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={() => addExercise(day.id)} className="text-[10px] font-medium text-gym-primary hover:text-white transition-colors flex items-center gap-1 ml-1 mt-2">
                                  <Plus className="h-3 w-3" /> Add Exercise
                                </button>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                )}
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
                Reschedule Booking
              </h2>
              
              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Selected Date</label>
                  <input 
                    type="date"
                    required
                    style={{ colorScheme: 'dark' }}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Start Time</label>
                    <input 
                      type="time"
                      required
                      style={{ colorScheme: 'dark' }}
                      value={rescheduleStartTime}
                      onChange={(e) => setRescheduleStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">End Time</label>
                    <input 
                      type="time"
                      required
                      style={{ colorScheme: 'dark' }}
                      value={rescheduleEndTime}
                      onChange={(e) => setRescheduleEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-white focus:ring-1 focus:ring-gym-primary outline-none"
                    />
                  </div>
                </div>

                {rescheduleError && <p className="text-red-400 text-xs">{rescheduleError}</p>}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setIsRescheduleModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isRescheduling}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
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

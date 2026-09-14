import { apiFetch } from "../lib/api";
import { useEffect, useState } from "react";
import { Users, TrendingUp, AlertCircle, Banknote, Loader2, Clock, CalendarDays, Activity, ShieldAlert, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const iconMap: Record<string, any> = {
  "Total Active Members": Users,
  "Monthly Revenue": Banknote,
  "Overdue Memberships": AlertCircle,
  "New This Month": TrendingUp,
};

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiFetch(`/api/dashboard/overview`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gym-primary drop-shadow-[0_0_15px_rgba(208,255,0,0.5)]" />
      </div>
    );
  }

  // Format Revenue History for Recharts
  const revenueData = data?.revenueHistory?.map((item: any) => ({
    name: item.month,
    Membership: parseFloat(item.membership) || 0,
    Maintenance: parseFloat(item.maintenance) || 0,
  })) || [];

  // Format Peak Hours for Recharts
  const peakHoursData = data?.peakHours?.map((item: any) => {
    const hr = parseInt(item.hour);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return {
      name: `${displayHr}${ampm}`,
      CheckIns: parseInt(item.count) || 0,
    };
  }) || [];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-gym-primary" />
            Command Center
          </h1>
          <p className="text-gray-400 mt-2 font-medium">Real-time analytics and gym overview.</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.stats?.map((stat: any, i: number) => {
          const Icon = iconMap[stat.name];
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              key={stat.name} 
              className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 relative overflow-hidden group hover:border-white/20 transition-all"
            >
              {/* Subtle background glow on hover */}
              <div className={`absolute -inset-20 bg-gradient-to-r from-transparent via-${stat.bg.split('-')[1]}/10 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none`} />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-xl ${stat.bg} shadow-lg backdrop-blur-md`}>
                  {Icon && <Icon className={`h-6 w-6 ${stat.color}`} />}
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{stat.name}</p>
                <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Charts Column (Takes up 2 cols on XL screens) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Revenue Breakdown Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-400" /> Revenue Breakdown
              </h3>
              <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1 text-emerald-400"><div className="w-3 h-3 rounded-full bg-emerald-400" /> Memberships</span>
                <span className="flex items-center gap-1 text-blue-400"><div className="w-3 h-3 rounded-full bg-blue-400" /> Other Fees</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMembership" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `Rs.${val/1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#000000dd', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, undefined]}
                  />
                  <Area type="monotone" dataKey="Maintenance" stackId="1" stroke="#60a5fa" strokeWidth={3} fill="url(#colorMaintenance)" />
                  <Area type="monotone" dataKey="Membership" stackId="1" stroke="#34d399" strokeWidth={3} fill="url(#colorMembership)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Peak Hours Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" /> Peak Gym Hours
              </h3>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Last 30 Days</span>
            </div>
            
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#ffffff10' }}
                    contentStyle={{ backgroundColor: '#000000dd', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="CheckIns" fill="#c084fc" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Side Widgets Column */}
        <div className="space-y-6">
          
          {/* Expiring Memberships */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col shadow-xl max-h-[400px]"
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" /> Expiring Soon
              </h3>
              <span className="bg-amber-500/20 text-amber-500 text-xs font-black px-2 py-1 rounded-md">{data?.expiringMembers?.length || 0}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
              {data?.expiringMembers?.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold">No expiring memberships.</p>
                </div>
              ) : (
                data?.expiringMembers?.map((member: any) => {
                  const daysLeft = Math.ceil((new Date(member.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={member.id} className="p-3 hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between group cursor-pointer mb-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{member.name}</span>
                        <span className="text-xs text-amber-500/80 font-bold">{daysLeft === 0 ? 'Expires Today' : `${daysLeft} days left`}</span>
                      </div>
                      <button className="text-gym-primary opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gym-primary/20 rounded-lg">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Live Activity Feed */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col shadow-xl max-h-[500px]"
          >
            <div className="p-5 border-b border-white/5 bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-gym-primary" /> Live Activity Feed
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
              {data?.recentActivity?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4 font-bold">No recent activity.</p>
              ) : (
                <AnimatePresence>
                  {data?.recentActivity?.map((activity: any, idx: number) => {
                    const diffMs = new Date().getTime() - new Date(activity.time).getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    let timeStr = `${diffMins}m ago`;
                    if (diffMins > 60) timeStr = `${diffHours}h ago`;
                    if (diffHours > 24) timeStr = new Date(activity.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                    const isPayment = activity.type === 'PAYMENT';

                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={`${activity.type}-${activity.id}`} 
                        className="flex items-start gap-3 relative"
                      >
                        {/* Timeline line */}
                        {idx !== data.recentActivity.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-[-16px] w-[2px] bg-white/5" />
                        )}
                        
                        <div className={`w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center relative z-10 shadow-lg ${
                          isPayment ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gym-primary/20 text-gym-primary border border-gym-primary/30'
                        }`}>
                          {isPayment ? <Banknote className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                        </div>
                        
                        <div className="flex-1 min-w-0 bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-bold text-white truncate pr-2">{activity.name}</p>
                            <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap bg-black/40 px-2 py-0.5 rounded-md">{timeStr}</span>
                          </div>
                          <p className="text-xs text-gray-400 font-medium flex items-center justify-between">
                            <span>
                              {isPayment ? 'Made a payment' : 'Checked into the gym'}
                            </span>
                            {isPayment && activity.amount && (
                              <span className="text-emerald-400 font-bold">Rs. {activity.amount}</span>
                            )}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

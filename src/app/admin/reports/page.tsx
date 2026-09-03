"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Activity, BarChart3, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gym-primary" />
      </div>
    );
  }

  const monthlyRevenue = data?.monthlyRevenue || [];
  const peakHours = data?.peakHours || [];
  const maxRevenue = Math.max(...monthlyRevenue.map((d: any) => d.value), 1); // Avoid div by 0
  const maxAttendance = Math.max(...peakHours.map((d: any) => d.count), 1);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Reports</h1>
        <p className="text-gray-400 mt-1">Advanced insights into gym performance and member behavior.</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total Revenue (YTD)</h3>
            <div className="p-2 bg-gym-primary/10 rounded-lg"><TrendingUp className="h-5 w-5 text-gym-primary" /></div>
          </div>
          <p className="text-3xl font-bold text-white">Rs. {(data?.totalRevenueYtd || 0).toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Active Members</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="h-5 w-5 text-blue-500" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{data?.activeMembers || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Avg. Daily Check-ins</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity className="h-5 w-5 text-emerald-500" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{data?.avgDailyCheckins || 0}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Churn Rate</h3>
            <div className="p-2 bg-red-500/10 rounded-lg"><BarChart3 className="h-5 w-5 text-red-500" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{data?.churnRate || "0.0"}%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="glass-panel p-6 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Revenue Growth</h3>
              <p className="text-sm text-gray-400">Monthly recurring revenue (LKR)</p>
            </div>
            <select className="bg-black/40 border border-white/10 rounded-lg text-sm text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gym-primary">
              <option>{new Date().getFullYear()}</option>
            </select>
          </div>
          
          <div className="h-64 flex items-end gap-2 sm:gap-4 relative pt-10">
            {/* Y-Axis lines */}
            <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-600 pointer-events-none pb-8">
              <div className="border-b border-white/5 w-full flex-1"></div>
              <div className="border-b border-white/5 w-full flex-1"></div>
              <div className="border-b border-white/5 w-full flex-1"></div>
              <div className="border-b border-white/5 w-full flex-1"></div>
            </div>

            {monthlyRevenue.map((d: any, idx: number) => {
              const heightPercentage = (d.value / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs text-white border border-white/10 pointer-events-none whitespace-nowrap">
                    Rs. {(d.value / 1000).toFixed(0)}k
                  </div>
                  {/* Bar */}
                  <div className="w-full bg-gym-primary/20 hover:bg-gym-primary/40 rounded-t-sm transition-all duration-500 relative overflow-hidden" style={{ height: `${heightPercentage}%` }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-gym-primary/60 group-hover:bg-gym-primary transition-colors" style={{ height: '100%' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">{d.month}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Peak Hours Chart */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="glass-panel p-6 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Peak Attendance Hours</h3>
              <p className="text-sm text-gray-400">Total member check-ins</p>
            </div>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="h-64 flex flex-col justify-end gap-3 relative">
             {peakHours.map((d: any, idx: number) => {
               const widthPercentage = (d.count / maxAttendance) * 100;
               return (
                 <div key={idx} className="flex items-center gap-4 group">
                    <span className="text-xs text-gray-400 w-12 text-right">{d.hour}</span>
                    <div className="flex-1 h-6 bg-black/40 rounded-full overflow-hidden relative">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${widthPercentage}%` }}
                         transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                         className="h-full bg-gradient-to-r from-orange-500/50 to-orange-500 rounded-full"
                       />
                       <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                         {d.count} visits
                       </span>
                    </div>
                 </div>
               );
             })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

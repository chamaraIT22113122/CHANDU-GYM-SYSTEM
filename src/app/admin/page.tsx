"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, AlertCircle, Banknote, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
        const res = await fetch("/api/dashboard/overview");
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
        <Loader2 className="h-8 w-8 animate-spin text-gym-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Welcome back, Chandu. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.stats?.map((stat: any, i: number) => {
          const Icon = iconMap[stat.name];
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              key={stat.name} 
              className="glass-panel p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  {Icon && <Icon className={`h-6 w-6 ${stat.color}`} />}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placeholder for Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2 glass-panel p-6 min-h-[400px] flex flex-col"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Revenue & Attendance Overview</h3>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-black/20">
            <p className="text-gray-500">Interactive Chart Will Render Here</p>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="glass-panel p-6 min-h-[400px] flex flex-col"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Recent Check-ins</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
            {data?.recentCheckins?.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent check-ins.</p>
            ) : (
              data?.recentCheckins?.map((checkin: any) => {
                const diffMs = new Date().getTime() - new Date(checkin.time).getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                let timeStr = `${diffMins} mins ago`;
                if (diffMins > 60) timeStr = `${diffHours} hours ago`;
                if (diffHours > 24) timeStr = new Date(checkin.time).toLocaleDateString();

                return (
                  <div key={checkin.id} className="flex items-center gap-4 border-b border-white/5 pb-4 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-gym-primary/20 flex flex-shrink-0 items-center justify-center">
                      <span className="text-gym-primary font-semibold text-xs">{checkin.memberId}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{checkin.name}</p>
                      <p className="text-gray-500 text-xs">Checked in {timeStr}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}

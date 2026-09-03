"use client";

import { useState, useEffect } from "react";
import { Loader2, CalendarCheck, Clock, Search } from "lucide-react";
import { motion } from "framer-motion";

type AttendanceRecord = {
  id: string;
  checkIn: string;
  checkOut: string | null;
  user: {
    firstName: string;
    lastName: string;
    membershipId: string | null;
  };
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await fetch("/api/attendance");
        const data = await res.json();
        if (res.ok) {
          setRecords(data);
        }
      } catch (err) {
        console.error("Failed to fetch attendance", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const filteredRecords = records.filter(record => 
    `${record.user.firstName} ${record.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.user.membershipId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Today's Attendance</h1>
          <p className="text-gray-400 mt-1">Real-time gym check-in log.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gym-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-gym-primary animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
            <CalendarCheck className="h-12 w-12 mb-4 opacity-20" />
            <p>No check-ins found for today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400 bg-black/20">
                  <th className="px-6 py-4 font-medium">Member</th>
                  <th className="px-6 py-4 font-medium">Membership ID</th>
                  <th className="px-6 py-4 font-medium">Check In Time</th>
                  <th className="px-6 py-4 font-medium">Check Out Time</th>
                  <th className="px-6 py-4 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, idx) => {
                  const checkInDate = new Date(record.checkIn);
                  const checkOutDate = record.checkOut ? new Date(record.checkOut) : null;
                  
                  let duration = "--";
                  if (checkOutDate) {
                    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    duration = `${hours > 0 ? hours + 'h ' : ''}${mins}m`;
                  }

                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={record.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gym-primary/20 to-blue-600/20 flex items-center justify-center text-gym-primary font-bold text-xs border border-gym-primary/30">
                            {record.user.firstName.charAt(0)}{record.user.lastName.charAt(0)}
                          </div>
                          <span className="text-white font-medium">
                            {record.user.firstName} {record.user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {record.user.membershipId || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-white">
                          <Clock className="h-4 w-4 text-emerald-500" />
                          {checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {checkOutDate ? (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="h-4 w-4 text-gray-500" />
                            {checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <span className="text-emerald-500/70 text-sm font-medium px-2 py-1 bg-emerald-500/10 rounded-full">
                            In Gym
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium">
                        {duration}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

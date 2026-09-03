"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar, Clock, Users, Activity } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`); // 06:00 to 20:00

export default function GlobalSchedulesPage() {
  const [activeTab, setActiveTab] = useState("master");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForSlot = (day: string, time: string) => {
    return bookings.filter(b => b.dayOfWeek === day && b.startTime === time && b.status === "SCHEDULED");
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    // Padding for first day
    for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
      days.push(null);
    }
    // Actual days (Monday as first day of week)
    // Wait, let's use standard Sunday as first day to match JS Date.getDay()
    const padding = firstDayOfMonth; 
    const daysArray = [];
    for (let i = 0; i < padding; i++) daysArray.push(null);
    for (let i = 1; i <= daysInMonth; i++) daysArray.push(new Date(year, month, i));
    return daysArray;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Global Schedules</h1>
        <p className="text-gray-400 mt-1">Manage and view all member schedules across the gym.</p>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-1">
        <button 
          onClick={() => setActiveTab("master")}
          className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === "master" ? "text-gym-primary" : "text-gray-400 hover:text-white"}`}
        >
          Master Schedule
          {activeTab === "master" && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gym-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab("calendar")}
          className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === "calendar" ? "text-gym-primary" : "text-gray-400 hover:text-white"}`}
        >
          Calendar View
          {activeTab === "calendar" && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gym-primary" />}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-gym-primary animate-spin" />
        </div>
      ) : activeTab === "master" ? (
        <div className="space-y-8">
          {DAYS_OF_WEEK.map(day => {
            const dayBookings = bookings.filter(b => b.dayOfWeek === day && b.status === "SCHEDULED");
            if (dayBookings.length === 0) return null;

            // Group by time
            const groupedByTime: Record<string, any[]> = {};
            dayBookings.forEach(b => {
              if (!groupedByTime[b.startTime]) groupedByTime[b.startTime] = [];
              groupedByTime[b.startTime].push(b);
            });

            // Sort times
            const sortedTimes = Object.keys(groupedByTime).sort();

            return (
              <div key={day} className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gym-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-gym-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{day}</h2>
                </div>

                <div className="space-y-6">
                  {sortedTimes.map(time => (
                    <div key={time} className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold text-white">{time} - {groupedByTime[time][0].endTime}</span>
                        </div>
                        <div className="text-xs font-medium px-2 py-1 bg-white/10 rounded-full text-gray-300">
                          {groupedByTime[time].length} Members
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {groupedByTime[time].map(booking => (
                          <Link 
                            key={booking.id} 
                            href={`/admin/members/${booking.userId}`}
                            className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/10 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gym-card border border-white/10 flex items-center justify-center font-bold text-white text-xs group-hover:border-gym-primary/50 transition-colors">
                              {booking.user.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white group-hover:text-gym-primary transition-colors">{booking.user.firstName} {booking.user.lastName}</p>
                              <p className="text-xs text-gray-500">{booking.user.membershipId}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {bookings.filter(b => b.status === "SCHEDULED").length === 0 && (
            <div className="glass-panel p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-1">No Active Schedules</h3>
              <p className="text-gray-400">There are currently no members scheduled for any day.</p>
            </div>
          )}
        </div>
      ) : activeTab === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">&larr;</button>
                <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">&rarr;</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium text-gray-400">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentMonth).map((date, i) => {
                if (!date) return <div key={i} className="aspect-square rounded-xl bg-transparent" />;
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();
                
                const dayName = date.toLocaleString('default', { weekday: 'long' });
                const hasBookings = bookings.some(b => b.dayOfWeek === dayName && b.status === "SCHEDULED");

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all ${
                      isSelected 
                        ? 'bg-gym-primary text-black border-gym-primary font-bold shadow-lg shadow-gym-primary/20' 
                        : isToday
                        ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        : 'bg-black/20 text-gray-300 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg">{date.getDate()}</span>
                    {hasBookings && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-2 ${isSelected ? 'bg-black' : 'bg-gym-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-1">
              {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "Select a date"}
            </h3>
            <p className="text-sm text-gray-400 mb-6">Daily Schedule</p>
            
            {selectedDate && (
              <div className="space-y-4">
                {(() => {
                  const dayName = selectedDate.toLocaleString('default', { weekday: 'long' });
                  const dayBookings = bookings.filter(b => b.dayOfWeek === dayName && b.status === "SCHEDULED");
                  
                  if (dayBookings.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 bg-black/20 rounded-xl border border-white/5">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No schedules for this day.</p>
                      </div>
                    );
                  }

                  const groupedByTime: Record<string, any[]> = {};
                  dayBookings.forEach(b => {
                    if (!groupedByTime[b.startTime]) groupedByTime[b.startTime] = [];
                    groupedByTime[b.startTime].push(b);
                  });
                  const sortedTimes = Object.keys(groupedByTime).sort();

                  return sortedTimes.map(time => (
                    <div key={time} className="bg-black/20 rounded-xl border border-white/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gym-primary font-semibold">
                          <Clock className="h-4 w-4" />
                          {time} - {groupedByTime[time][0].endTime}
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-white/10 rounded-full text-white">
                          {groupedByTime[time].length} Members
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groupedByTime[time].map(booking => (
                          <Link 
                            key={booking.id} 
                            href={`/admin/members/${booking.userId}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gym-card flex items-center justify-center font-bold text-white text-xs border border-white/10 group-hover:border-gym-primary/50">
                              {booking.user.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white group-hover:text-gym-primary transition-colors">{booking.user.firstName} {booking.user.lastName}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{booking.user.membershipId}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

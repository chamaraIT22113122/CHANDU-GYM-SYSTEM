"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Bell, User, Settings, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems: any[] = [];

export default function MemberTopNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/notifications`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const markAsRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ""}/api/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const clearAll = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ""}/api/notifications/clear`, {
        method: "POST",
        credentials: "include"
      });
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="sticky top-0 z-40 bg-gym-dark/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gym-primary/50 bg-white/5 p-0.5">
              <img 
                src="/logo.jpg" 
                alt="Chandu GYM" 
                className="object-contain w-full h-full rounded-full"
              />
            </div>
            <span className="text-white font-bold tracking-wider hidden sm:block">CHANDU<span className="text-gym-primary">GYM</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors text-gray-400 hover:text-white hover:bg-white/5`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
              }}
              className="p-2 text-gray-400 hover:text-white transition-colors relative rounded-full hover:bg-white/5"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-gym-primary ring-2 ring-gym-dark" />
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 bg-gym-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h3 className="font-bold text-white">Notifications</h3>
                    <span className="text-xs bg-gym-primary/20 text-gym-primary px-2 py-0.5 rounded-full">{unreadCount} New</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <Link
                          key={notif.id}
                          to={notif.link || "#"}
                          onClick={() => setIsNotifOpen(false)}
                          className={`block p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.isRead ? 'bg-gym-primary/5' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-semibold text-white">
                              {!notif.isRead && <span className="inline-block w-2 h-2 rounded-full bg-gym-primary mr-2" />}
                              {notif.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">{notif.message}</p>
                        </Link>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-white/5 flex justify-between items-center bg-black/20">
                      <button onClick={markAsRead} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                        Mark all as read
                      </button>
                      <button onClick={clearAll} className="text-xs font-medium text-gym-danger hover:text-red-400 transition-colors">
                        Clear all
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full border border-white/10 overflow-hidden focus:outline-none focus:ring-2 focus:ring-gym-primary flex items-center justify-center bg-gray-800"
            >
              <img 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" 
                alt="Member" 
                className="object-cover w-full h-full"
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gym-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <p className="text-sm font-bold text-white leading-none">Chandu Member</p>
                  <p className="text-xs text-gray-400 mt-1">M-1001</p>
                </div>
                <Link to="/member/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <User className="h-4 w-4 text-gray-400" /> My Profile
                </Link>
                <Link to="/member/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <Settings className="h-4 w-4 text-gray-400" /> Settings
                </Link>
                <div className="border-t border-white/5 mt-1 pt-1">
                  <Link to="/login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gym-danger hover:bg-gym-danger/10 transition-colors">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

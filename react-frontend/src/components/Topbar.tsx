import { apiFetch } from "../lib/api";
import { useState, useRef, useEffect } from "react";
import { Bell, Search, Menu, User, LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function Topbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await apiFetch(`/api/notifications`, {
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
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const markAsRead = async () => {
    try {
      await apiFetch(`/api/notifications/mark-read`, {
        method: "POST",
        credentials: "include"
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      await apiFetch(`/api/notifications/clear`, {
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
    <div className="h-20 border-b border-white/5 bg-[#1a1a1a]/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 md:px-8">
      
      <div className="flex items-center gap-4">
        <button className="md:hidden text-gray-400 hover:text-white transition-colors">
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search members..." 
            className="block w-64 pl-10 pr-3 py-2 border border-white/10 rounded-full bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ccff00]/50 text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        
        <div className="relative" ref={notifRef}>
          <motion.button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#1a1a1a]" />
            )}
          </motion.button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                  <h3 className="font-bold text-white">Notifications</h3>
                  <span className="text-xs bg-[#ccff00]/20 text-[#ccff00] px-2 py-0.5 rounded-full">{unreadCount} New</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <Link to={notif.link} key={notif.id} onClick={() => setIsNotifOpen(false)}>
                        <div className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.isRead ? 'bg-[#ccff00]/5' : ''}`}>
                          <div className="flex gap-3">
                            {!notif.isRead && (
                              <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${notif.type === 'OVERDUE' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                            )}
                            <div>
                              <p className="text-sm font-medium text-white">{notif.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-white/5 flex justify-between items-center bg-black/20">
                    <button onClick={markAsRead} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                      Mark all as read
                    </button>
                    <button onClick={clearAll} className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                      Clear all
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white hover:text-[#ccff00] transition-colors">Chandu</p>
              <p className="text-xs text-gray-400">Gym Owner</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-[#ccff00]/20 border border-[#ccff00]/30 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-[#ccff00] transition-all">
              <User className="h-5 w-5 text-[#ccff00]" />
            </div>
          </div>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl py-2 z-50 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-white/5 sm:hidden">
                  <p className="text-sm font-medium text-white">Chandu</p>
                  <p className="text-xs text-gray-400">Gym Owner</p>
                </div>
                
                <Link to="/admin/settings" onClick={() => setIsDropdownOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </div>
                </Link>
                
                <Link to="/login" onClick={() => setIsDropdownOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer mt-1">
                    <LogOut className="h-4 w-4" />
                    Log out
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}

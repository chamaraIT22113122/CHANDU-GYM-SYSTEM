"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bell, Lock, Shield, CreditCard, User, Globe } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MemberSettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <Link href="/member" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your account preferences and settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Nav for Settings */}
        <div className="md:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-gym-primary/10 text-gym-primary rounded-xl text-sm font-medium transition-colors">
            <User className="h-4 w-4" /> Account
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors">
            <Bell className="h-4 w-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors">
            <Lock className="h-4 w-4" /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors">
            <CreditCard className="h-4 w-4" /> Billing
          </button>
        </div>

        {/* Settings Content Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-3 space-y-6"
        >
          
          <div className="bg-gym-card rounded-2xl border border-white/5 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
            
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-400 font-medium">First Name</label>
                  <input type="text" defaultValue="Chandu" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gym-primary/50 focus:ring-1 focus:ring-gym-primary/50 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-400 font-medium">Last Name</label>
                  <input type="text" defaultValue="Member" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gym-primary/50 focus:ring-1 focus:ring-gym-primary/50 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-gray-400 font-medium">Email Address</label>
                <input type="email" defaultValue="member@example.com" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gym-primary/50 focus:ring-1 focus:ring-gym-primary/50 transition-all" />
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button type="button" className="px-6 py-2.5 bg-gym-primary text-black font-bold rounded-xl hover:bg-gym-accent transition-colors shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gym-card rounded-2xl border border-white/5 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Push Notifications</h3>
                  <p className="text-sm text-gray-400">Receive alerts for upcoming classes and workouts.</p>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-gym-primary' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">SMS Alerts</h3>
                  <p className="text-sm text-gray-400">Get text messages for billing and important updates.</p>
                </div>
                <button 
                  onClick={() => setSmsAlerts(!smsAlerts)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${smsAlerts ? 'bg-gym-primary' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${smsAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

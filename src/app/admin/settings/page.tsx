"use client";

import { useState, useEffect } from "react";
import { Save, Building2, CreditCard, Bell, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [role, setRole] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    gymName: "",
    email: "",
    phone: "",
    address: "",
    baseFee: "",
    maintenanceFee: "",
    penaltyFee: "",
    emailReminders: true,
    autoSuspend: true,
    twoFactorAuth: false,
    max_capacity: "20"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [settingsRes, userRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/auth/me")
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
      if (userRes.ok) {
        const userData = await userRes.json();
        setRole(userData.user?.role || null);
        if (userData.user?.role === "INSTRUCTOR") {
          setActiveTab("security");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Settings</h1>
          <p className="text-gray-400 mt-1">Configure global gym parameters and preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-gym-primary hover:bg-gym-accent text-black px-6 py-2.5 rounded-xl transition-colors font-bold shadow-lg shadow-gym-primary/20 min-w-[140px] justify-center"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>

      {saveSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-500">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">Settings saved successfully!</p>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 flex flex-col gap-2">
          {role !== "INSTRUCTOR" && (
            <>
              <button onClick={() => setActiveTab("general")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === "general" ? "bg-gym-primary/20 text-gym-primary border border-gym-primary/30" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}>
                <Building2 className="h-4 w-4" /> General Details
              </button>
              <button onClick={() => setActiveTab("financial")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === "financial" ? "bg-gym-primary/20 text-gym-primary border border-gym-primary/30" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}>
                <CreditCard className="h-4 w-4" /> Financial Defaults
              </button>
              <button onClick={() => setActiveTab("notifications")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === "notifications" ? "bg-gym-primary/20 text-gym-primary border border-gym-primary/30" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}>
                <Bell className="h-4 w-4" /> Notifications & Automation
              </button>
            </>
          )}
          <button onClick={() => setActiveTab("security")} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === "security" ? "bg-gym-primary/20 text-gym-primary border border-gym-primary/30" : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"}`}>
            <Shield className="h-4 w-4" /> Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 glass-panel p-6 md:p-8 min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 text-gym-primary animate-spin" />
            </div>
          ) : activeTab === "general" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">General Details</h2>
                <p className="text-sm text-gray-400 mb-6">Update your gym's public-facing information.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Gym Name</label>
                  <input type="text" value={settings.gymName} onChange={e => setSettings({...settings, gymName: e.target.value})} className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Contact Email</label>
                    <input type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Contact Phone</label>
                    <input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Address</label>
                    <textarea rows={3} value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gym-primary">Maximum Members Per Slot</label>
                    <input type="number" value={settings.max_capacity} onChange={e => setSettings({...settings, max_capacity: e.target.value})} className="w-full px-4 py-2.5 border border-gym-primary/30 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                    <p className="text-xs text-gray-400">Caps the maximum members that can be scheduled for any 1-hour time slot globally.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "financial" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Financial Defaults</h2>
                <p className="text-sm text-gray-400 mb-6">Set the default fees applied during new member registration or automated penalties.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Default Base Fee (Rs.)</label>
                  <input type="number" value={settings.baseFee} onChange={e => setSettings({...settings, baseFee: e.target.value})} className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  <p className="text-xs text-gray-500">Standard 1-month fee.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Annual Maintenance Fee (Rs.)</label>
                  <input type="number" value={settings.maintenanceFee} onChange={e => setSettings({...settings, maintenanceFee: e.target.value})} className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  <p className="text-xs text-gray-500">Applied once per year to active members.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Overdue Penalty Fee (Rs.)</label>
                  <input type="number" value={settings.penaltyFee} onChange={e => setSettings({...settings, penaltyFee: e.target.value})} className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/20 text-white focus:ring-2 focus:ring-gym-primary/50" />
                  <p className="text-xs text-gray-500">Added to outstanding balance when a plan expires.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Notifications & Automation</h2>
                <p className="text-sm text-gray-400 mb-6">Manage how the system communicates with members and handles background tasks.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-black/20">
                  <div>
                    <h4 className="text-white font-medium">Automated Email Reminders</h4>
                    <p className="text-xs text-gray-400 mt-1">Send warning emails 3 days before membership expires.</p>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, emailReminders: !settings.emailReminders})}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.emailReminders ? 'bg-gym-primary' : 'bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.emailReminders ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-black/20">
                  <div>
                    <h4 className="text-white font-medium">Auto-Suspend Overdue Accounts</h4>
                    <p className="text-xs text-gray-400 mt-1">Change member status to SUSPENDED if overdue by &gt;7 days.</p>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, autoSuspend: !settings.autoSuspend})}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.autoSuspend ? 'bg-gym-primary' : 'bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.autoSuspend ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Security</h2>
                <p className="text-sm text-gray-400 mb-6">Manage Admin access and authentication protocols.</p>
              </div>
              
              <div className="space-y-6">
                <div className="glass-panel p-6 border border-white/5 bg-black/20 rounded-xl">
                  <h4 className="text-white font-medium mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Current Password</label>
                      <input 
                        type="password" 
                        id="currentPassword"
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/40 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">New Password</label>
                      <input 
                        type="password" 
                        id="newPassword"
                        className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-black/40 text-white focus:ring-2 focus:ring-gym-primary/50"
                      />
                    </div>
                    <div className="pt-2">
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          const currentPassword = (document.getElementById("currentPassword") as HTMLInputElement).value;
                          const newPassword = (document.getElementById("newPassword") as HTMLInputElement).value;
                          if(!currentPassword || !newPassword) {
                            alert("Please fill in both password fields.");
                            return;
                          }
                          try {
                            const res = await fetch("/api/auth/password", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ currentPassword, newPassword }),
                            });
                            if(res.ok) {
                              alert("Password updated successfully!");
                              (document.getElementById("currentPassword") as HTMLInputElement).value = "";
                              (document.getElementById("newPassword") as HTMLInputElement).value = "";
                            } else {
                              const data = await res.json();
                              alert(data.error || "Failed to update password");
                            }
                          } catch(err) {
                            alert("An error occurred.");
                          }
                        }}
                        className="px-4 py-2 bg-gym-primary hover:bg-gym-accent text-black font-bold rounded-lg text-sm transition-colors"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-black/20">
                  <div>
                    <h4 className="text-white font-medium flex items-center gap-2">Two-Factor Authentication (2FA) <span className="text-[10px] bg-gym-primary/20 text-gym-primary px-2 py-0.5 rounded uppercase tracking-wider">Coming Soon</span></h4>
                    <p className="text-xs text-gray-400 mt-1">Require SMS or Authenticator code for Admin logins.</p>
                  </div>
                  <button 
                    disabled
                    className={`w-12 h-6 rounded-full relative transition-colors bg-gray-700 opacity-50 cursor-not-allowed`}
                  >
                    <div className={`absolute top-1 left-1 bg-white/50 w-4 h-4 rounded-full transition-transform translate-x-0`}></div>
                  </button>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-red-400 font-medium mb-2">Danger Zone</h4>
                  <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                    Reset Database Defaults
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

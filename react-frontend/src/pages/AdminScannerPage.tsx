import { apiFetch } from "../lib/api";
import { useState, useEffect } from "react";
import { Loader2, MonitorSmartphone, ScanLine, RefreshCcw, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminScannerPage() {
  const [kioskToken, setKioskToken] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchKioskToken = async () => {
    try {
      const res = await apiFetch('/api/attendance/kiosk-token');
      if (res.ok) {
        const data = await res.json();
        setKioskToken(data.token);
        setLastRefreshed(new Date());
      } else {
        setKioskToken("ERROR");
      }
    } catch {
      setKioskToken("ERROR");
    }
  };

  useEffect(() => {
    fetchKioskToken();
    const interval = setInterval(fetchKioskToken, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 w-full mx-auto relative overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gym-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 w-full relative z-10"
      >
        <h1 className="text-5xl font-black text-white flex items-center justify-center gap-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <MonitorSmartphone className="h-12 w-12 text-gym-primary drop-shadow-[0_0_20px_rgba(208,255,0,0.5)]" />
          Attendance Kiosk
        </h1>
        <p className="text-gray-400 mt-4 text-xl font-medium">Leave this screen open at the entrance.</p>
        <p className="text-gym-primary mt-2 text-base font-bold uppercase tracking-widest bg-gym-primary/10 inline-block px-4 py-1.5 rounded-full border border-gym-primary/20 shadow-[0_0_15px_rgba(208,255,0,0.2)]">
          Members will scan this code to check in
        </p>
      </motion.div>

      {/* QR Code Display */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-lg bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] p-12 flex flex-col items-center justify-center relative z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <div className="relative mx-auto mb-10 rounded-[32px] overflow-hidden shadow-[0_0_40px_rgba(208,255,0,0.15)] group" style={{ width: 340, height: 340 }}>
          {/* Animated spinning border */}
          <div className="absolute inset-[-50%] opacity-80 group-hover:opacity-100 transition-opacity duration-500" style={{
            background: 'conic-gradient(from 0deg, #ccff00, #00ff88, #00ccff, #ccff00)',
            animation: 'spin 3s linear infinite',
          }} />
          
          {/* Inner container */}
          <div className="absolute inset-[6px] bg-white rounded-[26px] flex items-center justify-center overflow-hidden z-10">
            {kioskToken && kioskToken !== "ERROR" ? (
              <div className="relative w-full h-full p-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(kioskToken)}`} 
                  alt="Gym Kiosk QR" 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
                {/* Scanning Laser Animation overlay */}
                <motion.div 
                  className="absolute left-6 right-6 h-1 bg-gym-primary shadow-[0_0_15px_#ccff00] rounded-full z-20"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : kioskToken === "ERROR" ? (
              <div className="flex flex-col items-center justify-center text-red-500 px-4 bg-red-500/5 w-full h-full">
                <ShieldAlert className="h-12 w-12 mb-3 opacity-50" />
                <span className="text-xl text-center font-bold mb-4">Connection Lost</span>
                <button 
                  onClick={fetchKioskToken} 
                  className="text-sm font-bold bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                >
                  Reconnect Kiosk
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 bg-gray-100 w-full h-full">
                <Loader2 className="w-16 h-16 animate-spin mb-4 text-gym-primary" />
                <span className="text-base font-bold text-gray-600">Generating Secure Token...</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-full">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-bold bg-white/5 px-4 py-2 rounded-lg border border-white/5 w-full justify-center">
            <RefreshCcw className="h-4 w-4 text-gym-primary" />
            <span className="tabular-nums">
              Auto-refreshes every 30s
            </span>
          </div>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-4">
            Last Updated: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

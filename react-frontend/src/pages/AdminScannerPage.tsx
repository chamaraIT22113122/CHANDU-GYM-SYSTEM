import { apiFetch } from "../lib/api";
import { useState, useEffect } from "react";
import { Loader2, MonitorSmartphone } from "lucide-react";

export default function AdminScannerPage() {
  const [kioskToken, setKioskToken] = useState<string | null>(null);

  const fetchKioskToken = async () => {
    try {
      const res = await apiFetch('/api/attendance/kiosk-token');
      if (res.ok) {
        const data = await res.json();
        setKioskToken(data.token);
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
    <div className="min-h-full flex flex-col items-center justify-center p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 w-full">
        <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3">
          <MonitorSmartphone className="h-9 w-9 text-gym-primary" />
          Attendance Kiosk
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Leave this screen open at the entrance.</p>
        <p className="text-gym-primary mt-1 text-sm font-bold">Members will scan this code to check in.</p>
      </div>

      {/* QR Code Display */}
      <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 p-10 flex flex-col items-center justify-center">
        
        <div className="relative mx-auto mb-8 rounded-[24px] overflow-hidden" style={{ width: 320, height: 320 }}>
          {/* Animated spinning background (larger than container to cover corners) */}
          <div className="absolute inset-[-50%]" style={{
            background: 'conic-gradient(from 0deg, #ccff00, #00ff88, #00ccff, #ccff00)',
            animation: 'spin 3s linear infinite',
          }} />
          
          {/* Inner container that stays still */}
          <div className="absolute inset-[4px] bg-white rounded-[20px] flex items-center justify-center overflow-hidden z-10">
            {kioskToken && kioskToken !== "ERROR" ? (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(kioskToken)}`} 
                alt="Gym Kiosk QR" 
                className="w-full h-full object-contain p-4"
              />
            ) : kioskToken === "ERROR" ? (
              <div className="flex flex-col items-center justify-center text-red-500 px-4">
                <span className="text-lg text-center font-bold mb-2">Failed to load</span>
                <button onClick={fetchKioskToken} className="text-sm font-bold bg-white/10 px-4 py-2 rounded">Retry</button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <span className="text-sm font-medium">Generating Kiosk Token...</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 font-medium">🔄 Auto-refreshes every 30 seconds</p>
      </div>
    </div>
  );
}

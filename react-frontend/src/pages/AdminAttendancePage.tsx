import { apiFetch } from "../lib/api";
"use client";

import { useState, useEffect } from "react";
import { Loader2, CalendarCheck, Clock, Search, Scan, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5QrcodeScanner } from "html5-qrcode";

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

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [scanStatus, setScanStatus] = useState<{type: 'success' | 'error' | null, message: string}>({ type: null, message: '' });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await apiFetch(`/api/attendance`);
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

  const handleScan = async (token: string) => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStatus({ type: null, message: '' });

    try {
      const res = await apiFetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setScanStatus({ type: 'success', message: data.message });
        const fetchRes = await apiFetch(`/api/attendance`);
        if (fetchRes.ok) {
          setRecords(await fetchRes.json());
        }
      } else {
        setScanStatus({ type: 'error', message: data.error || 'Failed to scan' });
      }
    } catch (err) {
      setScanStatus({ type: 'error', message: 'Network error occurred' });
    } finally {
      setIsScanning(false);
      setManualToken("");
    }
  };

  useEffect(() => {
    let scanner: any = null;

    if (scannerOpen) {
      // Import the core class instead of the scanner UI wrapper
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        scanner = new Html5Qrcode("qr-reader");
        
        scanner.start(
          { facingMode: "environment" }, // Prefer back camera
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            scanner.pause();
            handleScan(decodedText).then(() => {
              setTimeout(() => scanner.resume(), 3000);
            });
          },
          (error: any) => {
            // Ignore frame scan errors
          }
        ).catch((err: any) => {
          console.error("Camera error:", err);
          setScanStatus({ 
            type: 'error', 
            message: 'Could not access camera. Make sure you have given permission, or use Manual Entry.' 
          });
        });
      });
      
      return () => {
        if (scanner) {
          scanner.stop().then(() => scanner.clear()).catch((e: any) => console.error(e));
        }
      };
    }
  }, [scannerOpen]);

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
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => {
              setScannerOpen(true);
              setScanStatus({ type: null, message: '' });
            }}
            className="flex items-center gap-2 bg-gym-primary text-black px-4 py-2 rounded-xl font-bold hover:bg-gym-primary/90 transition-all whitespace-nowrap shadow-[0_0_15px_rgba(208,255,0,0.3)]"
          >
            <Scan className="h-5 w-5" />
            Scan Pass
          </button>
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

      <AnimatePresence>
        {scannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scan className="h-6 w-6 text-gym-primary" />
                  Scan Member QR Code
                </h2>
                <button 
                  onClick={() => setScannerOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {scanStatus.type && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 ${
                    scanStatus.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {scanStatus.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <X className="h-5 w-5 shrink-0" />}
                    <p className="text-sm font-medium leading-relaxed">{scanStatus.message}</p>
                  </div>
                )}

                <div className="bg-black/50 rounded-xl overflow-hidden border border-white/5 relative min-h-[300px]">
                  <div id="qr-reader" className="w-full"></div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Manual Entry (For Testing)</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste JWT Token here..."
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-gym-primary/50"
                    />
                    <button
                      onClick={() => handleScan(manualToken)}
                      disabled={isScanning || !manualToken}
                      className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-all"
                    >
                      {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

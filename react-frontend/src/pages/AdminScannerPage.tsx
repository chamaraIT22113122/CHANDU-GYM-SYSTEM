import { apiFetch } from "../lib/api";
import { useState, useEffect, useRef } from "react";
import { Loader2, Scan, CheckCircle2, X, AlertTriangle, ShieldCheck, LogIn, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Audio helpers (Web Audio API) ────────────────────────────────────────────
function playSuccess() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

function playError() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}
// ─────────────────────────────────────────────────────────────────────────────

type ScanResult = {
  type: 'checkin' | 'checkout' | 'blocked' | 'error' | null;
  message: string;
  memberName?: string;
  lastToken?: string; // store token for override re-submission
};

export default function AdminScannerPage() {
  const [manualToken, setManualToken] = useState("");
  const [result, setResult] = useState<ScanResult>({ type: null, message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<any>(null);

  const handleScan = async (token: string, override = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setResult({ type: null, message: '' });

    try {
      const res = await apiFetch('/api/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ token, override })
      });

      const data = await res.json();

      if (res.ok) {
        const action = data.action === 'checkout' ? 'checkout' : 'checkin';
        playSuccess();
        setResult({ type: action, message: data.message });
      } else if (data.requiresOverride) {
        playError();
        setResult({ type: 'blocked', message: data.error, memberName: data.memberName, lastToken: token });
      } else {
        playError();
        setResult({ type: 'error', message: data.error || 'Scan failed' });
      }
    } catch {
      playError();
      setResult({ type: 'error', message: 'Network error. Check your connection.' });
    } finally {
      setIsProcessing(false);
      setManualToken("");
      // Auto-clear and resume camera after 3.5 seconds
      setTimeout(() => {
        setResult({ type: null, message: '' });
        if (scannerRef.current) {
          try { scannerRef.current.resume(); } catch {}
        }
      }, 3500);
    }
  };

  useEffect(() => {
    let scanner: any = null;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (decodedText: string) => {
          scanner.pause();
          handleScan(decodedText);
        },
        () => {}
      ).catch((err: any) => {
        console.error("Camera error:", err);
        setResult({
          type: 'error',
          message: 'Could not access camera. Grant camera permission or use Manual Entry below.'
        });
      });
    });

    return () => {
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, []);

  const overlayConfig = {
    checkin: { bg: 'bg-emerald-500', icon: <LogIn className="h-28 w-28 text-white" />, label: 'CHECKED IN' },
    checkout: { bg: 'bg-sky-500', icon: <LogOut className="h-28 w-28 text-white" />, label: 'CHECKED OUT' },
    blocked: { bg: 'bg-red-600', icon: <AlertTriangle className="h-28 w-28 text-white" />, label: 'ACCESS BLOCKED' },
    error: { bg: 'bg-red-500', icon: <X className="h-28 w-28 text-white" />, label: 'ERROR' },
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-start p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 w-full">
        <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3">
          <Scan className="h-9 w-9 text-gym-primary" />
          Kiosk Scanner
        </h1>
        <p className="text-gray-500 mt-1">Leave this open at the entrance for continuous scanning.</p>
      </div>

      {/* Scanner Card */}
      <div className="w-full bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
        <div className="p-6">
          {/* Scanner viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-black min-h-[380px] flex items-center justify-center border border-white/5">
            <div id="qr-reader" className="w-full" />

            {/* Overlay for scan results */}
            <AnimatePresence>
              {result.type && (
                <motion.div
                  key={result.type}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 ${overlayConfig[result.type].bg}`}
                >
                  {overlayConfig[result.type].icon}
                  <p className="text-white font-black text-xl mt-4 tracking-widest">
                    {overlayConfig[result.type].label}
                  </p>
                  <p className="text-white/90 text-center text-sm mt-2 max-w-xs">
                    {result.message}
                  </p>

                  {/* Admin Override button — only shown when access is blocked */}
                  {result.type === 'blocked' && result.lastToken && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => handleScan(result.lastToken!, true)}
                      disabled={isProcessing}
                      className="mt-6 flex items-center gap-2 bg-white text-red-600 font-black px-6 py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      Admin Override — Allow Once
                    </motion.button>
                  )}

                  {/* Dismiss button */}
                  <button
                    onClick={() => {
                      setResult({ type: null, message: '' });
                      if (scannerRef.current) { try { scannerRef.current.resume(); } catch {} }
                    }}
                    className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-all"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gym-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gym-primary"></span>
            </span>
            <span className="text-xs text-gray-500">
              {isProcessing ? 'Processing...' : 'Scanner active — Waiting for QR code'}
            </span>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="border-t border-white/5 p-6">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-1">
            Manual Entry
          </p>
          <p className="text-[11px] text-gray-700 mb-3">Go to member's Pass tab → tap "Copy Token" → paste here</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manualToken && handleScan(manualToken)}
              placeholder="Paste JWT token (eyJ...) here..."
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-gym-primary/50 transition-colors"
            />
            <button
              onClick={() => handleScan(manualToken)}
              disabled={isProcessing || !manualToken}
              className="bg-gym-primary text-black px-5 py-3 rounded-xl font-bold hover:bg-gym-primary/90 disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

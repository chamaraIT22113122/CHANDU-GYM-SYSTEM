"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/member-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: email }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/member";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gym-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gym-accent/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Back to Home Button */}
      <a href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors z-20">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </a>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="glass-panel p-8 md:p-10 flex flex-col items-center">
          
          <div className="mb-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-gym-primary/50 shadow-[0_0_15px_rgba(204,255,0,0.3)] bg-white/5 flex items-center justify-center p-2">
              <Image 
                src="/logo.jpg" 
                alt="Chandu GYM Logo" 
                width={96} 
                height={96} 
                className="object-contain w-full h-full rounded-full"
              />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight text-center">
              Member Login
            </h1>
            <p className="text-gray-400 mt-2 text-sm text-center">
              Sign in with your Member ID or NIC
            </p>
          </div>
          
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-5">
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Member ID or NIC Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-gym-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary/50 transition-all sm:text-sm"
                  placeholder="e.g. 123456789V or M-1001"
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] text-sm font-bold text-black bg-gym-primary hover:bg-gym-accent transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gym-primary focus:ring-offset-gym-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </motion.button>
            
          </form>
        </div>
          
        <div className="mt-6 flex items-center justify-between text-xs text-gray-600 px-2">
          <span>&copy; {new Date().getFullYear()} Chandu GYM System.</span>
          <a href="/admin/login" className="hover:text-gray-400 transition-colors">Admin Login</a>
        </div>
      </motion.div>
    </div>
  );
}

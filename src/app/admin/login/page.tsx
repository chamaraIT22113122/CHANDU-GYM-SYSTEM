"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to login");
        return;
      }

      // Check role just to be safe, though middleware handles it
      if (data.user.role === "ADMIN" || data.user.role === "INSTRUCTOR") {
        window.location.href = "/admin";
      } else {
        setError("You do not have permission to access the admin panel.");
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
          
          <div className="mb-6 flex flex-col items-center">
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
              Admin Login
            </h1>
            <p className="text-gray-400 mt-2 text-sm text-center">
              Sign in to the administration panel
            </p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-5">
            
            {error && (
              <div className="p-3 rounded-lg bg-gym-danger/10 border border-gym-danger/20 text-gym-danger text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Admin Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-gym-primary transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary/50 transition-all sm:text-sm"
                  placeholder="admin@chandugym.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-gym-primary transition-colors" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-black/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gym-primary/50 focus:border-gym-primary/50 transition-all sm:text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-600 bg-black/20 text-gym-primary focus:ring-gym-primary/50 mr-2" />
                Remember me
              </label>
              <a href="#" className="text-gym-primary hover:text-gym-accent transition-colors">Forgot password?</a>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] text-sm font-bold text-black bg-gym-primary hover:bg-gym-accent transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gym-primary focus:ring-offset-gym-dark disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Admin Sign In"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </motion.button>
            
          </form>
          
        </div>
        
        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Are you a Member? <span className="text-gym-primary font-medium hover:underline">Login here</span>
          </a>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Chandu GYM System. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}

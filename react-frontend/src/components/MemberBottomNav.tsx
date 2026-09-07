"use client";

import { Link, useLocation } from "react-router-dom";
import { Home, CalendarDays, Utensils, QrCode, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const navItems = [
  { name: "Home", href: "/member#overview", hash: "overview", icon: Home },
  { name: "Workout", href: "/member#schedule", hash: "schedule", icon: CalendarDays },
  { name: "Diet", href: "/member#diet", hash: "diet", icon: Utensils },
  { name: "Payments", href: "/member#payments", hash: "payments", icon: CreditCard },
  { name: "Pass", href: "/member#pass", hash: "pass", icon: QrCode },
];

export default function MemberBottomNav() {
  const location = useLocation();
  const [activeHash, setActiveHash] = useState("overview");

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    setActiveHash(hash || "overview");
  }, [location.hash]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 pt-2 bg-gradient-to-t from-gym-dark via-gym-dark to-transparent md:hidden pointer-events-none">
      <div className="bg-gym-card/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex justify-between items-center pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeHash === item.hash;
          return (
            <Link key={item.name} to={item.href} className="relative flex flex-col items-center justify-center w-[20%] py-2 group">
              {isActive && (
                <motion.div 
                  layoutId="bottomNavBubble"
                  className="absolute inset-0 bg-gym-primary/20 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`h-5 w-5 relative z-10 transition-colors ${isActive ? 'text-gym-primary' : 'text-gray-400 group-hover:text-gray-200'}`} />
              <span className={`text-[9px] mt-1 font-medium relative z-10 transition-colors ${isActive ? 'text-gym-primary' : 'text-gray-400 group-hover:text-gray-200'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

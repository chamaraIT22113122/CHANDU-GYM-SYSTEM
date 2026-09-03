"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Utensils, QrCode } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "/member", icon: Home },
  { name: "Workout", href: "/member#workout", icon: CalendarDays },
  { name: "Pass", href: "/member#pass", icon: QrCode },
  { name: "Diet", href: "/member#diet", icon: Utensils },
];

export default function MemberBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-gym-dark via-gym-dark to-transparent md:hidden pointer-events-none">
      <div className="bg-gym-card/90 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex justify-around items-center pointer-events-auto shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className="relative flex flex-col items-center justify-center w-16 h-16 group">
              <Icon className={`h-6 w-6 relative z-10 text-gray-500 group-hover:text-gym-primary transition-colors`} />
              <span className={`text-[10px] mt-1 font-medium relative z-10 text-gray-500 group-hover:text-gym-primary transition-colors`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

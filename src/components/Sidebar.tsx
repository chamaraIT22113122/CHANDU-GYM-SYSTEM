"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  UserCheck,
  CalendarCheck,
  ShieldCheck
} from "lucide-react";

const allAdminLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN", "INSTRUCTOR"] },
  { name: "Members", href: "/admin/members", icon: Users, roles: ["ADMIN", "INSTRUCTOR"] },
  { name: "Instructors", href: "/admin/instructors", icon: UserCheck, roles: ["ADMIN"] },
  { name: "Attendance", href: "/admin/attendance", icon: CalendarCheck, roles: ["ADMIN", "INSTRUCTOR"] },
  { name: "Schedules", href: "/admin/schedules", icon: CalendarCheck, roles: ["ADMIN", "INSTRUCTOR"] },
  { name: "Billing", href: "/admin/billing", icon: CreditCard, roles: ["ADMIN"] },
  { name: "Plans", href: "/admin/plans", icon: LayoutDashboard, roles: ["ADMIN"] },
  { name: "Reports", href: "/admin/reports", icon: BarChart3, roles: ["ADMIN"] },
  { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["ADMIN", "INSTRUCTOR"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setRole(data.user?.role || null);
        }
      } catch (err) {
        console.error("Failed to fetch user role", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const visibleLinks = allAdminLinks.filter(link => role && link.roles.includes(role));

  return (
    <div className="h-screen w-64 bg-gym-card border-r border-white/5 flex flex-col justify-between hidden md:flex sticky top-0">
      <div>
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gym-primary/50 bg-white/5 p-1 flex-shrink-0">
              <Image 
                src="/logo.jpg" 
                alt="Chandu GYM" 
                width={40} 
                height={40} 
                className="object-contain w-full h-full rounded-full"
              />
            </div>
            <span className="text-white font-bold tracking-wider text-lg">CHANDU<span className="text-gym-primary">GYM</span></span>
          </div>
        </div>

        <div className="p-4 py-6 flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            {role === "INSTRUCTOR" ? "Instructor Panel" : "Admin Panel"}
          </span>
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href || (pathname.startsWith(`${link.href}/`) && link.href !== "/admin");
            const Icon = link.icon;
            
            return (
              <Link key={link.name} href={link.href}>
                <motion.div 
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    isActive 
                      ? "bg-gym-primary/10 text-gym-primary font-medium border border-gym-primary/20" 
                      : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-gym-primary" : "text-gray-500"}`} />
                  {link.name}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-gray-400 hover:text-gym-danger hover:bg-gym-danger/10 transition-all text-left">
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

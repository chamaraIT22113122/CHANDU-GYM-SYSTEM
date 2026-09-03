"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, Bell, User, Settings, ChevronDown } from "lucide-react";

const navItems: any[] = [];

export default function MemberTopNav() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40 bg-gym-dark/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gym-primary/50 bg-white/5 p-0.5">
              <Image 
                src="/logo.jpg" 
                alt="Chandu GYM" 
                width={32} 
                height={32} 
                className="object-contain w-full h-full rounded-full"
              />
            </div>
            <span className="text-white font-bold tracking-wider hidden sm:block">CHANDU<span className="text-gym-primary">GYM</span></span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              // Only highlight Home if literally on /member and no hash, otherwise highlight nothing
              // Or just keep the active state simple. Since it's anchor links, we don't really need active states.
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors text-gray-400 hover:text-white hover:bg-white/5`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gym-primary rounded-full border border-gym-dark"></span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full border border-white/10 overflow-hidden focus:outline-none focus:ring-2 focus:ring-gym-primary flex items-center justify-center bg-gray-800"
            >
              <Image 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" 
                alt="Member" 
                width={40} 
                height={40} 
                className="object-cover w-full h-full"
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gym-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <p className="text-sm font-bold text-white leading-none">Chandu Member</p>
                  <p className="text-xs text-gray-400 mt-1">M-1001</p>
                </div>
                <Link href="/member/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <User className="h-4 w-4 text-gray-400" /> My Profile
                </Link>
                <Link href="/member/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <Settings className="h-4 w-4 text-gray-400" /> Settings
                </Link>
                <div className="border-t border-white/5 mt-1 pt-1">
                  <Link href="/login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gym-danger hover:bg-gym-danger/10 transition-colors">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

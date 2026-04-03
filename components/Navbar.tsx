"use client";

import { Bell, HelpCircle, Menu, Zap, Coins, Image, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHomeStore, type NavItem } from "@/store/useHomeStore";

const NAV_ITEMS: { key: NavItem; label: string; icon: React.ReactNode }[] = [
  { key: "materials", label: "我的素材", icon: <Image className="h-3.5 w-3.5" /> },
  { key: "workspace", label: "工作中心", icon: <Briefcase className="h-3.5 w-3.5" /> },
];

export default function Navbar() {
  const { credits, notificationCount, activeNav, setActiveNav } = useHomeStore();

  return (
    <div className="sticky top-0 z-50 flex justify-center px-6 pt-4 pb-2">
      {/* Floating pill navbar */}
      <header
        className={cn(
          "flex w-full max-w-7xl items-center justify-between",
          "rounded-full border border-white/10 bg-[#111]/80 px-5 py-2.5",
          "shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl"
        )}
      >
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-1">
          {/* Logo */}
          <button
            onClick={() => setActiveNav("home")}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-white/5 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500">
              <Zap className="h-4 w-4 text-black" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              framemind
              <sup className="ml-0.5 text-[10px] text-green-400">+</sup>
            </span>
          </button>

          {/* Divider */}
          <div className="mx-1 h-4 w-px bg-white/10" />

          {/* Nav items */}
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
                activeNav === item.key
                  ? "bg-green-500/15 text-green-400"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Credits */}
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <Coins className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-white">{credits}</span>
          </div>

          <Button variant="outline" size="sm" className="h-7 rounded-full px-3 text-xs">
            充值
          </Button>

          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <Menu className="h-3.5 w-3.5" />
          </Button>

          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <HelpCircle className="h-3.5 w-3.5" />
          </Button>

          <Button variant="ghost" size="icon" className="relative h-7 w-7 rounded-full">
            <Bell className="h-3.5 w-3.5" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-green-400" />
            )}
          </Button>

          {/* Avatar */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-xs font-bold text-white">
            用
          </div>
        </div>
      </header>
    </div>
  );
}

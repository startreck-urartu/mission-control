"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Video,
  Calendar,
  Brain,
  Users,
  Building2,
  CreditCard,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tasks Board", href: "/tasks", icon: ClipboardList },
  { name: "Content Pipeline", href: "/content", icon: Video },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Memory", href: "/memory", icon: Brain },
  { name: "Team", href: "/team", icon: Users },
  { name: "Usage & Costs", href: "/usage", icon: CreditCard },
  { name: "Library", href: "/books", icon: BookOpen },
  { name: "Office", href: "/office", icon: Building2 },
  { name: "Polymarket", href: "/polymarket", icon: TrendingUp },
];

export function NavigationSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          OpenClaw Mission Control
        </h1>
        <p className="text-xs text-gray-400 mt-1">Real-time AI Coordination</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">System Online</span>
        </div>
      </div>
    </div>
  );
}

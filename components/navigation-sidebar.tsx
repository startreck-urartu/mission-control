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
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Tasks Board", href: "/tasks", icon: ClipboardList },
      { name: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Content Pipeline", href: "/content", icon: Video },
      { name: "Library", href: "/books", icon: BookOpen },
    ],
  },
  {
    label: "Trading",
    items: [
      { name: "Trading Team", href: "/trading-team", icon: Radio },
      { name: "Polymarket", href: "/polymarket", icon: TrendingUp },
    ],
  },
  {
    label: "Workspace",
    items: [
      { name: "Team", href: "/team", icon: Users },
      { name: "Office", href: "/office", icon: Building2 },
      { name: "Memory", href: "/memory", icon: Brain },
      { name: "Usage & Costs", href: "/usage", icon: CreditCard },
    ],
  },
];

export function NavigationSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[var(--surface-1)]/80 backdrop-blur-xl border-r border-white/[0.04] flex flex-col h-full relative">
      {/* Subtle gradient accent along right edge */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-blue-500/20 via-transparent to-purple-500/20" />

      <div className="p-5 pb-4">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
          Mission Control
        </h1>
        <p className="text-[11px] text-gray-600 mt-0.5">OpenClaw AI Coordination</p>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.15em] px-3 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-blue-500/15 text-blue-300 nav-active border border-blue-500/20"
                        : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors duration-150",
                        isActive ? "text-blue-400" : "text-gray-600"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-30" />
          </div>
          <span className="text-xs text-gray-600">System Online</span>
        </div>
      </div>
    </div>
  );
}

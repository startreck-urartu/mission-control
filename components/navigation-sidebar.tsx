"use client";

import { useState } from "react";
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
  Layers,
  Radio,
  Sun,
  Moon,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";

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
      { name: "Assistant", href: "/assistant", icon: MessageCircle },
    ],
  },
  {
    label: "Business",
    items: [
      { name: "Client Pipeline", href: "/clients", icon: Users },
      { name: "Revenue & Goals", href: "/revenue", icon: CreditCard },
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
      { name: "Polymarket v2", href: "/polymarket-v2", icon: Layers },
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

const sectionAccent: Record<string, { icon: string; activeBg: string }> = {
  Overview:  { icon: "text-accent-blue",   activeBg: "bg-accent-blue-tint" },
  Business:  { icon: "text-accent-green",  activeBg: "bg-accent-green-tint" },
  Content:   { icon: "text-accent-purple", activeBg: "bg-accent-purple-tint" },
  Trading:   { icon: "text-accent-orange", activeBg: "bg-accent-orange-tint" },
  Workspace: { icon: "text-accent-teal",   activeBg: "bg-accent-teal-tint" },
};

export function NavigationSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="p-5 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
            Mission Control
          </h1>
          <p className="text-[11px] text-tertiary mt-0.5">OpenClaw AI Coordination</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="md:hidden p-1.5 rounded-lg hover:bg-fill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
        >
          <X className="w-5 h-5 text-muted" />
        </button>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto space-y-5">
        {sections.map((section) => {
          const accent = sectionAccent[section.label] ?? sectionAccent.Overview;
          return (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-tertiary uppercase tracking-[0.12em] px-3 mb-1.5">
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
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150",
                      isActive
                        ? cn(accent.activeBg, "text-foreground")
                        : "text-muted hover:bg-fill hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn("w-4 h-4", isActive ? accent.icon : "text-tertiary")}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-separator space-y-1">
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-[13px] text-muted hover:bg-fill hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-accent-orange" />
          ) : (
            <Moon className="w-4 h-4 text-accent-blue" />
          )}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-2 h-2 bg-accent-green rounded-full" />
          <span className="text-xs text-tertiary">System Online</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg glass-pane focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
      >
        <Menu className="w-5 h-5 text-muted" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 glass-pane-elevated flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 flex-col glass-pane rounded-2xl">
        {navContent}
      </div>
    </>
  );
}

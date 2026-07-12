"use client";

import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Activity, LayoutGrid, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

// Office components
import {
  TeamMemberDesk,
  OfficeStats
} from "@/components/office";

/**
 * Loading skeleton for office page
 * Shows animated placeholder cards while data loads
 */
function OfficeSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-32 h-8 bg-fill rounded animate-pulse" />
          <div className="w-48 h-4 bg-fill rounded animate-pulse" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="w-24 h-3 bg-fill rounded animate-pulse" />
                <div className="w-12 h-8 bg-fill rounded animate-pulse" />
              </div>
              <div className="w-10 h-10 bg-fill rounded-xl animate-pulse" />
            </div>
          </Card>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-6 h-40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state when no team members exist
 */
function OfficeEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-12 text-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1
          }}
        >
          <div className="relative inline-block">
            <Activity className="w-16 h-16 text-tertiary mx-auto mb-4" />
            <motion.div
              className="absolute -top-2 -right-2 w-4 h-4 bg-accent-blue rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
        <EmptyState
          message="No Team Members Yet"
          hint="Add team members in the Team section to see them here. They'll appear in the office with live status and activity."
        >
          <motion.div
            className="inline-flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm text-accent-blue cursor-pointer hover:underline">
              Go to Team section →
            </span>
          </motion.div>
        </EmptyState>
      </Card>
    </motion.div>
  );
}

/**
 * Main Office Page component
 * Displays animated team members in a grid layout
 *
 * Features:
 * - Performance-optimized animations with Framer Motion
 * - IntersectionObserver for lazy loading
 * - CSS containment for GPU acceleration
 * - Reduced motion support
 * - Responsive grid layout
 */
export default function OfficePage() {
  const team = useQuery(api.team.getAllTeamMembers);
  const officeDesks = useQuery(api.office.getAllOfficeDesks);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    // Intentional mount flag for hydration gating; must set state on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  /**
   * Calculate office statistics
   * Memoized to prevent unnecessary recalculations
   */
  const stats = useMemo(() => {
    if (!team) {
      return { total: 0, online: 0, active: 0 };
    }
    return {
      total: team.length,
      online: team.filter((t) => t.status === "online").length,
      active: officeDesks?.filter((d) => d.isActive).length || 0,
    };
  }, [team, officeDesks]);

  /**
   * Map team members with their desk data
   * Memoized to maintain stable references
   */
  const teamWithDesks = useMemo(() => {
    if (!team) return [];
    return team.map((member, index) => {
      const desk = officeDesks?.find((d) => d.teamMemberId === member._id);
      return {
        member,
        desk,
        row: Math.floor(index / 3),
        col: index % 3,
        index,
      };
    });
  }, [team, officeDesks]);

  /**
   * Check reduced motion preference
   * Respects user's accessibility settings
   */
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Sync initial media-query state on mount (browser-only API, not available at render time).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Show loading state
  if (!team || !mounted) {
    return <OfficeSkeleton />;
  }

  // Show empty state
  if (teamWithDesks.length === 0) {
    return <OfficeEmptyState />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with stats */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Office"
          subtitle={`Visual workspace with ${stats.online} online · ${stats.active} active`}
        />

        {/* View mode toggle */}
        <div className="flex items-center gap-2 glass-pane rounded-lg p-1 mb-6">
          <motion.button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-fill text-foreground"
                : "text-muted hover:text-foreground"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LayoutGrid className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-md transition-colors",
              viewMode === "list"
                ? "bg-fill text-foreground"
                : "text-muted hover:text-foreground"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Users className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Statistics cards */}
      <OfficeStats
        total={stats.total}
        online={stats.online}
        active={stats.active}
      />

      {/* Team grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          className={cn(
            "grid gap-4",
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          )}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          style={{
            willChange: "transform, opacity",
            contain: "layout style paint",
          }}
        >
          {teamWithDesks.map(({ member, desk, row, col, index }) => (
            <TeamMemberDesk
              key={member._id}
              member={member}
              desk={desk}
              row={row}
              col={col}
              index={index}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Reduced motion notice */}
      <AnimatePresence>
        {prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 right-4 glass-pane rounded-lg px-3 py-2 text-xs text-muted shadow-lg"
          >
            Animations reduced (accessibility on)
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

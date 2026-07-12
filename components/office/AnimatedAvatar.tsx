"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import { accentBg, accentText, teamStatusAccent, type AccentName } from "@/lib/status-colors";

type TeamMember = Doc<"team">;

/** Animation states for agent avatars */
type AnimationState = "idle" | "thinking" | "typing" | "active";

/** Role → accent name map */
const ROLE_ACCENT: Record<string, AccentName> = {
  developer: "teal",
  writer: "blue",
  designer: "purple",
  manager: "orange",
  default: "gray",
};

/** Role-based gradient map (primary fill) — gradient classes are structural, not token offenders */
const ROLE_PRIMARY: Record<string, string> = {
  developer: "from-emerald-500 to-emerald-700",
  writer: "from-blue-500 to-blue-700",
  designer: "from-purple-500 to-purple-700",
  manager: "from-amber-500 to-amber-700",
  default: "from-slate-500 to-slate-700",
};

/**
 * Performance-optimized animated avatar for team members
 * Uses CSS transforms for GPU acceleration and IntersectionObserver
 * to pause animations when off-screen
 */
interface AnimatedAvatarProps {
  member: TeamMember;
  isActive: boolean;
  isWorking: boolean;
  size?: "sm" | "md" | "lg";
}

export default function AnimatedAvatar({
  member,
  isActive,
  isWorking,
  size = "md",
}: AnimatedAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [animationState, setAnimationState] = useState<AnimationState>("idle");

  const roleKey = member.role?.toLowerCase() ?? "default";
  const accent: AccentName = ROLE_ACCENT[roleKey] ?? ROLE_ACCENT.default;
  const primaryGradient = ROLE_PRIMARY[roleKey] ?? ROLE_PRIMARY.default;

  /** Generate initials from name */
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  /** Size variations */
  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    md: "w-20 h-20 text-2xl",
    lg: "w-28 h-28 text-3xl",
  };

  /**
   * Intersection Observer to pause animations when off-screen
   */
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /**
   * Update animation state based on activity
   */
  useEffect(() => {
    const updateState = () => {
      if (!isActive) {
        setAnimationState("idle");
      } else if (isWorking) {
        setAnimationState("typing");
      } else {
        setAnimationState("idle");
      }
    };

    const frameId = requestAnimationFrame(updateState);
    return () => cancelAnimationFrame(frameId);
  }, [isActive, isWorking]);

  /** Check if animations should be running */
  const shouldAnimate = isVisible && isActive;

  /** Status dot color via token map */
  const statusDotClass = accentBg[teamStatusAccent[member.status] ?? "gray"];

  /** Secondary accent dot (spinning diamond / pinging dot) */
  const secondaryDotClass = accentBg[accent];

  /** Tooltip accent text */
  const accentTextClass = accentText[accent];

  return (
    <div
      ref={containerRef}
      className="relative group"
      style={{ contain: "layout style paint" }}
    >
      {/* Main avatar container with floating animation */}
      <div
        className={cn(
          "relative transition-transform duration-300",
          sizeClasses[size],
          shouldAnimate && animationState === "typing" && "animate-float",
          shouldAnimate && animationState === "idle" && "animate-breathe"
        )}
      >
        {/* Hexagon base with gradient */}
        <div
          className={cn(
            "absolute inset-0 clip-hexagon bg-gradient-to-br transition-all duration-500",
            primaryGradient,
            isActive
              ? "opacity-100 scale-100"
              : "opacity-40 scale-95 grayscale",
            shouldAnimate && isWorking && "shadow-lg"
          )}
          style={{ willChange: "transform, opacity" }}
        />

        {/* Pulsing ring for active agents */}
        {shouldAnimate && (
          <div
            className={cn(
              "absolute inset-[-4px] clip-hexagon border-2 border-separator transition-opacity duration-300",
              isWorking ? "opacity-100 animate-pulse-ring" : "opacity-0"
            )}
            style={{ willChange: "opacity, transform" }}
          />
        )}

        {/* Geometric accent shapes */}
        {shouldAnimate && (
          <>
            {/* Spinning diamond */}
            <div
              className={cn(
                "absolute top-1 right-1 w-4 h-4 rotate-45 transition-all duration-300",
                secondaryDotClass,
                animationState === "typing" && "animate-spin-slow opacity-100",
                animationState === "idle" && "opacity-40 scale-75"
              )}
              style={{
                willChange: "transform, opacity",
                transformOrigin: "center center",
              }}
            />

            {/* Pinging dot */}
            <div
              className={cn(
                "absolute bottom-3 left-2 w-2 h-2 rounded-full transition-all duration-300",
                secondaryDotClass,
                animationState === "typing" && "animate-ping-slow opacity-100"
              )}
              style={{ willChange: "transform, opacity" }}
            />

            {/* Orbiting particle for typing state */}
            {animationState === "typing" && (
              <div
                className={cn(
                  "absolute w-1.5 h-1.5 rounded-full bg-white/80",
                  "animate-orbit"
                )}
                style={{
                  willChange: "transform",
                  top: "50%",
                  left: "50%",
                  marginTop: "-3px",
                  marginLeft: "-3px",
                }}
              />
            )}
          </>
        )}

        {/* Initials display — text-white kept: rendered on filled gradient hex */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-bold text-white drop-shadow-md select-none",
              shouldAnimate && animationState === "typing" && "animate-text-pulse"
            )}
          >
            {initials}
          </span>
        </div>

        {/* Status indicator dot */}
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background transition-all duration-200",
            statusDotClass,
            shouldAnimate && member.status === "online" && isWorking && "animate-pulse",
            shouldAnimate && "hover:scale-110"
          )}
        />
      </div>

      {/* Enhanced tooltip with role info */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-20 translate-y-2 group-hover:translate-y-0">
        <div className="glass-pane text-foreground text-xs px-2 py-1 rounded shadow-lg">
          <span className="font-medium">{member.name}</span>
          <span className={cn("ml-1", accentTextClass)}>· {member.role}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import AnimatedAvatar from "./AnimatedAvatar";
import ActivityIndicator from "./ActivityIndicator";

type TeamMember = Doc<"team">;
type OfficeDesk = Doc<"office">;

/**
 * Enhanced desk component with animations and interactions
 * Uses Framer Motion for performant animations
 */
interface TeamMemberDeskProps {
  member: TeamMember;
  desk?: OfficeDesk;
  row: number;
  col: number;
  index: number;
}

export function TeamMemberDesk({
  member,
  desk,
  row: _row,
  col: _col,
  index,
}: TeamMemberDeskProps) {
  const deskRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isActive = desk?.isActive ?? false;
  const isWorking = !!(isActive && member.status === "online" && member.currentTask);

  /**
   * IntersectionObserver for lazy loading
   * Only animates when visible in viewport
   */
  useEffect(() => {
    const element = deskRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /**
   * Mouse parallax effect
   * Uses motion values for smooth GPU-accelerated transforms
   */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(useMotionValue(0), springConfig);
  const rotateY = useSpring(useMotionValue(0), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!deskRef.current) return;

    const rect = deskRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate normalized position (-1 to 1)
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);

    rotateX.set(y * -5); // Invert Y for natural feel
    rotateY.set(x * 5);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  /**
   * Stagger animation delay calculation
   * Creates wave effect when multiple desks appear
   */
  const staggerDelay = Math.min(index * 0.05, 0.5); // Cap at 500ms

  // Suppress unused variable warnings — mouseX/mouseY are tracked for future parallax use
  void mouseX;
  void mouseY;

  return (
    <motion.div
      ref={deskRef}
      className={cn(
        "relative p-6 rounded-xl border-2 overflow-hidden glass-pane",
        isWorking
          ? "border-accent-blue/50"
          : "border-separator"
      )}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.4,
        delay: staggerDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{
        perspective: 1000,
        transform: isHovered ? "perspective(1000px)" : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Dynamic shadow based on state */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-xl pointer-events-none",
          isWorking
            ? "shadow-[0_0_30px_rgba(59,130,246,0.15)]"
            : "shadow-none"
        )}
        animate={{
          opacity: isWorking ? [0.5, 1, 0.5] : 0,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Desk content */}
      <div className="relative z-10">
        {/* Header with avatar and info */}
        <div className="flex items-start gap-4 mb-4">
          <AnimatedAvatar
            member={member}
            isActive={isActive}
            isWorking={isWorking}
            size="md"
          />

          <div className="flex-1 min-w-0">
            <motion.h3
              className="font-semibold text-foreground truncate"
              layoutId={`name-${member._id}`}
            >
              {member.name}
            </motion.h3>

            <motion.p
              className="text-xs text-muted capitalize truncate"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: staggerDelay + 0.1 }}
            >
              {member.role || "Team Member"}
            </motion.p>

            {/* Working status with typing dots */}
            <AnimatePresence>
              {isWorking && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mt-2"
                >
                  <ActivityIndicator type="typing" className="text-accent-blue" />
                  <span className="text-xs text-accent-blue truncate max-w-[180px]">
                    {member.currentTask?.slice(0, 35) || "Working..."}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle indicator */}
            <AnimatePresence>
              {isActive && !isWorking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mt-2"
                >
                  <ActivityIndicator type="idle" className="text-muted" />
                  <span className="text-xs text-muted">Online</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skills section */}
        {member.skills && member.skills.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: staggerDelay + 0.15 }}
          >
            {member.skills.slice(0, 3).map((skill, idx) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: staggerDelay + 0.15 + idx * 0.05 }}
                whileHover={{ scale: 1.1, y: -2 }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] border-separator transition-colors duration-200",
                    isWorking ? "bg-fill text-foreground" : "bg-fill text-muted"
                  )}
                >
                  {skill}
                </Badge>
              </motion.div>
            ))}
            {member.skills.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] bg-fill border-separator text-muted"
              >
                +{member.skills.length - 3}
              </Badge>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom activity bar — uses inline style for gradient; accent-blue hex kept in shimmer animation */}
      <AnimatePresence>
        {isWorking && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: "linear-gradient(90deg, transparent, var(--accent-blue), transparent)",
              animation: "shimmer 2s linear infinite",
            }}
          />
        )}
      </AnimatePresence>

      {/* Corner decoration for working state */}
      {isWorking && (
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-blue"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}

export default TeamMemberDesk;

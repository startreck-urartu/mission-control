"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, Zap, Monitor, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";

type TeamMember = Doc<"team">;
type OfficeDesk = Doc<"office">;

// Low-poly avatar colors by role
const ROLE_COLORS: Record<string, { bg: string; accent: string }> = {
  developer: { bg: "bg-emerald-500", accent: "bg-emerald-300" },
  writer: { bg: "bg-blue-500", accent: "bg-blue-300" },
  designer: { bg: "bg-purple-500", accent: "bg-purple-300" },
  manager: { bg: "bg-amber-500", accent: "bg-amber-300" },
  default: { bg: "bg-slate-500", accent: "bg-slate-300" },
};

// Simple CSS-animated low-poly avatar
function LowPolyAvatar({
  member,
  isActive,
  isWorking,
}: {
  member: TeamMember;
  isActive: boolean;
  isWorking: boolean;
}) {
  const colors = ROLE_COLORS[member.role?.toLowerCase()] || ROLE_COLORS.default;
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative group">
      {/* Avatar container */}
      <div
        className={cn(
          "relative w-20 h-20 transition-transform duration-300",
          isActive && isWorking && "animate-bounce-subtle"
        )}
      >
        {/* Low-poly hexagon base */}
        <div
          className={cn(
            "absolute inset-0 clip-hexagon transition-all duration-300",
            colors.bg,
            isActive ? "opacity-100" : "opacity-40 grayscale"
          )}
        />

        {/* Accent geometric shapes */}
        {isActive && (
          <>
            <div
              className={cn(
                "absolute top-2 right-2 w-4 h-4 rotate-45 animate-pulse",
                colors.accent,
                isWorking && "animate-spin-slow"
              )}
            />
            <div
              className={cn(
                "absolute bottom-3 left-2 w-3 h-3 rounded-full",
                colors.accent,
                "animate-ping-slow"
              )}
            />
          </>
        )}

        {/* Initials / Face */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white drop-shadow-md">
            {initials}
          </span>
        </div>

        {/* Status indicator */}
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900",
            member.status === "online" && "bg-green-500",
            member.status === "busy" && "bg-red-500",
            member.status === "away" && "bg-yellow-500",
            member.status === "offline" && "bg-gray-500",
            isWorking && member.status === "online" && "animate-pulse"
          )}
        />
      </div>

      {/* Tooltip on hover */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
          {member.name}
        </div>
      </div>
    </div>
  );
}

// Simplified desk with CSS only
function TeamMemberDesk({
  member,
  desk,
  row,
  col,
}: {
  member: TeamMember;
  desk?: OfficeDesk;
  row: number;
  col: number;
}) {
  const isActive = desk?.isActive ?? false;
  const isWorking =
    isActive && member.status === "online" && member.currentTask;

  return (
    <div
      className={cn(
        "relative p-6 rounded-xl border-2 transition-all duration-300",
        isWorking
          ? "bg-gray-800/90 border-blue-500/50 shadow-lg shadow-blue-500/20"
          : isActive
          ? "bg-gray-800/70 border-gray-700"
          : "bg-gray-900/50 border-gray-800"
      )}
      style={{
        animationDelay: `${(row + col) * 100}ms`,
      }}
    >
      {/* Desk header - computer/activity indicator */}
      <div className="flex items-center gap-3 mb-4">
        <LowPolyAvatar
          member={member}
          isActive={isActive}
          isWorking={isWorking}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{member.name}</h3>
          <p className="text-xs text-gray-400 capitalize truncate">
            {member.role || "Team Member"}
          </p>
          {isWorking && (
            <div className="flex items-center gap-1 mt-1">
              <Monitor className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400 truncate">
                {member.currentTask?.slice(0, 30) || "Working..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Skills pills */}
      {member.skills && member.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="text-[10px] bg-gray-800 border-gray-700 text-gray-400"
            >
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {/* Subtle activity indicator bar */}
      {isWorking && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
      )}
    </div>
  );
}

export default function OfficePage() {
  const team = useQuery(api.team.getAllTeamMembers);
  const officeDesks = useQuery(api.office.getAllOfficeDesks);

  const stats = useMemo(() => {
    if (!team) return { total: 0, online: 0, active: 0 };
    return {
      total: team.length,
      online: team.filter((t) => t.status === "online").length,
      active: officeDesks?.filter((d) => d.isActive).length || 0,
    };
  }, [team, officeDesks]);

  const teamWithDesks = useMemo(() => {
    if (!team) return [];
    return team.map((member, index) => {
      const desk = officeDesks?.find((d) => d.teamMemberId === member._id);
      return {
        member,
        desk,
        row: Math.floor(index / 3),
        col: index % 3,
      };
    });
  }, [team, officeDesks]);

  if (!team) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Office</h1>
          <p className="text-gray-400 mt-1">
            Visual workspace · {stats.online} online · {stats.active} active
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Team Members</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Online Now</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.online}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Working</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.active}
                </p>
              </div>
              <Monitor className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team grid */}
      {teamWithDesks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamWithDesks.map(({ member, desk, row, col }) => (
            <TeamMemberDesk
              key={member._id}
              member={member}
              desk={desk}
              row={row}
              col={col}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No Team Members Yet
          </h3>
          <p className="text-gray-400">
            Add team members in the Team section to see them here.
          </p>
        </Card>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes bounce-subtle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(45deg);
          }
          to {
            transform: rotate(405deg);
          }
        }
        @keyframes ping-slow {
          75%,
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .clip-hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
      `}</style>
    </div>
  );
}

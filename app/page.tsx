"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  ClipboardList, 
  Video, 
  Calendar, 
  Brain, 
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/utils";

const statsCards = [
  { title: "Active Tasks", icon: ClipboardList, color: "text-blue-400", bg: "bg-blue-400/10" },
  { title: "Content Pipeline", icon: Video, color: "text-purple-400", bg: "bg-purple-400/10" },
  { title: "AI Team", icon: Users, color: "text-green-400", bg: "bg-green-400/10" },
  { title: "Knowledge Base", icon: Brain, color: "text-yellow-400", bg: "bg-yellow-400/10" },
];

export default function DashboardPage() {
  const tasks = useQuery(api.tasks.getAllTasks);
  const content = useQuery(api.content.getAllContent);
  const team = useQuery(api.team.getAllTeamMembers);
  const memories = useQuery(api.memories.getAllMemories);
  const activity = useQuery(api.activity.getRecentActivity, { limit: 10 });

  const todoTasks = tasks?.filter(t => t.status === "todo").length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === "in-progress").length || 0;
  const onlineTeam = team?.filter(t => t.status === "online").length || 0;

  const stats = [
    { value: tasks?.length || 0, subtext: `${todoTasks} todo, ${inProgressTasks} in progress` },
    { value: content?.length || 0, subtext: "in pipeline" },
    { value: team?.length || 0, subtext: `${onlineTeam} online now` },
    { value: memories?.length || 0, subtext: "archived" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome to OpenClaw Mission Control</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Card key={card.title} className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats[index]?.value || 0}</div>
              <p className="text-xs text-gray-400 mt-1">{stats[index]?.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity?.map((item) => (
                <div key={item._id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className="mt-0.5">
                    {item.type.includes("created") && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                    {item.type.includes("deleted") && <AlertCircle className="w-4 h-4 text-red-400" />}
                    {(item.type.includes("changed") || item.type.includes("updated")) && <Clock className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{item.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(item.createdAt)}</p>
                  </div>
                </div>
              ))}
              {!activity?.length && (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-800/50 border-l-4 border-purple-500">
                <p className="text-sm text-gray-200 font-medium">Daily Standup</p>
                <p className="text-xs text-gray-400">9:00 AM • Recurring</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50 border-l-4 border-blue-500">
                <p className="text-sm text-gray-200 font-medium">Content Review</p>
                <p className="text-xs text-gray-400">2:00 PM • Today</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/50 border-l-4 border-green-500">
                <p className="text-sm text-gray-200 font-medium">Weekly Planning</p>
                <p className="text-xs text-gray-400">Friday 10:00 AM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  ClipboardList,
  Inbox,
  Loader2,
  Radio,
  TrendingUp,
  Users,
  Video,
  XCircle,
  Zap,
  DollarSign,
  Briefcase,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatTimeAgo } from "@/lib/utils";
import Link from "next/link";

const TRADING_AGENTS = ["Orion Prime", "Vega", "Atlas", "Mercury"];

const AGENT_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  "Orion Prime": { bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-amber-500/5" },
  Vega: { bg: "bg-cyan-500/10", text: "text-cyan-400", glow: "shadow-cyan-500/5" },
  Atlas: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-emerald-500/5" },
  Mercury: { bg: "bg-violet-500/10", text: "text-violet-400", glow: "shadow-violet-500/5" },
};

const STATUS_DOT: Record<string, string> = {
  online: "bg-green-500",
  busy: "bg-yellow-500",
  away: "bg-orange-500",
  offline: "bg-gray-600",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "done" || status === "agent-reviewed")
    return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />;
  if (status === "failed" || status === "validation-error")
    return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
  if (status === "processing")
    return <Loader2 className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-spin" />;
  if (status === "dispatched")
    return <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
  return <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />;
}

export default function DashboardPage() {
  const tasks = useQuery(api.tasks.getAllTasks);
  const content = useQuery(api.content.getAllContent);
  const team = useQuery(api.team.getAllTeamMembers);
  const activity = useQuery(api.activity.getRecentActivity, { limit: 15 });
  const metrics = useQuery(api.tasks.getTaskMetrics);
  const clientMetrics = useQuery(api.clients.getPipelineMetrics);
  const monthRevenue = useQuery(api.revenue.getCurrentMonthRevenue);
  const goals = useQuery(api.goals.getGoalProgress);

  const tradingAgents = team?.filter((m) =>
    TRADING_AGENTS.some((name) => m.name.toLowerCase() === name.toLowerCase())
  ) ?? [];
  const tradingAgentsOnline = tradingAgents.filter((a) => a.status === "online").length;

  const todoTasks = tasks?.filter((t) => t.status === "todo").length ?? 0;
  const inProgressTasks = tasks?.filter((t) =>
    ["in-progress", "dispatched", "processing"].includes(t.status)
  ).length ?? 0;
  const onlineTeam = team?.filter((t) => t.status === "online").length ?? 0;

  const tradingTasks = tasks?.filter((t) =>
    t.tags?.some((tag: string) =>
      ["trading", "mercury", "atlas", "vega", "orion-prime", "orion prime"].includes(
        tag.toLowerCase()
      )
    ) ||
    TRADING_AGENTS.some((name) => t.claimedBy?.toLowerCase() === name.toLowerCase())
  ) ?? [];

  const activeTradingTasks = tradingTasks.filter((t) =>
    ["processing", "dispatched", "in-progress"].includes(t.status)
  );
  const completedTradingTasks = tradingTasks.filter((t) =>
    ["done", "agent-reviewed"].includes(t.status)
  );

  const contentByStage = {
    idea: content?.filter((c) => c.stage === "idea").length ?? 0,
    script: content?.filter((c) => c.stage === "script").length ?? 0,
    filming: content?.filter((c) => c.stage === "filming" || c.stage === "editing").length ?? 0,
    published: content?.filter((c) => c.stage === "published").length ?? 0,
  };

  const recentTasks = tasks
    ?.slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Command Center
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-in">
        {[
          {
            label: "Active Tasks",
            value: inProgressTasks,
            sub: `${todoTasks} queued`,
            icon: ClipboardList,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            glowClass: "hover:glow-blue",
          },
          {
            label: "Team Online",
            value: onlineTeam,
            sub: `${team?.length ?? 0} total members`,
            icon: Users,
            color: "text-green-400",
            bg: "bg-green-500/10",
            glowClass: "hover:glow-green",
          },
          {
            label: "Content Pipeline",
            value: content?.length ?? 0,
            sub: `${contentByStage.published} published`,
            icon: Video,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            glowClass: "hover:glow-purple",
          },
          {
            label: "Client Pipeline",
            value: clientMetrics?.totalClients ?? 0,
            sub: `$${(clientMetrics?.totalPipeline ?? 0).toLocaleString()} potential`,
            icon: Briefcase,
            color: "text-teal-400",
            bg: "bg-teal-500/10",
            glowClass: "hover:glow-teal",
          },
        ].map((stat) => (
          <Card key={stat.label} className={cn("transition-shadow duration-300", stat.glowClass)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
              <div className="text-[11px] text-gray-600 mt-1">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Snapshot */}
      {(clientMetrics || goals) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stagger-in">
          {/* Pipeline Value */}
          <Card className="glass border border-purple-500/10 hover:border-purple-500/20 transition-all duration-300 hover:shadow-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                </div>
                <Link href="/clients" className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-0.5">
                  Pipeline <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="text-2xl font-bold text-white">
                ${(clientMetrics?.totalPipeline ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Pipeline Value</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-gray-500">{clientMetrics?.totalClients ?? 0} clients</span>
                {(clientMetrics?.followUpNeeded ?? 0) > 0 && (
                  <span className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {clientMetrics?.followUpNeeded} follow-ups
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue This Month */}
          <Card className="glass border border-green-500/10 hover:border-green-500/20 transition-all duration-300 hover:shadow-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="w-4 h-4 text-green-400" />
                </div>
                <Link href="/revenue" className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-0.5">
                  Revenue <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="text-2xl font-bold text-white">
                ${(monthRevenue?.received ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Revenue This Month</div>
              <div className="flex items-center gap-2 mt-2">
                {(monthRevenue?.pending ?? 0) > 0 && (
                  <span className="text-[11px] text-yellow-400">
                    ${(monthRevenue?.pending ?? 0).toLocaleString()} pending
                  </span>
                )}
                <span className="text-[11px] text-gray-600">
                  ${(clientMetrics?.totalWon ?? 0).toLocaleString()} won all-time
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Goal Progress */}
          {goals && goals.length > 0 ? (
            <Card className="glass border border-amber-500/10 hover:border-amber-500/20 transition-all duration-300 hover:shadow-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Target className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-[10px] text-gray-500">{goals[0].daysLeft}d left</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  ${goals[0].currentAmount.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500"> / ${goals[0].targetAmount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{goals[0].title}</div>
                <div className="mt-2 w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500/80 to-amber-400/60 transition-all duration-700"
                    style={{ width: `${goals[0].progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[11px] text-gray-600">{goals[0].progressPct}%</span>
                  <span className="text-[11px] text-amber-400">${(goals[0].targetAmount - goals[0].currentAmount).toLocaleString()} to go</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass border border-amber-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Target className="w-4 h-4 text-amber-400" />
                  </div>
                  <Link href="/revenue" className="text-[10px] text-gray-600 hover:text-gray-400 flex items-center gap-0.5">
                    Set goal <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="text-sm text-gray-400">No active goal set</div>
                <p className="text-[11px] text-gray-600 mt-1">Set a monthly revenue target on the Revenue page</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Task Pipeline Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 stagger-in">
          {[
            { label: "Done 24h", value: metrics.completedLast24h, icon: CheckCircle2, color: "text-green-400" },
            { label: "Failed 24h", value: metrics.failedLast24h, icon: XCircle, color: metrics.failedLast24h > 0 ? "text-red-400" : "text-gray-600" },
            {
              label: "Avg Time",
              value: metrics.avgProcessingMs > 0
                ? metrics.avgProcessingMs < 60000
                  ? `${Math.round(metrics.avgProcessingMs / 1000)}s`
                  : `${Math.round(metrics.avgProcessingMs / 60000)}m`
                : "—",
              icon: Clock,
              color: "text-blue-400",
            },
            { label: "Queue", value: metrics.queueDepth, icon: Inbox, color: "text-yellow-400" },
            { label: "Stale", value: metrics.staleCount, icon: AlertTriangle, color: metrics.staleCount > 0 ? "text-orange-400" : "text-gray-600" },
            { label: "Total", value: metrics.total, icon: Zap, color: "text-purple-400" },
          ].map((m) => (
            <div
              key={m.label}
              className="glass-subtle rounded-xl px-3 py-3 card-hover"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={cn("w-3.5 h-3.5", m.color)} />
                <span className="text-[11px] text-gray-500">{m.label}</span>
              </div>
              <div className={cn("text-xl font-bold", m.color)}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Trading Team Status + Recent Tasks — left 2/3 */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  Trading Team
                  <Badge variant="outline" className="text-[10px] border-white/[0.08] text-gray-500 ml-1">
                    {tradingAgentsOnline}/{tradingAgents.length} online
                  </Badge>
                </CardTitle>
                <Link
                  href="/trading-team"
                  className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {tradingAgents.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tradingAgents.map((agent) => {
                    const colors = AGENT_COLORS[agent.name] || AGENT_COLORS["Mercury"];
                    const agentTasks = tradingTasks.filter(
                      (t) =>
                        t.claimedBy?.toLowerCase() === agent.name.toLowerCase() ||
                        t.tags?.some(
                          (tag: string) => tag.toLowerCase() === agent.name.toLowerCase() ||
                            tag.toLowerCase() === agent.name.toLowerCase().replace(" ", "-")
                        )
                    );
                    const completed = agentTasks.filter((t) =>
                      ["done", "agent-reviewed"].includes(t.status)
                    ).length;
                    const active = agentTasks.filter((t) =>
                      ["processing", "dispatched"].includes(t.status)
                    ).length;

                    return (
                      <div
                        key={agent._id}
                        className={cn(
                          "p-3 rounded-xl glass-subtle hover:bg-white/[0.04] transition-all duration-200",
                          "shadow-sm", colors.glow
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg)}>
                            {agent.avatar && !agent.avatar.startsWith("http") ? (
                              <span className="text-lg">{agent.avatar}</span>
                            ) : (
                              <Bot className={cn("w-4 h-4", colors.text)} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-gray-200 truncate">
                                {agent.name}
                              </p>
                              <div className="relative">
                                <div
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    STATUS_DOT[agent.status]
                                  )}
                                />
                                {agent.status === "online" && (
                                  <div className={cn(
                                    "absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping opacity-40",
                                    STATUS_DOT[agent.status]
                                  )} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
                          {agent.role}
                        </p>
                        <div className="flex gap-2 text-[11px]">
                          <span className="text-green-400">{completed} done</span>
                          <span className="text-gray-700">|</span>
                          <span className={active > 0 ? "text-blue-400" : "text-gray-600"}>
                            {active} active
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-gray-700 mx-auto mb-3 empty-state-icon" />
                  <p className="text-sm text-gray-500">No trading agents registered</p>
                  <p className="text-xs text-gray-700 mt-1">Add agents via the Team page</p>
                </div>
              )}

              {activeTradingTasks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/[0.04]">
                  <p className="text-[11px] text-gray-500 uppercase tracking-[0.12em] font-medium mb-2">
                    Active Trading Tasks
                  </p>
                  <div className="space-y-1.5">
                    {activeTradingTasks.slice(0, 3).map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center gap-2 p-2 rounded-lg glass-subtle"
                      >
                        <StatusIcon status={task.status} />
                        <span className="text-sm text-gray-300 truncate flex-1">
                          {task.title}
                        </span>
                        <span className="text-[11px] text-gray-500 shrink-0">
                          {task.claimedBy || task.tags?.find((t: string) =>
                            ["mercury", "atlas", "vega", "orion-prime"].includes(t.toLowerCase())
                          ) || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Throughput */}
          {metrics && Object.keys(metrics.byAgent).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Agent Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(metrics.byAgent)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .map(([agent, data]) => {
                      const successRate = data.total > 0
                        ? Math.round((data.succeeded / data.total) * 100)
                        : 0;
                      return (
                        <div key={agent} className="p-3 rounded-xl glass-subtle">
                          <div className="text-sm font-medium text-gray-200 capitalize">
                            {agent}
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-lg font-bold text-white">{data.total}</span>
                            <span className="text-[11px] text-gray-500">tasks</span>
                          </div>
                          <div className="mt-2 w-full h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-green-500/80 to-green-400/60 transition-all duration-500"
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <div className="flex gap-3 mt-1.5 text-[11px]">
                            <span className="text-green-400">{data.succeeded} ok</span>
                            {data.failed > 0 && (
                              <span className="text-red-400">{data.failed} fail</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  Recent Tasks
                </CardTitle>
                <Link
                  href="/tasks"
                  className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  View board <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                {recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    <StatusIcon status={task.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full",
                            task.status === "done" || task.status === "agent-reviewed"
                              ? "bg-green-500/10 text-green-400"
                              : task.status === "processing"
                                ? "bg-blue-500/10 text-blue-400"
                                : task.status === "dispatched"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : task.status === "failed" || task.status === "validation-error"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-white/[0.04] text-gray-500"
                          )}
                        >
                          {task.status}
                        </span>
                        {task.claimedBy && (
                          <span className="text-[10px] text-gray-600">
                            {task.claimedBy}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          task.priority === "high"
                            ? "border-red-500/20 text-red-400"
                            : task.priority === "medium"
                              ? "border-yellow-500/20 text-yellow-400"
                              : "border-white/[0.06] text-gray-600"
                        )}
                      >
                        {task.priority}
                      </Badge>
                      <p className="text-[10px] text-gray-600 mt-1">
                        {formatTimeAgo(task.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentTasks.length === 0 && (
                  <div className="text-center py-8">
                    <Inbox className="w-10 h-10 text-gray-700 mx-auto mb-3 empty-state-icon" />
                    <p className="text-sm text-gray-500">No tasks yet</p>
                    <p className="text-xs text-gray-700 mt-1">Tasks will appear here as they&apos;re created</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 stagger-in">
            <div className="glass rounded-xl p-4 text-center glow-green">
              <div className="text-2xl font-bold text-green-400">
                {completedTradingTasks.length}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Trading Done</div>
            </div>
            <div className="glass rounded-xl p-4 text-center glow-blue">
              <div className="text-2xl font-bold text-blue-400">
                {activeTradingTasks.length}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Trading Active</div>
            </div>
          </div>

          {/* Content Pipeline Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  Content Pipeline
                </CardTitle>
                <Link
                  href="/content"
                  className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Ideas", count: contentByStage.idea, color: "bg-blue-500", track: "bg-blue-500/20" },
                  { label: "Scripts", count: contentByStage.script, color: "bg-purple-500", track: "bg-purple-500/20" },
                  { label: "Production", count: contentByStage.filming, color: "bg-yellow-500", track: "bg-yellow-500/20" },
                  { label: "Published", count: contentByStage.published, color: "bg-green-500", track: "bg-green-500/20" },
                ].map((stage) => {
                  const total = (content?.length ?? 0) || 1;
                  const pct = Math.round((stage.count / total) * 100);
                  return (
                    <div key={stage.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">{stage.label}</span>
                        <span className="text-sm font-medium text-gray-300">{stage.count}</span>
                      </div>
                      <div className={cn("w-full h-1 rounded-full", stage.track, "overflow-hidden")}>
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", stage.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {activity?.slice(0, 10).map((item) => (
                  <div
                    key={item._id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <div className="mt-0.5">
                      {item.type.includes("created") || item.type.includes("completed") ? (
                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        </div>
                      ) : item.type.includes("deleted") || item.type.includes("failed") ? (
                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                          <XCircle className="w-3 h-3 text-red-400" />
                        </div>
                      ) : item.type.includes("claimed") ? (
                        <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <Bot className="w-3 h-3 text-purple-400" />
                        </div>
                      ) : item.type.includes("dispatched") ? (
                        <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                          <Zap className="w-3 h-3 text-yellow-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/[0.04] flex items-center justify-center">
                          <Clock className="w-3 h-3 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 leading-relaxed">{item.message}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {formatTimeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {!activity?.length && (
                  <div className="text-center py-6">
                    <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2 empty-state-icon" />
                    <p className="text-sm text-gray-500">No activity yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

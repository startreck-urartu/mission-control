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
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatTimeAgo } from "@/lib/utils";
import {
  accentPill,
  accentBg,
  accentText,
  taskStatusAccent,
  priorityAccent,
  teamStatusAccent,
  type AccentName,
} from "@/lib/status-colors";
import Link from "next/link";

const TRADING_AGENTS = ["Orion Prime", "Vega", "Atlas", "Mercury"];

/** Maps trading agent name → accent for icon chip and text */
const AGENT_ACCENT: Record<string, AccentName> = {
  "Orion Prime": "orange",
  Vega: "teal",
  Atlas: "green",
  Mercury: "purple",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "done" || status === "agent-reviewed")
    return <CheckCircle2 className="w-3.5 h-3.5 text-accent-green shrink-0" />;
  if (status === "failed" || status === "validation-error")
    return <XCircle className="w-3.5 h-3.5 text-accent-red shrink-0" />;
  if (status === "processing")
    return <Loader2 className="w-3.5 h-3.5 text-accent-teal shrink-0 animate-spin" />;
  if (status === "dispatched")
    return <Clock className="w-3.5 h-3.5 text-accent-indigo shrink-0" />;
  return <Clock className="w-3.5 h-3.5 text-tertiary shrink-0" />;
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

  const tasksLoading = tasks === undefined;
  const contentLoading = content === undefined;
  const teamLoading = team === undefined;
  const activityLoading = activity === undefined;
  const metricsLoading = metrics === undefined;
  const financialLoading =
    clientMetrics === undefined || monthRevenue === undefined || goals === undefined;
  const statsLoading =
    tasksLoading || contentLoading || teamLoading || clientMetrics === undefined;

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
      <PageHeader
        title="Command Center"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      />

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-in">
        {statsLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="w-8 h-8 rounded-lg mb-3" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-20 mt-1.5" />
                <Skeleton className="h-2.5 w-24 mt-1.5" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Active Tasks"
              value={inProgressTasks}
              icon={ClipboardList}
              accent="blue"
              sub={`${todoTasks} queued`}
            />
            <StatCard
              label="Team Online"
              value={onlineTeam}
              icon={Users}
              accent="green"
              sub={`${team?.length ?? 0} total members`}
            />
            <StatCard
              label="Content Pipeline"
              value={content?.length ?? 0}
              icon={Video}
              accent="purple"
              sub={`${contentByStage.published} published`}
            />
            <StatCard
              label="Client Pipeline"
              value={clientMetrics?.totalClients ?? 0}
              icon={Briefcase}
              accent="teal"
              sub={`$${(clientMetrics?.totalPipeline ?? 0).toLocaleString()} potential`}
            />
          </>
        )}
      </div>

      {/* Financial Snapshot */}
      {financialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stagger-in">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="w-8 h-8 rounded-lg mb-3" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-28 mt-1.5" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (clientMetrics || goals) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stagger-in">
          {/* Pipeline Value */}
          <Card className="border border-accent-purple/10 hover:border-accent-purple/20 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", accentPill["purple"])}>
                  <Briefcase className="w-4 h-4" />
                </div>
                <Link href="/clients" className="text-[10px] text-tertiary hover:text-muted flex items-center gap-0.5">
                  Pipeline <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                ${(clientMetrics?.totalPipeline ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted mt-0.5">Pipeline Value</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-muted">{clientMetrics?.totalClients ?? 0} clients</span>
                {(clientMetrics?.followUpNeeded ?? 0) > 0 && (
                  <span className="text-[11px] text-accent-red flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {clientMetrics?.followUpNeeded} follow-ups
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue This Month */}
          <Card className="border border-accent-green/10 hover:border-accent-green/20 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", accentPill["green"])}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <Link href="/revenue" className="text-[10px] text-tertiary hover:text-muted flex items-center gap-0.5">
                  Revenue <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                ${(monthRevenue?.received ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted mt-0.5">Revenue This Month</div>
              <div className="flex items-center gap-2 mt-2">
                {(monthRevenue?.pending ?? 0) > 0 && (
                  <span className="text-[11px] text-accent-yellow">
                    ${(monthRevenue?.pending ?? 0).toLocaleString()} pending
                  </span>
                )}
                <span className="text-[11px] text-tertiary">
                  ${(clientMetrics?.totalWon ?? 0).toLocaleString()} won all-time
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Goal Progress */}
          {goals && goals.length > 0 ? (
            <Card className="border border-accent-orange/10 hover:border-accent-orange/20 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-lg", accentPill["orange"])}>
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-muted">{goals[0].daysLeft}d left</span>
                </div>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  ${goals[0].currentAmount.toLocaleString()}
                  <span className="text-sm font-normal text-muted"> / ${goals[0].targetAmount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted mt-0.5">{goals[0].title}</div>
                <div className="mt-2 w-full h-1.5 rounded-full bg-fill overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-orange transition-all duration-300"
                    style={{ width: `${goals[0].progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[11px] text-tertiary">{goals[0].progressPct}%</span>
                  <span className="text-[11px] text-accent-orange">${(goals[0].targetAmount - goals[0].currentAmount).toLocaleString()} to go</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-accent-orange/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-lg", accentPill["orange"])}>
                    <Target className="w-4 h-4" />
                  </div>
                  <Link href="/revenue" className="text-[10px] text-tertiary hover:text-muted flex items-center gap-0.5">
                    Set goal <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="text-sm text-muted">No active goal set</div>
                <p className="text-[11px] text-tertiary mt-1">Set a monthly revenue target on the Revenue page</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Task Pipeline Metrics */}
      {metricsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 stagger-in">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-pane rounded-2xl px-3 py-3">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </div>
      ) : metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 stagger-in">
          {[
            { label: "Done 24h", value: metrics.completedLast24h, icon: CheckCircle2, accent: "green" as AccentName },
            { label: "Failed 24h", value: metrics.failedLast24h, icon: XCircle, accent: (metrics.failedLast24h > 0 ? "red" : "gray") as AccentName },
            {
              label: "Avg Time",
              value: metrics.avgProcessingMs > 0
                ? metrics.avgProcessingMs < 60000
                  ? `${Math.round(metrics.avgProcessingMs / 1000)}s`
                  : `${Math.round(metrics.avgProcessingMs / 60000)}m`
                : "—",
              icon: Clock,
              accent: "blue" as AccentName,
            },
            { label: "Queue", value: metrics.queueDepth, icon: Inbox, accent: "yellow" as AccentName },
            { label: "Stale", value: metrics.staleCount, icon: AlertTriangle, accent: (metrics.staleCount > 0 ? "orange" : "gray") as AccentName },
            { label: "Total", value: metrics.total, icon: Zap, accent: "purple" as AccentName },
          ].map((m) => (
            <div
              key={m.label}
              className="glass-pane rounded-2xl px-3 py-3"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={cn("w-3.5 h-3.5", accentText[m.accent])} />
                <span className="text-[11px] text-muted">{m.label}</span>
              </div>
              <div className={cn("text-xl font-bold", accentText[m.accent])}>{m.value}</div>
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
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Radio className="w-4 h-4 text-accent-orange" />
                  Trading Team
                  <Badge variant="outline" className="text-[10px] border-separator text-muted ml-1">
                    {tradingAgentsOnline}/{tradingAgents.length} online
                  </Badge>
                </CardTitle>
                <Link
                  href="/trading-team"
                  className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {teamLoading || tasksLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 rounded-xl glass-pane">
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : tradingAgents.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tradingAgents.map((agent) => {
                    const accent: AccentName = AGENT_ACCENT[agent.name] ?? "purple";
                    const statusAccent: AccentName = teamStatusAccent[agent.status] ?? "gray";
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
                        className="p-3 rounded-xl glass-pane hover:bg-fill transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accentPill[accent])}>
                            {agent.avatar && !agent.avatar.startsWith("http") ? (
                              <span className="text-lg">{agent.avatar}</span>
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">
                                {agent.name}
                              </p>
                              <div className="relative">
                                <div
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    accentBg[statusAccent]
                                  )}
                                />
                                {agent.status === "online" && (
                                  <div className={cn(
                                    "absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping opacity-40",
                                    accentBg[statusAccent]
                                  )} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted line-clamp-1 mb-2">
                          {agent.role}
                        </p>
                        <div className="flex gap-2 text-[11px]">
                          <span className="text-accent-green">{completed} done</span>
                          <span className="text-separator">|</span>
                          <span className={active > 0 ? "text-accent-blue" : "text-tertiary"}>
                            {active} active
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Bot}
                  message="No trading agents registered"
                  hint="Add agents via the Team page"
                />
              )}

              {activeTradingTasks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-separator">
                  <p className="text-[11px] text-muted uppercase tracking-[0.12em] font-medium mb-2">
                    Active Trading Tasks
                  </p>
                  <div className="space-y-1.5">
                    {activeTradingTasks.slice(0, 3).map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center gap-2 p-2 rounded-lg glass-pane"
                      >
                        <StatusIcon status={task.status} />
                        <span className="text-sm text-foreground truncate flex-1">
                          {task.title}
                        </span>
                        <span className="text-[11px] text-muted shrink-0">
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
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-green" />
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
                        <div key={agent} className="p-3 rounded-xl glass-pane">
                          <div className="text-sm font-medium text-foreground capitalize">
                            {agent}
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-lg font-bold text-foreground">{data.total}</span>
                            <span className="text-[11px] text-muted">tasks</span>
                          </div>
                          <div className="mt-2 w-full h-1 rounded-full bg-fill overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent-green transition-all duration-300"
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <div className="flex gap-3 mt-1.5 text-[11px]">
                            <span className="text-accent-green">{data.succeeded} ok</span>
                            {data.failed > 0 && (
                              <span className="text-accent-red">{data.failed} fail</span>
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
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-accent-blue" />
                  Recent Tasks
                </CardTitle>
                <Link
                  href="/tasks"
                  className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View board <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                {tasksLoading && (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg">
                      <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-24 mt-1.5" />
                      </div>
                      <Skeleton className="h-4 w-12 shrink-0" />
                    </div>
                  ))
                )}
                {recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-fill transition-colors duration-150"
                  >
                    <StatusIcon status={task.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full",
                          accentPill[taskStatusAccent[task.status] ?? "gray"]
                        )}>
                          {task.status}
                        </span>
                        {task.claimedBy && (
                          <span className="text-[10px] text-tertiary">
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
                          accentPill[priorityAccent[task.priority ?? "low"] ?? "gray"]
                        )}
                      >
                        {task.priority}
                      </Badge>
                      <p className="text-[10px] text-tertiary mt-1">
                        {formatTimeAgo(task.updatedAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {!tasksLoading && recentTasks.length === 0 && (
                  <EmptyState
                    icon={Inbox}
                    message="No tasks yet"
                    hint="Tasks will appear here as they're created"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 stagger-in">
            <div className="glass-pane rounded-2xl p-4 text-center">
              {tasksLoading ? (
                <Skeleton className="h-8 w-10 mx-auto" />
              ) : (
                <div className="text-2xl font-bold text-accent-green">
                  {completedTradingTasks.length}
                </div>
              )}
              <div className="text-[11px] text-muted mt-0.5">Trading Done</div>
            </div>
            <div className="glass-pane rounded-2xl p-4 text-center">
              {tasksLoading ? (
                <Skeleton className="h-8 w-10 mx-auto" />
              ) : (
                <div className="text-2xl font-bold text-accent-blue">
                  {activeTradingTasks.length}
                </div>
              )}
              <div className="text-[11px] text-muted mt-0.5">Trading Active</div>
            </div>
          </div>

          {/* Content Pipeline Summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Video className="w-4 h-4 text-accent-purple" />
                  Content Pipeline
                </CardTitle>
                <Link
                  href="/content"
                  className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-6" />
                      </div>
                      <Skeleton className="w-full h-1 rounded-full" />
                    </div>
                  ))
                ) : (
                [
                  { label: "Ideas", count: contentByStage.idea, accent: "blue" as AccentName },
                  { label: "Scripts", count: contentByStage.script, accent: "purple" as AccentName },
                  { label: "Production", count: contentByStage.filming, accent: "orange" as AccentName },
                  { label: "Published", count: contentByStage.published, accent: "green" as AccentName },
                ].map((stage) => {
                  const total = (content?.length ?? 0) || 1;
                  const pct = Math.round((stage.count / total) * 100);
                  return (
                    <div key={stage.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted">{stage.label}</span>
                        <span className={cn("text-sm font-medium", accentText[stage.accent])}>{stage.count}</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-fill overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", accentBg[stage.accent])}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-blue" />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-separator space-y-0">
                {activityLoading && (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2">
                      <Skeleton className="w-5 h-5 rounded-full shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-3 w-5/6" />
                        <Skeleton className="h-2.5 w-16 mt-1.5" />
                      </div>
                    </div>
                  ))
                )}
                {activity?.slice(0, 10).map((item) => (
                  <div
                    key={item._id}
                    className="flex items-start gap-2.5 p-2 hover:bg-fill transition-colors duration-150"
                  >
                    <div className="mt-0.5">
                      {item.type.includes("created") || item.type.includes("completed") ? (
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", accentPill["green"])}>
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      ) : item.type.includes("deleted") || item.type.includes("failed") ? (
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", accentPill["red"])}>
                          <XCircle className="w-3 h-3" />
                        </div>
                      ) : item.type.includes("claimed") ? (
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", accentPill["purple"])}>
                          <Bot className="w-3 h-3" />
                        </div>
                      ) : item.type.includes("dispatched") ? (
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", accentPill["yellow"])}>
                          <Zap className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-fill flex items-center justify-center">
                          <Clock className="w-3 h-3 text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{item.message}</p>
                      <p className="text-[10px] text-tertiary mt-0.5">
                        {formatTimeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {!activityLoading && !activity?.length && (
                  <EmptyState
                    icon={Activity}
                    message="No activity yet"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

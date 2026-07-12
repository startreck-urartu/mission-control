"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Shield,
  Signal,
  Target,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatTimeAgo } from "@/lib/utils";
import { FormattedResult } from "@/components/ui/formatted-result";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Doc } from "@/convex/_generated/dataModel";
import {
  accentBg,
  accentPill,
  accentText,
  teamStatusAccent,
  taskStatusAccent,
  priorityAccent,
  type AccentName,
  tradingAgentAccent,
} from "@/lib/status-colors";

type TeamMember = Doc<"team">;
type Task = Doc<"tasks">;

const TRADING_AGENT_NAMES = ["Orion Prime", "Vega", "Atlas", "Mercury"];

// Per-agent identity accents (AccentName values only — no raw classes)

const AGENT_CONFIG: Record<
  string,
  { icon: typeof Target; tag: string }
> = {
  "Orion Prime": { icon: Target, tag: "orion-prime" },
  Vega: { icon: Activity, tag: "vega" },
  Atlas: { icon: Shield, tag: "atlas" },
  Mercury: { icon: Zap, tag: "mercury" },
};

// Heartbeat health — returns AccentName instead of raw color strings
function getHeartbeatHealth(lastActive: string | undefined | null): {
  label: string;
  accent: AccentName;
  icon: typeof Wifi;
} {
  if (!lastActive)
    return { label: "Unknown", accent: "gray", icon: WifiOff };
  const diff = Date.now() - new Date(lastActive).getTime();
  if (isNaN(diff))
    return { label: "Unknown", accent: "gray", icon: WifiOff };
  const minutes = diff / 60000;
  if (minutes < 10) return { label: "Healthy", accent: "green", icon: Wifi };
  if (minutes < 30) return { label: "Stale", accent: "yellow", icon: Signal };
  return { label: "Offline", accent: "red", icon: WifiOff };
}

function AgentCard({
  agent,
  tasks,
  agentResult,
  onDispatch,
  onViewResult,
}: {
  agent: TeamMember;
  tasks: Task[];
  agentResult: {
    title: string;
    status: string;
    result: string | null;
    completedAt: string | null;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
  } | null;
  onDispatch: (agentName: string) => void;
  onViewResult: (agentName: string, result: string, title: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = AGENT_CONFIG[agent.name] ?? AGENT_CONFIG["Mercury"];
  const accent = tradingAgentAccent[agent.name] ?? "gray";
  const Icon = config.icon;
  const heartbeat = getHeartbeatHealth(agent.lastActive);
  const HeartbeatIcon = heartbeat.icon;

  const agentTasks = tasks.filter(
    (t) =>
      t.claimedBy?.toLowerCase() === agent.name.toLowerCase() ||
      t.tags?.some(
        (tag) =>
          tag.toLowerCase() === agent.name.toLowerCase() ||
          tag.toLowerCase() === config.tag
      )
  );

  const activeTasks = agentTasks.filter(
    (t) =>
      t.status === "processing" ||
      t.status === "dispatched" ||
      t.status === "in-progress"
  );

  const recentTasks = agentTasks
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, expanded ? 6 : 3);

  const resultPreview = agentResult?.result
    ? agentResult.result.length > 120
      ? agentResult.result.slice(0, 120) + "..."
      : agentResult.result
    : null;

  const failedCount = agentResult?.failedTasks ?? 0;
  const failedAccent: AccentName = failedCount > 0 ? "red" : "gray";

  return (
    <Card className="glass-pane overflow-hidden">
      {/* Agent header strip */}
      <div className={cn("p-5 border-b border-separator", accentPill[accent])}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-glass border border-separator">
              {agent.avatar && !agent.avatar.startsWith("http") ? (
                <span className="text-2xl">{agent.avatar}</span>
              ) : (
                <Icon className={cn("w-6 h-6", accentText[accent])} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
              <p className="text-sm text-muted">{agent.role}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {/* Online/busy/away/offline dot */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full border-2 border-background",
                  accentBg[teamStatusAccent[agent.status] ?? "gray"],
                  agent.status === "online" && "animate-pulse"
                )}
              />
              <span className="text-xs text-muted capitalize">
                {agent.status}
              </span>
            </div>
            {/* Heartbeat indicator */}
            <div className="flex items-center gap-1.5">
              <HeartbeatIcon className={cn("w-3 h-3", accentText[heartbeat.accent])} />
              <span className={cn("text-[10px]", accentText[heartbeat.accent])}>
                {heartbeat.label}
              </span>
              <span className="text-[10px] text-tertiary">
                {formatTimeAgo(agent.lastActive)}
              </span>
            </div>
          </div>
        </div>

        {agent.description && (
          <p className="text-sm text-muted mt-3 line-clamp-2">
            {agent.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {agent.skills?.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs px-2 py-0.5 rounded-full bg-glass border border-separator text-muted"
            >
              {skill}
            </span>
          ))}
          {(agent.skills?.length ?? 0) > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-fill text-tertiary">
              +{agent.skills!.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-fill">
            <div className="text-lg font-bold tabular-nums text-accent-green">
              {agentResult?.completedTasks ?? 0}
            </div>
            <div className="text-xs text-muted">Done</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-fill">
            <div className="text-lg font-bold tabular-nums text-accent-blue">
              {activeTasks.length}
            </div>
            <div className="text-xs text-muted">Active</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-fill">
            <div className={cn("text-lg font-bold tabular-nums", accentText[failedAccent])}>
              {failedCount}
            </div>
            <div className="text-xs text-muted">Failed</div>
          </div>
        </div>

        {/* Last result preview */}
        {resultPreview && (
          <div
            className="p-3 rounded-lg bg-fill border border-separator cursor-pointer hover:bg-glass transition-colors"
            onClick={() =>
              agentResult?.result &&
              onViewResult(agent.name, agentResult.result, agentResult.title)
            }
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-accent-blue" />
                <span className="text-[11px] text-muted font-medium uppercase tracking-wider">
                  Last Result
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {agentResult?.completedAt && (
                  <span className="text-[10px] text-tertiary">
                    {formatTimeAgo(agentResult.completedAt)}
                  </span>
                )}
                <Eye className="w-3 h-3 text-muted" />
              </div>
            </div>
            <p className="text-xs text-muted font-medium mb-1 truncate">
              {agentResult?.title}
            </p>
            <p className="text-xs text-tertiary leading-relaxed line-clamp-2">
              {resultPreview}
            </p>
          </div>
        )}

        {/* Recent tasks */}
        {recentTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Recent Tasks
            </h4>
            <div className="space-y-1.5">
              {recentTasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onViewResult={
                    task.lastAgentResult
                      ? () =>
                          onViewResult(
                            agent.name,
                            task.lastAgentResult!,
                            task.title
                          )
                      : undefined
                  }
                />
              ))}
            </div>
            {agentTasks.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 mt-2 text-xs text-muted hover:text-foreground transition-colors mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 rounded"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Show {agentTasks.length - 3} more <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {recentTasks.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-tertiary">No tasks yet</p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onDispatch(agent.name)}
        >
          <Send className="w-3.5 h-3.5 mr-2" />
          Dispatch Task
        </Button>
      </div>
    </Card>
  );
}

function TaskRow({
  task,
  onViewResult,
}: {
  task: Task;
  onViewResult?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2 rounded-lg bg-fill hover:bg-glass transition-colors group",
        onViewResult && "cursor-pointer"
      )}
      onClick={onViewResult}
    >
      {task.status === "done" || task.status === "agent-reviewed" ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-accent-green mt-0.5 shrink-0" />
      ) : task.status === "failed" || task.status === "validation-error" ? (
        <XCircle className="w-3.5 h-3.5 text-accent-red mt-0.5 shrink-0" />
      ) : task.status === "processing" ? (
        <Loader2 className="w-3.5 h-3.5 text-accent-blue mt-0.5 shrink-0 animate-spin" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-muted mt-0.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted">{formatTimeAgo(task.updatedAt)}</p>
          {task.lastAgentResult && (
            <span className="text-[10px] text-accent-blue opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity flex items-center gap-0.5">
              <Eye className="w-2.5 h-2.5" /> view result
            </span>
          )}
        </div>
      </div>
      <Badge color={priorityAccent[task.priority ?? "low"] ?? "gray"} className="text-[10px] shrink-0">
        {task.priority}
      </Badge>
    </div>
  );
}

export default function TradingTeamPage() {
  const team = useQuery(api.team.getAllTeamMembers);
  const tasks = useQuery(api.tasks.getAllTasks);
  const agentResults = useQuery(api.tasks.getLatestAgentResults, {
    agentNames: TRADING_AGENT_NAMES,
  });
  const createTask = useMutation(api.tasks.createTask);
  const isLoading = team === undefined || tasks === undefined;

  const [dispatchAgent, setDispatchAgent] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [dispatching, setDispatching] = useState(false);
  const [viewingResult, setViewingResult] = useState<{
    agent: string;
    result: string;
    title: string;
  } | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const tradingAgents = useMemo(
    () =>
      (team ?? []).filter((m) =>
        TRADING_AGENT_NAMES.some(
          (name) => m.name.toLowerCase() === name.toLowerCase()
        )
      ),
    [team]
  );

  const tradingTasks = useMemo(
    () =>
      (tasks ?? []).filter(
        (t) =>
          t.tags?.some((tag: string) =>
            [
              "trading",
              "mercury",
              "atlas",
              "vega",
              "orion-prime",
              "orion prime",
            ].includes(tag.toLowerCase())
          ) ||
          TRADING_AGENT_NAMES.some(
            (name) => t.claimedBy?.toLowerCase() === name.toLowerCase()
          )
      ),
    [tasks]
  );

  const stats = useMemo(() => {
    const completed = tradingTasks.filter(
      (t) => t.status === "done" || t.status === "agent-reviewed"
    ).length;
    const active = tradingTasks.filter(
      (t) =>
        t.status === "processing" ||
        t.status === "dispatched" ||
        t.status === "in-progress"
    ).length;
    const failed = tradingTasks.filter(
      (t) => t.status === "failed" || t.status === "validation-error"
    ).length;
    const onlineAgents = tradingAgents.filter(
      (a) => a.status === "online"
    ).length;
    return { completed, active, failed, onlineAgents, total: tradingTasks.length };
  }, [tradingTasks, tradingAgents]);

  const handleDispatch = async () => {
    if (!taskTitle.trim() || !dispatchAgent) return;
    setDispatching(true);
    try {
      const agentTag =
        AGENT_CONFIG[dispatchAgent]?.tag || dispatchAgent.toLowerCase();
      await createTask({
        title: taskTitle,
        description: taskDescription || undefined,
        status: "dispatched",
        priority: taskPriority,
        assignee: "openclaw",
        tags: [agentTag, "trading"],
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setDispatchAgent(null);
    } finally {
      setDispatching(false);
    }
  };

  const handleViewResult = (agent: string, result: string, title: string) => {
    setViewingResult({ agent, result, title });
  };

  const failedAccentStat: AccentName = stats.failed > 0 ? "red" : "gray";

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Trading Team"
        subtitle="S4 DELTA strategy agents on n8n"
      >
        {isLoading ? (
          <Skeleton className="h-8 w-24 rounded-full" />
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass border border-separator text-sm">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                stats.onlineAgents > 0
                  ? "bg-accent-green animate-pulse"
                  : "bg-fill"
              )}
            />
            <span className="text-muted">
              {stats.onlineAgents}/{tradingAgents.length} Online
            </span>
          </div>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-6 w-8 ml-auto" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6 stagger-in">
          <StatCard label="Agents" value={tradingAgents.length} icon={Bot} accent="blue" />
          <StatCard label="Active" value={stats.active} icon={RefreshCw} accent="yellow" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="green" />
          <StatCard label="Failed" value={stats.failed} icon={AlertTriangle} accent={failedAccentStat} />
          <StatCard label="Total Tasks" value={stats.total} icon={Activity} accent="purple" />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="glass-pane overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-14 rounded-lg" />
                    ))}
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
              {tradingAgents.length > 0 ? (
                tradingAgents.map((agent) => (
                  <AgentCard
                    key={agent._id}
                    agent={agent}
                    tasks={tasks ?? []}
                    agentResult={agentResults?.[agent.name] ?? null}
                    onDispatch={setDispatchAgent}
                    onViewResult={handleViewResult}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    icon={Bot}
                    message="No trading agents found"
                    hint="Add Orion Prime, Vega, Atlas, and Mercury to your team"
                  />
                </div>
              )}
            </div>

            {/* All Trading Tasks table with inline result preview */}
            {tradingTasks.length > 0 && (
              <div className="mt-2 mb-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent-blue" />
                      All Trading Tasks
                      <Badge color="gray">
                        {tradingTasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0.5">
                      {tradingTasks
                        .sort(
                          (a, b) =>
                            new Date(b.updatedAt).getTime() -
                            new Date(a.updatedAt).getTime()
                        )
                        .slice(0, 12)
                        .map((task) => {
                          const statusAccent: AccentName =
                            taskStatusAccent[task.status] ?? "gray";
                          return (
                            <div key={task._id}>
                              <div
                                className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-lg hover:bg-fill transition-colors",
                                  task.lastAgentResult && "cursor-pointer",
                                  expandedTask === task._id && "bg-fill"
                                )}
                                onClick={() => {
                                  if (task.lastAgentResult) {
                                    setExpandedTask(
                                      expandedTask === task._id ? null : task._id
                                    );
                                  }
                                }}
                              >
                                {task.status === "done" || task.status === "agent-reviewed" ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-green shrink-0" />
                                ) : task.status === "failed" || task.status === "validation-error" ? (
                                  <XCircle className="w-3.5 h-3.5 text-accent-red shrink-0" />
                                ) : task.status === "processing" ? (
                                  <Loader2 className="w-3.5 h-3.5 text-accent-blue shrink-0 animate-spin" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-foreground truncate">{task.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted">
                                      {task.claimedBy || task.tags?.find((t: string) =>
                                        ["mercury", "atlas", "vega", "orion-prime"].includes(t.toLowerCase())
                                      ) || "—"}
                                    </span>
                                    <span className="text-[10px] text-tertiary">
                                      {formatTimeAgo(task.updatedAt)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge color={priorityAccent[task.priority ?? "low"] ?? "gray"} className="text-[10px]">
                                    {task.priority}
                                  </Badge>
                                  <span
                                    className={cn(
                                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                                      accentPill[statusAccent]
                                    )}
                                  >
                                    {task.status}
                                  </span>
                                  {task.lastAgentResult && (
                                    <ChevronDown
                                      className={cn(
                                        "w-3.5 h-3.5 text-muted transition-transform duration-200",
                                        expandedTask === task._id && "rotate-180"
                                      )}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Inline result expansion */}
                              {expandedTask === task._id && task.lastAgentResult && (
                                <div className="mx-2 mb-2 p-3 rounded-lg bg-fill border border-separator animate-fade-in-up">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <FileText className="w-3 h-3 text-accent-blue" />
                                    <span className="text-[11px] text-muted font-medium uppercase tracking-wider">
                                      Agent Result
                                    </span>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    <FormattedResult content={task.lastAgentResult} className="text-xs" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dispatch Task Dialog */}
      <Dialog
        open={dispatchAgent !== null}
        onOpenChange={(open) => !open && setDispatchAgent(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-accent-blue" />
              Dispatch Task to {dispatchAgent}
            </DialogTitle>
            <DialogDescription>
              Task will be routed to the agent&apos;s n8n workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Title
              </label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Review DELTA performance this week"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Description
              </label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Detailed instructions for the agent..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Priority
              </label>
              <Select
                value={taskPriority}
                onValueChange={(v) =>
                  setTaskPriority(v as "low" | "medium" | "high")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDispatchAgent(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDispatch}
                disabled={!taskTitle.trim() || dispatching}
              >
                {dispatching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Dispatch
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Result Viewer Dialog */}
      <Dialog
        open={viewingResult !== null}
        onOpenChange={(open) => !open && setViewingResult(null)}
      >
        <DialogContent className="sm:max-w-[640px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-blue" />
              {viewingResult?.agent} — Result
            </DialogTitle>
            <DialogDescription>
              {viewingResult?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {viewingResult?.result && (
              <FormattedResult content={viewingResult.result} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

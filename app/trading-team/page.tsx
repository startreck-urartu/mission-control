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
  Radio,
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
import { Doc } from "@/convex/_generated/dataModel";

type TeamMember = Doc<"team">;
type Task = Doc<"tasks">;

const TRADING_AGENT_NAMES = ["Orion Prime", "Vega", "Atlas", "Mercury"];

const AGENT_CONFIG: Record<
  string,
  { icon: typeof Target; color: string; gradient: string; tag: string; glow: string }
> = {
  "Orion Prime": {
    icon: Target,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-amber-600/5",
    tag: "orion-prime",
    glow: "glow-amber",
  },
  Vega: {
    icon: Activity,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    tag: "vega",
    glow: "glow-blue",
  },
  Atlas: {
    icon: Shield,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    tag: "atlas",
    glow: "glow-green",
  },
  Mercury: {
    icon: Zap,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-violet-600/5",
    tag: "mercury",
    glow: "glow-purple",
  },
};

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  busy: "bg-yellow-500",
  away: "bg-orange-500",
  offline: "bg-gray-500",
};

function getHeartbeatHealth(lastActive: string | undefined | null): {
  label: string;
  color: string;
  dotColor: string;
  icon: typeof Wifi;
} {
  if (!lastActive) return { label: "Unknown", color: "text-gray-400", dotColor: "bg-gray-500", icon: WifiOff };
  const diff = Date.now() - new Date(lastActive).getTime();
  if (isNaN(diff)) return { label: "Unknown", color: "text-gray-400", dotColor: "bg-gray-500", icon: WifiOff };
  const minutes = diff / 60000;
  if (minutes < 10)
    return { label: "Healthy", color: "text-green-400", dotColor: "bg-green-500", icon: Wifi };
  if (minutes < 30)
    return { label: "Stale", color: "text-yellow-400", dotColor: "bg-yellow-500", icon: Signal };
  return { label: "Offline", color: "text-red-400", dotColor: "bg-red-500", icon: WifiOff };
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
  const config = AGENT_CONFIG[agent.name] || AGENT_CONFIG["Mercury"];
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

  return (
    <Card className="glass overflow-hidden">
      <div className={cn("bg-gradient-to-r p-5", config.gradient)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center glass">
              {agent.avatar && !agent.avatar.startsWith("http") ? (
                <span className="text-2xl">{agent.avatar}</span>
              ) : (
                <Icon className={cn("w-6 h-6", config.color)} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
              <p className="text-sm text-gray-400">{agent.role}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  STATUS_COLORS[agent.status],
                  agent.status === "online" && "animate-pulse"
                )}
              />
              <span className="text-xs text-gray-400 capitalize">
                {agent.status}
              </span>
            </div>
            {/* Heartbeat indicator */}
            <div className="flex items-center gap-1.5">
              <HeartbeatIcon className={cn("w-3 h-3", heartbeat.color)} />
              <span className={cn("text-[10px]", heartbeat.color)}>
                {heartbeat.label}
              </span>
              <span className="text-[10px] text-gray-600">
                {formatTimeAgo(agent.lastActive)}
              </span>
            </div>
          </div>
        </div>

        {agent.description && (
          <p className="text-sm text-gray-400 mt-3 line-clamp-2">
            {agent.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {agent.skills?.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-300 border border-white/[0.06]"
            >
              {skill}
            </span>
          ))}
          {(agent.skills?.length ?? 0) > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-500">
              +{agent.skills!.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
            <div className="text-lg font-bold text-green-400">
              {agentResult?.completedTasks ?? 0}
            </div>
            <div className="text-xs text-gray-500">Done</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
            <div className="text-lg font-bold text-blue-400">
              {activeTasks.length}
            </div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/[0.03]">
            <div
              className={cn(
                "text-lg font-bold",
                (agentResult?.failedTasks ?? 0) > 0 ? "text-red-400" : "text-gray-600"
              )}
            >
              {agentResult?.failedTasks ?? 0}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>

        {/* Last result preview */}
        {resultPreview && (
          <div
            className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors"
            onClick={() =>
              agentResult?.result &&
              onViewResult(agent.name, agentResult.result, agentResult.title)
            }
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-blue-400" />
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                  Last Result
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {agentResult?.completedAt && (
                  <span className="text-[10px] text-gray-600">
                    {formatTimeAgo(agentResult.completedAt)}
                  </span>
                )}
                <Eye className="w-3 h-3 text-gray-500" />
              </div>
            </div>
            <p className="text-xs text-gray-400 font-medium mb-1 truncate">
              {agentResult?.title}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {resultPreview}
            </p>
          </div>
        )}

        {/* Recent tasks */}
        {recentTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
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
                className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors mx-auto"
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
            <p className="text-sm text-gray-600">No tasks yet</p>
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
        "flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group",
        onViewResult && "cursor-pointer"
      )}
      onClick={onViewResult}
    >
      {task.status === "done" || task.status === "agent-reviewed" ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
      ) : task.status === "failed" || task.status === "validation-error" ? (
        <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
      ) : task.status === "processing" ? (
        <Loader2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0 animate-spin" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-300 truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-500">{formatTimeAgo(task.updatedAt)}</p>
          {task.lastAgentResult && (
            <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              <Eye className="w-2.5 h-2.5" /> view result
            </span>
          )}
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] shrink-0",
          task.priority === "high"
            ? "border-red-500/30 text-red-400"
            : task.priority === "medium"
              ? "border-yellow-500/30 text-yellow-400"
              : "border-gray-600 text-gray-500"
        )}
      >
        {task.priority}
      </Badge>
    </div>
  );
}

export default function TradingTeamPage() {
  const team = useQuery(api.team.getAllTeamMembers) ?? [];
  const tasks = useQuery(api.tasks.getAllTasks) ?? [];
  const agentResults = useQuery(api.tasks.getLatestAgentResults, {
    agentNames: TRADING_AGENT_NAMES,
  });
  const createTask = useMutation(api.tasks.createTask);

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
      team.filter((m) =>
        TRADING_AGENT_NAMES.some(
          (name) => m.name.toLowerCase() === name.toLowerCase()
        )
      ),
    [team]
  );

  const tradingTasks = useMemo(
    () =>
      tasks.filter(
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 flex items-center justify-center border border-white/[0.06]">
              <Radio className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Trading Team
              </h1>
              <p className="text-sm text-gray-400">
                S4 DELTA strategy agents on n8n
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                stats.onlineAgents > 0
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-500"
              )}
            />
            <span className="text-gray-300">
              {stats.onlineAgents}/{tradingAgents.length} Online
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6 stagger-in">
        {[
          {
            label: "Agents",
            value: tradingAgents.length,
            icon: Bot,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Active",
            value: stats.active,
            icon: RefreshCw,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: CheckCircle2,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            label: "Failed",
            value: stats.failed,
            icon: AlertTriangle,
            color: stats.failed > 0 ? "text-red-400" : "text-gray-600",
            bg: stats.failed > 0 ? "bg-red-500/10" : "bg-white/[0.03]",
          },
          {
            label: "Total Tasks",
            value: stats.total,
            icon: Activity,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-gray-500">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          {tradingAgents.length > 0 ? (
            tradingAgents.map((agent) => (
              <AgentCard
                key={agent._id}
                agent={agent}
                tasks={tasks}
                agentResult={agentResults?.[agent.name] ?? null}
                onDispatch={setDispatchAgent}
                onViewResult={handleViewResult}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <Bot className="w-14 h-14 text-gray-700 mx-auto mb-4 empty-state-icon" />
              <h3 className="text-lg font-medium text-gray-400">
                No trading agents found
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Add Orion Prime, Vega, Atlas, and Mercury to your team
              </p>
            </div>
          )}
        </div>

        {/* All Trading Tasks table with inline result preview */}
        {tradingTasks.length > 0 && (
          <div className="mt-2 mb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  All Trading Tasks
                  <Badge
                    variant="outline"
                    className="text-xs border-white/[0.06] text-gray-500"
                  >
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
                    .map((task) => (
                      <div key={task._id}>
                        <div
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors",
                            task.lastAgentResult && "cursor-pointer",
                            expandedTask === task._id && "bg-white/[0.02]"
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
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          ) : task.status === "failed" || task.status === "validation-error" ? (
                            <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : task.status === "processing" ? (
                            <Loader2 className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-spin" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">
                                {task.claimedBy || task.tags?.find((t: string) =>
                                  ["mercury", "atlas", "vega", "orion-prime"].includes(t.toLowerCase())
                                ) || "—"}
                              </span>
                              <span className="text-[10px] text-gray-600">
                                {formatTimeAgo(task.updatedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                task.priority === "high"
                                  ? "border-red-500/30 text-red-400"
                                  : task.priority === "medium"
                                    ? "border-yellow-500/30 text-yellow-400"
                                    : "border-gray-600 text-gray-500"
                              )}
                            >
                              {task.priority}
                            </Badge>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                task.status === "done" || task.status === "agent-reviewed"
                                  ? "bg-green-500/10 text-green-400"
                                  : task.status === "processing"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : task.status === "dispatched"
                                      ? "bg-yellow-500/10 text-yellow-400"
                                      : task.status === "failed" || task.status === "validation-error"
                                        ? "bg-red-500/10 text-red-400"
                                        : "bg-white/[0.04] text-gray-400"
                              )}
                            >
                              {task.status}
                            </span>
                            {task.lastAgentResult && (
                              <ChevronDown
                                className={cn(
                                  "w-3.5 h-3.5 text-gray-500 transition-transform duration-200",
                                  expandedTask === task._id && "rotate-180"
                                )}
                              />
                            )}
                          </div>
                        </div>

                        {/* Inline result expansion */}
                        {expandedTask === task._id && task.lastAgentResult && (
                          <div className="mx-2 mb-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] animate-fade-in-up">
                            <div className="flex items-center gap-1.5 mb-2">
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                                Agent Result
                              </span>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              <FormattedResult content={task.lastAgentResult} className="text-xs" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
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
              <Send className="w-4 h-4 text-blue-400" />
              Dispatch Task to {dispatchAgent}
            </DialogTitle>
            <DialogDescription>
              Task will be routed to the agent&apos;s n8n workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-200 mb-1 block">
                Title
              </label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Review DELTA performance this week"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200 mb-1 block">
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
              <label className="text-sm font-medium text-gray-200 mb-1 block">
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
              <FileText className="w-4 h-4 text-blue-400" />
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

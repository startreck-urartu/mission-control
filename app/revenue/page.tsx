"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  Plus,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  Trash2,
  Edit,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  accentPill,
  accentBg,
  accentText,
  revenueCategoryAccent,
  type AccentName,
} from "@/lib/status-colors";

type Revenue = Doc<"revenue">;
type Goal = Doc<"goals">;

const CATEGORIES = [
  { id: "cadcam-design", label: "CAD/CAM Design" },
  { id: "3dgoldsmith", label: "3DGoldsmith" },
  { id: "trading", label: "Trading" },
  { id: "consulting", label: "Consulting" },
  { id: "other", label: "Other" },
] as const;

const GOAL_CATEGORIES = [
  { id: "revenue", label: "Revenue (auto-tracked)" },
  { id: "profit", label: "Profit" },
  { id: "clients", label: "Clients" },
  { id: "trading", label: "Trading" },
  { id: "custom", label: "Custom" },
] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthBounds() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${y}-${pad(m + 1)}-01`,
    end: `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`,
  };
}

// Summary stat config — accent keys only (no raw class strings)
const STAT_ACCENTS: AccentName[] = ["green", "yellow", "blue", "purple"];

export default function RevenuePage() {
  const allRevenue = useQuery(api.revenue.getAllRevenue);
  const goals = useQuery(api.goals.getGoalProgress);
  const clients = useQuery(api.clients.getAllClients);
  const isLoading = allRevenue === undefined;

  const createRevenue = useMutation(api.revenue.createRevenue);
  const updateRevenue = useMutation(api.revenue.updateRevenue);
  const deleteRevenue = useMutation(api.revenue.deleteRevenue);
  const createGoal = useMutation(api.goals.createGoal);
  const updateGoal = useMutation(api.goals.updateGoal);
  const deleteGoal = useMutation(api.goals.deleteGoal);

  const { confirm, confirmDialog } = useConfirm();

  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [revenueForm, setRevenueForm] = useState({
    amount: "",
    description: "",
    category: "cadcam-design" as Revenue["category"],
    clientId: "" as string,
    date: today(),
    status: "received" as Revenue["status"],
  });

  const [visibleEntries, setVisibleEntries] = useState(50);

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    targetAmount: "",
    currentAmount: "",
    category: "revenue" as Goal["category"],
    startDate: monthBounds().start,
    endDate: monthBounds().end,
  });

  const entries = useMemo(
    () => (allRevenue ?? []).slice().sort((a, b) => b.date.localeCompare(a.date)),
    [allRevenue]
  );

  const allTimeReceived = useMemo(
    () =>
      (allRevenue ?? [])
        .filter((r) => r.status === "received")
        .reduce((sum, r) => sum + r.amount, 0),
    [allRevenue]
  );

  // Month aggregates derived from the already-live ledger
  const monthRevenue = useMemo(() => {
    if (!allRevenue) return undefined;
    const { start, end } = monthBounds();
    const byCategory: Record<string, { amount: number; count: number }> = {};
    let pending = 0;
    let received = 0;
    let count = 0;
    for (const r of allRevenue) {
      const day = r.date.slice(0, 10);
      if (day < start || day > end) continue;
      count += 1;
      if (!byCategory[r.category]) byCategory[r.category] = { amount: 0, count: 0 };
      byCategory[r.category].amount += r.amount;
      byCategory[r.category].count += 1;
      if (r.status === "pending") pending += r.amount;
      else received += r.amount;
    }
    return { byCategory, pending, received, count };
  }, [allRevenue]);

  const clientNames = useMemo(() => {
    const map = new Map<Id<"clients">, string>();
    for (const c of clients ?? []) map.set(c._id, c.name);
    return map;
  }, [clients]);

  const clientName = (id?: Id<"clients">) => (id ? clientNames.get(id) : undefined);

  // ── Revenue handlers ─────────────────────────────────

  const openCreateRevenue = () => {
    setEditingRevenue(null);
    setRevenueForm({
      amount: "",
      description: "",
      category: "cadcam-design",
      clientId: "",
      date: today(),
      status: "received",
    });
    setRevenueDialogOpen(true);
  };

  const openEditRevenue = (r: Revenue) => {
    setEditingRevenue(r);
    setRevenueForm({
      amount: String(r.amount),
      description: r.description,
      category: r.category,
      clientId: r.clientId ?? "",
      date: r.date.slice(0, 10),
      status: r.status,
    });
    setRevenueDialogOpen(true);
  };

  const submitRevenue = async () => {
    const amount = parseFloat(revenueForm.amount);
    if (!revenueForm.description.trim() || !revenueForm.date || isNaN(amount)) return;

    const data = {
      amount,
      description: revenueForm.description.trim(),
      category: revenueForm.category,
      clientId: revenueForm.clientId
        ? (revenueForm.clientId as Id<"clients">)
        : undefined,
      date: revenueForm.date,
      status: revenueForm.status,
    };

    if (editingRevenue) {
      await updateRevenue({ id: editingRevenue._id, ...data });
    } else {
      await createRevenue(data);
    }
    setRevenueDialogOpen(false);
  };

  const removeRevenue = async (id: Id<"revenue">) => {
    if (!(await confirm({ title: "Delete this revenue entry?", destructive: true }))) return;
    await deleteRevenue({ id });
  };

  // ── Goal handlers ────────────────────────────────────

  const openCreateGoal = () => {
    setEditingGoal(null);
    setGoalForm({
      title: "",
      description: "",
      targetAmount: "",
      currentAmount: "",
      category: "revenue",
      startDate: monthBounds().start,
      endDate: monthBounds().end,
    });
    setGoalDialogOpen(true);
  };

  const openEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setGoalForm({
      title: g.title,
      description: g.description ?? "",
      targetAmount: String(g.targetAmount),
      currentAmount: String(g.currentAmount),
      category: g.category,
      startDate: g.startDate.slice(0, 10),
      endDate: g.endDate.slice(0, 10),
    });
    setGoalDialogOpen(true);
  };

  const submitGoal = async () => {
    const targetAmount = parseFloat(goalForm.targetAmount);
    if (!goalForm.title.trim() || isNaN(targetAmount) || !goalForm.startDate || !goalForm.endDate) return;

    const data = {
      title: goalForm.title.trim(),
      description: goalForm.description.trim() || undefined,
      targetAmount,
      currentAmount: goalForm.currentAmount ? parseFloat(goalForm.currentAmount) : 0,
      category: goalForm.category,
      startDate: goalForm.startDate,
      endDate: goalForm.endDate,
    };

    if (editingGoal) {
      await updateGoal({ id: editingGoal._id, ...data });
    } else {
      await createGoal(data);
    }
    setGoalDialogOpen(false);
  };

  const removeGoal = async (id: Id<"goals">) => {
    if (!(await confirm({ title: "Delete this goal?", destructive: true }))) return;
    await deleteGoal({ id });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue & Goals"
        subtitle="Income by category, financial targets, deal payouts"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={openCreateGoal} className="flex items-center gap-2">
            <Target className="w-4 h-4" /> New Goal
          </Button>
          <Button onClick={openCreateRevenue} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Revenue
          </Button>
        </div>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-in">
        {[
          {
            label: "Received This Month",
            value: formatCurrency(monthRevenue?.received ?? 0, { decimals: 0 }),
            icon: DollarSign,
            accent: STAT_ACCENTS[0],
          },
          {
            label: "Pending This Month",
            value: formatCurrency(monthRevenue?.pending ?? 0, { decimals: 0 }),
            icon: Clock,
            accent: (monthRevenue?.pending ?? 0) > 0 ? STAT_ACCENTS[1] : ("gray" as AccentName),
          },
          {
            label: "All-Time Received",
            value: formatCurrency(allTimeReceived, { decimals: 0 }),
            icon: TrendingUp,
            accent: STAT_ACCENTS[2],
          },
          {
            label: "Entries This Month",
            value: monthRevenue?.count ?? 0,
            icon: Users,
            accent: STAT_ACCENTS[3],
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn("p-1.5 rounded-lg", accentPill[stat.accent])}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-foreground tabular-nums tracking-tight">
                    {isLoading ? <Skeleton className="h-7 w-16 ml-auto" /> : stat.value}
                  </div>
                  <div className="text-[11px] text-muted">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Month by category */}
      {monthRevenue && Object.keys(monthRevenue.byCategory).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(monthRevenue.byCategory).map(([cat, data]) => (
            <Badge key={cat} color={revenueCategoryAccent[cat] ?? "gray"}>
              {CATEGORIES.find((c) => c.id === cat)?.label ?? cat}:{" "}
              {formatCurrency(data.amount, { decimals: 0 })} ({data.count})
            </Badge>
          ))}
        </div>
      )}

      {/* Goals */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target className={cn("w-4 h-4", accentText["orange"])} /> Active Goals
        </h2>
        {goals === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-separator">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {goals.map((goal) => {
              const met = goal.progressPct >= 100;
              return (
                <Card key={goal._id} className="group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate">{goal.title}</h3>
                        <p className="text-[11px] text-muted mt-0.5">
                          {formatDate(goal.startDate)} → {formatDate(goal.endDate)} · {goal.daysLeft}d left
                          {goal.category === "revenue" && (
                            <span className={accentText["orange"]}> · auto</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openEditGoal(goal)}
                          aria-label="Edit goal"
                          className="p-1 rounded hover:bg-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                        >
                          <Edit className="w-3 h-3 text-muted" />
                        </button>
                        <button
                          onClick={() => removeGoal(goal._id)}
                          aria-label="Delete goal"
                          className="p-1 rounded hover:bg-accent-red-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                        >
                          <Trash2 className="w-3 h-3 text-accent-red" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-foreground tabular-nums tracking-tight mt-3">
                      {formatCurrency(goal.currentAmount, { decimals: 0 })}
                      <span className="text-sm font-normal text-muted">
                        {" "}/ {formatCurrency(goal.targetAmount, { decimals: 0 })}
                      </span>
                    </div>
                    <div className="mt-2 w-full h-1.5 rounded-full bg-fill overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          met ? accentBg["green"] : accentBg["orange"]
                        )}
                        style={{ width: `${Math.min(100, goal.progressPct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={cn("text-[11px]", met ? accentText["green"] : "text-tertiary")}>
                        {goal.progressPct}%
                      </span>
                      <span className={cn("text-[11px]", met ? accentText["green"] : accentText["orange"])}>
                        {met
                          ? "Goal met!"
                          : `${formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), { decimals: 0 })} to go`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Target}
            message="No active goals"
            hint="Revenue goals track received income in their date range automatically"
          />
        )}
      </div>

      {/* Entries */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <DollarSign className={cn("w-4 h-4", accentText["green"])} /> Revenue Entries
        </h2>
        <Card>
          <CardContent className="p-2">
            {isLoading ? (
              <div className="divide-y divide-separator">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5">
                    <Skeleton className="h-3 w-20 shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-24 shrink-0" />
                  </div>
                ))}
              </div>
            ) : entries.length > 0 ? (
              <div className="divide-y divide-separator">
                {entries.slice(0, visibleEntries).map((r) => (
                  <div key={r._id} className="flex items-center gap-3 p-2.5 group hover:bg-fill rounded-lg">
                    <span className="text-[11px] text-muted w-20 shrink-0">{formatDate(r.date)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{r.description}</p>
                      {clientName(r.clientId) && (
                        <p className="text-[10px] text-tertiary">{clientName(r.clientId)}</p>
                      )}
                    </div>
                    <Badge color={revenueCategoryAccent[r.category] ?? "gray"} className="text-[10px] shrink-0">
                      {CATEGORIES.find((c) => c.id === r.category)?.label ?? r.category}
                    </Badge>
                    <Badge
                      color={r.status === "received" ? "green" : "yellow"}
                      className="text-[10px] shrink-0"
                    >
                      {r.status}
                    </Badge>
                    <span className={cn("text-sm font-semibold w-24 text-right shrink-0 tabular-nums tracking-tight", accentText["green"])}>
                      ${r.amount.toLocaleString()}
                    </span>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEditRevenue(r)}
                        aria-label="Edit revenue entry"
                        className="p-1 rounded hover:bg-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                      >
                        <Edit className="w-3 h-3 text-muted" />
                      </button>
                      <button
                        onClick={() => removeRevenue(r._id)}
                        aria-label="Delete revenue entry"
                        className="p-1 rounded hover:bg-accent-red-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                      >
                        <Trash2 className="w-3 h-3 text-accent-red" />
                      </button>
                    </div>
                  </div>
                ))}
                {entries.length > visibleEntries && (
                  <div className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleEntries((n) => n + 50)}
                      className="text-xs text-muted"
                    >
                      Show more ({entries.length - visibleEntries} older entries)
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={DollarSign}
                message="No revenue logged yet"
                hint="Entries are created automatically when a client reaches Paid, or add one manually"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue dialog */}
      <Dialog open={revenueDialogOpen} onOpenChange={setRevenueDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingRevenue ? "Edit Revenue" : "Add Revenue"}</DialogTitle>
            <DialogDescription>
              {editingRevenue ? "Update this income entry" : "Log an income entry"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Amount ($) *</label>
                <Input type="number" value={revenueForm.amount} onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })} placeholder="1500" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Date *</label>
                <Input type="date" value={revenueForm.date} onChange={(e) => setRevenueForm({ ...revenueForm, date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description *</label>
              <Textarea value={revenueForm.description} onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })} placeholder="Ring CAD model — final payment" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={revenueForm.category} onValueChange={(v) => setRevenueForm({ ...revenueForm, category: v as Revenue["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={revenueForm.status} onValueChange={(v) => setRevenueForm({ ...revenueForm, status: v as Revenue["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(clients?.length ?? 0) > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground">Client (optional)</label>
                <Select value={revenueForm.clientId || "none"} onValueChange={(v) => setRevenueForm({ ...revenueForm, clientId: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— none —</SelectItem>
                    {clients?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setRevenueDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitRevenue} disabled={!revenueForm.description.trim() || !revenueForm.amount}>
                {editingRevenue ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "New Goal"}</DialogTitle>
            <DialogDescription>
              Revenue goals compute progress from received income automatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="July Revenue Target" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Target ($) *</label>
                <Input type="number" value={goalForm.targetAmount} onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })} placeholder="10000" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={goalForm.category} onValueChange={(v) => setGoalForm({ ...goalForm, category: v as Goal["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Start *</label>
                <Input type="date" value={goalForm.startDate} onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">End *</label>
                <Input type="date" value={goalForm.endDate} onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })} />
              </div>
            </div>
            {goalForm.category !== "revenue" && (
              <div>
                <label className="text-sm font-medium text-foreground">Current Progress ($)</label>
                <Input type="number" value={goalForm.currentAmount} onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })} placeholder="0" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitGoal} disabled={!goalForm.title.trim() || !goalForm.targetAmount}>
                {editingGoal ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}

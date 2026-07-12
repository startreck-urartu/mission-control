"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ChevronDown,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Flag,
  Calendar,
  Trash2,
  Edit,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { cn, formatDate } from "@/lib/utils";
import {
  accentBg,
  accentBorderT,
  accentText,
  clientStageAccent,
  priorityAccent,
  type AccentName,
} from "@/lib/status-colors";

/** Local (not UTC) YYYY-MM-DD — bare Date parsing of followUpDate is UTC and fires "overdue" early. */
function localTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Client = Doc<"clients">;

const STAGES = [
  { id: "lead", label: "Lead" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "contract", label: "Contract" },
  { id: "in-production", label: "In Production" },
  { id: "delivered", label: "Delivered" },
  { id: "paid", label: "Paid" },
] as const;

function ClientCard({
  client,
  onEdit,
  onDelete,
  onMove,
}: {
  client: Client;
  onEdit: (c: Client) => void;
  onDelete: (id: Id<"clients">) => void;
  onMove: (id: Id<"clients">, stage: Client["stage"]) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const nextStage = (() => {
    const idx = STAGES.findIndex((s) => s.id === client.stage);
    return idx < STAGES.length - 1 ? STAGES[idx + 1].id : null;
  })();

  return (
    <Card
      className="group cursor-pointer overflow-hidden"
      onClick={() => setShowActions(false)}
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-foreground truncate">{client.name}</h3>
            {client.company && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-tertiary" />
                <span className="text-xs text-muted truncate">{client.company}</span>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 rounded hover:bg-fill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
              aria-label="Client actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-muted" />
            </button>
            {showActions && (
              <div className="absolute right-0 top-7 z-10 min-w-[120px] rounded-lg glass-pane border border-separator shadow-xl py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(client); setShowActions(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 rounded"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                {nextStage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMove(client._id, nextStage); setShowActions(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-accent-green hover:bg-fill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 rounded"
                  >
                    <ChevronDown className="w-3 h-3" /> Advance
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(client._id); setShowActions(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-accent-red hover:bg-accent-red-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 rounded"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {client.projectType && (
          <div className="mt-1.5">
            <Badge color="gray">{client.projectType}</Badge>
          </div>
        )}

        {!!client.value && (
          <div className="mt-2 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-accent-green" />
            <span className="text-sm font-semibold text-accent-green tabular-nums tracking-tight">${client.value.toLocaleString()}</span>
          </div>
        )}

        {client.notes && (
          <p className="text-xs text-muted mt-2 line-clamp-2">{client.notes}</p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge color={priorityAccent[client.priority] ?? "gray"}>
            <Flag className="w-2.5 h-2.5 mr-1" />{client.priority}
          </Badge>
          {client.followUpDate && (
            <span className={cn("text-[10px] flex items-center gap-1",
              client.followUpDate.slice(0, 10) <= localTodayStr() ? "text-accent-red" : "text-muted"
            )}>
              <Calendar className="w-2.5 h-2.5" />{formatDate(client.followUpDate)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 text-[10px] text-tertiary">
          {client.email && <Mail className="w-3 h-3" />}
          {client.phone && <Phone className="w-3 h-3" />}
          {client.source && <span className="text-muted">via {client.source}</span>}
        </div>
      </div>
    </Card>
  );
}

function DraggableClientCard({
  client,
  onEdit,
  onDelete,
  onMove,
}: {
  client: Client;
  onEdit: (c: Client) => void;
  onDelete: (id: Id<"clients">) => void;
  onMove: (id: Id<"clients">, stage: Client["stage"]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: client._id,
    data: { client },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      <ClientCard client={client} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
    </div>
  );
}

function StageColumn({
  stage,
  clients,
  onEdit,
  onDelete,
  onMove,
}: {
  stage: (typeof STAGES)[number];
  clients: Client[];
  onEdit: (c: Client) => void;
  onDelete: (id: Id<"clients">) => void;
  onMove: (id: Id<"clients">, stage: Client["stage"]) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const stageValue = clients.reduce((sum, c) => sum + (c.value ?? 0), 0);
  const accent: AccentName = clientStageAccent[stage.id] ?? "gray";

  return (
    <div className="w-72 sm:w-80 flex-shrink-0 flex flex-col">
      <div className={cn("p-3 rounded-t-lg glass-pane border border-separator border-t-2", accentBorderT[accent])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", accentBg[accent])} />
            <h2 className="text-sm font-semibold text-foreground">{stage.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted tabular-nums">{clients.length}</span>
            {stageValue > 0 && (
              <span className={cn("text-xs tabular-nums tracking-tight", accentText["green"])}>${stageValue.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-glass backdrop-blur-xl rounded-b-lg border border-separator border-t-0 p-2 space-y-2 overflow-y-auto transition-colors",
          isOver && "bg-accent-blue-tint border-accent-blue/40"
        )}
      >
        {clients.map((client) => (
          <DraggableClientCard
            key={client._id}
            client={client}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
        {clients.length === 0 && (
          <div className="text-center py-8">
            <span className="text-xs text-tertiary">No clients</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StageColumnSkeleton({ stage }: { stage: (typeof STAGES)[number] }) {
  const accent: AccentName = clientStageAccent[stage.id] ?? "gray";
  return (
    <div className="w-72 sm:w-80 flex-shrink-0 flex flex-col">
      <div className={cn("p-3 rounded-t-lg glass-pane border border-separator border-t-2", accentBorderT[accent])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", accentBg[accent])} />
            <h2 className="text-sm font-semibold text-foreground">{stage.label}</h2>
          </div>
          <Skeleton className="h-3 w-6" />
        </div>
      </div>
      <div className="flex-1 bg-glass backdrop-blur-xl rounded-b-lg border border-separator border-t-0 p-2 space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const clients = useQuery(api.clients.getAllClients);
  const isLoading = clients === undefined;
  const createClient = useMutation(api.clients.createClient);
  const updateClient = useMutation(api.clients.updateClient);
  const deleteClient = useMutation(api.clients.deleteClient);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  // distance threshold keeps card buttons clickable without starting a drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    source: "",
    stage: "lead" as Client["stage"],
    value: "",
    projectType: "",
    notes: "",
    followUpDate: "",
    priority: "medium" as Client["priority"],
    tags: "",
  });

  // Computed from the already-live client list — the page doesn't need a second
  // full-table subscription (getPipelineMetrics) for numbers it can derive here
  const metrics = useMemo(() => {
    if (!clients) return undefined;
    const today = localTodayStr();
    let totalPipeline = 0;
    let totalWon = 0;
    let followUpNeeded = 0;
    for (const c of clients) {
      if (c.stage === "paid") totalWon += c.value ?? 0;
      else totalPipeline += c.value ?? 0;
      if (c.followUpDate && c.followUpDate.slice(0, 10) <= today) followUpNeeded += 1;
    }
    return { totalClients: clients.length, totalPipeline, totalWon, followUpNeeded };
  }, [clients]);

  const clientsByStage = useMemo(() => {
    const list = clients ?? [];
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.company?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        )
      : list;
    return STAGES.reduce((acc, stage) => {
      acc[stage.id] = filtered.filter((c) => c.stage === stage.id);
      return acc;
    }, {} as Record<string, Client[]>);
  }, [clients, searchQuery]);

  const handleCreate = () => {
    setEditingClient(null);
    setSaveError(null);
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      source: "",
      stage: "lead",
      value: "",
      projectType: "",
      notes: "",
      followUpDate: "",
      priority: "medium",
      tags: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setSaveError(null);
    setFormData({
      name: client.name,
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      source: client.source || "",
      stage: client.stage,
      value: client.value?.toString() || "",
      projectType: client.projectType || "",
      notes: client.notes || "",
      followUpDate: client.followUpDate?.slice(0, 10) || "",
      priority: client.priority,
      tags: client.tags?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const name = formData.name.trim();
    if (!name) return;

    setIsSubmitting(true);
    const data = {
      ...formData,
      name,
      value: formData.value ? parseFloat(formData.value) : undefined,
      tags: formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      setSaveError(null);
      if (editingClient) {
        await updateClient({ id: editingClient._id, ...data });
      } else {
        await createClient(data);
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Client save failed:", err);
      setSaveError("Save failed — check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"clients">) => {
    if (!(await confirm({ title: "Remove this client?", destructive: true }))) return;
    await deleteClient({ id });
  };

  const handleMove = async (id: Id<"clients">, stage: Client["stage"]) => {
    try {
      await updateClient({ id, stage });
    } catch (err) {
      console.error("Stage move failed:", err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveClient((event.active.data.current?.client as Client) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveClient(null);
    if (!over) return;

    const client = active.data.current?.client as Client | undefined;
    const targetStage = STAGES.find((s) => s.id === String(over.id))?.id;
    if (client && targetStage && targetStage !== client.stage) {
      await handleMove(client._id, targetStage);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Client Pipeline"
        subtitle="CADCAM Designs — drag deals between stages; Paid books revenue automatically"
      >
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Client
        </Button>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger-in">
        <StatCard
          label="Total Clients"
          value={isLoading ? <Skeleton className="h-7 w-16 ml-auto" /> : (metrics?.totalClients ?? 0)}
          icon={Users}
          accent="blue"
        />
        <StatCard
          label="Pipeline Value"
          value={isLoading ? <Skeleton className="h-7 w-24 ml-auto" /> : `$${(metrics?.totalPipeline ?? 0).toLocaleString()}`}
          icon={TrendingUp}
          accent="purple"
        />
        <StatCard
          label="Revenue Won"
          value={isLoading ? <Skeleton className="h-7 w-24 ml-auto" /> : `$${(metrics?.totalWon ?? 0).toLocaleString()}`}
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="Follow-ups"
          value={isLoading ? <Skeleton className="h-7 w-10 ml-auto" /> : (metrics?.followUpNeeded ?? 0)}
          icon={AlertCircle}
          accent={(metrics?.followUpNeeded ?? 0) > 0 ? "red" : "gray"}
        />
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Pipeline columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto min-h-0">
          <div className="flex gap-3 pb-4 min-w-max">
            {isLoading
              ? STAGES.map((stage) => (
                  <StageColumnSkeleton key={stage.id} stage={stage} />
                ))
              : STAGES.map((stage) => (
                  <StageColumn
                    key={stage.id}
                    stage={stage}
                    clients={clientsByStage[stage.id] ?? []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMove={handleMove}
                  />
                ))}
          </div>
        </div>

        <DragOverlay>
          {activeClient && (
            <div className="glass-pane-elevated rounded-2xl p-3.5 w-72 rotate-2 shadow-2xl">
              <h3 className="text-sm font-medium text-foreground truncate">{activeClient.name}</h3>
              {!!activeClient.value && (
                <span className="text-sm font-semibold text-accent-green tabular-nums tracking-tight">
                  ${activeClient.value.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "New Client"}</DialogTitle>
            <DialogDescription>
              {editingClient ? "Update client details" : "Add a new lead or client"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Client name" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Company</label>
                <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Company" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 555-5555" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Stage</label>
                <Select value={formData.stage} onValueChange={(v) => setFormData({ ...formData, stage: v as Client["stage"] })} >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as Client["priority"] })} >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Estimated Value ($)</label>
                <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="5000" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Project Type</label>
                <Input value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} placeholder="CAD Design, Prototyping..." />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Source</label>
              <Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="Referral, LinkedIn, JCK..." />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Follow-up Date</label>
              <Input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Project details, next steps..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tags</label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="tag1, tag2" />
            </div>
            {saveError && <p className="text-[13px] text-accent-red">{saveError}</p>}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.name.trim() || isSubmitting}>
                {editingClient ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}

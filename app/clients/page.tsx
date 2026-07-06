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
import { cn, formatDate } from "@/lib/utils";

type Client = Doc<"clients">;

const STAGES = [
  { id: "lead", label: "Lead", color: "bg-gray-500", border: "border-gray-500/40", text: "text-gray-400" },
  { id: "qualified", label: "Qualified", color: "bg-blue-500", border: "border-blue-500/40", text: "text-blue-400" },
  { id: "proposal", label: "Proposal", color: "bg-purple-500", border: "border-purple-500/40", text: "text-purple-400" },
  { id: "contract", label: "Contract", color: "bg-indigo-500", border: "border-indigo-500/40", text: "text-indigo-400" },
  { id: "in-production", label: "In Production", color: "bg-yellow-500", border: "border-yellow-500/40", text: "text-yellow-400" },
  { id: "delivered", label: "Delivered", color: "bg-orange-500", border: "border-orange-500/40", text: "text-orange-400" },
  { id: "paid", label: "Paid", color: "bg-green-500", border: "border-green-500/40", text: "text-green-400" },
] as const;

const PRIORITY_COLORS = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  high: "bg-red-500/10 text-red-400 border-red-500/20",
};

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
      className="group bg-[var(--surface-2)] border-white/[0.06] hover:border-white/[0.1] transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => setShowActions(false)}
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-200 truncate">{client.name}</h3>
            {client.company && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-gray-600" />
                <span className="text-xs text-gray-500 truncate">{client.company}</span>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 rounded hover:bg-white/[0.06] transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {showActions && (
              <div className="absolute right-0 top-7 z-10 min-w-[120px] rounded-lg bg-[var(--surface-3)] border border-white/[0.08] shadow-xl py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(client); setShowActions(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.04]"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
                {nextStage && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMove(client._id, nextStage); setShowActions(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-green-300 hover:bg-white/[0.04]"
                  >
                    <ChevronDown className="w-3 h-3" /> Advance
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(client._id); setShowActions(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 hover:bg-white/[0.04]"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {client.projectType && (
          <div className="mt-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-400">{client.projectType}</span>
          </div>
        )}

        {!!client.value && (
          <div className="mt-2 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-green-400" />
            <span className="text-sm font-semibold text-green-400">${client.value.toLocaleString()}</span>
          </div>
        )}

        {client.notes && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{client.notes}</p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px]", PRIORITY_COLORS[client.priority])}>
            <Flag className="w-2.5 h-2.5 mr-1" />{client.priority}
          </Badge>
          {client.followUpDate && (
            <span className={cn("text-[10px] flex items-center gap-1",
              new Date(client.followUpDate) <= new Date() ? "text-red-400" : "text-gray-500"
            )}>
              <Calendar className="w-2.5 h-2.5" />{formatDate(client.followUpDate)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-600">
          {client.email && <Mail className="w-3 h-3" />}
          {client.phone && <Phone className="w-3 h-3" />}
          {client.source && <span className="text-gray-500">via {client.source}</span>}
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

  return (
    <div className="w-72 sm:w-80 flex-shrink-0 flex flex-col">
      <div className={cn("p-3 rounded-t-lg border-t-2", stage.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", stage.color)} />
            <h2 className="text-sm font-semibold text-gray-200">{stage.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{clients.length}</span>
            {stageValue > 0 && (
              <span className="text-xs text-green-400">${stageValue.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 bg-[var(--surface-1)]/50 rounded-b-lg border border-white/[0.04] border-t-0 p-2 space-y-2 overflow-y-auto transition-colors",
          isOver && "bg-white/[0.04] border-white/[0.1]"
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
            <span className="text-xs text-gray-600">No clients</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const clients = useQuery(api.clients.getAllClients);
  const createClient = useMutation(api.clients.createClient);
  const updateClient = useMutation(api.clients.updateClient);
  const deleteClient = useMutation(api.clients.deleteClient);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeClient, setActiveClient] = useState<Client | null>(null);

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
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
    const name = formData.name.trim();
    if (!name) return;

    const data = {
      ...formData,
      name,
      value: formData.value ? parseFloat(formData.value) : undefined,
      tags: formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    if (editingClient) {
      await updateClient({ id: editingClient._id, ...data });
    } else {
      await createClient(data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: Id<"clients">) => {
    if (confirm("Remove this client?")) {
      await deleteClient({ id });
    }
  };

  const handleMove = async (id: Id<"clients">, stage: Client["stage"]) => {
    await updateClient({ id, stage });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Pipeline</h1>
          <p className="text-gray-400 mt-1">CADCAM Designs — drag deals between stages; Paid books revenue automatically</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Client
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger-in">
        {[
          {
            label: "Total Clients",
            value: metrics?.totalClients ?? 0,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Pipeline Value",
            value: `$${(metrics?.totalPipeline ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
          },
          {
            label: "Revenue Won",
            value: `$${(metrics?.totalWon ?? 0).toLocaleString()}`,
            icon: DollarSign,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            label: "Follow-ups",
            value: metrics?.followUpNeeded ?? 0,
            icon: AlertCircle,
            color: (metrics?.followUpNeeded ?? 0) > 0 ? "text-red-400" : "text-gray-600",
            bg: (metrics?.followUpNeeded ?? 0) > 0 ? "bg-red-500/10" : "bg-white/[0.03]",
          },
        ].map((stat) => (
          <Card key={stat.label} className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[11px] text-gray-500">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            {STAGES.map((stage) => (
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
            <Card className="p-3.5 w-72 bg-[var(--surface-2)] border-white/[0.15] shadow-2xl rotate-2">
              <h3 className="text-sm font-medium text-gray-200 truncate">{activeClient.name}</h3>
              {!!activeClient.value && (
                <span className="text-sm font-semibold text-green-400">
                  ${activeClient.value.toLocaleString()}
                </span>
              )}
            </Card>
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
                <label className="text-sm font-medium text-gray-200">Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Client name" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-200">Company</label>
                <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Company" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-200">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-200">Phone</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 555-5555" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-200">Stage</label>
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
                <label className="text-sm font-medium text-gray-200">Priority</label>
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
                <label className="text-sm font-medium text-gray-200">Estimated Value ($)</label>
                <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="5000" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-200">Project Type</label>
                <Input value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} placeholder="CAD Design, Prototyping..." />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Source</label>
              <Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="Referral, LinkedIn, JCK..." />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Follow-up Date</label>
              <Input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Notes</label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Project details, next steps..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Tags</label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="tag1, tag2" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
                {editingClient ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

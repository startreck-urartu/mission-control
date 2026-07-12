"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  User,
  Bot,
  Trash2,
  Edit,
  Activity,
  UserCircle,
  Crown,
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn, formatTimeAgo } from "@/lib/utils";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  accentBg,
  accentText,
  teamStatusAccent,
  type AccentName,
} from "@/lib/status-colors";

type TeamMember = Doc<"team">;

// Page-only domain: card left-border accent per member type
const TYPE_BORDER: Record<TeamMember["type"], string> = {
  human: "border-accent-blue/50",
  agent: "border-accent-purple/50",
};

// Status dot items for the SelectContent (index map — no template literals)
const STATUS_DOT_ITEMS: Array<{ value: TeamMember["status"]; label: string }> = [
  { value: "online", label: "Online" },
  { value: "busy",   label: "Busy"   },
  { value: "away",   label: "Away"   },
  { value: "offline",label: "Offline"},
];

function TeamMemberCard({
  member,
  onEdit,
  onDelete,
  onStatusChange,
  isSubagent = false,
}: {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (id: Id<"team">) => void;
  onStatusChange: (id: Id<"team">, status: TeamMember["status"]) => void;
  isSubagent?: boolean;
}) {
  const statusAccent: AccentName = teamStatusAccent[member.status] ?? "gray";

  return (
    <Card
      className={cn(
        "group hover:border-separator transition-all overflow-hidden",
        TYPE_BORDER[member.type],
        isSubagent && "ml-4 border-l-4"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-separator">
              {member.avatar && member.avatar.startsWith("http") ? (
                <AvatarImage src={member.avatar} alt={member.name} />
              ) : member.avatar ? (
                <AvatarFallback className="text-2xl">{member.avatar}</AvatarFallback>
              ) : (
                <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[hsl(var(--glass-bg))]",
                accentBg[statusAccent]
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  {member.isMainAgent && (
                    <Crown className="w-4 h-4 text-accent-yellow" />
                  )}
                  {!isSubagent && member.parentId && (
                    <Badge variant="outline" className="text-xs">
                      Subagent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted">{member.role}</p>
              </div>
              <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(member);
                  }}
                  aria-label={`Edit ${member.name}`}
                  className="p-1.5 hover:bg-fill rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                >
                  <Edit className="w-4 h-4 text-muted" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(member._id);
                  }}
                  aria-label={`Remove ${member.name}`}
                  className="p-1.5 hover:bg-fill rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                >
                  <Trash2 className="w-4 h-4 text-accent-red" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {member.skills?.slice(0, 4).map((skill) => (
                <Badge key={skill} color="gray" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {member.skills?.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{member.skills.length - 4}
                </Badge>
              )}
            </div>

            {member.description && (
              <p className="text-sm text-muted mt-3 line-clamp-2">
                {member.description}
              </p>
            )}

            {member.currentTask && (
              <div className="mt-3 p-2 bg-fill rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-accent-blue" />
                  <span className="text-xs text-muted">Currently:</span>
                </div>
                <p className="text-sm text-foreground mt-1">{member.currentTask}</p>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-separator">
              <Select
                value={member.status}
                onValueChange={(v) => onStatusChange(member._id, v as TeamMember["status"])}
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        accentBg[teamStatusAccent[member.status] ?? "gray"]
                      )}
                    />
                    <span className={accentText[teamStatusAccent[member.status] ?? "gray"]}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_DOT_ITEMS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            accentBg[teamStatusAccent[value] ?? "gray"]
                          )}
                        />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-xs text-tertiary">
                Last active: {formatTimeAgo(member.lastActive)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TeamPage() {
  const team = useQuery(api.team.getAllTeamMembers);
  const isLoading = team === undefined;
  const createTeamMember = useMutation(api.team.createTeamMember);
  const updateTeamMember = useMutation(api.team.updateTeamMember);
  const deleteTeamMember = useMutation(api.team.deleteTeamMember);
  const updateStatus = useMutation(api.team.updateStatus);
  const { confirm, confirmDialog } = useConfirm();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "human" | "agent">("all");

  const [formData, setFormData] = useState<{
    name: string;
    role: string;
    type: TeamMember["type"];
    avatar: string;
    status: TeamMember["status"];
    skills: string;
    description: string;
    email: string;
    isMainAgent: boolean;
  }>({
    name: "",
    role: "",
    type: "human",
    avatar: "",
    status: "online",
    skills: "",
    description: "",
    email: "",
    isMainAgent: false,
  });

  const filteredTeam = useMemo(() => {
    const members = team ?? [];
    const filtered =
      activeTab === "all"
        ? members
        : members.filter((m) => m.type === activeTab);
    return filtered.sort((a, b) => {
      // Main agent first, then by status (online first)
      if (a.isMainAgent && !b.isMainAgent) return -1;
      if (!a.isMainAgent && b.isMainAgent) return 1;
      const statusOrder = { online: 0, busy: 1, away: 2, offline: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [team, activeTab]);

  const stats = useMemo(() => {
    const members = team ?? [];
    return {
      total: members.length,
      human: members.filter((m) => m.type === "human").length,
      agents: members.filter((m) => m.type === "agent").length,
      online: members.filter((m) => m.status === "online").length,
    };
  }, [team]);

  const handleCreate = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      role: "",
      type: "human",
      avatar: "",
      status: "online",
      skills: "",
      description: "",
      email: "",
      isMainAgent: false,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      type: member.type,
      avatar: member.avatar || "",
      status: member.status,
      skills: member.skills?.join(", ") || "",
      description: member.description || "",
      email: member.email || "",
      isMainAgent: member.isMainAgent || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data = {
      ...formData,
      skills: formData.skills
        ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    if (editingMember) {
      await updateTeamMember({
        id: editingMember._id,
        ...data,
      });
    } else {
      await createTeamMember(data);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: Id<"team">) => {
    if (!(await confirm({ title: "Remove this team member?", destructive: true }))) return;
    await deleteTeamMember({ id });
  };

  const handleStatusChange = async (id: Id<"team">, status: TeamMember["status"]) => {
    await updateStatus({ id, status });
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Team"
        subtitle="Manage your team members and agents"
      >
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-8 h-8" />
                    <div className="space-y-2">
                      <Skeleton className="h-7 w-10 ml-auto" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : [
              { label: "Total",  value: stats.total,  icon: Users,    accent: "blue"   as AccentName },
              { label: "Human",  value: stats.human,  icon: User,     accent: "teal"   as AccentName },
              { label: "Agents", value: stats.agents, icon: Bot,      accent: "purple" as AccentName },
              { label: "Online", value: stats.online, icon: Activity, accent: "green"  as AccentName },
            ].map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                accent={stat.accent}
              />
            ))}
      </div>

      <Card className="mb-6">
        <div className="p-4 flex gap-2">
          {[
            { id: "all",   label: "All"    },
            { id: "human", label: "Human"  },
            { id: "agent", label: "Agents" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as "all" | "human" | "agent")}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0 space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-7 w-32" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
            {filteredTeam.map((member) => (
              <TeamMemberCard
                key={member._id}
                member={member}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
            {filteredTeam.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={UserCircle}
                  message="No team members"
                  hint="Add your first team member or agent"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Member" : "Add Team Member"}
            </DialogTitle>
            <DialogDescription>
              {editingMember ? "Update member details" : "Add a new team member"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Member name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <Input
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="e.g., Developer, Designer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v as TeamMember["type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human">Human</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as TeamMember["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Avatar Image URL</label>
              <Input
                value={formData.avatar}
                onChange={(e) =>
                  setFormData({ ...formData, avatar: e.target.value })
                }
                placeholder="https://example.com/avatar.png"
              />
              <p className="text-xs text-tertiary mt-1">
                Use a direct image URL (PNG, JPG, SVG). Try: ui-avatars.com, dicebear.com, or avataaars.io
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Skills</label>
              <Input
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                placeholder="skill1, skill2, skill3"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingMember ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}

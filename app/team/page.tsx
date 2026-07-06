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
import { cn, formatTimeAgo } from "@/lib/utils";
import { Doc, Id } from "@/convex/_generated/dataModel";

type TeamMember = Doc<"team">;

const STATUS_COLORS = {
  online: "bg-green-500",
  busy: "bg-red-500",
  away: "bg-yellow-500",
  offline: "bg-gray-500",
};

const STATUS_LABELS = {
  online: "Online",
  busy: "Busy",
  away: "Away",
  offline: "Offline",
};

const TYPE_COLORS = {
  human: "border-blue-500/50",
  agent: "border-purple-500/50",
};

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
  return (
    <Card
      className={cn(
        "group glass hover:border-white/[0.1] transition-all overflow-hidden",
        TYPE_COLORS[member.type],
        isSubagent && "ml-4 border-l-4"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="w-14 h-14 border-2 border-white/[0.06]">
              {member.avatar && member.avatar.startsWith("http") ? (
                <AvatarImage src={member.avatar} alt={member.name} />
              ) : member.avatar ? (
                <AvatarFallback className="bg-gray-700 text-2xl"
                  >{member.avatar}</AvatarFallback>
              ) : (
                <AvatarFallback className="bg-gray-700 text-gray-300"
                  >{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-800",
                STATUS_COLORS[member.status]
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-100">{member.name}</h3>
                  {member.isMainAgent && (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  )}
                  {!isSubagent && member.parentId && (
                    <Badge variant="outline" className="text-xs">
                      Subagent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400">{member.role}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(member);
                  }}
                  className="p-1.5 hover:bg-gray-700 rounded"
                >
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(member._id);
                  }}
                  className="p-1.5 hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {member.skills?.slice(0, 4).map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="text-xs bg-white/[0.04] border-white/[0.08] text-gray-300"
                >
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
              <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                {member.description}
              </p>
            )}

            {member.currentTask && (
              <div className="mt-3 p-2 bg-white/[0.02] rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-gray-400">Currently:</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">{member.currentTask}</p>
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
              <Select
                value={member.status}
                onValueChange={(v) => onStatusChange(member._id, v as TeamMember["status"])}
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        STATUS_COLORS[member.status]
                      )}
                    />
                    <span>{STATUS_LABELS[member.status]}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Online
                    </div>
                  </SelectItem>
                  <SelectItem value="busy">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Busy
                    </div>
                  </SelectItem>
                  <SelectItem value="away">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Away
                    </div>
                  </SelectItem>
                  <SelectItem value="offline">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      Offline
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="text-xs text-gray-500">
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
  const team = useQuery(api.team.getAllTeamMembers) || [];
  const createTeamMember = useMutation(api.team.createTeamMember);
  const updateTeamMember = useMutation(api.team.updateTeamMember);
  const deleteTeamMember = useMutation(api.team.deleteTeamMember);
  const updateStatus = useMutation(api.team.updateStatus);

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
    const filtered =
      activeTab === "all"
        ? team
        : team.filter((m) => m.type === activeTab);
    return filtered.sort((a, b) => {
      // Main agent first, then by status (online first)
      if (a.isMainAgent && !b.isMainAgent) return -1;
      if (!a.isMainAgent && b.isMainAgent) return 1;
      const statusOrder = { online: 0, busy: 1, away: 2, offline: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [team, activeTab]);

  const stats = useMemo(() => {
    return {
      total: team.length,
      human: team.filter((m) => m.type === "human").length,
      agents: team.filter((m) => m.type === "agent").length,
      online: team.filter((m) => m.status === "online").length,
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
    if (confirm("Remove this team member?")) {
      await deleteTeamMember({ id });
    }
  };

  const handleStatusChange = async (id: Id<"team">, status: TeamMember["status"]) => {
    await updateStatus({ id, status });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Team</h1>
          <p className="text-gray-400 mt-1">Manage your team members and agents</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, icon: Users },
          { label: "Human", value: stats.human, icon: User },
          { label: "Agents", value: stats.agents, icon: Bot },
          { label: "Online", value: stats.online, icon: Activity },
        ].map((stat) => (
          <Card key={stat.label} className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className="w-8 h-8 text-gray-500" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass mb-6">
        <div className="p-4 flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "human", label: "Human" },
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
            <div className="col-span-full text-center py-12">
              <UserCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300">No team members</h3>
              <p className="text-gray-500 mt-1">
                Add your first team member or agent
              </p>
            </div>
          )}
        </div>
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
                <label className="text-sm font-medium text-gray-200">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Member name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-200">Role</label>
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
                <label className="text-sm font-medium text-gray-200">Type</label>
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
                <label className="text-sm font-medium text-gray-200">Status</label>
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
              <label className="text-sm font-medium text-gray-200">Avatar Image URL</label>
              <Input
                value={formData.avatar}
                onChange={(e) =>
                  setFormData({ ...formData, avatar: e.target.value })
                }
                placeholder="https://example.com/avatar.png"
                className="glass"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use a direct image URL (PNG, JPG, SVG). Try: ui-avatars.com, dicebear.com, or avataaars.io
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Skills</label>
              <Input
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                placeholder="skill1, skill2, skill3"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Email</label>
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
    </div>
  );
}

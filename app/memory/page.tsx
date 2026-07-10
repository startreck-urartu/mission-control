"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Search,
  Plus,
  Brain,
  Calendar,
  MessageSquare,
  CheckSquare,
  Lightbulb,
  StickyNote,
  Trash2,
  Edit,
  Filter,
  X,
  Sparkles,
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
import { cn, formatTimeAgo } from "@/lib/utils";
import { Doc, Id } from "@/convex/_generated/dataModel";

type Memory = Doc<"memories">;

const MEMORY_TYPES = {
  conversation: { icon: MessageSquare, color: "bg-blue-500", label: "Conversation" },
  task: { icon: CheckSquare, color: "bg-green-500", label: "Task" },
  decision: { icon: Lightbulb, color: "bg-yellow-500", label: "Decision" },
  insight: { icon: Sparkles, color: "bg-purple-500", label: "Insight" },
  note: { icon: StickyNote, color: "bg-gray-500", label: "Note" },
};

const IMPORTANCE_COLORS = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

function MemoryCard({
  memory,
  onEdit,
  onDelete,
}: {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (id: Id<"memories">) => void;
}) {
  const TypeIcon = MEMORY_TYPES[memory.type].icon;

  return (
    <Card className="group glass card-hover highlight-top transition-all overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              MEMORY_TYPES[memory.type].color
            )}
          >
            <TypeIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-gray-100 leading-tight min-w-0 break-words">
                {memory.title}
              </h3>
              <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(memory);
                  }}
                  aria-label="Edit memory"
                  className="p-1 hover:bg-gray-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  <Edit className="w-3 h-3 text-gray-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(memory._id);
                  }}
                  aria-label="Delete memory"
                  className="p-1 hover:bg-red-900/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              {memory.content}
            </p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs text-white border-0",
                  IMPORTANCE_COLORS[memory.importance]
                )}
              >
                {memory.importance}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {formatTimeAgo(memory.createdAt)}
              </div>
              {memory.source && (
                <span className="text-xs text-gray-500">via {memory.source}</span>
              )}
            </div>
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-white/[0.06] rounded-full text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MemorySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="glass highlight-top overflow-hidden">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function MemoryPage() {
  const memories = useQuery(api.memories.getAllMemories);
  const isLoading = memories === undefined;
  const createMemory = useMutation(api.memories.createMemory);
  const updateMemory = useMutation(api.memories.updateMemory);
  const deleteMemory = useMutation(api.memories.deleteMemory);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [importanceFilter, setImportanceFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    type: Memory["type"];
    importance: Memory["importance"];
    source: string;
    tags: string;
  }>({
    title: "",
    content: "",
    type: "note",
    importance: "medium",
    source: "",
    tags: "",
  });

  const filteredMemories = useMemo(() => {
    return (memories ?? [])
      .filter((memory) => {
        if (typeFilter && memory.type !== typeFilter) return false;
        if (importanceFilter && memory.importance !== importanceFilter) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            memory.title.toLowerCase().includes(query) ||
            memory.content.toLowerCase().includes(query) ||
            memory.tags?.some((t) => t.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [memories, searchQuery, typeFilter, importanceFilter]);

  const handleCreate = () => {
    setEditingMemory(null);
    setFormData({
      title: "",
      content: "",
      type: "note",
      importance: "medium",
      source: "",
      tags: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setFormData({
      title: memory.title,
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      source: memory.source || "",
      tags: memory.tags?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data = {
      ...formData,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
    };

    if (editingMemory) {
      await updateMemory({
        id: editingMemory._id,
        ...data,
      });
    } else {
      await createMemory(data);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: Id<"memories">) => {
    if (!(await confirm({ title: "Delete this memory?", destructive: true }))) return;
    await deleteMemory({ id });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter(null);
    setImportanceFilter(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Memory Archive</h1>
          <p className="text-gray-400 mt-1">
            Search and manage your archived memories
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Memory
        </Button>
      </div>

      <Card className="glass-subtle mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={typeFilter || "all"}
              onValueChange={(v) => setTypeFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(MEMORY_TYPES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={importanceFilter || "all"}
              onValueChange={(v) => setImportanceFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Importance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Importance</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || typeFilter || importanceFilter) && (
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <MemorySkeleton />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          {filteredMemories.map((memory) => (
            <MemoryCard
              key={memory._id}
              memory={memory}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {filteredMemories.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300">
                {(memories ?? []).length === 0 ? "No memories yet" : "No matches found"}
              </h3>
              <p className="text-gray-500 mt-1">
                {(memories ?? []).length === 0
                  ? "Start building your memory archive"
                  : "Try adjusting your filters or search query"}
              </p>
            </div>
          )}
        </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMemory ? "Edit Memory" : "New Memory"}
            </DialogTitle>
            <DialogDescription>
              {editingMemory ? "Update memory details" : "Archive a new memory"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Memory title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="What do you want to remember?"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-200">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v as Memory["type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEMORY_TYPES).map(([key, { label, icon: Icon }]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-200">Importance</label>
                <Select
                  value={formData.importance}
                  onValueChange={(v) =>
                    setFormData({ ...formData, importance: v as Memory["importance"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Source</label>
              <Input
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                placeholder="e.g., Discord, Meeting, etc."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Tags</label>
              <Input
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingMemory ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}

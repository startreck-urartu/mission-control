"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Play,
  Pause,
  CheckCircle,
  FileText,
  Image,
  Video,
  Share2,
  Mic,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Edit,
  User,
  Bot,
  Tag,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Doc } from "@/convex/_generated/dataModel";

type Content = Doc<"content">;

type ContentStage = "idea" | "script" | "thumbnail" | "filming" | "editing" | "published";
type ContentType = "video" | "blog" | "social" | "email";
type AssignedTo = "human" | "openclaw";

const STAGES = [
  { id: "idea", label: "Idea", icon: FileText, color: "bg-gray-500" },
  { id: "script", label: "Script", icon: FileText, color: "bg-blue-500" },
  { id: "thumbnail", label: "Thumbnail", icon: Image, color: "bg-purple-500" },
  { id: "filming", label: "Filming", icon: Video, color: "bg-yellow-500" },
  { id: "editing", label: "Editing", icon: FileText, color: "bg-orange-500" },
  { id: "published", label: "Published", icon: Share2, color: "bg-green-500" },
] as const;

const CONTENT_TYPES = {
  video: { icon: Play, color: "text-red-400" },
  blog: { icon: FileText, color: "text-blue-400" },
  social: { icon: Share2, color: "text-purple-400" },
  podcast: { icon: Mic, color: "text-yellow-400" },
};

function ContentCard({
  content,
  onEdit,
  onDelete,
  onAdvance,
  onPrevious,
}: {
  content: Content;
  onEdit: (content: Content) => void;
  onDelete: (id: string) => void;
  onAdvance: (id: string) => void;
  onPrevious: (id: string) => void;
}) {
  const stageIndex = STAGES.findIndex((s) => s.id === content.stage);
  const progressPercent = ((stageIndex + 1) / STAGES.length) * 100;
  const TypeIcon = CONTENT_TYPES[content.contentType].icon;

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all group overflow-hidden">
      <div className="h-1 w-full bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon
              className={cn(
                "w-4 h-4",
                CONTENT_TYPES[content.contentType].color
              )}
            />
            <Badge variant="outline" className="text-xs">
              {content.contentType}
            </Badge>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(content)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <Edit className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={() => onDelete(content._id)}
              className="p-1 hover:bg-red-900/30 rounded"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-100 mt-2 leading-tight">
          {content.title}
        </h3>

        {content.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {content.description}
          </p>
        )}

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            {content.assignedTo === "human" ? (
              <User className="w-3 h-3 text-gray-400" />
            ) : (
              <Bot className="w-3 h-3 text-purple-400" />
            )}
            <span className="text-xs text-gray-400">
              {content.assignedTo === "human" ? "Human" : "OpenClaw"}
            </span>
          </div>

          {content.platform && (
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{content.platform}</span>
            </div>
          )}

          {content.publishDate && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">
                {formatDate(content.publishDate)}
              </span>
            </div>
          )}
        </div>

        {content.tags && content.tags.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {content.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-4 pt-3 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            disabled={stageIndex === 0}
            onClick={() => onPrevious(content._id)}
            className="h-7 px-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={stageIndex === STAGES.length - 1}
            onClick={() => onAdvance(content._id)}
            className={cn(
              "h-7 px-2",
              stageIndex === STAGES.length - 1
                ? ""
                : "hover:bg-green-900/30 hover:text-green-400"
            )}
          >
            {stageIndex === STAGES.length - 1 ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function ContentPage() {
  const content = useQuery(api.content.getAllContent) || [];
  const createContent = useMutation(api.content.createContent);
  const updateContent = useMutation(api.content.updateContent);
  const deleteContent = useMutation(api.content.deleteContent);
  const advanceStage = useMutation(api.content.advanceStage);
  const updateContentStage = useMutation(api.content.updateContent);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    stage: ContentStage;
    contentType: ContentType;
    platform: string;
    scriptContent: string;
    assignedTo: AssignedTo;
    tags: string;
    thumbnailUrl: string;
    videoUrl: string;
    publishDate: string;
  }>({
    title: "",
    description: "",
    stage: "idea",
    contentType: "video",
    platform: "",
    scriptContent: "",
    assignedTo: "human",
    tags: "",
    thumbnailUrl: "",
    videoUrl: "",
    publishDate: "",
  });

  const contentByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.id] = content.filter((c) => c.stage === stage.id);
      return acc;
    }, {} as Record<string, Content[]>);
  }, [content]);

  const handleCreate = () => {
    setEditingContent(null);
    setFormData({
      title: "",
      description: "",
      stage: "idea",
      contentType: "video",
      platform: "",
      scriptContent: "",
      assignedTo: "human",
      tags: "",
      thumbnailUrl: "",
      videoUrl: "",
      publishDate: "",
    });
    setSelectedStage(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (c: Content) => {
    setEditingContent(c);
    setFormData({
      title: c.title,
      description: c.description || "",
      stage: c.stage,
      contentType: c.contentType,
      platform: c.platform || "",
      scriptContent: c.scriptContent || "",
      assignedTo: c.assignedTo,
      tags: c.tags?.join(", ") || "",
      thumbnailUrl: c.thumbnailUrl || "",
      videoUrl: c.videoUrl || "",
      publishDate: c.publishDate ? c.publishDate.slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data = {
      ...formData,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
    };

    if (editingContent) {
      await updateContent({
        id: editingContent._id,
        ...data,
      });
    } else {
      await createContent(data);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this content?")) {
      await deleteContent({ id: id as any });
    }
  };

  const handleAdvance = async (id: string) => {
    await advanceStage({ id: id as any });
  };

  const handlePrevious = async (id: string) => {
    const c = content.find((x) => x._id === id);
    if (!c) return;
    const currentIndex = STAGES.findIndex((s) => s.id === c.stage);
    const prevStage = STAGES[currentIndex - 1];
    if (prevStage) {
      await updateContentStage({ id: id as any, stage: prevStage.id });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Pipeline</h1>
          <p className="text-gray-400 mt-1">
            From idea to published - track your content creation workflow
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Content
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const stageContent = contentByStage[stage.id] || [];

            return (
              <div key={stage.id} className="w-72 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      stage.color
                    )}
                  >
                    <StageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-gray-100">{stage.label}</h2>
                      <Badge variant="secondary" className="bg-gray-800">
                        {stageContent.length}
                      </Badge>
                    </div>
                    <div
                      className="h-0.5 mt-1 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${
                          index <= 2 ? "#3b82f6" : index === 3 ? "#eab308" : "#22c55e"
                        }, transparent)`,
                        width: "100%",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {stageContent.map((c) => (
                    <ContentCard
                      key={c._id}
                      content={c}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAdvance={handleAdvance}
                      onPrevious={handlePrevious}
                    />
                  ))}
                  {stageContent.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-lg">
                      <span className="text-sm text-gray-500">No content</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContent ? "Edit Content" : "Create New Content"}
            </DialogTitle>
            <DialogDescription>
              {editingContent
                ? "Update content details"
                : "Add new content to your pipeline"}
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
                placeholder="Content title"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-200">Content Type</label>
                <Select
                  value={formData.contentType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, contentType: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video"><Video className="w-4 h-4 mr-2 inline" />Video</SelectItem>
                    <SelectItem value="blog"><FileText className="w-4 h-4 mr-2 inline" />Blog</SelectItem>
                    <SelectItem value="social"><Share2 className="w-4 h-4 mr-2 inline" />Social</SelectItem>
                    <SelectItem value="podcast"><Mic className="w-4 h-4 mr-2 inline" />Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-200">Stage</label>
                <Select
                  value={formData.stage}
                  onValueChange={(v) =>
                    setFormData({ ...formData, stage: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-200">Platform</label>
                <Input
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                  placeholder="e.g., YouTube, Twitter"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-200">Assigned To</label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(v) =>
                    setFormData({ ...formData, assignedTo: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human">Human</SelectItem>
                    <SelectItem value="openclaw">OpenClaw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Tags</label>
              <Input
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="tag1, tag2"
              />
            </div>

            {formData.stage === "script" || formData.stage === "editing" ? (
              <div>
                <label className="text-sm font-medium text-gray-200">Script Content</label>
                <Textarea
                  value={formData.scriptContent}
                  onChange={(e) =>
                    setFormData({ ...formData, scriptContent: e.target.value })
                  }
                  placeholder="Script content..."
                  className="min-h-[150px]"
                />
              </div>
            ) : null}

            {formData.stage === "thumbnail" ? (
              <div>
                <label className="text-sm font-medium text-gray-200">Thumbnail URL</label>
                <Input
                  value={formData.thumbnailUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnailUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            ) : null}

            {formData.stage === "published" ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-200">Video URL</label>
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-200">Publish Date</label>
                  <Input
                    type="datetime-local"
                    value={formData.publishDate}
                    onChange={(e) =>
                      setFormData({ ...formData, publishDate: e.target.value })
                    }
                  />
                </div>
              </>
            ) : null}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingContent ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

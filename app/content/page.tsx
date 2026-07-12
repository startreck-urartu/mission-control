"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Play,
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
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn, formatDate } from "@/lib/utils";
import {
  contentStageAccent,
  accentPill,
  accentBg,
  accentBorderT,
  accentText,
  type AccentName,
} from "@/lib/status-colors";
import { Doc, Id } from "@/convex/_generated/dataModel";

type Content = Doc<"content">;

// Content pipeline types (keep in sync with convex/schema.ts)
type ContentStage = "idea" | "script" | "thumbnail" | "filming" | "editing" | "published";
type ContentType = "video" | "blog" | "social" | "podcast";
type AssignedTo = "human" | "openclaw";

const STAGES = [
  { id: "idea", label: "Idea", icon: FileText },
  { id: "script", label: "Script", icon: FileText },
  { id: "thumbnail", label: "Thumbnail", icon: Image },
  { id: "filming", label: "Filming", icon: Video },
  { id: "editing", label: "Editing", icon: FileText },
  { id: "published", label: "Published", icon: Share2 },
] as const;

// AccentName-valued map — allowed per spec
const CONTENT_TYPE_ACCENT: Record<ContentType, AccentName> = {
  video: "blue",
  blog: "purple",
  social: "teal",
  podcast: "orange",
};

const CONTENT_TYPE_ICON: Record<ContentType, typeof Play> = {
  video: Play,
  blog: FileText,
  social: Share2,
  podcast: Mic,
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
  onDelete: (id: Id<"content">) => void;
  onAdvance: (id: Id<"content">) => void;
  onPrevious: (id: Id<"content">) => void;
}) {
  const stageIndex = STAGES.findIndex((s) => s.id === content.stage);
  const progressPercent = ((stageIndex + 1) / STAGES.length) * 100;
  const stageAccent = contentStageAccent[content.stage] ?? "gray";
  const TypeIcon = CONTENT_TYPE_ICON[content.contentType];
  const typeAccent = CONTENT_TYPE_ACCENT[content.contentType] ?? "gray";

  return (
    <Card className="transition-all group overflow-hidden">
      {/* Progress bar track + fill */}
      <div className="h-1 w-full bg-fill">
        <div
          className={cn("h-full transition-all", accentBg[stageAccent])}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className={cn("w-4 h-4", accentText[typeAccent])} />
            <Badge color={typeAccent} className="text-xs">
              {content.contentType}
            </Badge>
          </div>
          <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(content)}
              aria-label="Edit content"
              className="p-1 hover:bg-fill rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            >
              <Edit className="w-3 h-3 text-muted" />
            </button>
            <button
              onClick={() => onDelete(content._id)}
              aria-label="Delete content"
              className="p-1 hover:bg-accent-red-tint rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            >
              <Trash2 className="w-3 h-3 text-accent-red" />
            </button>
          </div>
        </div>

        <h3 className="text-sm font-medium text-foreground mt-2 leading-tight">
          {content.title}
        </h3>

        {content.description && (
          <p className="text-xs text-muted mt-1 line-clamp-2">
            {content.description}
          </p>
        )}

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            {content.assignedTo === "human" ? (
              <User className="w-3 h-3 text-muted" />
            ) : (
              <Bot className="w-3 h-3 text-accent-purple" />
            )}
            <span className="text-xs text-muted">
              {content.assignedTo === "human" ? "Human" : "OpenClaw"}
            </span>
          </div>

          {content.platform && (
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-muted" />
              <span className="text-xs text-muted">{content.platform}</span>
            </div>
          )}

          {content.publishDate && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3 h-3 text-accent-green" />
              <span className="text-xs text-accent-green">
                {formatDate(content.publishDate)}
              </span>
            </div>
          )}
        </div>

        {content.tags && content.tags.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {content.tags.map((tag) => (
              <Badge key={tag} color="gray" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between mt-4 pt-3 border-t border-separator">
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
                : "hover:bg-accent-green-tint hover:text-accent-green"
            )}
          >
            {stageIndex === STAGES.length - 1 ? (
              <CheckCircle className="w-4 h-4 text-accent-green" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ContentSkeleton() {
  return (
    <div className="flex gap-4 pb-4 min-w-0 md:min-w-max">
      {STAGES.map((stage) => (
        <div key={stage.id} className="w-60 sm:w-72 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-0.5 w-full" />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ContentPage() {
  const content = useQuery(api.content.getAllContent);
  const isLoading = content === undefined;
  const createContent = useMutation(api.content.createContent);
  const updateContent = useMutation(api.content.updateContent);
  const deleteContent = useMutation(api.content.deleteContent);
  const advanceStage = useMutation(api.content.advanceStage);
  const updateContentStage = useMutation(api.content.updateContent);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const { confirm, confirmDialog } = useConfirm();

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
      acc[stage.id] = (content ?? []).filter((c) => c.stage === stage.id);
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

  const handleDelete = async (id: Id<"content">) => {
    if (!(await confirm({ title: "Delete this content?", destructive: true }))) return;
    await deleteContent({ id });
  };

  const handleAdvance = async (id: Id<"content">) => {
    await advanceStage({ id });
  };

  const handlePrevious = async (id: Id<"content">) => {
    const c = (content ?? []).find((x) => x._id === id);
    if (!c) return;
    const currentIndex = STAGES.findIndex((s) => s.id === c.stage);
    const prevStage = STAGES[currentIndex - 1];
    if (prevStage) {
      await updateContentStage({ id, stage: prevStage.id });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Content Pipeline"
        subtitle="From idea to published - track your content creation workflow"
      >
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Content
        </Button>
      </PageHeader>

      <div className="flex-1 overflow-x-auto">
        {isLoading ? (
          <ContentSkeleton />
        ) : (
        <div className="flex gap-4 pb-4 min-w-0 md:min-w-max">
          {STAGES.map((stage) => {
            const StageIcon = stage.icon;
            const stageContent = contentByStage[stage.id] || [];
            const accent = contentStageAccent[stage.id] ?? "gray";

            return (
              <div key={stage.id} className="w-60 sm:w-72 flex-shrink-0">
                <div
                  className={cn(
                    "glass-pane rounded-2xl border border-separator border-t-2 mb-3 p-2",
                    accentBorderT[accent]
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        accentPill[accent]
                      )}
                    >
                      <StageIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-foreground">{stage.label}</h2>
                        <Badge color="gray">
                          {stageContent.length}
                        </Badge>
                      </div>
                      <div
                        className={cn("h-0.5 mt-1 rounded-full", accentBg[accent])}
                        style={{ width: "100%" }}
                      />
                    </div>
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
                    <EmptyState message="No content" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
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
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Content title"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Content Type</label>
                <Select
                  value={formData.contentType}
                  onValueChange={(v) =>
                    setFormData({ ...formData, contentType: v as ContentType })
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
                <label className="text-sm font-medium text-foreground">Stage</label>
                <Select
                  value={formData.stage}
                  onValueChange={(v) =>
                    setFormData({ ...formData, stage: v as ContentStage })
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
                <label className="text-sm font-medium text-foreground">Platform</label>
                <Input
                  value={formData.platform}
                  onChange={(e) =>
                    setFormData({ ...formData, platform: e.target.value })
                  }
                  placeholder="e.g., YouTube, Twitter"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Assigned To</label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(v) =>
                    setFormData({ ...formData, assignedTo: v as AssignedTo })
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
              <label className="text-sm font-medium text-foreground">Tags</label>
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
                <label className="text-sm font-medium text-foreground">Script Content</label>
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
                <label className="text-sm font-medium text-foreground">Thumbnail URL</label>
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
                  <label className="text-sm font-medium text-foreground">Video URL</label>
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Publish Date</label>
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
      {confirmDialog}
    </div>
  );
}

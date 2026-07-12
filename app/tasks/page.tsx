"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  User,
  Bot,
  Clock,
  Trash2,
  Edit,
  Flag,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PageHeader } from "@/components/ui/page-header";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn, formatDate } from "@/lib/utils";
import {
  accentBg,
  accentBorderT,
  taskStatusAccent,
  priorityAccent,
} from "@/lib/status-colors";
import { Badge } from "@/components/ui/badge";
import { Doc, Id } from "@/convex/_generated/dataModel";

type Task = Doc<"tasks">;

const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "processing", title: "Processing" },
  { id: "review", title: "Review" },
  { id: "agent-reviewed", title: "Agent Reviewed" },
  { id: "done", title: "Done" },
  { id: "validation-error", title: "Validation Error" },
  { id: "failed", title: "Failed" },
] as const;

function SortableTaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: Id<"tasks">) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group"
    >
      <Card className="p-4 kanban-card cursor-move transition-all hover:shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-medium text-foreground leading-tight">
            {task.title}
          </h3>
          <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              aria-label={`Edit task "${task.title}"`}
              className="p-1 hover:bg-fill rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            >
              <Edit className="w-3 h-3 text-muted" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id);
              }}
              aria-label={`Delete task "${task.title}"`}
              className="p-1 hover:bg-accent-red-tint rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
            >
              <Trash2 className="w-3 h-3 text-accent-red" />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-muted mt-2 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge color={priorityAccent[task.priority] ?? "gray"}>
            <Flag className="w-3 h-3 mr-1" />
            {task.priority}
          </Badge>

          <div className="flex items-center gap-1 text-xs text-muted">
            {task.assignee === "human" ? (
              <User className="w-3 h-3" />
            ) : (
              <Bot className="w-3 h-3" />
            )}
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <Clock className="w-3 h-3" />
              {new Date(task.dueDate) < new Date() ? (
                <span className="text-accent-red">{formatDate(task.dueDate)}</span>
              ) : (
                formatDate(task.dueDate)
              )}
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-fill rounded-full text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function DroppableColumnBody({
  columnId,
  children,
}: {
  columnId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 rounded-b-lg border-t-0 p-2 overflow-y-auto transition-colors",
        isOver ? "bg-accent-blue-tint border-accent-blue/40" : "bg-glass backdrop-blur-xl"
      )}
    >
      {children}
    </div>
  );
}

function DragOverlayCard({ task }: { task: Task }) {
  return (
    <Card className="p-4 glass-pane-elevated rounded-2xl shadow-2xl rotate-2 scale-105 w-72">
      <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
      <Badge color={priorityAccent[task.priority] ?? "gray"} className="mt-2">
        {task.priority}
      </Badge>
    </Card>
  );
}

function TasksBoardSkeleton() {
  return (
    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 min-h-0 overflow-x-auto">
      {COLUMNS.map((column) => (
        <div key={column.id} className="flex flex-col min-h-0">
          <div className="p-3 rounded-t-lg glass-pane border border-separator border-t-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
          </div>
          <div className="flex-1 bg-glass backdrop-blur-xl rounded-b-lg border-t-0 p-2 overflow-y-auto">
            {[1, 2].map((i) => (
              <div key={i} className="mb-2">
                <Card className="p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full mt-2" />
                  <div className="flex items-center gap-2 mt-3">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-3" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TasksPage() {
  const tasks = useQuery(api.tasks.getAllTasks);
  const isLoading = tasks === undefined;
  const moveTask = useMutation(api.tasks.moveTask);
  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const { confirm, confirmDialog } = useConfirm();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: Task["status"];
    priority: Task["priority"];
    assignee: Task["assignee"];
    dueDate: string;
    tags: string;
  }>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee: "human",
    dueDate: "",
    tags: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasksByColumn = useMemo(() => {
    if (!tasks) return {};
    return tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks?.find((t) => t._id === activeId),
    [tasks, activeId]
  );

  async function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks?.find((t) => t._id === active.id);
    if (!activeTask) return;

    // over.id is a column id when dropping on the column body, or a task id
    // when dropping onto another card — resolve both to a target status
    const overId = String(over.id);
    const overTask = tasks?.find((t) => t._id === overId);
    const newStatus = COLUMNS.find((c) => c.id === overId)?.id ?? overTask?.status;

    if (newStatus && newStatus !== activeTask.status) {
      await moveTask({ id: activeTask._id, status: newStatus });
    }
  }

  function handleCreate() {
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assignee: "human",
      dueDate: "",
      tags: "",
    });
    setIsCreateDialogOpen(true);
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      dueDate: task.dueDate || "",
      tags: task.tags?.join(", ") || "",
    });
    setIsCreateDialogOpen(true);
  }

  async function handleSubmit() {
    const taskData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
      dueDate: formData.dueDate || undefined,
    };

    if (editingTask) {
      await updateTask({
        id: editingTask._id,
        ...taskData,
      });
    } else {
      await createTask(taskData);
    }

    setIsCreateDialogOpen(false);
    setEditingTask(null);
  }

  async function handleDelete(id: Id<"tasks">) {
    if (!(await confirm({ title: "Are you sure you want to delete this task?", destructive: true }))) return;
    await deleteTask({ id });
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Tasks Board" subtitle="Drag and drop tasks to organize your workflow">
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </PageHeader>

      {isLoading ? (
        <TasksBoardSkeleton />
      ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 min-h-0 overflow-x-auto">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="flex flex-col min-h-0"
            >
              <div className={cn("p-3 rounded-t-lg glass-pane border border-separator border-t-2", accentBorderT[taskStatusAccent[column.id] ?? "gray"])}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        accentBg[taskStatusAccent[column.id] ?? "gray"]
                      )}
                    />
                    <h2 className="font-semibold text-foreground text-sm">{column.title}</h2>
                  </div>
                  <span className="text-xs text-muted tabular-nums">
                    {tasksByColumn[column.id]?.length || 0}
                  </span>
                </div>
              </div>
              <DroppableColumnBody columnId={column.id}>
                <SortableContext
                  items={(tasksByColumn[column.id] || []).map((t) => t._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {(tasksByColumn[column.id] || []).map((task) => (
                    <div key={task._id} className="mb-2">
                      <SortableTaskCard
                        task={task}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </SortableContext>
                <div className="pb-2" />
              </DroppableColumnBody>
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({}) }}>
          {activeTask && <DragOverlayCard task={activeTask} />}
        </DragOverlay>
      </DndContext>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription>
              {editingTask
                ? "Update the task details"
                : "Add a new task to your board"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as Task["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="agent-reviewed">Agent Reviewed</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="validation-error">Validation Error</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData({ ...formData, priority: v as Task["priority"] })
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Assignee</label>
                <Select
                  value={formData.assignee}
                  onValueChange={(v) =>
                    setFormData({ ...formData, assignee: v as Task["assignee"] })
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
              <div>
                <label className="text-sm font-medium text-foreground">Due Date</label>
                <Input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
              <Input
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingTask ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}

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
import { Doc, Id } from "@/convex/_generated/dataModel";

type Task = Doc<"tasks">;

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-red-500/20 border-red-500/50" },
  { id: "in-progress", title: "In Progress", color: "bg-yellow-500/20 border-yellow-500/50" },
  { id: "processing", title: "Processing", color: "bg-purple-500/20 border-purple-500/50" },
  { id: "review", title: "Review", color: "bg-blue-500/20 border-blue-500/50" },
  { id: "agent-reviewed", title: "Agent Reviewed", color: "bg-cyan-500/20 border-cyan-500/50" },
  { id: "done", title: "Done", color: "bg-green-500/20 border-green-500/50" },
  { id: "validation-error", title: "Validation Error", color: "bg-orange-500/20 border-orange-500/50" },
  { id: "failed", title: "Failed", color: "bg-red-700/20 border-red-700/50" },
] as const;

const PRIORITY_COLORS = {
  high: "bg-red-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white",
};

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
      <Card className="p-4 bg-gray-800 border-gray-700 hover:border-gray-600 cursor-move transition-all hover:shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-medium text-gray-100 leading-tight">
            {task.title}
          </h3>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <Edit className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id);
              }}
              className="p-1 hover:bg-red-900/30 rounded"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]
            )}
          >
            <Flag className="w-3 h-3 mr-1" />
            {task.priority}
          </Badge>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            {task.assignee === "human" ? (
              <User className="w-3 h-3" />
            ) : (
              <Bot className="w-3 h-3" />
            )}
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {new Date(task.dueDate) < new Date() ? (
                <span className="text-red-400">{formatDate(task.dueDate)}</span>
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
                className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-300"
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
        "flex-1 bg-gray-900/50 rounded-b-lg border border-gray-800 border-t-0 p-2 overflow-y-auto transition-colors",
        isOver && "bg-gray-800/60 border-gray-600"
      )}
    >
      {children}
    </div>
  );
}

function DragOverlayCard({ task }: { task: Task }) {
  return (
    <Card className="p-4 bg-gray-800 border-gray-600 shadow-2xl rotate-2 scale-105">
      <h3 className="text-sm font-medium text-gray-100">{task.title}</h3>
      <Badge
        className={cn(
          "mt-2 text-xs",
          PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]
        )}
      >
        {task.priority}
      </Badge>
    </Card>
  );
}

export default function TasksPage() {
  const tasks = useQuery(api.tasks.getAllTasks);
  const moveTask = useMutation(api.tasks.moveTask);
  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

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
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask({ id });
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Tasks Board</h1>
          <p className="text-gray-400 mt-1">
            Drag and drop tasks to organize your workflow
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </Button>
      </div>

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
              <div
                className={cn(
                  "p-3 rounded-t-lg border-t-2",
                  column.color
                )}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-100">{column.title}</h2>
                  <Badge variant="secondary" className="bg-gray-800">
                    {tasksByColumn[column.id]?.length || 0}
                  </Badge>
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
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-200">Description</label>
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
                <label className="text-sm font-medium text-gray-200">Status</label>
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
                <label className="text-sm font-medium text-gray-200">Priority</label>
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
                <label className="text-sm font-medium text-gray-200">Assignee</label>
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
                <label className="text-sm font-medium text-gray-200">Due Date</label>
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
              <label className="text-sm font-medium text-gray-200">Tags (comma separated)</label>
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
    </div>
  );
}

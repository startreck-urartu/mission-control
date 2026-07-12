"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Repeat,
  Zap,
  Users,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { accentPill, accentBg, accentText, type AccentName } from "@/lib/status-colors";

type CalendarEvent = Doc<"calendar">;

const EVENT_TYPE_ACCENT: Record<string, AccentName> = {
  cron: "teal",
  task: "blue",
  meeting: "purple",
  milestone: "orange",
};

const EVENT_TYPE_ICONS = {
  task: CheckCircle2,
  cron: Zap,
  meeting: Users,
  milestone: CalendarIcon,
};

function CalendarGrid({
  currentDate,
  events,
  onSelectDate,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventsByDay = useMemo(() => {
    return days.reduce((acc, day) => {
      acc[format(day, "yyyy-MM-dd")] = events.filter((e) =>
        isSameDay(new Date(e.startDate), day)
      );
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events, days]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex-1 flex flex-col">
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-[10px] font-semibold text-tertiary uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay[dayKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const isExpanded = expandedDays.has(dayKey);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "min-h-[100px] p-2 rounded-lg border cursor-pointer transition-all hover:border-accent-blue/40",
                isCurrentMonth
                  ? "bg-glass border-separator"
                  : "bg-glass/50 border-separator",
                isTodayDate && "bg-accent-blue-tint border-separator"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm",
                    isTodayDate
                      ? "text-accent-blue font-semibold"
                      : isCurrentMonth
                      ? "text-foreground font-medium"
                      : "text-tertiary font-medium"
                  )}
                >
                  {format(day, "d")}
                </span>
                {isTodayDate && (
                  <Badge color="blue" className="text-xs">
                    Today
                  </Badge>
                )}
              </div>
              <div className="space-y-1 mt-1">
                {(isExpanded ? dayEvents : dayEvents.slice(0, 3)).map((event) => {
                  const accent = EVENT_TYPE_ACCENT[event.type] ?? "gray";
                  return (
                    <div
                      key={event._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className={cn(
                        "text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80",
                        accentPill[accent]
                      )}
                    >
                      {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDays((prev) => {
                        const next = new Set(prev);
                        if (next.has(dayKey)) next.delete(dayKey); else next.add(dayKey);
                        return next;
                      });
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).click(); } }}
                    className="text-xs text-muted px-2 cursor-pointer hover:text-foreground select-none"
                  >
                    {isExpanded ? "Show less" : `+${dayEvents.length - 3} more`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-2 flex justify-center">
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[100px] p-2 rounded-lg border bg-glass border-separator"
            >
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-5 w-full mt-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-80 lg:flex-shrink-0">
        <Card>
          <div className="p-4 border-b border-separator">
            <h2 className="font-semibold text-foreground">Upcoming Events</h2>
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg glass-pane">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const events = useQuery(api.calendar.getAllEvents);
  const isLoading = events === undefined;
  const createEvent = useMutation(api.calendar.createEvent);
  const updateEvent = useMutation(api.calendar.updateEvent);
  const deleteEvent = useMutation(api.calendar.deleteEvent);

  const { confirm, confirmDialog } = useConfirm();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "task" as "task" | "cron" | "meeting" | "milestone",
    startDate: "",
    endDate: "",
    allDay: false,
    recurrence: "",
    color: "#3b82f6",
    assignedTo: "human" as "human" | "openclaw",
  });

  const handlePreviousMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCreate = (date?: Date) => {
    setEditingEvent(null);
    const initialDate = date || selectedDate || new Date();
    setFormData({
      title: "",
      description: "",
      type: "task",
      startDate: format(initialDate, "yyyy-MM-dd'T'HH:mm"),
      endDate: "",
      allDay: false,
      recurrence: "",
      color: "#3b82f6",
      assignedTo: "human",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      type: event.type,
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate ? event.endDate.slice(0, 16) : "",
      allDay: event.allDay || false,
      recurrence: event.recurrence || "",
      color: event.color || "#3b82f6",
      assignedTo: event.assignedTo || "human",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data = {
      ...formData,
      endDate: formData.endDate || undefined,
    };

    if (editingEvent) {
      await updateEvent({
        id: editingEvent._id,
        ...data,
      });
    } else {
      await createEvent(data);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete this event?", destructive: true }))) return;
    await deleteEvent({ id: id as Id<"calendar"> });
  };

  const upcomingEvents = (events ?? [])
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Calendar">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xl font-medium text-foreground w-40 text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" aria-label="Next month" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="ghost" onClick={handleToday}>
          Today
        </Button>
        <Button onClick={() => handleCreate()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </PageHeader>

      {isLoading ? (
        <CalendarPageSkeleton />
      ) : (
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <CalendarGrid
            currentDate={currentDate}
            events={events ?? []}
            onSelectDate={handleCreate}
            onSelectEvent={handleEdit}
          />
        </div>

        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <Card>
            <div className="p-4 border-b border-separator">
              <h2 className="font-semibold text-foreground">Upcoming Events</h2>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {upcomingEvents.map((event) => {
                const Icon = EVENT_TYPE_ICONS[event.type];
                const accent = EVENT_TYPE_ACCENT[event.type] ?? "gray";
                return (
                  <div
                    key={event._id}
                    onClick={() => handleEdit(event)}
                    className="p-3 rounded-lg glass-pane cursor-pointer transition-all group hover:bg-fill"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
                          accentPill[accent]
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-muted mt-1">
                          {format(new Date(event.startDate), "MMM d, yyyy h:mm a")}
                        </p>
                        {event.recurrence && (
                          <div className="flex items-center gap-1 mt-1">
                            <Repeat className="w-3 h-3 text-tertiary" />
                            <span className="text-xs text-tertiary">
                              {event.recurrence}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event._id);
                          }}
                          aria-label={`Delete event "${event.title}"`}
                          className="p-1 hover:bg-accent-red-tint rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                        >
                          <Trash2 className="w-3 h-3 text-accent-red" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingEvents.length === 0 && (
                <EmptyState
                  icon={CalendarIcon}
                  message="No upcoming events"
                />
              )}
            </div>
          </Card>

          <Card className="mt-4">
            <div className="p-4 border-b border-separator">
              <h2 className="font-semibold text-foreground">Legend</h2>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(EVENT_TYPE_ACCENT).map(([type, accent]) => {
                const Icon = EVENT_TYPE_ICONS[type as keyof typeof EVENT_TYPE_ICONS];
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded", accentBg[accent])} />
                    <Icon className={cn("w-4 h-4", accentText[accent])} />
                    <span className="text-sm text-muted capitalize">{type}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Create Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update event details" : "Schedule a new event"}
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
                placeholder="Event title"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Event description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      type: v as "task" | "cron" | "meeting" | "milestone",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="cron">Cron Job</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Assigned To</label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      assignedTo: v as "human" | "openclaw",
                    })
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Start Date</label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">End Date</label>
                <Input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Recurrence</label>
              <Select
                value={formData.recurrence || "none"}
                onValueChange={(v) =>
                  setFormData({ ...formData, recurrence: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No recurrence</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingEvent ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  );
}

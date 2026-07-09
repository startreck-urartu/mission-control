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
import { cn } from "@/lib/utils";
import { Doc, Id } from "@/convex/_generated/dataModel";

type CalendarEvent = Doc<"calendar">;

const EVENT_COLORS = {
  task: "bg-blue-500",
  cron: "bg-purple-500",
  meeting: "bg-green-500",
  milestone: "bg-yellow-500",
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
            className="p-2 text-center text-sm font-medium text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day) => {
          const dayEvents = eventsByDay[format(day, "yyyy-MM-dd")] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "min-h-[100px] p-2 rounded-lg border cursor-pointer transition-all hover:border-gray-600",
                isCurrentMonth
                  ? "bg-gray-900 border-gray-800"
                  : "bg-gray-900/50 border-gray-900",
                isTodayDate && "border-blue-500/50 bg-blue-500/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isTodayDate
                      ? "text-blue-400"
                      : isCurrentMonth
                      ? "text-gray-200"
                      : "text-gray-600"
                  )}
                >
                  {format(day, "d")}
                </span>
                {isTodayDate && (
                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                    Today
                  </Badge>
                )}
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(event);
                    }}
                    className={cn(
                      "text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80",
                      EVENT_COLORS[event.type]
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{dayEvents.length - 3} more
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

export default function CalendarPage() {
  const events = useQuery(api.calendar.getAllEvents) || [];
  const createEvent = useMutation(api.calendar.createEvent);
  const updateEvent = useMutation(api.calendar.updateEvent);
  const deleteEvent = useMutation(api.calendar.deleteEvent);

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
    if (confirm("Delete this event?")) {
      await deleteEvent({ id: id as Id<"calendar"> });
    }
  };

  const upcomingEvents = events
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xl font-medium text-gray-200 w-40 text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" onClick={handleToday}>
            Today
          </Button>
        </div>
        <Button onClick={() => handleCreate()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            onSelectDate={handleCreate}
            onSelectEvent={handleEdit}
          />
        </div>

        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <Card className="glass-subtle">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold text-gray-100">Upcoming Events</h2>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {upcomingEvents.map((event) => {
                const Icon = EVENT_TYPE_ICONS[event.type];
                return (
                  <div
                    key={event._id}
                    onClick={() => handleEdit(event)}
                    className="p-3 rounded-lg glass card-hover highlight-top cursor-pointer transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
                          EVENT_COLORS[event.type]
                        )}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-100 truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(event.startDate), "MMM d, yyyy h:mm a")}
                        </p>
                        {event.recurrence && (
                          <div className="flex items-center gap-1 mt-1">
                            <Repeat className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {event.recurrence}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event._id);
                          }}
                          className="p-1 hover:bg-red-900/30 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No upcoming events
                </div>
              )}
            </div>
          </Card>

          <Card className="glass-subtle mt-4">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-semibold text-gray-100">Legend</h2>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(EVENT_COLORS).map(([type, color]) => {
                const Icon = EVENT_TYPE_ICONS[type as keyof typeof EVENT_TYPE_ICONS];
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded", color)} />
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 capitalize">{type}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

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
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Event title"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200">Description</label>
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
                <label className="text-sm font-medium text-gray-200">Type</label>
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
                <label className="text-sm font-medium text-gray-200">Assigned To</label>
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
                <label className="text-sm font-medium text-gray-200">Start Date</label>
                <Input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-200">End Date</label>
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
              <label className="text-sm font-medium text-gray-200">Recurrence</label>
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
    </div>
  );
}

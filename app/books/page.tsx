"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit2,
  BookMarked,
  Clock,
  CheckCircle,
  Star,
  FolderOpen,
} from "lucide-react";
import { Doc, Id } from "@/convex/_generated/dataModel";

type Book = Doc<"books">;

const categories = [
  { value: "business", label: "Business", icon: "💼" },
  { value: "technical", label: "Technical", icon: "⚙️" },
  { value: "design", label: "Design", icon: "🎨" },
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "leadership", label: "Leadership", icon: "👑" },
  { value: "finance", label: "Finance", icon: "💰" },
  { value: "legal", label: "Legal", icon: "⚖️" },
  { value: "personal-development", label: "Personal Development", icon: "🌱" },
  { value: "industry-specific", label: "Industry Specific", icon: "💎" },
  { value: "reference", label: "Reference", icon: "📚" },
  { value: "other", label: "Other", icon: "📄" },
];

const formats = [
  { value: "pdf", label: "PDF", icon: "📕" },
  { value: "epub", label: "EPUB", icon: "📗" },
  { value: "doc", label: "DOC", icon: "📝" },
  { value: "docx", label: "DOCX", icon: "📝" },
  { value: "txt", label: "TXT", icon: "📃" },
  { value: "md", label: "Markdown", icon: "📘" },
  { value: "other", label: "Other", icon: "📎" },
];

const statuses = [
  { value: "to-read", label: "To Read", color: "bg-gray-500" },
  { value: "reading", label: "Reading", color: "bg-blue-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "reference", label: "Reference", color: "bg-purple-500" },
  { value: "archived", label: "Archived", color: "bg-yellow-500" },
];

export default function BooksPage() {
  const books = useQuery(api.books.getAllBooks);
  const stats = useQuery(api.books.getLibraryStats);
  const team = useQuery(api.team.getAllTeamMembers);
  const createBook = useMutation(api.books.createBook);
  const updateBook = useMutation(api.books.updateBook);
  const deleteBook = useMutation(api.books.deleteBook);
  const recordAccess = useMutation(api.books.recordAccess);

  const statsLoading = stats === undefined;
  const booksLoading = books === undefined;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState<{
    title: string;
    author: string;
    description: string;
    category: Book["category"];
    format: Book["format"];
    filePath: string;
    fileSize: number;
    fileUrl: string;
    thumbnailUrl: string;
    priority: Book["priority"];
    notes: string;
    tags: string;
  }>({
    title: "",
    author: "",
    description: "",
    category: "business",
    format: "pdf",
    filePath: "",
    fileSize: 0,
    fileUrl: "",
    thumbnailUrl: "",
    priority: "medium",
    notes: "",
    tags: "",
  });

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter((book) => {
      const matchesSearch =
        searchQuery === "" ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        book.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesCategory =
        filterCategory === "all" || book.category === filterCategory;
      const matchesStatus =
        filterStatus === "all" || book.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [books, searchQuery, filterCategory, filterStatus]);

  const handleCreate = () => {
    setEditingBook(null);
    setFormData({
      title: "",
      author: "",
      description: "",
      category: "business",
      format: "pdf",
      filePath: "",
      fileSize: 0,
      fileUrl: "",
      thumbnailUrl: "",
      priority: "medium",
      notes: "",
      tags: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author || "",
      description: book.description || "",
      category: book.category,
      format: book.format,
      filePath: book.filePath || "",
      fileSize: book.fileSize || 0,
      fileUrl: book.fileUrl || "",
      thumbnailUrl: book.thumbnailUrl || "",
      priority: book.priority,
      notes: book.notes || "",
      tags: book.tags.join(", "),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const mainAgent = team?.find((t) => t.isMainAgent);
    const addedBy = mainAgent?._id || team?.[0]?._id;

    if (!addedBy) {
      alert("No team member found to associate with this book");
      return;
    }

    if (editingBook) {
      await updateBook({
        id: editingBook._id,
        title: formData.title,
        author: formData.author || undefined,
        description: formData.description || undefined,
        category: formData.category,
        status: undefined, // Keep current status
        priority: formData.priority,
        notes: formData.notes || undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        thumbnailUrl: formData.thumbnailUrl || undefined,
      });
    } else {
      await createBook({
        title: formData.title,
        author: formData.author || undefined,
        description: formData.description || undefined,
        category: formData.category,
        format: formData.format,
        filePath: formData.filePath || undefined,
        fileSize: formData.fileSize || undefined,
        fileUrl: formData.fileUrl || undefined,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        priority: formData.priority,
        notes: formData.notes || undefined,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        addedBy,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: Id<"books">) => {
    if (confirm("Delete this book from the library?")) {
      await deleteBook({ id });
    }
  };

  const handleOpenBook = async (book: Book) => {
    await recordAccess({ id: book._id });
    if (book.fileUrl) {
      window.open(book.fileUrl, "_blank");
    } else if (book.filePath) {
      // For local files, we can't directly open them from browser
      // This would need a custom protocol or file server
      alert(`Local file: ${book.filePath}\n\nFor local files, navigate to this path on your system.`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCategoryLabel = (value: string) =>
    categories.find((c) => c.value === value)?.label || value;
  const getCategoryIcon = (value: string) =>
    categories.find((c) => c.value === value)?.icon || "📄";
  const getFormatIcon = (value: string) =>
    formats.find((f) => f.value === value)?.icon || "📎";
  const getStatusColor = (value: string) =>
    statuses.find((s) => s.value === value)?.color || "bg-gray-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Library</h1>
          <p className="text-gray-400 mt-1">
            Digital library for business literature and skill development
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Book
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass card-hover highlight-top">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total Books</CardTitle>
            <div className="p-2 rounded-lg bg-blue-400/10">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? <Skeleton className="h-8 w-12" /> : stats.totalBooks}
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover highlight-top">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Reading Now</CardTitle>
            <div className="p-2 rounded-lg bg-green-400/10">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? <Skeleton className="h-8 w-12" /> : stats.currentlyReading}
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover highlight-top">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Completed</CardTitle>
            <div className="p-2 rounded-lg bg-purple-400/10">
              <CheckCircle className="w-4 h-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? <Skeleton className="h-8 w-12" /> : stats.completed}
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover highlight-top">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Library Size</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-400/10">
              <FolderOpen className="w-4 h-4 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : formatFileSize(stats.totalSize)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search books, authors, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/[0.03] border-white/[0.08]"
            />
          </div>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] bg-white/[0.03] border-white/[0.08]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-white/[0.03] border-white/[0.08]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {booksLoading &&
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass card-hover highlight-top">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {filteredBooks?.map((book) => (
          <Card
            key={book._id}
            className="glass card-hover highlight-top transition-colors cursor-pointer group"
            onClick={() => handleOpenBook(book)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Thumbnail or Icon */}
                <div className="w-16 h-20 bg-white/[0.04] rounded-lg flex items-center justify-center flex-shrink-0">
                  {book.thumbnailUrl ? (
                    <img
                      src={book.thumbnailUrl}
                      alt={book.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">{getFormatIcon(book.format)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white truncate">{book.title}</h3>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${getStatusColor(
                        book.status
                      )}`}
                    />
                  </div>

                  {book.author && (
                    <p className="text-sm text-gray-400 truncate">{book.author}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryIcon(book.category)} {getCategoryLabel(book.category)}
                    </Badge>
                    {(book.fileSize ?? 0) > 0 && (
                      <span className="text-xs text-gray-500">
                        {formatFileSize(book.fileSize ?? 0)}
                      </span>
                    )}
                  </div>

                  {book.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < book.rating!
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-500">
                      Opened {book.readCount} {book.readCount === 1 ? "time" : "times"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (visible on hover) */}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(book);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(book._id);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!booksLoading && !filteredBooks?.length && (
          <Card className="glass card-hover highlight-top col-span-full">
            <CardContent className="p-8 text-center">
              <BookMarked className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No books in the library yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Add your first book to start building your digital library.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle>
          <p className="text-sm text-gray-400">
              For local files, add the file path. For online documents, add the URL.
            </p>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Book title"
                  className="bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  placeholder="Author name"
                  className="bg-white/[0.03] border-white/[0.08]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the book"
                className="bg-white/[0.03] border-white/[0.08]"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v as Book["category"] })
                  }
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(v) =>
                    setFormData({ ...formData, format: v as Book["format"] })
                  }
                  disabled={!!editingBook}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {formats.map((fmt) => (
                      <SelectItem key={fmt.value} value={fmt.value}>
                        {fmt.icon} {fmt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData({ ...formData, priority: v as Book["priority"] })
                  }
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Local File Path</Label>
              <Input
                value={formData.filePath}
                onChange={(e) =>
                  setFormData({ ...formData, filePath: e.target.value })
                }
                placeholder="e.g., /Users/username/Documents/book.pdf"
                className="bg-white/[0.03] border-white/[0.08]"
              />
              <p className="text-xs text-gray-500">
                Path to the file on your local system
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>File Size (bytes)</Label>
                <Input
                  type="number"
                  value={formData.fileSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fileSize: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              <div className="space-y-2">
                <Label>File URL (if online)</Label>
                <Input
                  value={formData.fileUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, fileUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="bg-white/[0.03] border-white/[0.08]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={formData.thumbnailUrl}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnailUrl: e.target.value })
                }
                placeholder="https://..."
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="e.g., cad, jewelry, marketing"
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Personal notes about this book"
                className="bg-white/[0.03] border-white/[0.08]"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.title}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingBook ? "Update" : "Add Book"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

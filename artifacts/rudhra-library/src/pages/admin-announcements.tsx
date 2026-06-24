import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Trash2, Eye, EyeOff, MessageSquare, CalendarDays, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  info: "Info",
  warning: "Warning",
  urgent: "Urgent",
  event: "Event",
};

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-100 text-blue-800 border-blue-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
  event: "bg-green-100 text-green-800 border-green-200",
};

export default function AdminAnnouncements() {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", message: "", type: "info", expiresAt: "" });
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/announcements`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`${BASE}/api/announcements`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, expiresAt: data.expiresAt || null }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created");
      setAddOpen(false);
      setForm({ title: "", message: "", type: "info", expiresAt: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async (a: Announcement) => {
      const res = await fetch(`${BASE}/api/announcements/${a.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/announcements/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Deleted");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
          <h2 className="font-serif text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground mt-1">Manage announcements shown on the website.</p>
        </div>
        <Button size="lg" onClick={() => { setForm({ title: "", message: "", type: "info", expiresAt: "" }); setAddOpen(true); }}>
          <Plus className="mr-2 h-5 w-5" />
          New Announcement
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : announcements && announcements.length > 0 ? (
                  announcements.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">{a.message}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TYPE_COLORS[a.type] || TYPE_COLORS.info}>
                          {TYPE_LABELS[a.type] || a.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.isActive ? "default" : "secondary"} className={a.isActive ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" : ""}>
                          {a.isActive ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(a.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {a.expiresAt ? (
                          <span className={new Date(a.expiresAt) < new Date() ? "text-red-500 font-medium" : ""}>
                            {format(new Date(a.expiresAt), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleMutation.mutate(a)} title={a.isActive ? "Hide" : "Show"}>
                            {a.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(a)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <MessageSquare className="h-8 w-8 opacity-20" />
                        <p>No announcements yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message</label>
              <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your announcement..." rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expires at (optional)</label>
              <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">Auto-hides after this date/time. Leave empty for no expiry.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={e => { e.preventDefault(); if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

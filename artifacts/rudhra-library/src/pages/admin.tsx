import { useState, useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  Search, 
  Users, 
  UserCheck, 
  UserMinus, 
  IndianRupee, 
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Lock,
  LogOut,
  BookOpen
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";

import { SiteHeader } from "@/components/site-header";
import { StudentForm } from "@/components/student-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { toast } from "sonner";

import { 
  useGetStatsOverview, 
  useGetRecentStudents, 
  useListStudents,
  useDeleteStudent,
  getListStudentsQueryKey,
  getGetStatsOverviewQueryKey,
  getGetRecentStudentsQueryKey,
  ListStudentsStatus,
  Student
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { generateStudentCard } from "@/lib/pdf-generator";
import { useDebounce } from "@/hooks/use-debounce";

const COLORS = ['#1e3a8a', '#d97706', '#0d9488', '#b91c1c', '#6d28d9'];

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Galat password hai.");
      }
    } catch {
      setError("Server se connect nahi ho paya. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="font-serif text-2xl font-bold">Rudhra Library</h1>
          <p className="text-muted-foreground text-sm">Admin access required</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password daalo..."
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-60"
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState<ListStudentsStatus>(ListStudentsStatus.all);
  
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { isAdmin?: boolean }) => {
        setIsAdmin(!!d.isAdmin);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const handleLogout = async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    setIsAdmin(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin onLogin={() => setIsAdmin(true)} />;
  }

  const { data: stats, isLoading: statsLoading } = useGetStatsOverview();
  const { data: recent, isLoading: recentLoading } = useGetRecentStudents();
  
  const { data: students, isLoading: studentsLoading } = useListStudents({ 
    search: debouncedSearch, 
    status: status === ListStudentsStatus.all ? undefined : status 
  }, {
    query: {
      queryKey: getListStudentsQueryKey({ 
        search: debouncedSearch, 
        status: status === ListStudentsStatus.all ? undefined : status 
      })
    }
  });

  const deleteMutation = useDeleteStudent();

  const handleDelete = () => {
    if (!studentToDelete) return;
    
    deleteMutation.mutate({ id: studentToDelete.id }, {
      onSuccess: () => {
        toast.success("Student deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentStudentsQueryKey() });
        setStudentToDelete(null);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to delete student");
        setStudentToDelete(null);
      }
    });
  };

  const handleDownloadCard = async (student: Student) => {
    try {
      await generateStudentCard(student);
      toast.success("Card downloaded successfully");
    } catch (err) {
      toast.error("Failed to generate card");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage students, shifts, and library operations.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="lg" className="bg-primary" onClick={() => setIsAddFormOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Add New Student
            </Button>
            <Button variant="outline" size="lg" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold font-serif">{stats?.totalStudents || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold font-serif text-green-600">{stats?.activeStudents || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Memberships</CardTitle>
              <UserMinus className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-3xl font-bold font-serif text-red-600">{stats?.expiredStudents || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-3xl font-bold font-serif text-secondary">
                  ₹{(stats?.totalRevenue || 0).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          {/* Shift Breakdown Chart */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Shift Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </div>
              ) : stats?.shiftBreakdown && stats.shiftBreakdown.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.shiftBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="shift"
                      >
                        {stats.shiftBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : recent && recent.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {recent.map(student => (
                    <div key={student.id} className="flex items-center gap-4 p-3 border rounded-xl bg-card/50">
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.shift}</p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 text-right">
                        {format(new Date(student.joinDate), "MMM d")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No recent enrollments
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Students Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Students Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, phone..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Tabs value={status} onValueChange={(v) => setStatus(v as ListStudentsStatus)} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                  <TabsTrigger value={ListStudentsStatus.all}>All</TabsTrigger>
                  <TabsTrigger value={ListStudentsStatus.active}>Active</TabsTrigger>
                  <TabsTrigger value={ListStudentsStatus.expired}>Expired</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : students && students.length > 0 ? (
                    students.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium font-mono">{student.cardId}</TableCell>
                        <TableCell className="font-bold">{student.name}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/5 text-primary">
                            {student.shift}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.seatNumber || "-"}</TableCell>
                        <TableCell>{format(new Date(student.validUntil), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {student.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Active</Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Expired</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/admin/students/${student.id}`}>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setEditingStudent(student)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Student
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handleDownloadCard(student)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Card
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                                onClick={() => setStudentToDelete(student)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="h-8 w-8 opacity-20" />
                          <p>No students found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isAddFormOpen || !!editingStudent} onOpenChange={(open) => {
        if (!open) {
          setIsAddFormOpen(false);
          setEditingStudent(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
          </DialogHeader>
          <StudentForm 
            student={editingStudent} 
            onSuccess={(student) => {
              setIsAddFormOpen(false);
              setEditingStudent(null);
              
              if (!editingStudent) {
                // Offer to download card for newly created student
                toast.success("Student added successfully", {
                  action: {
                    label: "Download Card",
                    onClick: () => handleDownloadCard(student)
                  }
                });
              } else {
                toast.success("Student updated successfully");
              }
            }}
            onCancel={() => {
              setIsAddFormOpen(false);
              setEditingStudent(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for <strong>{studentToDelete?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

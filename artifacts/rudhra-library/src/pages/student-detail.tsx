import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CreditCard,
  IndianRupee
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StudentForm } from "@/components/student-form";

import { useGetStudent, getGetStudentQueryKey } from "@workspace/api-client-react";
import { generateStudentCard } from "@/lib/pdf-generator";
import { queryClient } from "@/lib/queryClient";

function photoSrc(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `/api/storage${path}`;
}

export default function StudentDetail() {
  const params = useParams();
  const id = params.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const { data: student, isLoading, error } = useGetStudent(id, {
    query: {
      enabled: !!id,
      queryKey: getGetStudentQueryKey(id),
      retry: false
    }
  });

  const handleDownloadCard = async () => {
    if (!student) return;
    try {
      await generateStudentCard(student);
      toast.success("Card downloaded successfully");
    } catch (err) {
      toast.error("Failed to generate card");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-destructive">Student Not Found</CardTitle>
              <CardDescription>The student you're looking for doesn't exist or has been deleted.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button>Return to Admin</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight">Student Details</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2"><CardContent className="p-6"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
          </div>
        ) : student ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <Card className="lg:col-span-2 overflow-hidden">
              <div className="bg-primary/5 border-b p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-serif font-bold shadow-md shrink-0 overflow-hidden">
                  {student.photoUrl ? (
                    <img src={photoSrc(student.photoUrl)} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    student.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <h2 className="text-3xl font-serif font-bold">{student.name}</h2>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => setIsEditFormOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" onClick={handleDownloadCard}>
                        <Download className="mr-2 h-4 w-4" />
                        Card
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4 text-sm">
                    <Badge variant="outline" className="font-mono bg-background">{student.cardId}</Badge>
                    {student.status === 'active' ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Active</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Expired</Badge>
                    )}
                    <Badge variant="secondary">{student.shift}</Badge>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" /> Personal Info
                    </h3>
                    <div className="space-y-2 text-sm border-l-2 pl-3 ml-2">
                      {student.fatherName && (
                        <div><span className="font-medium">D/S of:</span> {student.fatherName}</div>
                      )}
                      <div><span className="font-medium flex items-center gap-2 mt-1"><Phone className="h-3 w-3" /> {student.phone}</span></div>
                      <div><span className="font-medium flex items-center gap-2 mt-1"><Mail className="h-3 w-3" /> {student.email}</span></div>
                      <div className="flex items-start gap-2 mt-1"><MapPin className="h-3 w-3 mt-1 shrink-0" /> <span>{student.address}</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4" /> Financials
                    </h3>
                    <div className="space-y-2 text-sm border-l-2 pl-3 ml-2">
                      <div><span className="font-medium flex items-center gap-2 mt-1"><IndianRupee className="h-3 w-3" /> Total Fees:</span> ₹{student.feesAmount}</div>
                      <div><span className="font-medium flex items-center gap-2 mt-1"><IndianRupee className="h-3 w-3" /> Fees Paid:</span> ₹{student.feesPaid}</div>
                      {student.feesAmount > student.feesPaid && (
                        <div className="text-red-600 font-medium">Due: ₹{student.feesAmount - student.feesPaid}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" /> Membership
                    </h3>
                    <div className="space-y-2 text-sm border-l-2 pl-3 ml-2">
                      <div><span className="font-medium">Joined:</span> {format(new Date(student.joinDate), "MMMM d, yyyy")}</div>
                      <div><span className="font-medium">Valid Until:</span> {format(new Date(student.validUntil), "MMMM d, yyyy")}</div>
                      <div className="flex items-center gap-2 mt-1"><Clock className="h-3 w-3" /> <span className="font-medium">Shift:</span> {student.shift}</div>
                      {student.seatNumber && (
                        <div><span className="font-medium">Seat No:</span> {student.seatNumber}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ID Card Visual Mockup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ID Card Preview</CardTitle>
                <CardDescription>How the card will appear on PDF</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-[85mm] h-[55mm] bg-slate-900 rounded-lg overflow-hidden relative shadow-lg transform transition-transform hover:scale-105" style={{ aspectRatio: '85/55', width: '100%', maxWidth: '340px', height: 'auto' }}>
                  {/* Top Bar */}
                  <div className="h-1/4 w-full bg-amber-600 flex items-center justify-center">
                    <h4 className="text-white font-serif font-bold tracking-wider text-sm md:text-base">RUDHRA LIBRARY</h4>
                  </div>
                  
                  {/* Content */}
                  <div className="h-3/4 p-4 flex">
                    <div className="w-1/3 flex flex-col items-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded flex items-center justify-center text-slate-900 font-bold text-2xl overflow-hidden shadow-inner">
                        {student.photoUrl ? (
                          <img src={photoSrc(student.photoUrl)} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                          student.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="text-[10px] md:text-xs text-white font-bold mt-2 font-mono">{student.cardId}</div>
                    </div>
                    <div className="w-2/3 pl-3 text-white space-y-1">
                      <div className="font-bold text-xs md:text-sm truncate">{student.name}</div>
                      {student.fatherName && <div className="text-[8px] md:text-[10px] text-slate-300 truncate">D/S of: {student.fatherName}</div>}
                      <div className="text-[9px] md:text-[11px] mt-2"><span className="text-amber-500">Shift:</span> {student.shift}</div>
                      {student.seatNumber && <div className="text-[9px] md:text-[11px]"><span className="text-amber-500">Seat:</span> {student.seatNumber}</div>}
                      <div className="text-[9px] md:text-[11px]"><span className="text-amber-500">Valid:</span> {format(new Date(student.validUntil), "dd/MM/yy")}</div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="absolute bottom-0 w-full h-4 bg-slate-950 flex justify-between items-center px-2 text-[6px] md:text-[8px] text-slate-400">
                    <span>Ankul Kumar</span>
                    <span>+91 7088830367</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>

      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit Student</DialogTitle>
          </DialogHeader>
          {student && (
            <StudentForm 
              student={student}
              onSuccess={() => {
                setIsEditFormOpen(false);
                toast.success("Student updated successfully");
              }}
              onCancel={() => setIsEditFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

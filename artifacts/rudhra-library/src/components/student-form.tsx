import { useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import { CalendarIcon, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUpload } from "@workspace/object-storage-web";

import {
  Student,
  useCreateStudent,
  useUpdateStudent,
  CreateStudentShift,
  getListStudentsQueryKey,
  getGetStatsOverviewQueryKey,
  getGetRecentStudentsQueryKey,
  getGetStudentQueryKey,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  fatherName: z.string().optional(),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone must be at least 10 characters."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  photoUrl: z.string().optional().or(z.literal("")),
  seatNumber: z.string().optional(),
  shift: z.enum([
    CreateStudentShift.Morning,
    CreateStudentShift.Afternoon,
    CreateStudentShift.Evening,
    CreateStudentShift.Night,
    CreateStudentShift.Full_Day,
  ]),
  joinDate: z.date(),
  validUntil: z.date(),
  feesAmount: z.coerce.number().min(0, "Fees must be 0 or more"),
  feesPaid: z.coerce.number().min(0, "Paid amount must be 0 or more"),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  student?: Student | null;
  onSuccess: (student: Student) => void;
  onCancel: () => void;
}

function photoSrc(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `/api/storage${path}`;
}

export function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const isEditing = !!student;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const { uploadFile, isUploading, progress } = useUpload({
    onError: (err) => setUploadError(err.message),
  });

  const isPending =
    createMutation.isPending || updateMutation.isPending || isUploading;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student?.name || "",
      fatherName: student?.fatherName || "",
      email: student?.email || "",
      phone: student?.phone || "",
      address: student?.address || "",
      photoUrl: student?.photoUrl || "",
      seatNumber: student?.seatNumber || "",
      shift:
        (student?.shift as FormValues["shift"]) || CreateStudentShift.Morning,
      joinDate: student ? new Date(student.joinDate) : new Date(),
      validUntil: student
        ? new Date(student.validUntil)
        : addDays(new Date(), 30),
      feesAmount: student?.feesAmount ?? 1500,
      feesPaid: student?.feesPaid ?? 1500,
    },
  });

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file (JPG, PNG, etc).");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    const result = await uploadFile(file);
    if (result?.objectPath) {
      form.setValue("photoUrl", result.objectPath, { shouldDirty: true });
    }
    e.target.value = "";
  };

  const extractApiError = (err: unknown): string => {
    const anyErr = err as {
      response?: { data?: { error?: string; field?: string } };
      message?: string;
    };
    const data = anyErr?.response?.data;
    if (data?.field === "email") {
      form.setError("email", { type: "server", message: data.error ?? "Email already exists." });
    }
    if (data?.field === "seatNumber") {
      form.setError("seatNumber", { type: "server", message: data.error ?? "Seat already taken." });
    }
    return data?.error || anyErr?.message || "Something went wrong. Please try again.";
  };

  const onSubmit = (data: FormValues) => {
    setSubmitError(null);
    const formattedData = {
      ...data,
      photoUrl: data.photoUrl === "" ? null : data.photoUrl,
      joinDate: data.joinDate.toISOString(),
      validUntil: data.validUntil.toISOString(),
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: student.id, data: formattedData },
        {
          onSuccess: (res) => {
            queryClient.invalidateQueries({
              queryKey: getListStudentsQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetStatsOverviewQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetStudentQueryKey(student.id),
            });
            onSuccess(res);
          },
          onError: (err) => setSubmitError(extractApiError(err)),
        },
      );
    } else {
      createMutation.mutate(
        { data: formattedData },
        {
          onSuccess: (res) => {
            queryClient.invalidateQueries({
              queryKey: getListStudentsQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetStatsOverviewQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetRecentStudentsQueryKey(),
            });
            onSuccess(res);
          },
          onError: (err) => setSubmitError(extractApiError(err)),
        },
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Photo</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted">
                  {field.value ? (
                    <img
                      src={photoSrc(field.value)}
                      alt="Student"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilePick}
                    disabled={isUploading}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading {progress}%
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {field.value ? "Replace photo" : "Upload photo"}
                        </>
                      )}
                    </Button>
                    {field.value && !isUploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          form.setValue("photoUrl", "", { shouldDirty: true })
                        }
                      >
                        <X className="mr-1 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG or PNG, up to 5 MB. Used on the student ID card.
                  </p>
                  {uploadError && (
                    <p className="text-xs text-destructive">{uploadError}</p>
                  )}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fatherName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Father/Spouse Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Optional"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input placeholder="+91..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Full residential address"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shift"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(CreateStudentShift).map((shift) => (
                      <SelectItem key={shift} value={shift}>
                        {shift}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seatNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seat Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. A-12 (Optional)"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="joinDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Join Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Valid Until *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="feesAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Fees (₹) *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="feesPaid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fees Paid (₹) *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertPatientSchema, type InsertPatient } from "@shared/schema";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { useEffect } from "react";

interface EditPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: any;
}

const extendedSchema = insertPatientSchema.extend({
  firstName: insertPatientSchema.shape.firstName.min(2, "First name must be at least 2 characters"),
  lastName: insertPatientSchema.shape.lastName.min(2, "Last name must be at least 2 characters"),
  phone: insertPatientSchema.shape.phone.min(10, "Phone number must be at least 10 characters"),
});

export default function EditPatientModal({ open, onOpenChange, patient }: EditPatientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertPatient>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      gender: undefined,
      phone: "",
      email: "",
      address: "",
      medicalHistory: "",
      isActive: true,
    },
  });

  // Update form values when patient changes
  useEffect(() => {
    if (patient) {
      form.reset({
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : undefined,
        gender: patient.gender || undefined,
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || "",
        medicalHistory: patient.medicalHistory || "",
        isActive: patient.isActive ?? true,
      });
    }
  }, [patient, form]);

  const updatePatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update patient");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient Updated",
        description: "Patient information has been successfully updated.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPatient) => {
    updatePatientMutation.mutate(data);
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-first-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-last-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value ? (typeof field.value === 'string' ? field.value : format(field.value, 'yyyy-MM-dd')) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        data-testid="input-date-of-birth" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="+1 (555) 000-0000"
                      data-testid="input-phone" 
                    />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      {...field} 
                      value={field.value || ""}
                      placeholder="patient@example.com"
                      data-testid="input-email" 
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
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""}
                      placeholder="Street address, city, state, zip code"
                      rows={3}
                      data-testid="textarea-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicalHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical History</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""}
                      placeholder="Previous conditions, medications, allergies, etc."
                      rows={4}
                      data-testid="textarea-medical-history"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatePatientMutation.isPending}
                data-testid="button-save"
              >
                {updatePatientMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
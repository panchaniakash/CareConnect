import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertAppointmentSchema, type InsertAppointment, type Clinic } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders, getCurrentUser } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Search } from "lucide-react";

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const extendedSchema = insertAppointmentSchema.extend({
  patientId: insertAppointmentSchema.shape.patientId.min(1, "Patient is required"),
  clinicId: insertAppointmentSchema.shape.clinicId.min(1, "Clinic is required"),
  appointmentDate: insertAppointmentSchema.shape.appointmentDate.refine(
    (date) => {
      if (!date) return false;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate >= now;
    },
    "Appointment date must be today or in the future"
  ),
});

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

export default function NewAppointmentModal({ open, onOpenChange }: NewAppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      patientId: "",
      clinicId: "",
      doctorId: user?.id || "",
      appointmentDate: new Date(),
      duration: 30,
      type: "consultation" as any,
      status: "scheduled" as any,
      notes: "",
    },
  });

  // Fetch clinics
  const { data: clinics } = useQuery({
    queryKey: ["/api/clinics"],
    queryFn: async () => {
      const response = await fetch("/api/clinics", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch clinics");
      return response.json();
    },
  });

  // Search patients
  const { data: patients } = useQuery({
    queryKey: ["/api/patients", { query: patientSearch }],
    queryFn: async () => {
      if (!patientSearch.trim()) return [];
      const response = await fetch(`/api/patients?query=${encodeURIComponent(patientSearch)}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to search patients");
      return response.json();
    },
    enabled: patientSearch.length > 2,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create appointment");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Appointment scheduled successfully",
        description: `Appointment scheduled for ${data.patient.firstName} ${data.patient.lastName}.`,
      });
      form.reset();
      setSelectedPatient(null);
      setPatientSearch("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error scheduling appointment",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: InsertAppointment) => {
    // Combine date and time into proper Date object
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(hours, minutes, 0, 0);
      data.appointmentDate = appointmentDateTime;
    }
    
    console.log("Submitting appointment data:", data);
    createAppointmentMutation.mutate(data);
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    form.setValue("patientId", patient.id);
  };

  const handleClose = () => {
    form.reset();
    setSelectedPatient(null);
    setPatientSearch("");
    setSelectedDate("");
    setSelectedTime("");
    onOpenChange(false);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto" data-testid="modal-new-appointment">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-text-primary">
            Schedule Appointment
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Search */}
            <div>
              <Label className="text-sm font-medium text-text-primary mb-1">
                Patient *
              </Label>
              <div className="relative">
                <Input
                  placeholder="Search by name or phone..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  data-testid="input-patient-search"
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={16} />
                
                {/* Patient search results */}
                {patients && patients.length > 0 && patientSearch.length > 2 && !selectedPatient && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {patients.map((patient: any) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        data-testid={`patient-option-${patient.id}`}
                      >
                        <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                        <div className="text-sm text-text-secondary">{patient.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedPatient && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <div className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                  <div className="text-sm text-text-secondary">{selectedPatient.phone}</div>
                </div>
              )}
            </div>

            {/* Clinic Selection */}
            <FormField
              control={form.control}
              name="clinicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-text-primary">
                    Clinic *
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-clinic">
                        <SelectValue placeholder="Select Clinic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clinics?.map((clinic: Clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-text-primary mb-1">
                  Appointment Date *
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={getMinDate()}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value && selectedTime) {
                      const [hours, minutes] = selectedTime.split(":").map(Number);
                      const appointmentDateTime = new Date(e.target.value);
                      appointmentDateTime.setHours(hours, minutes, 0, 0);
                      form.setValue("appointmentDate", appointmentDateTime);
                    }
                  }}
                  data-testid="input-appointment-date"
                  className="w-full"
                />
                {!selectedDate && (
                  <p className="text-sm text-red-500 mt-1">Please select a date</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-text-primary mb-1">
                  Appointment Time *
                </Label>
                <Select 
                  value={selectedTime}
                  onValueChange={(time) => {
                    setSelectedTime(time);
                    if (selectedDate && time) {
                      const [hours, minutes] = time.split(":").map(Number);
                      const appointmentDateTime = new Date(selectedDate);
                      appointmentDateTime.setHours(hours, minutes, 0, 0);
                      form.setValue("appointmentDate", appointmentDateTime);
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-appointment-time">
                    <SelectValue placeholder="Select Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {new Date(`2024-01-01 ${time}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedTime && (
                  <p className="text-sm text-red-500 mt-1">Please select a time</p>
                )}
              </div>

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-text-primary">
                      Duration (minutes)
                    </FormLabel>
                    <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                      <FormControl>
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue placeholder="Select Duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-text-primary">
                      Type *
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-appointment-type">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="checkup">General Checkup</SelectItem>
                        <SelectItem value="followup">Follow-up</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-text-primary">
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      placeholder="Any special notes or requirements..."
                      data-testid="textarea-appointment-notes"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createAppointmentMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-dark"
                disabled={createAppointmentMutation.isPending || !selectedPatient || !selectedDate || !selectedTime || !form.getValues("clinicId")}
                data-testid="button-schedule-appointment"
              >
                {createAppointmentMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

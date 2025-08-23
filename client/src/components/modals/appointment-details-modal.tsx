import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  Save,
  X
} from "lucide-react";

interface AppointmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
}

export default function AppointmentDetailsModal({
  open,
  onOpenChange,
  appointment,
}: AppointmentDetailsModalProps) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateAppointmentMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success/10 text-success">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
      case "scheduled":
        return <Badge className="bg-primary/10 text-primary">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-success/10 text-success">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleMarkComplete = () => {
    updateAppointmentMutation.mutate({ status: "completed" });
  };

  const handleCancel = () => {
    updateAppointmentMutation.mutate({ status: "cancelled" });
  };

  const handleReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast({
        title: "Error",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }

    const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
    updateAppointmentMutation.mutate({ 
      appointmentDate: newDateTime.toISOString() 
    });
    setIsRescheduling(false);
    setRescheduleDate("");
    setRescheduleTime("");
  };

  const formatDateForInput = (dateString: string) => {
    return format(new Date(dateString), "yyyy-MM-dd");
  };

  const formatTimeForInput = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            View and manage appointment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Name</p>
                <p className="font-medium">
                  {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-text-secondary" />
                  <p className="font-medium">{appointment.patient.phone}</p>
                </div>
              </div>
              {appointment.patient.email && (
                <div className="col-span-2">
                  <p className="text-sm text-text-secondary">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-text-secondary" />
                    <p className="font-medium">{appointment.patient.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Appointment Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Date & Time</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-text-secondary" />
                  <p className="font-medium">
                    {format(new Date(appointment.appointmentDate), "EEEE, MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Duration</p>
                <p className="font-medium">{appointment.duration} minutes</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Type</p>
                <p className="font-medium capitalize">{appointment.type}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Status</p>
                {getStatusBadge(appointment.status)}
              </div>
              <div>
                <p className="text-sm text-text-secondary">Doctor</p>
                <p className="font-medium">{appointment.doctor.name}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Clinic</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-text-secondary" />
                  <p className="font-medium">{appointment.clinic.name}</p>
                </div>
              </div>
            </div>
            
            {appointment.notes && (
              <div className="mt-4">
                <p className="text-sm text-text-secondary">Notes</p>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {appointment.status !== "completed" && appointment.status !== "cancelled" && (
              <>
                <Button
                  onClick={() => setIsRescheduling(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-reschedule"
                >
                  <Edit className="h-4 w-4" />
                  Reschedule
                </Button>
                
                <Button
                  onClick={handleMarkComplete}
                  disabled={updateAppointmentMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid="button-mark-complete"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark Complete
                </Button>
              </>
            )}
            
            {appointment.status !== "cancelled" && (
              <Button
                onClick={handleCancel}
                disabled={updateAppointmentMutation.isPending}
                variant="destructive"
                className="flex items-center gap-2"
                data-testid="button-cancel"
              >
                <Trash2 className="h-4 w-4" />
                Cancel Appointment
              </Button>
            )}
          </div>

          {isRescheduling && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <h4 className="font-medium text-blue-900">Reschedule Appointment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">New Date</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                    data-testid="input-reschedule-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-time">New Time</Label>
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    data-testid="input-reschedule-time"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleReschedule}
                  disabled={updateAppointmentMutation.isPending}
                  size="sm"
                  className="flex items-center gap-2"
                  data-testid="button-confirm-reschedule"
                >
                  <Save className="h-3 w-3" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setIsRescheduling(false);
                    setRescheduleDate("");
                    setRescheduleTime("");
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  data-testid="button-cancel-reschedule"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
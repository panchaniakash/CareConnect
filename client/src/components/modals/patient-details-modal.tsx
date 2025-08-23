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
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  User, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  FileText,
  Edit,
  UserPlus,
  History,
  UserX
} from "lucide-react";

interface PatientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: any;
  onEdit?: (patient: any) => void;
  onSchedule?: (patient: any) => void;
  onViewHistory?: (patient: any) => void;
  onDeactivate?: (patient: any) => void;
}

export default function PatientDetailsModal({
  open,
  onOpenChange,
  patient,
  onEdit,
  onSchedule,
  onViewHistory,
  onDeactivate,
}: PatientDetailsModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deactivatePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: false }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to deactivate patient");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      onOpenChange(false);
      toast({
        title: "Patient Deactivated",
        description: "Patient has been successfully deactivated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate patient",
        variant: "destructive",
      });
    },
  });

  const handleDeactivate = () => {
    if (confirm("Are you sure you want to deactivate this patient? This action can be reversed later.")) {
      deactivatePatientMutation.mutate(patient.id);
    }
  };

  if (!patient) return null;

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Patient Details
          </DialogTitle>
          <DialogDescription>
            View and manage patient information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {patient.firstName} {patient.lastName}
                </h2>
                <p className="text-text-secondary">
                  Patient ID: {patient.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <Badge variant={patient.isActive ? "default" : "secondary"}>
              {patient.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <Separator />

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Date of Birth</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-text-secondary" />
                  <p className="font-medium">
                    {patient.dateOfBirth 
                      ? `${format(new Date(patient.dateOfBirth), "MMM d, yyyy")} (${calculateAge(patient.dateOfBirth)} years old)`
                      : "Not provided"
                    }
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Gender</p>
                <p className="font-medium capitalize">
                  {patient.gender || "Not specified"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-text-secondary">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-text-secondary" />
                  <p className="font-medium">{patient.phone}</p>
                </div>
              </div>
              {patient.email && (
                <div>
                  <p className="text-sm text-text-secondary">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-text-secondary" />
                    <p className="font-medium">{patient.email}</p>
                  </div>
                </div>
              )}
              {patient.address && (
                <div>
                  <p className="text-sm text-text-secondary">Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 text-text-secondary mt-1" />
                    <p className="font-medium">{patient.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {patient.medicalHistory && (
            <>
              <Separator />
              
              {/* Medical History */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Medical History
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{patient.medicalHistory}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {onEdit && (
              <Button
                onClick={() => onEdit(patient)}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-edit-patient"
              >
                <Edit className="h-4 w-4" />
                Edit Patient
              </Button>
            )}
            
            {onSchedule && (
              <Button
                onClick={() => onSchedule(patient)}
                className="flex items-center gap-2"
                data-testid="button-schedule-appointment"
              >
                <UserPlus className="h-4 w-4" />
                Schedule Appointment
              </Button>
            )}
            
            {onViewHistory && (
              <Button
                onClick={() => onViewHistory(patient)}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-view-history"
              >
                <History className="h-4 w-4" />
                View History
              </Button>
            )}
            
            {onDeactivate && patient.isActive && (
              <Button
                onClick={handleDeactivate}
                disabled={deactivatePatientMutation.isPending}
                variant="destructive"
                className="flex items-center gap-2"
                data-testid="button-deactivate"
              >
                <UserX className="h-4 w-4" />
                {deactivatePatientMutation.isPending ? "Deactivating..." : "Deactivate"}
              </Button>
            )}
          </div>

          {/* Registration Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-text-secondary">
              Patient registered on {format(new Date(patient.createdAt), "MMM d, yyyy 'at' h:mm a")}
              {patient.updatedAt !== patient.createdAt && (
                <span>
                  {" • Last updated on "}
                  {format(new Date(patient.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
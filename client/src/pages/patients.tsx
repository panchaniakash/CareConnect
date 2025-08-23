import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders } from "@/lib/auth";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import NewPatientModal from "@/components/modals/new-patient-modal";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PatientsPage() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/patients", { query: searchQuery, page: currentPage, limit: pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      params.append("limit", pageSize.toString());
      params.append("offset", ((currentPage - 1) * pageSize).toString());
      
      const response = await fetch(`/api/patients?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch patients");
      return response.json();
    },
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  const formatLastVisit = (createdAt: string) => {
    return format(new Date(createdAt), "MMM dd, yyyy");
  };

  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
  };

  const handleEditPatient = (patient: any) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handleScheduleAppointment = async (patient: any) => {
    // TODO: Open appointment modal with patient pre-selected
    toast({
      title: "Schedule Appointment",
      description: `Scheduling appointment for ${patient.firstName} ${patient.lastName}`,
    });
  };

  const handleViewHistory = (patient: any) => {
    // TODO: Navigate to patient history page
    toast({
      title: "View History",
      description: `Viewing history for ${patient.firstName} ${patient.lastName}`,
    });
  };

  const handleDeactivatePatient = async (patient: any) => {
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
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
      
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      toast({
        title: "Patient Deactivated",
        description: `${patient.firstName} ${patient.lastName} has been deactivated`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate patient",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary" data-testid="text-patients-title">
              Patients
            </h2>
            <p className="text-text-secondary">Manage patient records and information</p>
          </div>
          <Button
            className="bg-primary hover:bg-primary-dark"
            onClick={() => setShowPatientModal(true)}
            data-testid="button-new-patient"
          >
            <Plus size={16} className="mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={16} />
              <Input
                placeholder="Search by name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-patients"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilterSidebar(true)}
                data-testid="button-filter"
              >
                <Filter size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-text-secondary font-medium">Patient</TableHead>
                  <TableHead className="text-text-secondary font-medium">Contact</TableHead>
                  <TableHead className="text-text-secondary font-medium">Last Visit</TableHead>
                  <TableHead className="text-text-secondary font-medium">Status</TableHead>
                  <TableHead className="text-text-secondary font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-4 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : patients && patients.length > 0 ? (
                  patients.map((patient: any) => (
                    <TableRow 
                      key={patient.id} 
                      className="hover:bg-gray-50"
                      data-testid={`patient-row-${patient.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-medium text-sm">
                                {getInitials(patient.firstName, patient.lastName)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div 
                              className="text-sm font-medium text-text-primary"
                              data-testid={`patient-name-${patient.id}`}
                            >
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-text-secondary">
                              ID: {patient.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-text-primary">{patient.phone}</div>
                        {patient.email && (
                          <div className="text-sm text-text-secondary">{patient.email}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-text-secondary">
                        {formatLastVisit(patient.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success">
                          {patient.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary-dark"
                            onClick={() => handleViewPatient(patient)}
                            data-testid={`button-view-${patient.id}`}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-text-secondary hover:text-text-primary"
                            onClick={() => handleEditPatient(patient)}
                            data-testid={`button-edit-${patient.id}`}
                          >
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-more-${patient.id}`}
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleScheduleAppointment(patient)}>
                                Schedule Appointment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewHistory(patient)}>
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeactivatePatient(patient)}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-center">
                        <Search className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No patients found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {searchQuery 
                            ? "Try adjusting your search terms." 
                            : "Get started by adding a new patient."
                          }
                        </p>
                        {!searchQuery && (
                          <div className="mt-4">
                            <Button
                              onClick={() => setShowPatientModal(true)}
                              className="bg-primary hover:bg-primary-dark"
                            >
                              <Plus size={16} className="mr-2" />
                              Add Patient
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {patients && patients.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-mobile"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!patients || patients.length < pageSize}
                    data-testid="button-next-mobile"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">
                      Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(currentPage * pageSize, ((currentPage - 1) * pageSize) + (patients?.length || 0))}</span> of{" "}
                      <span className="font-medium">many</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-desktop"
                      >
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" className="bg-primary text-white">
                        {currentPage}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!patients || patients.length < pageSize}
                        data-testid="button-next-desktop"
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <NewPatientModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
      />
    </div>
  );
}

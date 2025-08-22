import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders } from "@/lib/auth";
import { Plus, Calendar, Users, Clock, CheckCircle, AlertTriangle, TriangleAlert, UserPlus, Search } from "lucide-react";
import NewPatientModal from "@/components/modals/new-patient-modal";
import NewAppointmentModal from "@/components/modals/new-appointment-modal";
import { useState } from "react";
import { format } from "date-fns";

export default function DashboardPage() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Get today's date for filtering appointments
  const today = new Date();
  const clinicId = "clinic-1"; // This should come from user context in a real app

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", { clinicId }],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?clinicId=${clinicId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments", { date: format(today, "yyyy-MM-dd") }],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?date=${format(today, "yyyy-MM-dd")}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary" data-testid="text-dashboard-title">
          Dashboard
        </h2>
        <p className="text-text-secondary">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="text-primary text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary">Today's Appointments</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-text-primary" data-testid="stat-today-appointments">
                    {stats?.todayAppointments || 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Users className="text-secondary text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary">Total Patients</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-text-primary" data-testid="stat-total-patients">
                    {stats?.totalPatients || 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="text-warning text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary">Pending</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-text-primary" data-testid="stat-pending">
                    {stats?.pendingAppointments || 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="text-success text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary">Completed</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-text-primary" data-testid="stat-completed">
                    {stats?.completedAppointments || 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-text-primary">
                  Today's Schedule
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {appointmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : todayAppointments && todayAppointments.length > 0 ? (
                <div className="space-y-4" data-testid="appointments-list">
                  {todayAppointments.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      data-testid={`appointment-${appointment.id}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-medium text-sm">
                            {format(new Date(appointment.appointmentDate), "HH:mm")}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </p>
                        <p className="text-sm text-text-secondary capitalize">
                          {appointment.type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(appointment.status)}
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments today</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your schedule is clear for today.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reminders & Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-text-primary">
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <TriangleAlert className="text-warning flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Follow-up required
                    </p>
                    <p className="text-xs text-text-secondary">
                      3 patients need follow-up calls
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="text-primary flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Appointment confirmation
                    </p>
                    <p className="text-xs text-text-secondary">
                      {stats?.pendingAppointments || 0} appointments need confirmation
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-text-primary">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                className="w-full bg-primary hover:bg-primary-dark"
                onClick={() => setShowAppointmentModal(true)}
                data-testid="button-new-appointment"
              >
                <Plus size={16} className="mr-2" />
                New Appointment
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPatientModal(true)}
                data-testid="button-add-patient"
              >
                <UserPlus size={16} className="mr-2" />
                Add Patient
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-search-records">
                <Search size={16} className="mr-2" />
                Search Records
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <NewPatientModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
      />
      
      <NewAppointmentModal
        open={showAppointmentModal}
        onOpenChange={setShowAppointmentModal}
      />
    </div>
  );
}

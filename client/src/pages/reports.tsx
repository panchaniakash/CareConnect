import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders } from "@/lib/auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, Calendar, Activity, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ReportsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const response = await fetch("/api/appointments", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const response = await fetch("/api/patients", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch patients");
      return response.json();
    },
  });

  // Process data for charts
  const appointmentStatusData = appointments ? [
    { name: 'Scheduled', value: appointments.filter((a: any) => a.status === 'scheduled').length, color: '#3B82F6' },
    { name: 'Confirmed', value: appointments.filter((a: any) => a.status === 'confirmed').length, color: '#10B981' },
    { name: 'Completed', value: appointments.filter((a: any) => a.status === 'completed').length, color: '#8B5CF6' },
    { name: 'Cancelled', value: appointments.filter((a: any) => a.status === 'cancelled').length, color: '#EF4444' },
    { name: 'Pending', value: appointments.filter((a: any) => a.status === 'pending').length, color: '#F59E0B' },
  ] : [];

  const appointmentTypeData = appointments ? [
    { name: 'Consultation', value: appointments.filter((a: any) => a.type === 'consultation').length },
    { name: 'Checkup', value: appointments.filter((a: any) => a.type === 'checkup').length },
    { name: 'Follow-up', value: appointments.filter((a: any) => a.type === 'followup').length },
    { name: 'Emergency', value: appointments.filter((a: any) => a.type === 'emergency').length },
  ] : [];

  const genderData = patients ? [
    { name: 'Male', value: patients.filter((p: any) => p.gender === 'male').length },
    { name: 'Female', value: patients.filter((p: any) => p.gender === 'female').length },
    { name: 'Other', value: patients.filter((p: any) => p.gender === 'other').length },
  ] : [];

  // Weekly appointment trend (mock data for now)
  const weeklyTrend = [
    { week: 'Week 1', appointments: 12 },
    { week: 'Week 2', appointments: 19 },
    { week: 'Week 3', appointments: 15 },
    { week: 'Week 4', appointments: 22 },
  ];

  if (statsLoading || appointmentsLoading || patientsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary" data-testid="text-reports-title">
              Reports & Analytics
            </h2>
            <p className="text-text-secondary">Comprehensive insights into your practice performance</p>
          </div>
          <Button className="bg-primary hover:bg-primary-dark" data-testid="button-export-reports">
            <Download size={16} className="mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="text-primary" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Today's Appointments</p>
                <p className="text-2xl font-bold text-text-primary" data-testid="text-todays-appointments">
                  {stats?.todayAppointments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="text-success" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Total Patients</p>
                <p className="text-2xl font-bold text-text-primary" data-testid="text-total-patients">
                  {stats?.totalPatients || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Activity className="text-warning" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Pending Appointments</p>
                <p className="text-2xl font-bold text-text-primary" data-testid="text-pending-appointments">
                  {stats?.pendingAppointments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="text-success" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Completed</p>
                <p className="text-2xl font-bold text-text-primary" data-testid="text-completed-appointments">
                  {stats?.completedAppointments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Appointment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-text-primary">
              <FileText size={20} className="mr-2" />
              Appointment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {appointmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointment Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary">Appointment Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Appointment Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary">Weekly Appointment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="appointments" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Patient Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary">Patient Demographics (Gender)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {genderData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-text-primary">{item.name}</span>
                  </div>
                  <Badge variant="secondary" data-testid={`badge-${item.name.toLowerCase()}-count`}>
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
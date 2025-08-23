import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuthHeaders } from "@/lib/auth";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import NewAppointmentModal from "@/components/modals/new-appointment-modal";
import AppointmentDetailsModal from "@/components/modals/appointment-details-modal";
import { format, addDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval } from "date-fns";

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
];

export default function SchedulePage() {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments", { 
      date: format(weekStart, "yyyy-MM-dd"),
      endDate: format(addDays(weekStart, 6), "yyyy-MM-dd") 
    }],
    queryFn: async () => {
      const response = await fetch("/api/appointments", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });

  const getAppointmentForSlot = (date: Date, timeSlot: string) => {
    if (!appointments) return null;
    
    return appointments.find((apt: any) => {
      const aptDate = new Date(apt.appointmentDate);
      const aptTime = format(aptDate, "HH:mm");
      const aptDateStr = format(aptDate, "yyyy-MM-dd");
      const dateStr = format(date, "yyyy-MM-dd");
      
      return aptDateStr === dateStr && aptTime === timeSlot;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 border-l-4 border-success";
      case "pending":
        return "bg-warning/10 border-l-4 border-warning";
      case "scheduled":
        return "bg-primary/10 border-l-4 border-primary";
      case "completed":
        return "bg-secondary/10 border-l-4 border-secondary";
      default:
        return "bg-gray-50 border-l-4 border-gray-300";
    }
  };

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "day") {
      setCurrentDate(direction === "next" ? addDays(currentDate, 1) : addDays(currentDate, -1));
    } else if (viewMode === "week") {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else if (viewMode === "month") {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary" data-testid="text-schedule-title">
              Schedule
            </h2>
            <p className="text-text-secondary">Manage appointments and availability</p>
          </div>
          <Button
            className="bg-primary hover:bg-primary-dark"
            onClick={() => setShowAppointmentModal(true)}
            data-testid="button-new-appointment"
          >
            <Plus size={16} className="mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Calendar Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("prev")}
                data-testid="button-prev"
              >
                <ChevronLeft size={16} />
              </Button>
              <h3 className="text-lg font-semibold text-text-primary">
                {viewMode === "day" ? format(currentDate, "EEEE, MMMM d, yyyy") :
                 viewMode === "week" ? `Week of ${format(weekStart, "MMM d")} - ${format(addDays(weekStart, 6), "MMM d, yyyy")}` :
                 format(currentDate, "MMMM yyyy")}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("next")}
                data-testid="button-next"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
                data-testid="button-day-view"
              >
                Day
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                className={viewMode === "week" ? "bg-primary text-white" : ""}
                data-testid="button-week-view"
              >
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                data-testid="button-month-view"
              >
                Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Content */}
      <Card>
        <CardContent className="p-0">
          {viewMode === "day" && (
            <div className="grid grid-cols-2 gap-0">
              {/* Time column */}
              <div className="border-r border-gray-200">
                <div className="p-4 text-center font-medium text-text-primary bg-primary/5">
                  {format(currentDate, "EEEE, MMM d")}
                </div>
                {timeSlots.map((time) => (
                  <div 
                    key={time}
                    className="h-20 border-b border-gray-100 flex items-center justify-center text-sm text-text-secondary"
                  >
                    {format(new Date(`2024-01-01 ${time}`), "h:mm a")}
                  </div>
                ))}
              </div>
              
              {/* Day column */}
              <div className="bg-primary/5">
                <div className="h-14"></div>
                {timeSlots.map((timeSlot) => {
                  const appointment = getAppointmentForSlot(currentDate, timeSlot);
                  
                  return (
                    <div 
                      key={`${currentDate.toISOString()}-${timeSlot}`}
                      className="h-20 border-b border-gray-100 p-2 relative hover:bg-gray-50"
                      data-testid={`day-slot-${format(currentDate, "yyyy-MM-dd")}-${timeSlot}`}
                    >
                      {appointment && (
                        <div 
                          className={`p-3 rounded h-full flex flex-col justify-between cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(appointment.status)}`}
                          onClick={() => handleAppointmentClick(appointment)}
                          data-testid={`appointment-${appointment.id}`}
                        >
                          <div className="font-medium">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </div>
                          <div className="text-sm opacity-75">
                            {appointment.type}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "week" && (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-8 gap-0 border-b border-gray-200">
                <div className="p-4 text-sm font-medium text-text-secondary border-r border-gray-200"></div>
                {weekDays.map((day) => (
                  <div 
                    key={day.toISOString()}
                    className={`p-4 text-sm font-medium text-text-primary text-center border-r border-gray-200 ${
                      isToday(day) ? "bg-primary/5" : ""
                    }`}
                    data-testid={`day-header-${format(day, "yyyy-MM-dd")}`}
                  >
                    <div className={isToday(day) ? "text-primary" : ""}>
                      {format(day, "EEE")}
                    </div>
                    <div className={`text-lg font-bold ${isToday(day) ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time slots and appointments */}
              <div className="grid grid-cols-8 gap-0">
                {/* Time column */}
                <div className="border-r border-gray-200">
                  {timeSlots.map((time) => (
                    <div 
                      key={time}
                      className="h-16 border-b border-gray-100 flex items-center justify-center text-sm text-text-secondary"
                    >
                      {format(new Date(`2024-01-01 ${time}`), "h:mm a")}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day) => (
                  <div 
                    key={day.toISOString()}
                    className={`border-r border-gray-200 ${isToday(day) ? "bg-primary/5" : ""}`}
                  >
                    {timeSlots.map((timeSlot) => {
                      const appointment = getAppointmentForSlot(day, timeSlot);
                      
                      return (
                        <div 
                          key={`${day.toISOString()}-${timeSlot}`}
                          className="h-16 border-b border-gray-100 p-1 relative hover:bg-gray-50"
                          data-testid={`time-slot-${format(day, "yyyy-MM-dd")}-${timeSlot}`}
                        >
                          {appointment && (
                            <div 
                              className={`p-2 rounded text-xs h-full flex flex-col justify-between cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(appointment.status)}`}
                              onClick={() => handleAppointmentClick(appointment)}
                              data-testid={`appointment-${appointment.id}`}
                            >
                              <div className="font-medium truncate">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </div>
                              <div className="text-xs opacity-75 truncate">
                                {appointment.type}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {viewMode === "month" && (
            <div className="p-4">
              {/* Month calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-text-secondary">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {monthDays.map((day) => {
                  const dayAppointments = appointments?.filter((apt: any) => {
                    const aptDate = new Date(apt.appointmentDate);
                    return format(aptDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
                  }) || [];
                  
                  return (
                    <div 
                      key={day.toISOString()}
                      className={`min-h-24 p-2 border rounded-lg ${
                        isToday(day) ? "bg-primary/10 border-primary" : "bg-white border-gray-200"
                      } hover:bg-gray-50`}
                      data-testid={`month-day-${format(day, "yyyy-MM-dd")}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday(day) ? "text-primary" : "text-text-primary"
                      }`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((apt: any) => (
                          <div 
                            key={apt.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(apt.status)}`}
                            onClick={() => handleAppointmentClick(apt)}
                            data-testid={`month-appointment-${apt.id}`}
                          >
                            {apt.patient.firstName} {apt.patient.lastName}
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-text-secondary">+{dayAppointments.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <NewAppointmentModal 
        open={showAppointmentModal} 
        onOpenChange={setShowAppointmentModal} 
      />
      
      <AppointmentDetailsModal
        open={showAppointmentDetails}
        onOpenChange={setShowAppointmentDetails}
        appointment={selectedAppointment}
      />
    </div>
  );
}
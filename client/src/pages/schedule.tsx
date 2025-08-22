import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuthHeaders } from "@/lib/auth";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import NewAppointmentModal from "@/components/modals/new-appointment-modal";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
];

export default function SchedulePage() {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek(direction === "next" ? addWeeks(currentWeek, 1) : subWeeks(currentWeek, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
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
                onClick={() => navigateWeek("prev")}
                data-testid="button-prev-week"
              >
                <ChevronLeft size={16} />
              </Button>
              <h3 className="text-lg font-semibold text-text-primary">
                {format(currentWeek, "MMMM yyyy")}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateWeek("next")}
                data-testid="button-next-week"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
              >
                Day
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                className={viewMode === "week" ? "bg-primary text-white" : ""}
              >
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardContent className="p-0">
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
                      className="h-16 border-b border-gray-100 p-2"
                      data-testid={`slot-${format(day, "yyyy-MM-dd")}-${timeSlot}`}
                    >
                      {appointment ? (
                        <div 
                          className={`rounded p-2 h-full text-xs ${getStatusColor(appointment.status)}`}
                          data-testid={`appointment-${appointment.id}`}
                        >
                          <div className="font-medium text-text-primary truncate">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </div>
                          <div className="text-text-secondary capitalize truncate">
                            {appointment.type}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="h-full rounded border-2 border-dashed border-transparent hover:border-primary/30 cursor-pointer transition-colors"
                          onClick={() => setShowAppointmentModal(true)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <NewAppointmentModal
        open={showAppointmentModal}
        onOpenChange={setShowAppointmentModal}
      />
    </div>
  );
}

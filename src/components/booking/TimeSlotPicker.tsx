import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, addDays, startOfDay, isSameDay, parseISO, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeSlotPickerProps {
  stylistId: string;
  serviceDuration: number;
  onSlotSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ExistingAppointment {
  appointment_date: string;
  duration_minutes: number;
}

export function TimeSlotPicker({
  stylistId,
  serviceDuration,
  onSlotSelect,
  selectedDate,
  selectedTime,
}: TimeSlotPickerProps) {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<string[]>([]);

  // Fetch stylist availability and existing appointments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch availability settings
      const { data: availData } = await supabase
        .from("stylist_availability")
        .select("*")
        .eq("stylist_id", stylistId)
        .eq("is_available", true);

      if (availData) setAvailability(availData);

      // Fetch existing appointments for the next 30 days
      const thirtyDaysFromNow = addDays(new Date(), 30);
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("appointment_date, service:stylist_services(duration_minutes)")
        .eq("stylist_id", stylistId)
        .gte("appointment_date", new Date().toISOString())
        .lte("appointment_date", thirtyDaysFromNow.toISOString())
        .neq("status", "cancelled");

      if (appointmentsData) {
        setExistingAppointments(
          appointmentsData.map((a: any) => ({
            appointment_date: a.appointment_date,
            duration_minutes: a.service?.duration_minutes || 30,
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, [stylistId]);

  // Generate time slots for selected day
  useEffect(() => {
    if (!selectedDay || availability.length === 0) {
      setSlots([]);
      return;
    }

    const dayOfWeek = selectedDay.getDay();
    const dayAvailability = availability.find((a) => a.day_of_week === dayOfWeek);

    if (!dayAvailability) {
      setSlots([]);
      return;
    }

    const generatedSlots = generateTimeSlots(
      dayAvailability.start_time,
      dayAvailability.end_time,
      serviceDuration,
      selectedDay,
      existingAppointments
    );

    setSlots(generatedSlots);
  }, [selectedDay, availability, serviceDuration, existingAppointments]);

  const generateTimeSlots = (
    startTime: string,
    endTime: string,
    duration: number,
    date: Date,
    appointments: ExistingAppointment[]
  ): string[] => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentTime = setMinutes(setHours(date, startHour), startMin);
    const endDateTime = setMinutes(setHours(date, endHour), endMin);

    // Don't show past slots for today
    const now = new Date();
    if (isSameDay(date, now)) {
      const nowPlusBuffer = addDays(now, 0); // Could add buffer time here
      if (currentTime < nowPlusBuffer) {
        currentTime = setMinutes(
          setHours(date, now.getHours() + 1),
          0
        );
      }
    }

    while (currentTime < endDateTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      
      if (slotEnd > endDateTime) break;

      // Check if slot conflicts with existing appointments
      const slotStart = currentTime;
      const hasConflict = appointments.some((apt) => {
        const aptStart = parseISO(apt.appointment_date);
        const aptEnd = new Date(aptStart.getTime() + apt.duration_minutes * 60000);
        
        // Check for overlap
        return (
          isSameDay(aptStart, date) &&
          ((slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd))
        );
      });

      if (!hasConflict) {
        slots.push(format(currentTime, "HH:mm"));
      }

      // Move to next slot (use 30-minute increments for slot starts)
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }

    return slots;
  };

  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return availability.some((a) => a.day_of_week === dayOfWeek && a.is_available);
  };

  const handleSlotClick = (time: string) => {
    const dateStr = format(selectedDay, "yyyy-MM-dd");
    onSlotSelect(dateStr, time);
  };

  // Get next 7 days for quick selection
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (availability.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          This stylist hasn't set up their availability yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Select Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick day selection */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((day) => {
            const available = isDateAvailable(day);
            const isSelected = isSameDay(day, selectedDay);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => available && setSelectedDay(day)}
                disabled={!available}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center p-3 rounded-xl border-2 transition-all min-w-[70px] min-h-[72px] active:scale-95",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : available
                    ? "border-border hover:border-primary/50"
                    : "border-border/50 opacity-40 cursor-not-allowed"
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {format(day, "EEE")}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {format(day, "d")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(day, "MMM")}
                </span>
              </button>
            );
          })}
          
          {/* Calendar picker for more dates */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all min-w-[70px] min-h-[72px] active:scale-95">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">More</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(date) => date && setSelectedDay(date)}
                disabled={(date) => 
                  date < startOfDay(new Date()) || 
                  !isDateAvailable(date)
                }
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time slots */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Available slots for {format(selectedDay, "EEEE, MMMM d")}
            <span className="ml-2 text-xs">({serviceDuration} min service)</span>
          </p>
          
          {slots.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No available slots for this day</p>
              <p className="text-xs mt-1">Try selecting another date</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((time) => {
                const isSelected = selectedDate === format(selectedDay, "yyyy-MM-dd") && selectedTime === time;
                
                return (
                  <button
                    key={time}
                    onClick={() => handleSlotClick(time)}
                    className={cn(
                      "py-3 px-4 min-h-[48px] rounded-lg border-2 text-sm font-medium transition-all active:scale-95",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

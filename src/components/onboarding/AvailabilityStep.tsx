import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface DayAvailability {
  day: number;
  dayName: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

interface AvailabilityStepProps {
  availability: DayAvailability[];
  setAvailability: (availability: DayAvailability[]) => void;
}

const DAYS = [
  { day: 0, dayName: "Sunday" },
  { day: 1, dayName: "Monday" },
  { day: 2, dayName: "Tuesday" },
  { day: 3, dayName: "Wednesday" },
  { day: 4, dayName: "Thursday" },
  { day: 5, dayName: "Friday" },
  { day: 6, dayName: "Saturday" },
];

export const AvailabilityStep = ({ availability, setAvailability }: AvailabilityStepProps) => {
  const updateDay = (dayIndex: number, field: keyof DayAvailability, value: any) => {
    const updated = availability.map((a) =>
      a.day === dayIndex ? { ...a, [field]: value } : a
    );
    setAvailability(updated);
  };

  const initializeAvailability = () => {
    if (availability.length === 0) {
      setAvailability(
        DAYS.map((d) => ({
          ...d,
          isAvailable: d.day !== 0, // Closed on Sunday by default
          startTime: "09:00",
          endTime: "18:00",
        }))
      );
    }
  };

  // Initialize if empty
  if (availability.length === 0) {
    initializeAvailability();
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Weekly Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set your regular working hours. You can adjust these later.
          </p>

          <div className="space-y-3">
            {availability.map((day) => (
              <div
                key={day.day}
                className={`p-4 rounded-lg border ${
                  day.isAvailable ? "bg-background" : "bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={day.isAvailable}
                      onCheckedChange={(checked) => updateDay(day.day, "isAvailable", checked)}
                    />
                    <Label className="font-medium">{day.dayName}</Label>
                  </div>

                  {day.isAvailable && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateDay(day.day, "startTime", e.target.value)}
                        className="w-28"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateDay(day.day, "endTime", e.target.value)}
                        className="w-28"
                      />
                    </div>
                  )}

                  {!day.isAvailable && (
                    <span className="text-sm text-muted-foreground">Closed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

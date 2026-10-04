import { Badge } from "@/components/ui/badge";
import { Clock, ShoppingCart, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
}

interface ServiceCartProps {
  services: Service[];
  selectedServices: Service[];
  onAddService: (service: Service) => void;
  onRemoveService: (serviceId: string) => void;
}

export const ServiceCart = ({
  services,
  selectedServices,
  onAddService,
  onRemoveService,
}: ServiceCartProps) => {
  const { t } = useTranslation();

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some((s) => s.id === serviceId);
  };

  const handleServiceClick = (service: Service) => {
    if (isServiceSelected(service.id)) {
      onRemoveService(service.id);
    } else {
      onAddService(service);
    }
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="space-y-3">
      {services.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          {t("customer.bookingDetails.noServicesAvailable")}
        </p>
      ) : (
        services.map((service) => {
          const isSelected = isServiceSelected(service.id);

          return (
            <div
              key={service.id}
              onClick={() => handleServiceClick(service)}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{service.name}</span>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        {t("common.selected")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.duration_minutes} {t("customer.bookingDetails.min")}
                    </span>
                    {service.description && (
                      <span className="truncate">{service.description}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary whitespace-nowrap">
                    ${service.price}
                  </span>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Sticky service tray */}
      {selectedServices.length > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-md glass rim-light border rounded-pill px-4 py-2 flex items-center gap-3 shadow-elevated animate-fade-in">
          <ShoppingCart className="w-4 h-4 text-vapor shrink-0" />
          <div className="flex-1 min-w-0 text-sm">
            <span className="text-foreground">
              {selectedServices.length} {t("booking.servicesSelected", { count: selectedServices.length })}
            </span>
            <span className="text-muted-foreground"> · ${totalPrice.toFixed(0)} · {totalDuration}m</span>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("booking-step-time")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="shrink-0 min-h-[40px] rounded-pill bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Continue to time
          </button>
        </div>
      )}
    </div>
  );
};

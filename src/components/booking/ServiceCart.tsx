import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Minus, ShoppingCart } from "lucide-react";
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

  const getServiceCount = (serviceId: string) => {
    return selectedServices.filter((s) => s.id === serviceId).length;
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
          const count = getServiceCount(service.id);
          const isSelected = count > 0;

          return (
            <div
              key={service.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{service.name}</span>
                    {isSelected && (
                      <Badge variant="secondary" className="text-xs">
                        ×{count}
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
                  <div className="flex items-center gap-1">
                    {isSelected && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onRemoveService(service.id)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={isSelected ? "outline" : "default"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onAddService(service)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Cart Summary */}
      {selectedServices.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-primary/5 border-2 border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-medium">
                {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-primary">${totalPrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {totalDuration} {t("customer.bookingDetails.min")} total
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

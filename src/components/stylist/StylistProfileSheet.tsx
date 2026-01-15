import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Calendar, CalendarPlus } from "lucide-react";
import { MapPreview } from "@/components/map/MapPreview";
import { openInMaps } from "@/components/map/StylistLocationLink";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Stylist {
  id: string;
  name: string;
  business_name?: string;
  photo_url?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

interface StylistProfileSheetProps {
  stylist: Stylist | null;
  isOpen: boolean;
  onClose: () => void;
  onNewAppointment: () => void;
  onViewHistory?: () => void;
  onMessage?: () => void;
  onCall?: () => void;
}

export const StylistProfileSheet = ({
  stylist,
  isOpen,
  onClose,
  onNewAppointment,
  onViewHistory,
  onMessage,
  onCall,
}: StylistProfileSheetProps) => {
  const { t } = useTranslation();

  if (!stylist) return null;

  const handleMapClick = () => {
    openInMaps(stylist.address, stylist.latitude, stylist.longitude, stylist.name);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{stylist.business_name || stylist.name}</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-8 space-y-4">
          {/* Map Preview - Large */}
          {stylist.latitude && stylist.longitude ? (
            <div 
              onClick={handleMapClick}
              className="cursor-pointer active:opacity-90 transition-opacity"
            >
              <MapPreview
                latitude={stylist.latitude}
                longitude={stylist.longitude}
                label={stylist.business_name || stylist.name}
                avatarUrl={stylist.photo_url}
                avatarFallback={stylist.name}
                className="h-[280px] rounded-2xl"
              />
            </div>
          ) : (
            <div className="h-[280px] rounded-2xl bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No location available</span>
            </div>
          )}

          {/* Stylist Info Row */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-foreground truncate">
                {stylist.business_name || stylist.name}
              </h2>
              {stylist.address && (
                <p className="text-sm text-muted-foreground truncate">
                  {stylist.address}
                </p>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="ml-3 rounded-full px-5"
              onClick={() => {
                onClose();
                onNewAppointment();
              }}
            >
              {t('common.profile', 'Profile')}
            </Button>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              className="h-12 rounded-xl text-base font-medium"
              onClick={onCall}
            >
              <Phone className="w-5 h-5 mr-2" />
              {t('common.call', 'Call')}
            </Button>
            <Button
              variant="secondary"
              className="h-12 rounded-xl text-base font-medium"
              onClick={onMessage}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {t('common.message', 'Message')}
            </Button>
          </div>

          <Button
            variant="secondary"
            className="w-full h-12 rounded-xl text-base font-medium"
            onClick={onViewHistory}
          >
            <Calendar className="w-5 h-5 mr-2" />
            {t('customer.appointments.history', 'Appointment history')}
          </Button>

          <Button
            variant="default"
            className="w-full h-12 rounded-xl text-base font-medium"
            onClick={() => {
              onClose();
              onNewAppointment();
            }}
          >
            <CalendarPlus className="w-5 h-5 mr-2" />
            {t('customer.booking.newAppointment', 'New appointment')}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

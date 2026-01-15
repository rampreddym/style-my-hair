import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
  avatarUrl?: string;
  avatarFallback?: string;
}

// Create custom avatar marker icon
const createAvatarIcon = (avatarUrl?: string, avatarFallback?: string) => {
  const initial = avatarFallback?.charAt(0) || "?";
  
  const html = avatarUrl
    ? `<div class="map-avatar-marker">
        <img src="${avatarUrl}" alt="Stylist" class="map-avatar-img" />
      </div>`
    : `<div class="map-avatar-marker map-avatar-fallback">
        <span>${initial}</span>
      </div>`;

  return L.divIcon({
    html,
    className: "custom-avatar-icon",
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

// Default marker icon as fallback
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const MapPreview = ({ 
  latitude, 
  longitude, 
  label, 
  className = "",
  avatarUrl,
  avatarFallback
}: MapPreviewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Use avatar icon if provided, otherwise default
    const icon = avatarUrl || avatarFallback 
      ? createAvatarIcon(avatarUrl, avatarFallback)
      : defaultIcon;

    // Add marker
    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    
    if (label) {
      marker.bindPopup(label);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, label, avatarUrl, avatarFallback]);

  // Update map view when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[160px]" />
      {/* Subtle overlay for visual depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/10 to-transparent rounded-xl" />
    </div>
  );
};

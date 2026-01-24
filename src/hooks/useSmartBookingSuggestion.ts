import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LastBooking {
  id: string;
  appointment_date: string;
  service_id: string;
  service_name: string;
  stylist_id: string;
  stylist_name: string;
  stylist_photo_url: string | null;
  stylist_rating: number;
  stylist_address: string | null;
  price: number;
}

export interface StylistMatch {
  id: string;
  name: string;
  business_name: string | null;
  photo_url: string | null;
  rating: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
  score: number;
  hasService: boolean;
  servicePrice: number | null;
  serviceDuration: number | null;
}

interface UseSmartBookingSuggestionProps {
  customerId: string | null;
  selectedServiceName: string | null;
  customerLatitude: number | null;
  customerLongitude: number | null;
}

export const useSmartBookingSuggestion = ({
  customerId,
  selectedServiceName,
  customerLatitude,
  customerLongitude,
}: UseSmartBookingSuggestionProps) => {
  const [lastBooking, setLastBooking] = useState<LastBooking | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<StylistMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate AI score based on rating, proximity, and service availability
  const calculateScore = (
    rating: number,
    distance: number | null,
    hasService: boolean
  ): number => {
    // Weights: rating (40%), proximity (40%), service match (20%)
    const ratingScore = (rating / 5) * 40;
    
    // Distance score: closer = better (max 50km considered)
    const maxDistance = 50;
    const distanceScore = distance !== null 
      ? Math.max(0, (1 - distance / maxDistance)) * 40
      : 20; // If no distance, give neutral score
    
    const serviceScore = hasService ? 20 : 0;
    
    return ratingScore + distanceScore + serviceScore;
  };

  // Fetch last booking for a similar service
  const fetchLastBooking = async () => {
    if (!customerId || !selectedServiceName) return;

    setLoading(true);

    try {
      // Find the most recent completed booking
      const { data: appointments, error: aptError } = await supabase
        .from("appointments")
        .select("id, appointment_date, service_id, stylist_id, price")
        .eq("customer_id", customerId)
        .in("status", ["completed", "confirmed", "pending"])
        .order("appointment_date", { ascending: false })
        .limit(20);

      if (aptError) throw aptError;
      if (!appointments || appointments.length === 0) {
        setLoading(false);
        return;
      }

      // Get service details for these appointments
      const serviceIds = [...new Set(appointments.map(a => a.service_id).filter(Boolean))];
      const stylistIds = [...new Set(appointments.map(a => a.stylist_id).filter(Boolean))];

      const [servicesResult, stylistsResult] = await Promise.all([
        supabase.from("stylist_services").select("id, name").in("id", serviceIds),
        supabase.from("stylists_public").select("id, name, photo_url, rating, address").in("id", stylistIds),
      ]);

      const servicesMap = new Map((servicesResult.data || []).map((s: any) => [s.id, s]));
      const stylistsMap = new Map((stylistsResult.data || []).map((s: any) => [s.id, s]));

      // Find booking with similar service name
      const matchingBooking = appointments.find((apt: any) => {
        const service = servicesMap.get(apt.service_id);
        const serviceName = service?.name?.toLowerCase() || "";
        const selectedName = selectedServiceName.toLowerCase();
        
        // Match if service names contain similar keywords
        const keywords = selectedName.split(/[\s,]+/).filter((k: string) => k.length > 2);
        return keywords.some((keyword: string) => serviceName.includes(keyword)) ||
               serviceName.includes(selectedName) ||
               selectedName.includes(serviceName);
      });

      if (matchingBooking) {
        const service = servicesMap.get(matchingBooking.service_id);
        const stylist = stylistsMap.get(matchingBooking.stylist_id);
        
        setLastBooking({
          id: matchingBooking.id,
          appointment_date: matchingBooking.appointment_date,
          service_id: matchingBooking.service_id,
          service_name: service?.name || "",
          stylist_id: matchingBooking.stylist_id,
          stylist_name: stylist?.name || "",
          stylist_photo_url: stylist?.photo_url || null,
          stylist_rating: stylist?.rating || 0,
          stylist_address: stylist?.address || null,
          price: matchingBooking.price,
        });
        setShowSuggestion(true);
      }
    } catch (error) {
      console.error("Error fetching last booking:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI-recommended stylists
  const fetchAIRecommendations = async () => {
    if (!selectedServiceName) return;

    setLoading(true);

    try {
      // Fetch all public stylists with their services
      const { data: stylists, error: stylistsError } = await supabase
        .from("stylists_public")
        .select("*")
        .order("rating", { ascending: false });

      if (stylistsError) throw stylistsError;

      // Fetch all services to match
      const { data: allServices, error: servicesError } = await supabase
        .from("stylist_services")
        .select("stylist_id, name, price, duration_minutes");

      if (servicesError) throw servicesError;

      // Process and score each stylist
      const recommendations: StylistMatch[] = (stylists || []).map((stylist: any) => {
        // Check if stylist offers a similar service
        const matchingService = allServices?.find((svc: any) => {
          if (svc.stylist_id !== stylist.id) return false;
          
          const svcName = svc.name?.toLowerCase() || "";
          const selectedName = selectedServiceName.toLowerCase();
          const keywords = selectedName.split(/[\s,]+/).filter((k: string) => k.length > 2);
          
          return keywords.some((keyword: string) => svcName.includes(keyword)) ||
                 svcName.includes(selectedName) ||
                 selectedName.includes(svcName);
        });

        // Calculate distance if customer location is available
        const distance = (customerLatitude && customerLongitude && stylist.latitude && stylist.longitude)
          ? calculateDistance(customerLatitude, customerLongitude, stylist.latitude, stylist.longitude)
          : null;

        // Calculate AI score
        const score = calculateScore(
          stylist.rating || 0,
          distance,
          !!matchingService
        );

        return {
          id: stylist.id,
          name: stylist.name,
          business_name: stylist.business_name,
          photo_url: stylist.photo_url,
          rating: stylist.rating || 0,
          address: stylist.address,
          latitude: stylist.latitude,
          longitude: stylist.longitude,
          distance,
          score,
          hasService: !!matchingService,
          servicePrice: matchingService?.price || null,
          serviceDuration: matchingService?.duration_minutes || null,
        };
      });

      // Sort by score and take top 5
      const sortedRecommendations = recommendations
        .filter(r => r.hasService) // Only include stylists that offer the service
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setAiRecommendations(sortedRecommendations);
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get the best recommendation (for auto-select)
  const getBestRecommendation = (): StylistMatch | null => {
    if (aiRecommendations.length === 0) return null;
    return aiRecommendations[0];
  };

  useEffect(() => {
    if (customerId && selectedServiceName) {
      fetchLastBooking();
      fetchAIRecommendations();
    }
  }, [customerId, selectedServiceName, customerLatitude, customerLongitude]);

  return {
    lastBooking,
    aiRecommendations,
    loading,
    showSuggestion,
    setShowSuggestion,
    getBestRecommendation,
    refetch: () => {
      fetchLastBooking();
      fetchAIRecommendations();
    },
  };
};

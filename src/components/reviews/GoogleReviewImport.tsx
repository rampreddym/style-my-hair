import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Star, MapPin, Loader2, Check, ExternalLink, LogIn } from "lucide-react";
import { getUserFriendlyError } from "@/lib/errorHandler";

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
}

interface GoogleReviewImportProps {
  stylistId: string;
  currentPlaceId?: string | null;
  onPlaceConnected: (placeId: string) => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export const GoogleReviewImport = ({
  stylistId,
  currentPlaceId,
  onPlaceConnected,
}: GoogleReviewImportProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [importMethod, setImportMethod] = useState<"oauth" | "search" | null>(null);

  // --- Google OAuth Flow ---
  const handleGoogleOAuth = async () => {
    setConnectingOAuth(true);
    try {
      const redirectUri = `${window.location.origin}/stylist/profile`;

      const { data, error } = await supabase.functions.invoke("google-business-auth-url", {
        body: { redirectUri },
      });

      if (error) throw error;
      if (data?.authUrl) {
        // Store stylist ID for after redirect
        sessionStorage.setItem("google_business_stylist_id", stylistId);
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      console.error("OAuth error:", error);
      toast({
        title: "Connection failed",
        description: getUserFriendlyError(error) || "Unable to connect Google Business. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnectingOAuth(false);
    }
  };

  // --- Places API Search Flow ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Enter business name", description: "Please enter your business name or address to search", variant: "destructive" });
      return;
    }
    setSearching(true);
    setSearchResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("search-google-places", { body: { query: searchQuery } });
      if (error) throw error;
      if (data?.results?.length > 0) {
        setSearchResults(data.results);
      } else {
        toast({ title: "No results found", description: "Try searching with a different business name or address" });
      }
    } catch (error: any) {
      toast({ title: "Search failed", description: getUserFriendlyError(error) || "Unable to search. Please try again.", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleConnect = async (place: GooglePlace) => {
    setConnecting(true);
    try {
      const { error: updateError } = await supabase.from("stylists").update({ google_place_id: place.place_id }).eq("id", stylistId);
      if (updateError) throw updateError;

      const { data: importResult, error: importError } = await supabase.functions.invoke("import-google-reviews", {
        body: { stylistId, placeId: place.place_id },
      });
      if (importError) throw importError;

      onPlaceConnected(place.place_id);
      toast({ title: "Connected successfully!", description: `Imported ${importResult?.reviewsImported || 0} reviews from Google` });
      setSearchResults([]);
      setSearchQuery("");
      setImportMethod(null);
    } catch (error: any) {
      toast({ title: "Connection failed", description: getUserFriendlyError(error) || "Unable to connect. Please try again.", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GoogleIcon />
          Import Google Reviews
        </CardTitle>
        <CardDescription>
          Connect your Google Business profile to import reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPlaceId ? (
          <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
            <Check className="w-5 h-5 text-success" />
            <div className="flex-1">
              <p className="font-medium text-success">Google Business Connected</p>
              <p className="text-sm text-muted-foreground">Reviews are synced from your Google Business profile</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setImportMethod(null); onPlaceConnected(""); }}>
              Change
            </Button>
          </div>
        ) : !importMethod ? (
          <div className="space-y-3">
            <Button
              onClick={handleGoogleOAuth}
              disabled={connectingOAuth}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300"
              variant="outline"
            >
              {connectingOAuth ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <GoogleIcon />
              )}
              <span className="ml-2 font-medium">Sign in with Google</span>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Connect your Google account to import all your business reviews
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setImportMethod("search")} className="w-full text-muted-foreground">
              <Search className="w-4 h-4 mr-2" />
              Search by business name instead
            </Button>
          </div>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => setImportMethod(null)} className="text-muted-foreground mb-2">
              ← Back to options
            </Button>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="business-search" className="sr-only">Business Name</Label>
                <Input
                  id="business-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your salon/barbershop name..."
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Select your business:</Label>
                {searchResults.map((place) => (
                  <button
                    key={place.place_id}
                    type="button"
                    disabled={connecting}
                    onClick={() => handleConnect(place)}
                    className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors text-left"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{place.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{place.formatted_address}</span>
                        </p>
                      </div>
                      {place.rating && (
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-warning fill-warning" />
                            <span className="font-medium">{place.rating}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{place.user_ratings_total} reviews</p>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              <ExternalLink className="w-3 h-3 inline mr-1" />
              Reviews will be imported from your Google Business profile
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

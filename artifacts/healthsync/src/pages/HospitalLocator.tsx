import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { MapPin, Navigation, Phone, Globe, Loader2, Hospital, Navigation2, RefreshCw, AlertCircle } from "lucide-react";
import { 
  APIProvider, 
  Map, 
  useApiIsLoaded, 
  useMapsLibrary,
  AdvancedMarker,
  Pin,
  MapCameraChangedEvent,
  useMap,
  Marker
} from "@vis.gl/react-google-maps";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 }; // New Delhi
const MAP_ID = "DEMO_MAP_ID"; // May require cloud setup, so fallback will be used

interface HospitalData {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  type: string;
}

export default function HospitalLocator() {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [errorVisible, setErrorVisible] = useState(false);

  // Detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setMapCenter(loc); // Move map to user location immediately
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter({...userLocation});
    }
  };

  return (
    <div className="pb-12 min-h-screen bg-background">
      <PageHeader 
        title="Find Care" 
        description="Locate specialized endocrinologists and gynecologists nearby."
      />

      <div className="px-4 sm:px-8">
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl mb-8 relative group">
          <div className="h-[450px] w-full relative">
            {!API_KEY || API_KEY === "YOUR_GOOGLE_MAPS_API_KEY" ? (
              <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-inner">
                    <MapPin className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-display font-bold mb-2">Google Maps API Key Required</h3>
                 <p className="text-muted-foreground text-sm max-w-md mb-6 font-medium">
                   Please edit your <code className="bg-muted px-2 py-1 rounded">.env</code> file in the <code className="bg-muted px-2 py-1 rounded">artifacts/healthsync/</code> directory.
                 </p>
                 <div className="bg-card p-4 rounded-2xl border border-border text-left w-full max-w-sm shadow-md">
                    <p className="text-xs font-mono text-primary truncate">VITE_GOOGLE_MAPS_API_KEY=your_key_here</p>
                 </div>
              </div>
            ) : (
              <APIProvider apiKey={API_KEY}>
                <MapComponent 
                  center={mapCenter} 
                  userLocation={userLocation}
                  hospitals={hospitals}
                  onHospitalsFound={(data) => setHospitals(data)}
                  onLoading={(l) => setLoading(l)}
                  onStatus={(s) => setSearchStatus(s)}
                />
              </APIProvider>
            )}
          </div>
          
          {/* Controls FAB */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-30">
            {userLocation && (
              <button 
                onClick={handleCenterOnUser}
                className="p-4 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                title="Center on my location"
              >
                <Navigation2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-2 gap-4">
          <div className="flex flex-col">
            <h3 className="text-2xl font-display font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Hospital className="w-6 h-6" />
              </div>
              Care Providers Near You
            </h3>
            <p className="text-sm text-muted-foreground mt-1 font-medium italic">
              {searchStatus || "Ready to search your area."}
            </p>
          </div>
          <div className="flex items-center gap-3">
             {loading && (
                <div className="flex items-center gap-2 text-primary font-bold text-sm bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </div>
             )}
          </div>
        </div>

        {hospitals.length === 0 && !loading ? (
           <div className="bg-muted/10 border-2 border-dashed border-border p-20 rounded-[3.5rem] text-center max-w-4xl mx-auto flex flex-col items-center shadow-inner">
              <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center mb-8 opacity-50 shadow-sm">
                <MapPin className="w-12 h-12" />
              </div>
              <h4 className="text-2xl font-display font-bold mb-3">Looking for providers?</h4>
              <p className="text-muted-foreground max-w-md mb-8 font-medium">
                Try moving the map to a known hospital area or use the button below to refresh the search for this location.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-4 bg-primary text-white rounded-2xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
              >
                <RefreshCw className="w-5 h-5" /> Refresh Search
              </button>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hospitals.map((h) => (
              <div key={h.id} className="bg-card border border-border p-8 rounded-[3rem] flex flex-col shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 transform hover:-translate-y-2 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-2xl leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[4rem]">{h.name}</h4>
                    <p className="text-xs text-muted-foreground mt-3 font-medium flex gap-2 items-start opacity-70">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-primary" /> 
                      <span className="line-clamp-2">{h.address}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-6">
                       <span className="text-[10px] font-black uppercase tracking-[0.15em] bg-primary/5 text-primary px-4 py-2 rounded-full border border-primary/10">
                        {h.type}
                       </span>
                       {h.rating && (
                         <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/5 rounded-full border border-amber-500/10">
                            <span className="text-amber-500 text-xs font-black">★</span>
                            <span className="text-xs font-black text-amber-600">{h.rating}</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-auto pt-8 border-t border-border/30">
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`, '_blank')}
                    className="flex-1 py-4.5 bg-foreground text-background rounded-3xl text-sm font-black flex items-center justify-center gap-2 hover:bg-primary transition-all shadow-xl shadow-foreground/5 active:scale-95"
                  >
                    <Navigation className="w-5 h-5" /> Directions
                  </button>
                  <button className="p-4.5 border-2 border-border rounded-3xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-90">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Specialized Search Note */}
        <div className="mt-16 bg-muted/20 p-8 rounded-[3rem] border border-border/50 flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center text-primary rounded-2xl shadow-inner flex-shrink-0">
             <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h5 className="text-lg font-bold mb-1">How search works</h5>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We search for hospitals and specialist clinics (Gynecology, PCOS, PCOD, thyroid) within 15km of your location. 
              If you don't see specific specialists, please pan the map towards the nearest city center.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapComponent({ 
  center, 
  userLocation,
  hospitals,
  onHospitalsFound,
  onLoading,
  onStatus 
}: { 
  center: google.maps.LatLngLiteral, 
  userLocation: google.maps.LatLngLiteral | null,
  hospitals: HospitalData[],
  onHospitalsFound: (data: HospitalData[]) => void,
  onLoading: (l: boolean) => void,
  onStatus: (s: string) => void
}) {
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  // Broad Search Algorithm
  const performSearch = useCallback(() => {
    if (!map || !placesLibrary) return;

    onLoading(true);
    onStatus("Scanning for medical facilities...");
    const service = new google.maps.places.PlacesService(map);
    const mapCenter = map.getCenter();
    if (!mapCenter) return;

    // We'll broaden the search significantly to ensure markers appear
    const request: google.maps.places.PlaceSearchRequest = {
      location: mapCenter,
      radius: 15000, // 15km radius
      type: 'hospital',
      // Simpler keyword string works better for Places Search
      keyword: 'gynaecologist endocrinologist clinic hospital' 
    };

    service.nearbySearch(request, (results, status) => {
      onLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        onStatus(`Found ${results.length} health centers nearby.`);
        const found = results.map(place => ({
          id: place.place_id || Math.random().toString(),
          name: place.name || 'Health Facility',
          address: place.vicinity || 'Address not listed',
          location: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0
          },
          rating: place.rating,
          type: place.types?.includes('hospital') ? 'Medical Hospital' : 'Specialist Center'
        }));
        onHospitalsFound(found);
      } else {
        console.warn("Places search status:", status);
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            onStatus("No specialized centers found. Try moving the map.");
            onHospitalsFound([]);
        } else {
            onStatus("Unable to fetch results. Check your API configuration.");
        }
      }
    });
  }, [map, placesLibrary, onHospitalsFound, onLoading, onStatus]);

  const onCameraChanged = (ev: MapCameraChangedEvent) => {
     if (searchDebounce.current) clearTimeout(searchDebounce.current);
     searchDebounce.current = setTimeout(() => {
       performSearch();
     }, 2000);
  };

  // Immediate re-center and search when location is found
  useEffect(() => {
    if (map && userLocation) {
        map.panTo(userLocation);
        performSearch();
    }
  }, [map, userLocation, placesLibrary]);

  return (
    <Map
      center={center}
      onCameraChanged={onCameraChanged}
      defaultZoom={13}
      mapId={MAP_ID}
      gestureHandling={'greedy'}
      disableDefaultUI={true}
      className="w-full h-full"
    >
      {/* User Location Marker (Standard Fallback) */}
      {userLocation && (
        <Marker 
          position={userLocation}
          title="Your Current Location"
          zIndex={100}
        />
      )}

      {/* Hospital Markers (Standard Fallback for Reliability) */}
      {hospitals.map((h) => (
        <Marker
          key={h.id}
          position={h.location}
          title={h.name}
        />
      ))}
    </Map>
  );
}

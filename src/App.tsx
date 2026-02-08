import { useEffect, useState, useCallback } from "react";
import ChoroplethMap from "./components/ChoroplethMap";
import FacilityCard from "./components/FacilityCard";

import ChatPanel from "./components/ChatPanel";
import GuidedOptions from "./components/GuidedOptions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import ApiStatusIndicator from "./components/ApiStatusIndicator";
import { findFacilityCoords } from "./lib/ghana-city-coords";
import { API_BASE_URL } from "./config";
import vitalLogo from "./assets/vital-logo.png";
import virtueFoundationLogo from "./assets/virtue-foundation-logo.avif";
type RegionSummary = {
  region: string;
  status: "desert" | "fragile" | "resilient";
  counts: {
    ready: number;
    fragile: number;
    absent: number;
    total: number;
  };
};
type Facility = {
  facility_id: string;
  name: string;
  lat?: number;
  lng?: number;
  region?: string;
  capability?: string[];
  phone_numbers?: string[];
  email?: string;
  websites?: string[];
  officialWebsite?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  address_city?: string;
  address_stateOrRegion?: string;
  address_zipOrPostcode?: string;
  address_country?: string;
  address_countryCode?: string;
  countries?: string[];
  missionStatement?: string;
  missionStatementLink?: string;
  organizationDescription?: string;
  facilityTypeId?: string;
  operatorTypeId?: string;
  affiliationTypeIds?: string[];
  description?: string;
  assessment: {
    readiness: "ready" | "fragile" | "absent";
    confidence: number;
    missing_required: string[];
    flags: {
      type: string;
      severity: string;
      message: string;
    }[];
  };
};
export default function App() {
  const [capability, setCapability] = useState("c_section");
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Load regions and all facilities
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch regions
    fetch(`${API_BASE_URL}/regions/summary?capability=${capability}`, {
      headers: {
        "ngrok-skip-browser-warning": "1"
      }
    }).then(r => {
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      return r.json();
    }).then(d => {
      const regionItems = d.items || [];
      setRegions(regionItems);

      // Fetch facilities for all regions
      const facilityPromises = regionItems.filter((r: RegionSummary) => r.region !== "Unknown").map((r: RegionSummary) => fetch(`${API_BASE_URL}/facilities?capability=${capability}&region=${encodeURIComponent(r.region)}&limit=200`, {
        headers: {
          "ngrok-skip-browser-warning": "1"
        }
      }).then(res => res.json()).then(data => {
        const items = data.items || [];
        return items.map((f: Facility) => {
          const coords = findFacilityCoords(f.name, r.region);
          return coords ? {
            ...f,
            lat: coords.lat,
            lng: coords.lng
          } : f;
        });
      }).catch(() => []));
      return Promise.all(facilityPromises);
    }).then(allFacilityArrays => {
      const combined = allFacilityArrays.flat();
      setAllFacilities(combined);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch data:", err);
      setError("Could not connect to API. The backend may be offline.");
      setRegions([]);
      setAllFacilities([]);
      setLoading(false);
    });
  }, [capability]);
  const handleRegionClick = useCallback((region: string) => {
    setSelectedRegion(region);
    setSelectedFacilityId(null);
    // Filter facilities for the selected region
    const filtered = allFacilities.filter(f => {
      return (f as Facility & {
        region?: string;
      }).region === region;
    });
    setSelectedFacilities(filtered);
  }, [allFacilities]);
  const handleFacilityClick = useCallback((facility: Facility) => {
    setSelectedFacilityId(facility.facility_id);
    // Also select the region if not already selected
    const facilityRegion = (facility as Facility & {
      region?: string;
    }).region;
    if (facilityRegion && facilityRegion !== selectedRegion) {
      setSelectedRegion(facilityRegion);
      const filtered = allFacilities.filter(f => {
        return (f as Facility & {
          region?: string;
        }).region === facilityRegion;
      });
      setSelectedFacilities(filtered);
    }
  }, [allFacilities, selectedRegion]);
  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">VITAL: Virtue-Informed Targeting of Actionable Life-Saving</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-derived readiness signals from unstructured facility data</p>
            <ApiStatusIndicator />
          </div>
          <div className="flex items-center gap-3">
            <img src={virtueFoundationLogo} alt="Virtue Foundation" className="h-16 w-auto" />
            <img src={vitalLogo} alt="VITAL Logo" className="h-16 w-auto" />
          </div>
        </div>

        {/* Agent Interaction Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="guided" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="guided">Guided Options</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>
            <TabsContent value="guided">
              <GuidedOptions />
            </TabsContent>
            <TabsContent value="chat">
              <ChatPanel />
            </TabsContent>
          </Tabs>
        </div>

        {/* Choropleth Map */}
        <div className="mt-6">
          <ChoroplethMap regions={regions} facilities={allFacilities} onRegionClick={handleRegionClick} onFacilityClick={handleFacilityClick} selectedRegion={selectedRegion} selectedFacilityId={selectedFacilityId} />
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState, useCallback } from "react";
import ChoroplethMap from "./components/ChoroplethMap";
import { findFacilityCoords } from "./lib/ghana-city-coords";

const API_BASE = "https://epexegetic-doris-quiescently.ngrok-free.dev";

type RegionSummary = {
  region: string;
  status: "desert" | "fragile" | "resilient";
  counts: { ready: number; fragile: number; absent: number; total: number };
};

type Facility = {
  facility_id: string;
  name: string;
  lat?: number;
  lng?: number;
  assessment: {
    readiness: "ready" | "fragile" | "absent";
    confidence: number;
    missing_required: string[];
    flags: { type: string; severity: string; message: string }[];
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
    fetch(`${API_BASE}/regions/summary?capability=${capability}`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const regionItems = d.items || [];
        setRegions(regionItems);
        
        // Fetch facilities for all regions
        const facilityPromises = regionItems
          .filter((r: RegionSummary) => r.region !== "Unknown")
          .map((r: RegionSummary) =>
            fetch(`${API_BASE}/facilities?capability=${capability}&region=${encodeURIComponent(r.region)}&limit=200`, {
              headers: { "ngrok-skip-browser-warning": "1" },
            })
              .then((res) => res.json())
              .then((data) => {
                const items = data.items || [];
                return items.map((f: Facility) => {
                  const coords = findFacilityCoords(f.name, r.region);
                  return coords ? { ...f, lat: coords.lat, lng: coords.lng } : f;
                });
              })
              .catch(() => [])
          );
        
        return Promise.all(facilityPromises);
      })
      .then((allFacilityArrays) => {
        const combined = allFacilityArrays.flat();
        setAllFacilities(combined);
        setLoading(false);
      })
      .catch((err) => {
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
    const filtered = allFacilities.filter((f) => {
      return (f as Facility & { region?: string }).region === region;
    });
    setSelectedFacilities(filtered);
  }, [allFacilities]);

  const handleFacilityClick = useCallback((facility: Facility) => {
    setSelectedFacilityId(facility.facility_id);
    // Also select the region if not already selected
    const facilityRegion = (facility as Facility & { region?: string }).region;
    if (facilityRegion && facilityRegion !== selectedRegion) {
      setSelectedRegion(facilityRegion);
      const filtered = allFacilities.filter((f) => {
        return (f as Facility & { region?: string }).region === facilityRegion;
      });
      setSelectedFacilities(filtered);
    }
  }, [allFacilities, selectedRegion]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Capability Readiness & Fragility</h1>
      <p className="text-sm text-gray-600 mt-1">AI-derived readiness signals from unstructured facility data</p>

      <div className="mt-4">
        <select className="border rounded px-3 py-2" value={capability} onChange={(e) => setCapability(e.target.value)}>
          <option value="c_section">C-section</option>
          <option value="emergency_surgery">Emergency surgery</option>
          <option value="ultrasound">Ultrasound</option>
        </select>
      </div>

      {/* Choropleth Map */}
      <div className="mt-6">
        <ChoroplethMap 
          regions={regions} 
          facilities={allFacilities} 
          onRegionClick={handleRegionClick} 
          onFacilityClick={handleFacilityClick}
          selectedRegion={selectedRegion} 
          selectedFacilityId={selectedFacilityId}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Regions</h2>
          <input
            type="text"
            placeholder="Search regions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="max-h-[400px] overflow-y-auto">
            {loading && <p className="text-sm text-muted-foreground">Loading regions...</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!loading && !error && regions.length === 0 && (
              <p className="text-sm text-muted-foreground">No regions found.</p>
            )}
            {regions
              .filter((r) => r.region.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((r) => (
                <button
                  key={r.region}
                  onClick={() => handleRegionClick(r.region)}
                  className={`w-full text-left border rounded p-3 mb-2 hover:bg-accent ${
                    selectedRegion === r.region ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="font-medium">{r.region}</div>
                  <div className="text-sm text-muted-foreground">
                    Status: <span className={
                      r.status === "resilient" ? "text-green-600" :
                      r.status === "fragile" ? "text-amber-600" : "text-red-600"
                    }>{r.status}</span> · {r.counts.total} facilities
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="col-span-2">
          <h2 className="font-semibold mb-2">
            {selectedRegion ? `Facilities — ${selectedRegion}` : "Select a region"}
          </h2>

          {selectedFacilities.map((f) => (
            <button
              key={f.facility_id}
              onClick={() => handleFacilityClick(f)}
              className={`w-full text-left border rounded p-3 mb-2 hover:bg-accent transition-colors ${
                selectedFacilityId === f.facility_id ? "ring-2 ring-primary bg-accent" : ""
              }`}
            >
              <div className="font-semibold">{f.name}</div>
              <div className="text-sm">
                Readiness: <span className={
                  f.assessment.readiness === "ready" ? "text-green-600 font-medium" :
                  f.assessment.readiness === "fragile" ? "text-amber-600 font-medium" : "text-red-600 font-medium"
                }>{f.assessment.readiness}</span> · Confidence: {Math.round(f.assessment.confidence * 100)}%
              </div>

              {f.assessment.flags.map((fl, i) => (
                <div key={i} className="text-sm text-destructive">
                  {fl.message}
                </div>
              ))}

              {f.assessment.missing_required.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Missing signals: {f.assessment.missing_required.join(", ")}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import FacilityPanel from "./components/FacilityPanel";

const API_BASE = "https://epexegetic-doris-quiescently.ngrok-free.dev";

type RegionSummary = {
  region: string;
  status: "desert" | "fragile" | "resilient";
  counts: { ready: number; fragile: number; absent: number; total: number };
};

type Evidence = {
  field: string;
  match: string;
  snippet: string;
};

type Facility = {
  facility_id: string;
  name: string;
  assessment: {
    readiness: "ready" | "fragile" | "absent";
    confidence: number;
    missing_required: string[];
    flags: { type: string; severity: string; message: string }[];
    evidence?: Evidence[];
  };
};

export default function App() {
  const [capability, setCapability] = useState("c_section");
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/regions/summary?capability=${capability}`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then((r) => r.json())
      .then((d) => setRegions(d.items || []))
      .catch(() => setRegions([]));
  }, [capability]);

  function loadFacilities(region: string) {
    setSelectedRegion(region);
    setLoadingFacilities(true);
    fetch(`${API_BASE}/facilities?capability=${capability}&region=${encodeURIComponent(region)}&limit=200`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then((r) => r.json())
      .then((d) => setFacilities(d.items || []))
      .catch(() => setFacilities([]))
      .finally(() => setLoadingFacilities(false));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Capability Readiness & Fragility</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-derived readiness signals from unstructured facility data
        </p>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Select Capability
          </label>
          <select
            className="border rounded-lg px-3 py-2 bg-background text-foreground"
            value={capability}
            onChange={(e) => {
              setCapability(e.target.value);
              setSelectedRegion(null);
              setFacilities([]);
            }}
          >
            <option value="c_section">C-section</option>
            <option value="emergency_surgery">Emergency surgery</option>
            <option value="ultrasound">Ultrasound</option>
          </select>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative">
            <MapView
              regions={regions}
              selectedRegion={selectedRegion}
              onSelectRegion={loadFacilities}
            />
          </div>

          <div>
            <FacilityPanel
              facilities={facilities}
              selectedRegion={selectedRegion}
              loading={loadingFacilities}
            />
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold text-foreground">
              {regions.reduce((sum, r) => sum + r.counts.total, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Facilities</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold" style={{ color: "hsl(38, 92%, 50%)" }}>
              {regions.reduce((sum, r) => sum + r.counts.fragile, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Fragile</div>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="text-2xl font-bold" style={{ color: "hsl(0, 72%, 51%)" }}>
              {regions.reduce((sum, r) => sum + r.counts.absent, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </div>
        </div>
      </main>
    </div>
  );
}

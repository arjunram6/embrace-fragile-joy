import { useEffect, useState, useCallback } from "react";
import ChoroplethMap from "./components/ChoroplethMap";

const API_BASE = "https://epexegetic-doris-quiescently.ngrok-free.dev";

type RegionSummary = {
  region: string;
  status: "desert" | "fragile" | "resilient";
  counts: { ready: number; fragile: number; absent: number; total: number };
};

type Facility = {
  facility_id: string;
  name: string;
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
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/regions/summary?capability=${capability}`, {
      headers: { "ngrok-skip-browser-warning": "1" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setRegions(d.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch regions:", err);
        setError("Could not connect to API. The backend may be offline.");
        setRegions([]);
        setLoading(false);
      });
  }, [capability]);

  const loadFacilities = useCallback(
    (region: string) => {
      setSelectedRegion(region);
      fetch(`${API_BASE}/facilities?capability=${capability}&region=${encodeURIComponent(region)}&limit=200`, {
        headers: { "ngrok-skip-browser-warning": "1" },
      })
        .then((r) => r.json())
        .then((d) => setFacilities(d.items || []))
        .catch(() => setFacilities([]));
    },
    [capability],
  );

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
        <ChoroplethMap regions={regions} onRegionClick={loadFacilities} selectedRegion={selectedRegion} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <h2 className="font-semibold mb-2">Regions</h2>
          {loading && <p className="text-sm text-muted-foreground">Loading regions...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!loading && !error && regions.length === 0 && (
            <p className="text-sm text-muted-foreground">No regions found.</p>
          )}
          {regions.map((r) => (
            <button
              key={r.region}
              onClick={() => loadFacilities(r.region)}
              className={`w-full text-left border rounded p-3 mb-2 hover:bg-accent ${
                selectedRegion === r.region ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="font-medium">{r.region}</div>
              <div className="text-sm">Status: {r.status}</div>
            </button>
          ))}
        </div>

        <div className="col-span-2">
          <h2 className="font-semibold mb-2">
            {selectedRegion ? `Facilities — ${selectedRegion}` : "Select a region"}
          </h2>

          {facilities.map((f) => (
            <div key={f.facility_id} className="border rounded p-3 mb-2">
              <div className="font-semibold">{f.name}</div>
              <div className="text-sm">
                Readiness: <b>{f.assessment.readiness}</b> · Confidence: {f.assessment.confidence}
              </div>

              {f.assessment.flags.map((fl, i) => (
                <div key={i} className="text-sm text-red-600">
                  {fl.message}
                </div>
              ))}

              {f.assessment.missing_required.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Missing signals: {f.assessment.missing_required.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

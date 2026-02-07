import { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView";

// ✅ Set this to your CURRENT ngrok URL
const API_BASE = "https://epexegetic-doris-quiescently.ngrok-free.dev";

// ✅ Needed so Lovable fetch does not get blocked by ngrok’s browser warning page
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "1" };

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

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[-–—]/g, " ")
    .replace(/[’']/g, "")
    .replace(/[()]/g, "");
}

// helper: show useful error messages instead of silent failures
async function fetchJsonOrThrow(url: string) {
  const r = await fetch(url, { headers: NGROK_HEADERS });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`${r.status} ${r.statusText}: ${t.slice(0, 200)}`);
  }
  return r.json();
}

export default function App() {
  const [capability, setCapability] = useState("c_section");

  const [summary, setSummary] = useState<RegionSummary[]>([]);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);

  // Load region summary for capability
  useEffect(() => {
    const url = `${API_BASE}/regions/summary?capability=${encodeURIComponent(capability)}`;

    fetchJsonOrThrow(url)
      .then((d) => {
        setSummary(d.items || []);
        setSummaryError(null);
      })
      .catch((e) => {
        setSummary([]);
        setSummaryError(`Summary load failed: ${String(e?.message || e)}`);
      });
  }, [capability]);

  const statusByRegion = useMemo(() => {
    const m = new Map<string, RegionSummary["status"]>();
    for (const r of summary) m.set(norm(r.region), r.status);
    return m;
  }, [summary]);

  function loadFacilities(regionName: string) {
    setSelectedRegion(regionName);
    setLoadingFacilities(true);
    setFacilitiesError(null);

    const url =
      `${API_BASE}/facilities?capability=${encodeURIComponent(capability)}` +
      `&region=${encodeURIComponent(regionName)}&limit=200`;

    fetchJsonOrThrow(url)
      .then((d) => setFacilities(d.items || []))
      .catch((e) => {
        setFacilities([]);
        setFacilitiesError(`Facilities load failed: ${String(e?.message || e)}`);
      })
      .finally(() => setLoadingFacilities(false));
  }

  const regionsForMap = useMemo<RegionSummary[]>(() => {
    // MapView expects the full RegionSummary objects; we already have them.
    // Ensure every region has a status (default to desert if missing).
    return (summary || []).map((r) => ({
      ...r,
      status: statusByRegion.get(norm(r.region)) || r.status || "desert",
    }));
  }, [summary, statusByRegion]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ghana Capability Fragility Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choropleth: desert / fragile / resilient • Click a region to drill down to facilities
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            API_BASE: <span className="font-mono">{API_BASE}</span>
          </p>
        </div>

        <div className="ml-auto">
          <div className="text-sm font-medium mb-1">Capability</div>
          <select
            className="border border-border rounded px-3 py-2 bg-background"
            value={capability}
            onChange={(e) => setCapability(e.target.value)}
          >
            <option value="c_section">C-section</option>
            <option value="emergency_surgery">Emergency surgery</option>
            <option value="ultrasound">Ultrasound</option>
          </select>
        </div>
      </div>

      {summaryError ? (
        <div className="mt-4 p-3 border border-border rounded bg-muted text-sm">{summaryError}</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border text-xs flex gap-3 items-center">
            <span className="font-semibold">Legend:</span>
            <span>🟩 resilient</span>
            <span>🟧 fragile</span>
            <span>🟥 desert</span>
          </div>

          <div className="p-3">
            <MapView
              regions={regionsForMap}
              selectedRegion={selectedRegion}
              onSelectRegion={(regionName) => {
                setSelectedRegion(regionName);
                loadFacilities(regionName);
              }}
            />
          </div>
        </div>

        <div className="border border-border rounded-xl p-4">
          <h2 className="font-semibold">
            {selectedRegion ? `Facilities — ${selectedRegion}` : "Click a region"}
          </h2>

          {loadingFacilities ? <div className="text-sm text-muted-foreground mt-2">Loading…</div> : null}
          {facilitiesError ? <div className="mt-2 text-sm text-destructive">{facilitiesError}</div> : null}

          <div className="mt-3 space-y-3">
            {facilities.map((f) => (
              <div key={f.facility_id || f.name} className="border border-border rounded-lg p-3">
                <div className="font-semibold">{f.name}</div>
                <div className="text-sm">
                  Readiness: <b>{f.assessment.readiness}</b> · Confidence: {f.assessment.confidence}
                </div>

                {f.assessment.flags?.length ? (
                  <div className="mt-2 space-y-1">
                    {f.assessment.flags.map((fl, i) => (
                      <div key={i} className="text-sm text-destructive">
                        {fl.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-2">No flags</div>
                )}

                {f.assessment.missing_required?.length ? (
                  <div className="text-xs text-muted-foreground mt-2">
                    Missing signals: {f.assessment.missing_required.join(", ")}
                  </div>
                ) : null}
              </div>
            ))}

            {selectedRegion && !loadingFacilities && facilities.length === 0 && !facilitiesError ? (
              <div className="text-sm text-muted-foreground">No facilities returned for this region.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

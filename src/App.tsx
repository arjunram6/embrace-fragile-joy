import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";

// ✅ Set this to your CURRENT ngrok URL (this is the one you shared earlier)
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

// Natural Earth admin1 has properties like: adm0_a3, admin, name, name_en, iso_a2, etc.
function getFeatureRegionName(f: any): string {
  const p = f?.properties || {};
  return p.name || p.name_en || p.name_local || "";
}

// ✅ More robust Ghana filter
function isGhanaFeature(f: any): boolean {
  const p = f?.properties || {};
  return p.adm0_a3 === "GHA" || p.admin === "Ghana" || p.iso_a2 === "GH";
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

  const [geo, setGeo] = useState<any>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [summary, setSummary] = useState<RegionSummary[]>([]);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);

  // Load GeoJSON from backend
  useEffect(() => {
    const url = `${API_BASE}/geo/gha_adm1`;

    fetchJsonOrThrow(url)
      .then((gj) => {
        const features = (gj.features || []).filter(isGhanaFeature);
        setGeo({ ...gj, features });
        setGeoError(null);

        // helpful hint if filter removes everything
        if (!features.length) {
          setGeoError("GeoJSON loaded but 0 Ghana features after filtering. We may need to adjust the filter keys.");
        }
      })
      .catch((e) => {
        setGeo(null);
        setGeoError(`GeoJSON load failed: ${String(e?.message || e)}`);
      });
  }, []);

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

  function styleForFeature(feature: any) {
    const name = getFeatureRegionName(feature);
    const status = statusByRegion.get(norm(name)) || "desert";

    const fill = status === "resilient" ? "#16a34a" : status === "fragile" ? "#f59e0b" : "#ef4444";

    const isSelected = selectedRegion && norm(selectedRegion) === norm(name);

    return {
      weight: isSelected ? 3 : 1,
      color: "#111827",
      opacity: 1,
      fillOpacity: 0.55,
      fillColor: fill,
    };
  }

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

  function onEachFeature(feature: any, layer: any) {
    const name = getFeatureRegionName(feature);
    layer.bindTooltip(name || "Unknown", { sticky: true });
    layer.on("click", () => {
      if (name) loadFacilities(name);
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ghana Capability Fragility Map</h1>
          <p className="text-sm text-gray-600 mt-1">
            Choropleth: desert / fragile / resilient • Click a region to drill down to facilities
          </p>
          <p className="text-xs text-gray-500 mt-1">
            API_BASE: <span className="font-mono">{API_BASE}</span>
          </p>
        </div>

        <div className="ml-auto">
          <div className="text-sm font-medium mb-1">Capability</div>
          <select
            className="border rounded px-3 py-2"
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
        <div className="mt-4 p-3 border rounded bg-red-50 text-red-700 text-sm">{summaryError}</div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 border rounded-xl overflow-hidden">
          <div className="p-3 border-b text-xs flex gap-3 items-center">
            <span className="font-semibold">Legend:</span>
            <span>🟩 resilient</span>
            <span>🟧 fragile</span>
            <span>🟥 desert</span>
          </div>

          {geo ? (
            <MapContainer style={{ height: 520, width: "100%" }} center={[7.95, -1.02]} zoom={6} scrollWheelZoom>
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON data={geo} style={styleForFeature as any} onEachFeature={onEachFeature} />
            </MapContainer>
          ) : (
            <div className="p-4 text-sm text-gray-600">
              Loading map…
              {geoError ? <div className="mt-2 text-red-600">Error: {geoError}</div> : null}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-4">
          <h2 className="font-semibold">{selectedRegion ? `Facilities — ${selectedRegion}` : "Click a region"}</h2>

          {loadingFacilities ? <div className="text-sm text-gray-600 mt-2">Loading…</div> : null}
          {facilitiesError ? <div className="mt-2 text-sm text-red-600">{facilitiesError}</div> : null}

          <div className="mt-3 space-y-3">
            {facilities.map((f) => (
              <div key={f.facility_id || f.name} className="border rounded-lg p-3">
                <div className="font-semibold">{f.name}</div>
                <div className="text-sm">
                  Readiness: <b>{f.assessment.readiness}</b> · Confidence: {f.assessment.confidence}
                </div>

                {f.assessment.flags?.length ? (
                  <div className="mt-2 space-y-1">
                    {f.assessment.flags.map((fl, i) => (
                      <div key={i} className="text-sm text-red-600">
                        {fl.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-2">No flags</div>
                )}

                {f.assessment.missing_required?.length ? (
                  <div className="text-xs text-gray-500 mt-2">
                    Missing signals: {f.assessment.missing_required.join(", ")}
                  </div>
                ) : null}
              </div>
            ))}

            {selectedRegion && !loadingFacilities && facilities.length === 0 && !facilitiesError ? (
              <div className="text-sm text-gray-600">No facilities returned for this region.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

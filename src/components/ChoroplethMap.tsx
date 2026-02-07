import { useEffect, useRef } from "react";
import L from "leaflet";

type RegionSummary = {
  region: string;
  status: "desert" | "fragile" | "resilient";
  counts: { ready: number; fragile: number; absent: number; total: number };
};

type ChoroplethMapProps = {
  regions: RegionSummary[];
  onRegionClick: (region: string) => void;
  selectedRegion: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  resilient: "#22c55e",
  fragile: "#f59e0b",
  desert: "#ef4444",
};

function getFeatureRegionName(properties: Record<string, unknown>): string {
  const p = properties;
  return (
    (p.region_name as string) ||
    (p.name as string) ||
    (p.name_en as string) ||
    (p.name_local as string) ||
    ""
  );
}

function normalizeRegionName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

export default function ChoroplethMap({
  regions,
  onRegionClick,
  selectedRegion,
}: ChoroplethMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [7.9465, -1.0232], // Ghana center
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Load GeoJSON and style based on regions
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove existing layer
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    // Fetch GeoJSON
    fetch("/ghana-adm1.geojson")
      .then((r) => r.json())
      .then((geojson) => {
        const regionLookup = new Map<string, RegionSummary>();
        regions.forEach((r) => {
          regionLookup.set(normalizeRegionName(r.region), r);
        });

        geoJsonLayerRef.current = L.geoJSON(geojson, {
          style: (feature) => {
            if (!feature?.properties) {
              return { fillColor: "#94a3b8", weight: 1, opacity: 1, color: "#64748b", fillOpacity: 0.5 };
            }

            const featureName = getFeatureRegionName(feature.properties);
            const normalizedName = normalizeRegionName(featureName);
            const regionData = regionLookup.get(normalizedName);

            const isSelected = selectedRegion && normalizeRegionName(selectedRegion) === normalizedName;

            return {
              fillColor: regionData ? STATUS_COLORS[regionData.status] : "#94a3b8",
              weight: isSelected ? 3 : 1,
              opacity: 1,
              color: isSelected ? "#1e293b" : "#64748b",
              fillOpacity: isSelected ? 0.8 : 0.6,
            };
          },
          onEachFeature: (feature, layer) => {
            if (!feature?.properties) return;

            const featureName = getFeatureRegionName(feature.properties);
            const normalizedName = normalizeRegionName(featureName);
            const regionData = regionLookup.get(normalizedName);

            // Tooltip
            const tooltipContent = regionData
              ? `<strong>${featureName}</strong><br/>Status: ${regionData.status}<br/>Ready: ${regionData.counts.ready} / ${regionData.counts.total}`
              : `<strong>${featureName}</strong><br/>No data`;

            layer.bindTooltip(tooltipContent, { sticky: true });

            // Click handler
            layer.on("click", () => {
              if (regionData) {
                onRegionClick(regionData.region);
              }
            });
          },
        }).addTo(map);
      })
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, [regions, selectedRegion, onRegionClick]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="h-[400px] w-full rounded-lg border" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-md z-[1000]">
        <div className="text-xs font-semibold mb-2">Status</div>
        <div className="space-y-1">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

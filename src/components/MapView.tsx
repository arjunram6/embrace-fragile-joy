import { useEffect, useState, useMemo, useRef } from "react";
import L from "leaflet";
import type { FeatureCollection, Feature } from "geojson";

const GEOJSON_URL = "/ghana-adm1.geojson";

type RegionSummary = {
  region: string;
  status: "desert" | "fragile" | "resilient";
  counts: { ready: number; fragile: number; absent: number; total: number };
};

type Props = {
  regions: RegionSummary[];
  selectedRegion: string | null;
  onSelectRegion: (region: string) => void;
};

// Normalize region names for matching
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+region$/i, "")
    .replace(/[^a-z]/g, "")
    .trim();
}

// Get color based on status
function getStatusColor(status: "desert" | "fragile" | "resilient" | undefined): string {
  switch (status) {
    case "resilient":
      return "hsl(142, 71%, 45%)";
    case "fragile":
      return "hsl(38, 92%, 50%)";
    case "desert":
    default:
      return "hsl(0, 72%, 51%)";
  }
}

export default function MapView({ regions, selectedRegion, onSelectRegion }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  // Build status lookup
  const statusMap = useMemo(() => {
    const map = new Map<string, "desert" | "fragile" | "resilient">();
    for (const r of regions) {
      map.set(normalize(r.region), r.status);
    }
    return map;
  }, [regions]);

  // Load GeoJSON
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView([7.9465, -1.0232], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add/update GeoJSON layer
  useEffect(() => {
    if (!mapRef.current || !geoData) return;

    // Remove old layer
    if (geoLayerRef.current) {
      mapRef.current.removeLayer(geoLayerRef.current);
    }

    // Find matching region name
    function findRegionName(feature: Feature): string {
      const shapeName = feature.properties?.shapeName || feature.properties?.ADM1_NAME || "";
      const normalized = normalize(shapeName);

      for (const r of regions) {
        if (normalize(r.region) === normalized) return r.region;
      }
      for (const r of regions) {
        if (normalize(r.region).includes(normalized) || normalized.includes(normalize(r.region))) {
          return r.region;
        }
      }
      return shapeName;
    }

    // Create new layer
    geoLayerRef.current = L.geoJSON(geoData, {
      style: (feature) => {
        if (!feature) return {};
        const shapeName = feature.properties?.shapeName || "";
        const normalized = normalize(shapeName);
        const status = statusMap.get(normalized);
        const isSelected = selectedRegion && normalize(selectedRegion) === normalized;

        return {
          fillColor: getStatusColor(status),
          weight: isSelected ? 3 : 1,
          opacity: 1,
          color: isSelected ? "#1e293b" : "#64748b",
          fillOpacity: isSelected ? 0.8 : 0.6,
        };
      },
      onEachFeature: (feature, layer) => {
        const shapeName = feature.properties?.shapeName || "Unknown";
        layer.bindTooltip(shapeName, { sticky: true });

        layer.on({
          click: () => {
            const regionName = findRegionName(feature);
            onSelectRegion(regionName);
          },
          mouseover: (e) => {
            const target = e.target as L.Path;
            target.setStyle({ weight: 2, fillOpacity: 0.8 });
          },
          mouseout: (e) => {
            const target = e.target as L.Path;
            const name = feature.properties?.shapeName || "";
            const isSelected = selectedRegion && normalize(selectedRegion) === normalize(name);
            target.setStyle({
              weight: isSelected ? 3 : 1,
              fillOpacity: isSelected ? 0.8 : 0.6,
            });
          },
        });
      },
    }).addTo(mapRef.current);
  }, [geoData, regions, statusMap, selectedRegion, onSelectRegion]);

  if (!geoData) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] rounded-lg overflow-hidden border">
      <div ref={containerRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 p-3 rounded-lg shadow-md border z-[1000]">
        <div className="text-xs font-semibold mb-2">Status</div>
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(142, 71%, 45%)" }} />
            <span>Resilient</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(38, 92%, 50%)" }} />
            <span>Fragile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(0, 72%, 51%)" }} />
            <span>Desert</span>
          </div>
        </div>
      </div>
    </div>
  );
}

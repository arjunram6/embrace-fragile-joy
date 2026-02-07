import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";

const GEOJSON_URL =
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/GHA/ADM1/geoBoundaries-GHA-ADM1_simplified.geojson";

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

// Build a lookup map from normalized name → status
function buildStatusMap(regions: RegionSummary[]): Map<string, "desert" | "fragile" | "resilient"> {
  const map = new Map<string, "desert" | "fragile" | "resilient">();
  for (const r of regions) {
    map.set(normalize(r.region), r.status);
  }
  return map;
}

// Get color based on status
function getStatusColor(status: "desert" | "fragile" | "resilient" | undefined): string {
  switch (status) {
    case "resilient":
      return "hsl(142, 71%, 45%)"; // green
    case "fragile":
      return "hsl(38, 92%, 50%)"; // amber
    case "desert":
    default:
      return "hsl(0, 72%, 51%)"; // red
  }
}

export default function MapView({ regions, selectedRegion, onSelectRegion }: Props) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  const statusMap = useMemo(() => buildStatusMap(regions), [regions]);

  // Find the best matching region name from the API data
  function findRegionName(feature: Feature): string | null {
    const shapeName = feature.properties?.shapeName || feature.properties?.ADM1_NAME || "";
    const normalized = normalize(shapeName);
    
    // Try exact match first
    for (const r of regions) {
      if (normalize(r.region) === normalized) {
        return r.region;
      }
    }
    
    // Try partial match
    for (const r of regions) {
      if (normalize(r.region).includes(normalized) || normalized.includes(normalize(r.region))) {
        return r.region;
      }
    }
    
    return shapeName; // fallback to original name
  }

  function style(feature: Feature | undefined): PathOptions {
    if (!feature) return {};
    
    const shapeName = feature.properties?.shapeName || feature.properties?.ADM1_NAME || "";
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
  }

  function onEachFeature(feature: Feature<Geometry, { shapeName?: string }>, layer: Layer) {
    const shapeName = feature.properties?.shapeName || "Unknown";
    
    layer.bindTooltip(shapeName, { sticky: true });
    
    layer.on({
      click: () => {
        const regionName = findRegionName(feature);
        if (regionName) {
          onSelectRegion(regionName);
        }
      },
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 2,
          fillOpacity: 0.8,
        });
      },
      mouseout: (e) => {
        const target = e.target;
        const shapeName = feature.properties?.shapeName || "";
        const normalized = normalize(shapeName);
        const isSelected = selectedRegion && normalize(selectedRegion) === normalized;
        target.setStyle({
          weight: isSelected ? 3 : 1,
          fillOpacity: isSelected ? 0.8 : 0.6,
        });
      },
    });
  }

  if (!geoData) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        center={[7.9465, -1.0232]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={selectedRegion || "default"}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      
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

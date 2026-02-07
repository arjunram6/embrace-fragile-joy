import { useEffect, useRef } from "react";
import L from "leaflet";

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

type ChoroplethMapProps = {
  regions: RegionSummary[];
  facilities?: Facility[];
  onRegionClick: (region: string) => void;
  onFacilityClick?: (facility: Facility) => void;
  selectedRegion: string | null;
  selectedFacilityId?: string | null;
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

// Maps API region names to GeoJSON region_name values
const REGION_ALIASES: Record<string, string> = {
  // Greater Accra variations
  "greateraccra": "greateraccra",
  "accranorth": "greateraccra",
  "accraeast": "greateraccra",
  "gaeastmunicipality": "greateraccra",
  "gaeastmunicipalitygreateraccra": "greateraccra",
  "ledzokukukrowor": "greateraccra",
  "shaiosudokudistrictgreateraccra": "greateraccra",
  "temawestmunicipal": "greateraccra",
  "eastlegon": "greateraccra",
  // Ashanti variations  
  "ashanti": "ashanti",
  "asokwakumasi": "ashanti",
  "ejisumunicipal": "ashanti",
  "ahafoanosouheast": "ashanti",
  // Western variations
  "western": "western",
  "westernnorth": "western",
  "takoradi": "western",
  // Bono/Brong Ahafo variations
  "bono": "bono",
  "bonoeast": "bonoeast",
  "ahafo": "ahafo",
  "brongahafo": "bono",
  "techimanmunicipal": "bono",
  "dormaaeast": "bono",
  // Volta/Oti variations
  "volta": "volta",
  "oti": "oti",
  // Northern variations
  "northern": "northern",
  "savannah": "savannah",
  "northeast": "northeast",
  // Upper regions
  "uppereast": "uppereast",
  "upperwest": "upperwest",
  "sissalawestdistrict": "upperwest",
  // Central region
  "central": "central",
  "centralghana": "central",
  // Eastern region
  "eastern": "eastern",
  // Generic/unknown
  "ghana": "greateraccra",
  "sh": "ashanti",
};

const READINESS_COLORS: Record<string, string> = {
  ready: "#22c55e",
  fragile: "#f59e0b",
  absent: "#ef4444",
};

export default function ChoroplethMap({
  regions,
  facilities = [],
  onRegionClick,
  onFacilityClick,
  selectedRegion,
  selectedFacilityId,
}: ChoroplethMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());

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
          const normalized = normalizeRegionName(r.region);
          // Store under both the original normalized name and any alias
          regionLookup.set(normalized, r);
          const alias = REGION_ALIASES[normalized];
          if (alias && !regionLookup.has(alias)) {
            regionLookup.set(alias, r);
          }
        });

        // Aggregate counts for regions that map to the same GeoJSON region
        const aggregatedLookup = new Map<string, RegionSummary>();
        regions.forEach((r) => {
          const normalized = normalizeRegionName(r.region);
          const targetRegion = REGION_ALIASES[normalized] || normalized;
          
          if (aggregatedLookup.has(targetRegion)) {
            const existing = aggregatedLookup.get(targetRegion)!;
            existing.counts.ready += r.counts.ready;
            existing.counts.fragile += r.counts.fragile;
            existing.counts.absent += r.counts.absent;
            existing.counts.total += r.counts.total;
            // Update status based on aggregated counts
            const readyRatio = existing.counts.ready / existing.counts.total;
            const fragileRatio = existing.counts.fragile / existing.counts.total;
            if (readyRatio > 0.5) {
              existing.status = "resilient";
            } else if (fragileRatio > 0.3 || readyRatio > 0.1) {
              existing.status = "fragile";
            } else {
              existing.status = "desert";
            }
          } else {
            aggregatedLookup.set(targetRegion, {
              region: r.region,
              status: r.status,
              counts: { ...r.counts },
            });
          }
        });

        geoJsonLayerRef.current = L.geoJSON(geojson, {
          style: (feature) => {
            if (!feature?.properties) {
              return { fillColor: "transparent", weight: 1, opacity: 1, color: "#94a3b8", fillOpacity: 0 };
            }

            const featureName = getFeatureRegionName(feature.properties);
            const normalizedName = normalizeRegionName(featureName);

            const isSelected = selectedRegion && normalizeRegionName(selectedRegion) === normalizedName;

            // Transparent fill, only show borders
            return {
              fillColor: "transparent",
              weight: isSelected ? 2 : 1,
              opacity: 1,
              color: isSelected ? "#1e293b" : "#94a3b8",
              fillOpacity: 0,
            };
          },
          onEachFeature: (feature, layer) => {
            if (!feature?.properties) return;

            const featureName = getFeatureRegionName(feature.properties);
            const normalizedName = normalizeRegionName(featureName);
            const regionData = aggregatedLookup.get(normalizedName);

            // Tooltip
            const tooltipContent = regionData
              ? `<strong>${featureName}</strong><br/>Status: ${regionData.status}<br/>Ready: ${regionData.counts.ready} / ${regionData.counts.total}`
              : `<strong>${featureName}</strong><br/>No data`;

            layer.bindTooltip(tooltipContent, { sticky: true });

            // Click handler - find all matching API regions and use the first one
            layer.on("click", () => {
              // Find the first API region that maps to this GeoJSON region
              const matchingRegion = regions.find((r) => {
                const normalized = normalizeRegionName(r.region);
                const alias = REGION_ALIASES[normalized] || normalized;
                return alias === normalizedName || normalized === normalizedName;
              });
              if (matchingRegion) {
                onRegionClick(matchingRegion.region);
              }
            });
          },
        }).addTo(map);
      })
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, [regions, selectedRegion, onRegionClick]);

  // Add facility markers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove existing markers
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }
    markersRef.current.clear();

    // Only add markers for facilities with coordinates
    const facilitiesWithCoords = facilities.filter((f) => f.lat && f.lng);
    
    if (facilitiesWithCoords.length === 0) return;

    markersLayerRef.current = L.layerGroup();

    facilitiesWithCoords.forEach((facility) => {
      const color = READINESS_COLORS[facility.assessment.readiness] || "#94a3b8";
      const isSelected = selectedFacilityId === facility.facility_id;
      
      const marker = L.circleMarker([facility.lat!, facility.lng!], {
        radius: isSelected ? 10 : 6,
        fillColor: color,
        color: isSelected ? "#000" : "#fff",
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 1 : 0.9,
      });

      marker.bindTooltip(
        `<strong>${facility.name}</strong><br/>Readiness: ${facility.assessment.readiness}<br/>Confidence: ${Math.round(facility.assessment.confidence * 100)}%`,
        { sticky: true }
      );

      marker.on("click", () => {
        if (onFacilityClick) {
          onFacilityClick(facility);
        }
      });

      markersRef.current.set(facility.facility_id, marker);
      markersLayerRef.current!.addLayer(marker);
    });

    markersLayerRef.current.addTo(map);
  }, [facilities, selectedFacilityId, onFacilityClick]);

  // Pan to selected facility
  useEffect(() => {
    if (!mapRef.current || !selectedFacilityId) return;

    const marker = markersRef.current.get(selectedFacilityId);
    if (marker) {
      const latLng = marker.getLatLng();
      mapRef.current.setView(latLng, 9, { animate: true });
      marker.openTooltip();
    }
  }, [selectedFacilityId]);

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

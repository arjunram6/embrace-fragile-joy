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

type Props = {
  facilities: Facility[];
  selectedRegion: string | null;
  loading: boolean;
};

function getReadinessBadge(readiness: "ready" | "fragile" | "absent") {
  const styles = {
    ready: "bg-green-100 text-green-800 border-green-200",
    fragile: "bg-amber-100 text-amber-800 border-amber-200",
    absent: "bg-red-100 text-red-800 border-red-200",
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[readiness]}`}>
      {readiness}
    </span>
  );
}

export default function FacilityPanel({ facilities, selectedRegion, loading }: Props) {
  if (!selectedRegion) {
    return (
      <div className="bg-muted/50 rounded-lg p-6 text-center">
        <p className="text-muted-foreground">Click a region on the map to view facilities</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-semibold text-lg mb-3">
        Facilities — {selectedRegion}
      </h2>
      
      {loading ? (
        <div className="text-muted-foreground">Loading facilities...</div>
      ) : facilities.length === 0 ? (
        <div className="text-muted-foreground">No facilities found in this region.</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {facilities.map((f) => (
            <div key={f.facility_id} className="border rounded-lg p-3 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm">{f.name}</div>
                {getReadinessBadge(f.assessment.readiness)}
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                Confidence: {(f.assessment.confidence * 100).toFixed(0)}%
              </div>

              {f.assessment.flags.map((fl, i) => (
                <div key={i} className="text-xs text-destructive mt-1">
                  ⚠ {fl.message}
                </div>
              ))}

              {f.assessment.missing_required.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Missing: {f.assessment.missing_required.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

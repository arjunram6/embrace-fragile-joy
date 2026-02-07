import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

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

function EvidenceSection({ evidence }: { evidence: Evidence[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="mt-2 text-xs text-muted-foreground italic">
        No evidence citations available
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <FileText className="h-3 w-3" />
        <span>Evidence ({evidence.length} citations)</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      
      {expanded && (
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-primary/20">
          {evidence.map((e, i) => (
            <div key={i} className="text-xs">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground capitalize">{e.field}:</span>
                <span className="text-primary font-mono bg-primary/10 px-1 rounded">
                  "{e.match}"
                </span>
              </div>
              <div className="text-muted-foreground mt-0.5 italic">
                "...{e.snippet}..."
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm">{facility.name}</div>
        {getReadinessBadge(facility.assessment.readiness)}
      </div>
      
      <div className="text-xs text-muted-foreground mt-1">
        Confidence: {(facility.assessment.confidence * 100).toFixed(0)}%
      </div>

      {facility.assessment.flags.map((fl, i) => (
        <div key={i} className="text-xs text-destructive mt-1">
          ⚠ {fl.message}
        </div>
      ))}

      {facility.assessment.missing_required.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          Missing: {facility.assessment.missing_required.join(", ")}
        </div>
      )}

      <EvidenceSection evidence={facility.assessment.evidence || []} />
    </div>
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
            <FacilityCard key={f.facility_id} facility={f} />
          ))}
        </div>
      )}
    </div>
  );
}

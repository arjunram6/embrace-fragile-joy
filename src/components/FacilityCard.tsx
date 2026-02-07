import { CheckCircle, AlertTriangle, XCircle, ChevronRight } from "lucide-react";

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

type FacilityCardProps = {
  facility: Facility;
  isSelected: boolean;
  onClick: () => void;
};

const statusConfig = {
  ready: {
    icon: CheckCircle,
    label: "Ready",
    bgColor: "bg-green-50",
    borderColor: "border-l-green-500",
    iconColor: "text-green-600",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
  },
  fragile: {
    icon: AlertTriangle,
    label: "Fragile",
    bgColor: "bg-amber-50",
    borderColor: "border-l-amber-500",
    iconColor: "text-amber-600",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  absent: {
    icon: XCircle,
    label: "Not Ready",
    bgColor: "bg-red-50",
    borderColor: "border-l-red-500",
    iconColor: "text-red-600",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
  },
};

export default function FacilityCard({ facility, isSelected, onClick }: FacilityCardProps) {
  const status = statusConfig[facility.assessment.readiness];
  const StatusIcon = status.icon;
  const confidence = Math.round(facility.assessment.confidence * 100);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-lg border-l-4 ${status.borderColor}
        bg-card hover:bg-accent/50 transition-all duration-200
        ${isSelected ? "ring-2 ring-primary shadow-md" : "shadow-sm hover:shadow"}
        mb-3 overflow-hidden
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-full ${status.bgColor} flex-shrink-0`}>
              <StatusIcon className={`w-4 h-4 ${status.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm leading-tight truncate">{facility.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${status.badgeBg} ${status.badgeText} font-medium`}>
                  {status.label}
                </span>
                {confidence > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {confidence}% confidence
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isSelected ? "rotate-90" : ""}`} />
        </div>

        {/* Flags/Warnings */}
        {facility.assessment.flags.length > 0 && (
          <div className="mt-3 space-y-1">
            {facility.assessment.flags.slice(0, 2).map((flag, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-1">{flag.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Missing Signals */}
        {facility.assessment.missing_required.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {facility.assessment.missing_required.slice(0, 3).map((signal, i) => (
                <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                  {signal}
                </span>
              ))}
              {facility.assessment.missing_required.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{facility.assessment.missing_required.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

import { CheckCircle, AlertTriangle, XCircle, ChevronRight, Info, Phone, Mail, Globe, MapPin, Building, FileText } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

type Facility = {
  facility_id: string;
  name: string;
  lat?: number;
  lng?: number;
  region?: string;
  capability?: string[];
  phone_numbers?: string[];
  email?: string;
  websites?: string[];
  officialWebsite?: string;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  address_city?: string;
  address_stateOrRegion?: string;
  address_zipOrPostcode?: string;
  address_country?: string;
  address_countryCode?: string;
  countries?: string[];
  missionStatement?: string;
  missionStatementLink?: string;
  organizationDescription?: string;
  facilityTypeId?: string;
  operatorTypeId?: string;
  affiliationTypeIds?: string[];
  description?: string;
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

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | string[] | null }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border last:border-0">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm break-words">{displayValue}</div>
      </div>
    </div>
  );
}

function FacilityInfoPopover({ facility }: { facility: Facility }) {
  const address = [
    facility.address_line1,
    facility.address_line2,
    facility.address_line3,
    facility.address_city,
    facility.address_stateOrRegion,
    facility.address_zipOrPostcode,
    facility.address_country,
  ].filter(Boolean).join(", ");

  const hasInfo = facility.capability || facility.phone_numbers || facility.email || 
    facility.websites || facility.officialWebsite || address || 
    facility.description || facility.organizationDescription || 
    facility.missionStatement || facility.facilityTypeId;

  if (!hasInfo) {
    return (
      <div className="p-2 rounded-full hover:bg-muted transition-colors opacity-30 cursor-not-allowed">
        <Info className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="p-2 rounded-full hover:bg-muted transition-colors"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Info className="w-4 h-4 text-primary" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 border-b bg-muted/50">
          <h4 className="font-semibold text-sm">{facility.name}</h4>
          {facility.facilityTypeId && (
            <span className="text-xs text-muted-foreground capitalize">{facility.facilityTypeId}</span>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-3 space-y-0">
            <InfoRow icon={Building} label="Capabilities" value={facility.capability} />
            <InfoRow icon={Phone} label="Phone" value={facility.phone_numbers} />
            <InfoRow icon={Mail} label="Email" value={facility.email} />
            <InfoRow icon={Globe} label="Website" value={facility.officialWebsite || (facility.websites?.[0])} />
            <InfoRow icon={MapPin} label="Address" value={address || undefined} />
            <InfoRow icon={FileText} label="Description" value={facility.description || facility.organizationDescription} />
            {facility.missionStatement && (
              <InfoRow icon={FileText} label="Mission" value={facility.missionStatement} />
            )}
            {facility.operatorTypeId && (
              <InfoRow icon={Building} label="Operator Type" value={facility.operatorTypeId} />
            )}
            {facility.affiliationTypeIds && facility.affiliationTypeIds.length > 0 && (
              <InfoRow icon={Building} label="Affiliations" value={facility.affiliationTypeIds} />
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default function FacilityCard({ facility, isSelected, onClick }: FacilityCardProps) {
  const status = statusConfig[facility.assessment.readiness];
  const StatusIcon = status.icon;
  const confidence = Math.round(facility.assessment.confidence * 100);

  return (
    <div
      onClick={onClick}
      className={`
        w-full text-left rounded-lg border-l-4 ${status.borderColor}
        bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer
        ${isSelected ? "ring-2 ring-primary shadow-md" : "shadow-sm hover:shadow"}
        mb-3 overflow-hidden
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
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
          <div className="flex items-center gap-1 flex-shrink-0">
            <FacilityInfoPopover facility={facility} />
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
          </div>
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
    </div>
  );
}

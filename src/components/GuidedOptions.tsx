import { useState, useEffect, useCallback } from "react";
import { Loader2, MapPin, Search, AlertTriangle, Building2, CheckCircle, MessageSquare, RefreshCw } from "lucide-react";
import { apiGuidedOptions, apiGuidedQuery, GuidedOption, QueryResponse, ApiError } from "@/lib/api";
import ReactMarkdown from "react-markdown";
const OPTION_ICONS: Record<string, React.ReactNode> = {
  care_near_me: <MapPin className="h-5 w-5" />,
  gaps: <AlertTriangle className="h-5 w-5" />,
  find: <Search className="h-5 w-5" />,
  regional: <Building2 className="h-5 w-5" />,
  verify: <CheckCircle className="h-5 w-5" />,
  custom: <MessageSquare className="h-5 w-5" />,
};

type InputConfig = {
  fields: { key: string; label: string; placeholder: string }[];
  buildQuery: (values: Record<string, string>) => string;
};

const OPTION_INPUTS: Record<string, InputConfig> = {
  care_near_me: {
    fields: [
      { key: "care", label: "Type of care", placeholder: "e.g., maternity, dialysis" },
      { key: "city", label: "City/Location", placeholder: "e.g., Accra, Kumasi" },
    ],
    buildQuery: (v) => `I need ${v.care} care, where should I go? I live in ${v.city}`,
  },
  gaps: {
    fields: [
      { key: "capability", label: "Capability", placeholder: "e.g., dialysis, MRI" },
    ],
    buildQuery: (v) => `Which regions lack ${v.capability}?`,
  },
  find: {
    fields: [
      { key: "care", label: "Care type", placeholder: "e.g., maternity care" },
    ],
    buildQuery: (v) => `Facilities with ${v.care}`,
  },
  regional: {
    fields: [
      { key: "region", label: "Region", placeholder: "e.g., Accra, Ashanti" },
    ],
    buildQuery: (v) => `What capabilities exist in ${v.region}?`,
  },
  verify: {
    fields: [
      { key: "facility", label: "Facility name", placeholder: "e.g., Korle Bu" },
      { key: "capability", label: "Capability", placeholder: "e.g., dialysis" },
    ],
    buildQuery: (v) => `Can ${v.facility} do ${v.capability}?`,
  },
  custom: {
    fields: [
      { key: "query", label: "Your question", placeholder: "Type your question..." },
    ],
    buildQuery: (v) => v.query,
  },
};

export default function GuidedOptions() {
  const [options, setOptions] = useState<GuidedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<GuidedOption | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [queryLoading, setQueryLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<{ message: string; isTimeout?: boolean } | null>(null);

  useEffect(() => {
    apiGuidedOptions()
      .then((data) => setOptions(data.options))
      .catch((err) => {
        console.error("Failed to load guided options:", err);
        // Fallback to default options
        setOptions([
          { id: "care_near_me", label: "I need care near me", short: "Find care by location", example: "" },
          { id: "gaps", label: "Find gaps", short: "Where is care missing?", example: "" },
          { id: "find", label: "Find facilities", short: "Search by capability", example: "" },
          { id: "regional", label: "Regional view", short: "Capabilities by region", example: "" },
          { id: "verify", label: "Verify a claim", short: "Can a facility do X?", example: "" },
          { id: "custom", label: "Custom question", short: "Ask anything", example: "" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOptionSelect = (option: GuidedOption) => {
    setSelectedOption(option);
    setInputValues({});
    setResponse(null);
    setError(null);
  };

  const handleInputChange = (key: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedOption) return;

    const config = OPTION_INPUTS[selectedOption.id];
    if (!config) return;

    // Check all fields are filled
    const allFilled = config.fields.every((f) => inputValues[f.key]?.trim());
    if (!allFilled) return;

    const query = config.buildQuery(inputValues);
    setQueryLoading(true);
    setError(null);

    try {
      const result = await apiGuidedQuery(query);
      setResponse(result);
    } catch (err) {
      console.error("Query error:", err);
      if (err instanceof ApiError) {
        setError({ message: err.message, isTimeout: err.isTimeout });
      } else {
        setError({ message: "Failed to connect to the server. Please try again." });
      }
    } finally {
      setQueryLoading(false);
    }
  }, [selectedOption, inputValues]);

  const handleBack = () => {
    setSelectedOption(null);
    setInputValues({});
    setResponse(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show input form for selected option
  if (selectedOption) {
    const config = OPTION_INPUTS[selectedOption.id];
    const allFilled = config?.fields.every((f) => inputValues[f.key]?.trim());

    return (
      <div className="space-y-4">
        <button
          onClick={handleBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to options
        </button>

        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-4">
            {OPTION_ICONS[selectedOption.id]}
            <h3 className="font-medium">{selectedOption.label}</h3>
          </div>

          <div className="space-y-3">
            {config?.fields.map((field) => (
              <div key={field.key}>
                <label className="text-sm text-muted-foreground block mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={inputValues[field.key] || ""}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!allFilled || queryLoading}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {queryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                "Ask"
              )}
            </button>
          </div>
        </div>

        {/* Response */}
        {response && (
          <div className="border rounded-lg p-4 bg-card">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{response.answer}</ReactMarkdown>
            </div>
            {response.used_medical_reasoning && (
              <p className="text-xs text-muted-foreground mt-3">
                ⚕️ Medical reasoning was used
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/10">
            <p className="text-sm text-destructive">{error.message}</p>
            <button
              onClick={handleSubmit}
              className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show option cards
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleOptionSelect(option)}
          className="border rounded-lg p-4 text-left hover:bg-accent hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2 text-primary">
            {OPTION_ICONS[option.id] || <MessageSquare className="h-5 w-5" />}
          </div>
          <h3 className="font-medium text-sm">{option.label}</h3>
          <p className="text-xs text-muted-foreground mt-1">{option.short}</p>
        </button>
      ))}
    </div>
  );
}

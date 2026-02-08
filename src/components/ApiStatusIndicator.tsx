import { useState, useEffect, useCallback } from "react";
import { Circle, RefreshCw } from "lucide-react";
import { apiHealth, ApiError } from "@/lib/api";

type Status = "checking" | "online" | "offline";

export default function ApiStatusIndicator() {
  const [status, setStatus] = useState<Status>("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await apiHealth();
      // Accept any valid response as "online"
      if (response && (response.status === "ok" || response.status === "healthy" || response.service)) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch (err) {
      console.error("Health check failed:", err);
      setStatus("offline");
    } finally {
      setLastChecked(new Date());
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Re-check every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const statusColors = {
    checking: "text-muted-foreground",
    online: "text-green-500",
    offline: "text-destructive",
  };

  const statusLabels = {
    checking: "Checking...",
    online: "API Online",
    offline: "API Offline",
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5">
        <Circle
          className={`h-2 w-2 fill-current ${statusColors[status]} ${
            status === "checking" ? "animate-pulse" : ""
          }`}
        />
        <span className={`${statusColors[status]} font-medium`}>
          {statusLabels[status]}
        </span>
      </div>
      <button
        onClick={checkHealth}
        disabled={isRefreshing}
        className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
        title="Refresh status"
      >
        <RefreshCw
          className={`h-3 w-3 text-muted-foreground ${
            isRefreshing ? "animate-spin" : ""
          }`}
        />
      </button>
    </div>
  );
}

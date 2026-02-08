import { useState, useCallback } from "react";
import { Search, Loader2, X, Bot, Sparkles } from "lucide-react";
import { apiQuery, QueryResponse } from "@/lib/api";
import ReactMarkdown from "react-markdown";

export default function AgentSearchBar() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await apiQuery(query);
      setResponse(result);
    } catch (err) {
      console.error("Agent query failed:", err);
      setError(err instanceof Error ? err.message : "Failed to get response from agent");
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearResponse = () => {
    setResponse(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 border rounded-lg bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
          <Bot className="ml-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Ask the agent about facilities, regions, or capabilities..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 py-3 pr-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="mr-2 p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Response Panel */}
      {(response || error) && (
        <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bot className="h-4 w-4" />
              <span>Agent Response</span>
              {response?.intent && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  {response.intent}
                </span>
              )}
              {response?.confidence && (
                <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs">
                  {response.confidence} confidence
                </span>
              )}
            </div>
            <button
              onClick={clearResponse}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="p-4">
            {error ? (
              <p className="text-destructive text-sm">{error}</p>
            ) : response ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{response.answer}</ReactMarkdown>
              </div>
            ) : null}
            
            {response?.sub_agent && (
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <span>Handled by: {response.sub_agent}</span>
                {response.used_medical_reasoning && (
                  <span className="inline-flex items-center gap-1 ml-2">
                    <Sparkles className="h-3 w-3" /> Medical reasoning
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

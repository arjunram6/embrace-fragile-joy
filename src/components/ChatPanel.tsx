import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, AlertTriangle, RefreshCw } from "lucide-react";
import { apiChat, ChatResponse, ApiError } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant" | "error";
  content: string;
  intent?: string;
  sub_agent?: string;
  isTimeout?: boolean;
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (retryMessage?: string) => {
    const messageToSend = retryMessage || input.trim();
    if (!messageToSend || isLoading) return;

    if (!retryMessage) {
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: messageToSend }]);
    }
    setLastUserMessage(messageToSend);
    setIsLoading(true);

    // Remove any previous error message when retrying
    if (retryMessage) {
      setMessages((prev) => prev.filter((m) => m.role !== "error"));
    }

    try {
      const response: ChatResponse = await apiChat(messageToSend);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.reply,
          intent: response.intent,
          sub_agent: response.sub_agent,
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      const isTimeout = err instanceof ApiError && err.isTimeout;
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to connect to the server.";
      
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: errorMessage,
          isTimeout,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleRetry = () => {
    if (lastUserMessage) {
      handleSend(lastUserMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-card">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium">Medical Agent Chat</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ask me about Ghana health facilities</p>
            <p className="text-sm mt-1">e.g., "What services does Korle Bu offer?"</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.role === "error") {
            return (
              <div key={idx} className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="max-w-[80%] rounded-lg p-3 bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{msg.content}</p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try again
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                {msg.sub_agent && (
                  <p className="text-xs mt-2 opacity-70">
                    via {msg.sub_agent}
                  </p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

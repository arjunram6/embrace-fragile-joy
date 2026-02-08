import { API_BASE_URL } from "@/config";

const headers = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "1",
};

// Request timeout (30 seconds)
const TIMEOUT_MS = 30000;

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public isTimeout?: boolean
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out. The server may be busy or starting up.", undefined, true);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Parse API response with error handling
async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMessage = `Server error (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use default error message
    }
    throw new ApiError(errorMessage, res.status);
  }
  return res.json();
}

// Health Check
export type HealthResponse = {
  status: string;
  service: string;
};

export async function apiHealth(): Promise<HealthResponse> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/health`, { headers });
  return parseResponse(res);
}

// Single Question (Query)
export type QueryResponse = {
  answer: string;
  intent?: string;
  sub_agent?: string;
  used_medical_reasoning?: boolean;
  confidence?: string;
};

export async function apiQuery(query: string): Promise<QueryResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/query`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    },
    60000 // Allow 60 seconds for AI queries
  );
  return parseResponse(res);
}

// Chat (Multi-turn)
export type ChatResponse = {
  reply: string;
  intent?: string;
  sub_agent?: string;
};

export async function apiChat(message: string): Promise<ChatResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/chat`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    },
    60000 // Allow 60 seconds for AI chat
  );
  return parseResponse(res);
}

// Guided Options
export type GuidedOption = {
  id: string;
  label: string;
  short: string;
  example: string;
};

export type GuidedOptionsResponse = {
  options: GuidedOption[];
};

export async function apiGuidedOptions(): Promise<GuidedOptionsResponse> {
  const res = await fetchWithTimeout(`${API_BASE_URL}/api/guided-options`, { headers });
  return parseResponse(res);
}

// Guided Query (same as single question)
export async function apiGuidedQuery(query: string): Promise<QueryResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE_URL}/api/guided-query`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    },
    60000 // Allow 60 seconds for AI queries
  );
  return parseResponse(res);
}

import { API_BASE_URL } from "@/config";

const headers = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "1",
};

// Health Check
export type HealthResponse = {
  status: string;
  service: string;
};

export async function apiHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
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
  const res = await fetch(`${API_BASE_URL}/api/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Chat (Multi-turn)
export type ChatResponse = {
  reply: string;
  intent?: string;
  sub_agent?: string;
};

export async function apiChat(message: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
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
  const res = await fetch(`${API_BASE_URL}/api/guided-options`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Guided Query (same as single question)
export async function apiGuidedQuery(query: string): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/guided-query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

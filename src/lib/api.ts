import { API_BASE_URL } from "@/config";

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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }

  return res.json();
}

"use client";

import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api/databuddy";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Databuddy POST ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export type DatabuddyParamEntry = {
  parameter: string;
  success?: boolean;
  data: unknown[];
  error?: string;
};

export type DatabuddyBatchResult = {
  success: boolean;
  batch?: boolean;
  queryId?: string;
  results?: Array<{
    queryId?: string;
    data?: DatabuddyParamEntry[];
    meta?: unknown;
  }>;
  data?: DatabuddyParamEntry[];
  meta?: unknown;
};

export function useDatabuddyParameters(args: {
  websiteId: string;
  parameters: string[];
  limit?: number;
  page?: number;
  filters?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
}) {
  const { websiteId, parameters, limit, page, filters, startDate, endDate } =
    args;
  return useQuery({
    queryKey: [
      "databuddy",
      "parameters",
      websiteId,
      parameters,
      limit,
      page,
      filters,
      startDate,
      endDate,
    ],
    queryFn: () =>
      post<DatabuddyBatchResult>(
        `/query?website_id=${encodeURIComponent(websiteId)}${startDate ? `&start_date=${encodeURIComponent(startDate)}` : ""}${endDate ? `&end_date=${encodeURIComponent(endDate)}` : ""}`,
        { id: "custom-query", parameters, limit, page, filters },
      ),
  });
}

export function mapBatchByParameter(json: DatabuddyBatchResult): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  const direct = Array.isArray(json.data) ? json.data : undefined;
  const nested = Array.isArray(json.results) && json.results[0]?.data ? json.results[0].data : undefined;
  const entries: DatabuddyParamEntry[] = direct ?? nested ?? [];
  for (const entry of entries) {
    if (entry && typeof entry.parameter === 'string') out[entry.parameter] = Array.isArray(entry.data) ? entry.data : [];
  }
  return out;
}

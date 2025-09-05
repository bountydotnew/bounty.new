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

export type DatabuddyBatchResult = {
  success: boolean;
  batch?: boolean;
  results?: Array<{
    queryId?: string;
    data?: Array<{ parameter: string; success: boolean; data: unknown[] }>;
    meta?: unknown;
  }>;
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

export function mapBatchByParameter(
  json: DatabuddyBatchResult,
): Record<string, unknown[]> {
  const out: Record<string, unknown[]> = {};
  const arr = Array.isArray((json as any)?.data)
    ? ((json as any).data as Array<any>)
    : (json?.results?.[0]?.data as Array<any>) || [];
  for (const entry of arr) {
    if (entry?.parameter)
      out[entry.parameter] = (entry.data as unknown[]) || [];
  }
  return out;
}

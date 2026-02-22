export interface DataBuddyQueryBody {
  website_id?: string;
  websiteId?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  id?: string;
  parameters?: unknown;
  limit?: number;
  page?: number;
  filters?: unknown;
}

export interface DataBuddyUpstreamBody {
  id: string;
  parameters: unknown;
  limit?: number;
  page?: number;
  filters?: unknown;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

interface RequestHeaders {
  'content-type': string;
  'x-api-key'?: string;
  cookie?: string;
}

interface HttpResponseHeaders {
  'content-type': string;
}

interface NextApiRequest extends Request {
  json(): Promise<DataBuddyQueryBody>;
  url: string;
}

interface NextApiResponse extends Response {
  status: number;
  headers: Headers;
}

export interface PolarCustomer {
  id: string;
  email: string;
  name?: string;
  external_id: string;
  metadata?: Record<string, unknown>;
}

export interface PolarCustomerCreateParams {
  external_id: string;
  email: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface PolarError {
  status?: number;
  message?: string;
  body$?: string;
  detail?: string;
}

export interface PolarWebhookPayload {
  type: string;
  data: Record<string, unknown>;
}
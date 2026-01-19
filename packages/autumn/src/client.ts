/**
 * Autumn HTTP Client
 *
 * Lightweight HTTP client for Autumn API.
 * Handles authentication, error handling, and request/response processing.
 *
 * @see https://docs.useautumn.com/docs/api
 */

import type {
  AutumnCheckoutSession,
  AutumnCheckParams,
  AutumnCheckResponse,
  AutumnCustomer,
  AutumnCustomerCreateParams,
  AutumnCustomerUpdateParams,
  AutumnFeatureState,
  AutumnPortalSession,
  AutumnTrackParams,
  AutumnTrackResponse,
  AutumnUsageEvent,
  AutumnUsageEventResponse,
  AutumnSubscription,
  AutumnProduct,
  AutumnError,
  CustomerState,
} from '@bounty/types';
import {
  AUTUMN_CONFIG,
  debugLog,
  isConflictError,
  isCustomerNotFoundError,
} from './config';

// ============================================================================
// Types
// ============================================================================

/**
 * HTTP client options
 */
export interface AutumnClientOptions {
  apiKey: string;
  apiURL?: string;
}


// ============================================================================
// Client Class
// ============================================================================

/**
 * Autumn API Client
 *
 * Provides methods for interacting with the Autumn API.
 * Use the singleton instances `autumnClient` (server) or `autumnPublicClient` (client-side).
 */
export class AutumnClient {
  private readonly apiKey: string;
  private readonly apiURL: string;

  constructor(options: AutumnClientOptions) {
    if (!options.apiKey || options.apiKey.trim() === '') {
      throw new Error('Autumn API key is required. Set AUTUMN_SECRET_KEY in your environment variables.');
    }
    this.apiKey = options.apiKey;
    this.apiURL = options.apiURL ?? AUTUMN_CONFIG.apiURL;
  }

  // ==========================================================================
  // HTTP Methods
  // ==========================================================================

  private validateApiKey(): void {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error(
        'Autumn API key is missing or empty. ' +
        'Set AUTUMN_SECRET_KEY in your environment variables. ' +
        'Get your key from: https://app.useautumn.com/sandbox/dev?tab=api_keys'
      );
    }
  }

  private buildRequestInit(method: string, body?: unknown): RequestInit {
    this.validateApiKey();

    // Mask the API key for logging
    const maskedKey = this.apiKey.substring(0, 8) + '...' + this.apiKey.substring(Math.max(0, this.apiKey.length - 4));
    debugLog(`[Autumn] Using API key:`, maskedKey);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const init: RequestInit = {
      method,
      headers,
    };

    if (body != null) {
      init.body = JSON.stringify(body);
    }

    return init;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.apiURL}${path}`;
    debugLog(`${method} ${path}`, body);

    const requestInit = this.buildRequestInit(method, body);
    debugLog(`[Autumn] Request headers:`, requestInit.headers);

    const response = await fetch(url, requestInit);
    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      const errorBody = isJson ? await response.json().catch(() => null) : null;
      const error: AutumnError = new Error(
        errorBody?.message ?? errorBody?.error ?? `HTTP ${response.status}`
      ) as AutumnError;
      error.status = response.status;
      error.code = errorBody?.code;
      error.detail = errorBody?.detail;
      error.body = errorBody;
      throw error;
    }

    if (isJson && response.status !== 204) {
      return await response.json();
    }

    return undefined as T;
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  private delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // ==========================================================================
  // Customer API
  // ==========================================================================

  /**
   * Get a customer by external ID
   */
  async getCustomer(externalId: string): Promise<AutumnCustomer | null> {
    try {
      return await this.get<AutumnCustomer>(`/customers/${externalId}`);
    } catch (error) {
      if (isCustomerNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(
    params: AutumnCustomerCreateParams
  ): Promise<AutumnCustomer> {
    // Transform external_id to id for the API
    const body = {
      id: params.external_id,
      email: params.email,
      ...(params.name !== undefined && { name: params.name }),
      ...(params.metadata !== undefined && { metadata: params.metadata }),
    };
    return await this.post<AutumnCustomer>('/customers', body);
  }

  /**
   * Update a customer
   */
  async updateCustomer(
    customerId: string,
    params: AutumnCustomerUpdateParams
  ): Promise<AutumnCustomer> {
    return await this.put<AutumnCustomer>(`/customers/${customerId}`, params);
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: string): Promise<void> {
    await this.delete<void>(`/customers/${customerId}`);
  }

  /**
   * Get or create a customer by external ID
   * Returns the existing customer if found, creates one otherwise
   */
  async getOrCreateCustomer(
    params: AutumnCustomerCreateParams
  ): Promise<AutumnCustomer> {
    const existing = await this.getCustomer(params.external_id);
    if (existing) {
      return existing;
    }

    try {
      return await this.createCustomer(params);
    } catch (error) {
      if (isConflictError(error)) {
        // Customer was created concurrently, fetch again
        const customer = await this.getCustomer(params.external_id);
        if (customer) {
          return customer;
        }
      }
      throw error;
    }
  }

  // ==========================================================================
  // Customer State API
  // ==========================================================================

  /**
   * Get complete customer state including subscriptions, features, and products
   * This is the primary method for checking a user's billing status
   */
  async getCustomerState(externalId: string): Promise<CustomerState | null> {
    try {
      return await this.get<CustomerState>(`/customers/${externalId}/state`);
    } catch (error) {
      if (isCustomerNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  // ==========================================================================
  // Subscription API
  // ==========================================================================

  /**
   * Get subscriptions for a customer
   */
  async getSubscriptions(
    customerId: string
  ): Promise<AutumnSubscription[]> {
    return await this.get<AutumnSubscription[]>(
      `/customers/${customerId}/subscriptions`
    );
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true
  ): Promise<AutumnSubscription> {
    return await this.post<AutumnSubscription>(
      `/subscriptions/${subscriptionId}/cancel`,
      { cancel_at_period_end: cancelAtPeriodEnd }
    );
  }

  // ==========================================================================
  // Checkout API
  // ==========================================================================

  /**
   * Create a checkout session for a product
   * Returns either a checkout URL (first-time payment) or preview data (payment on file)
   */
  async createCheckout(params: {
    productId: string;
    customerId?: string;
    customerEmail?: string;
    customerName?: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AutumnCheckoutSession> {
    const body: Record<string, unknown> = {
      product_id: params.productId,
      success_url: params.successUrl ?? AUTUMN_CONFIG.successURL,
    };

    if (params.customerId) {
      body.customer_id = params.customerId;
    }
    if (params.customerEmail) {
      body.customer_email = params.customerEmail;
    }
    if (params.customerName) {
      body.customer_name = params.customerName;
    }
    if (params.cancelUrl) {
      body.cancel_url = params.cancelUrl;
    }
    if (params.metadata) {
      body.metadata = params.metadata;
    }

    return await this.post<AutumnCheckoutSession>('/checkout', body);
  }

  /**
   * Attach a product to a customer (confirm purchase when payment method is on file)
   * This is called after checkout returns preview data instead of a URL
   */
  async attach(params: {
    productId: string;
    customerId: string;
  }): Promise<{ success: boolean }> {
    return await this.post<{ success: boolean }>('/attach', {
      product_id: params.productId,
      customer_id: params.customerId,
    });
  }

  // ==========================================================================
  // Portal API
  // ==========================================================================

  /**
   * Create a customer portal session
   */
  async createPortal(customerId: string): Promise<AutumnPortalSession> {
    return await this.post<AutumnPortalSession>(
      `/customers/${customerId}/portal`,
      {}
    );
  }

  // ==========================================================================
  // Usage/Events API
  // ==========================================================================

  /**
   * Track a usage event for a customer
   */
  async trackEvent(
    event: AutumnUsageEvent
  ): Promise<AutumnUsageEventResponse> {
    return await this.post<AutumnUsageEventResponse>('/events', event);
  }

  /**
   * Track usage by external ID (convenience method)
   */
  async trackUsage(
    externalId: string,
    eventName: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<AutumnUsageEventResponse> {
    const event: AutumnUsageEvent = {
      event_name: eventName,
      customer_id: externalId,
    };
    if (metadata) {
      event.metadata = metadata;
    }
    return await this.trackEvent(event);
  }

  // ==========================================================================
  // Check & Track API
  // ==========================================================================

  /**
   * Check if a customer has access to a feature
   * Returns the allowed status along with balance information
   */
  async check(params: AutumnCheckParams): Promise<AutumnCheckResponse> {
    const body: Record<string, unknown> = {
      customer_id: params.customerId,
      feature_id: params.featureId,
    };

    if (params.requiredBalance !== undefined) {
      body.required_balance = params.requiredBalance;
    }

    if (params.sendEvent) {
      body.send_event = true;
    }

    return await this.post<AutumnCheckResponse>('/check', body);
  }

  /**
   * Track feature usage for a customer
   * Increments the usage counter for the given feature
   */
  async trackFeature(params: AutumnTrackParams): Promise<AutumnTrackResponse> {
    const body: Record<string, unknown> = {
      customer_id: params.customerId,
      feature_id: params.featureId,
      value: params.value,
    };

    if (params.idempotencyKey) {
      body.idempotency_key = params.idempotencyKey;
    }

    if (params.metadata) {
      body.metadata = params.metadata;
    }

    return await this.post<AutumnTrackResponse>('/track', body);
  }

  // ==========================================================================
  // Products API
  // ==========================================================================

  /**
   * Get all products
   */
  async getProducts(): Promise<AutumnProduct[]> {
    return await this.get<AutumnProduct[]>('/products');
  }

  /**
   * Get a specific product
   */
  async getProduct(productId: string): Promise<AutumnProduct> {
    return await this.get<AutumnProduct>(`/products/${productId}`);
  }

  // ==========================================================================
  // Features API
  // ==========================================================================

  /**
   * Get feature state for a customer
   */
  async getFeatureState(
    customerId: string,
    featureId: string
  ): Promise<AutumnFeatureState> {
    return await this.get<AutumnFeatureState>(
      `/customers/${customerId}/features/${featureId}`
    );
  }

  /**
   * Get all feature states for a customer
   */
  async getAllFeatureStates(
    customerId: string
  ): Promise<Record<string, AutumnFeatureState>> {
    return await this.get<Record<string, AutumnFeatureState>>(
      `/customers/${customerId}/features`
    );
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

/**
 * Server-side Autumn client
 * Import from '@bounty/autumn/server'
 */
export const autumnClient = new AutumnClient({
  apiKey: AUTUMN_CONFIG.secretKey,
  apiURL: AUTUMN_CONFIG.apiURL,
});

// ============================================================================
// Error Re-exports
// ============================================================================

export {
  isCustomerNotFoundError,
  isPermissionDeniedError,
  isConflictError,
  extractErrorMessage,
  logError,
  debugLog,
} from './config';

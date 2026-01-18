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
  AutumnCustomer,
  AutumnCustomerCreateParams,
  AutumnCustomerUpdateParams,
  AutumnFeatureState,
  AutumnPortalSession,
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
  extractErrorMessage,
  isConflictError,
  isCustomerNotFoundError,
  isPermissionDeniedError,
  logError,
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

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
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
    this.apiKey = options.apiKey;
    this.apiURL = options.apiURL ?? AUTUMN_CONFIG.apiURL;
  }

  // ==========================================================================
  // HTTP Methods
  // ==========================================================================

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.apiURL}${path}`;
    debugLog(`${method} ${path}`, body);

    const init: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (body != null) {
      init.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, init);

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
    } catch (error) {
      if (error instanceof Error && ('status' in error)) {
        throw error;
      }
      const apiError: AutumnError = new Error(
        extractErrorMessage(error)
      ) as AutumnError;
      apiError.status = 500;
      throw apiError;
    }
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
      return await this.get<AutumnCustomer>(`/customers/external/${externalId}`);
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
    return await this.post<AutumnCustomer>('/customers', params);
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
        if (customer) return customer;
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
      return await this.get<CustomerState>(`/customers/external/${externalId}/state`);
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
   */
  async createCheckout(params: {
    productId: string;
    customerId?: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AutumnCheckoutSession> {
    const body: Record<string, unknown> = {
      product_id: params.productId,
      success_url: params.successUrl ?? AUTUMN_CONFIG.successURL,
    };

    if (params.customerId) body.customer_id = params.customerId;
    if (params.cancelUrl) body.cancel_url = params.cancelUrl;
    if (params.metadata) body.metadata = params.metadata;

    return await this.post<AutumnCheckoutSession>('/checkout', body);
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

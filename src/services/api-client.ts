/**
 * Typed API Client for Stellar Insights Mobile (React Native)
 *
 * Provides strongly-typed access to the Stellar Insights API with contract enforcement.
 * Optimized for mobile networks with caching, offline support, and efficient pagination.
 */

/**
 * API Response Contract Types
 */

export interface ResponseMetadata {
  request_id?: string;
  timestamp?: string;
  version?: string;
}

export interface SuccessResponse<T> {
  status: "success";
  code: number;
  data: T;
  metadata?: ResponseMetadata;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
}

export interface ErrorResponse {
  status: "error";
  code: number;
  error: ErrorDetail;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Pagination Types
 */

export interface CursorPageMeta {
  limit: number;
  total: number;
  cursor?: string;
  has_next: boolean;
  next_cursor?: string;
}

export interface PaginatedResponse<T> {
  status: "success";
  code: number;
  data: T[];
  pagination: CursorPageMeta;
  metadata?: ResponseMetadata;
}

/**
 * API Error Class
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: Record<string, unknown>,
    public requestId?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromErrorResponse(errorResponse: ErrorResponse): ApiError {
    return new ApiError(
      errorResponse.error.code,
      errorResponse.error.message,
      errorResponse.error.details,
      errorResponse.error.request_id,
      errorResponse.code
    );
  }

  static fromNetworkError(error: Error, message: string): ApiError {
    return new ApiError(
      "NETWORK_ERROR",
      message,
      { originalError: error.message },
      undefined,
      0
    );
  }

  get isNetworkError(): boolean {
    return this.code === "NETWORK_ERROR";
  }

  get isValidationError(): boolean {
    return this.code === "VALIDATION_ERROR";
  }

  get isInvalidFields(): boolean {
    return this.code === "INVALID_FIELDS";
  }

  get isUnauthorized(): boolean {
    return this.code === "UNAUTHORIZED";
  }

  get isRateLimited(): boolean {
    return this.code === "RATE_LIMITED";
  }

  get isServiceUnavailable(): boolean {
    return this.code === "SERVICE_UNAVAILABLE";
  }

  get isClientError(): boolean {
    return this.statusCode ? this.statusCode >= 400 && this.statusCode < 500 : false;
  }

  get isServerError(): boolean {
    return this.statusCode ? this.statusCode >= 500 : false;
  }
}

/**
 * Query Options
 */

export interface QueryOptions {
  fields?: string[];
  limit?: number;
  cursor?: string;
  [key: string]: unknown;
}

/**
 * Cache Configuration
 */

export interface CacheConfig {
  enabled: boolean;
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
}

/**
 * Cache Entry
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * API Client Configuration
 */

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  cache?: CacheConfig;
  onError?: (error: ApiError) => void;
  onNetworkChange?: (isOnline: boolean) => void;
}

/**
 * Mobile-optimized API Client
 */

export class MobileApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private retries: number;
  private cache: Map<string, CacheEntry<unknown>>;
  private cacheConfig: CacheConfig;
  private onError?: (error: ApiError) => void;
  private onNetworkChange?: (isOnline: boolean) => void;
  private isOnline: boolean = true;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 15000; // Shorter timeout for mobile
    this.retries = config.retries ?? 2; // Fewer retries for mobile
    this.cache = new Map();
    this.cacheConfig = config.cache ?? { enabled: true, ttl: 5 * 60 * 1000 }; // 5 min default
    this.onError = config.onError;
    this.onNetworkChange = config.onNetworkChange;

    // Monitor network status
    this.setupNetworkMonitoring();
  }

  /**
   * Setup network change monitoring
   */
  private setupNetworkMonitoring(): void {
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.onNetworkChange?.(true);
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
        this.onNetworkChange?.(false);
      });
    }
  }

  /**
   * Generic fetch method with contract validation and caching
   */
  private async fetch<T>(
    endpoint: string,
    method: string = "GET",
    body?: unknown,
    options: { timeout?: number; skipCache?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    const cacheKey = `${method}:${endpoint}`;
    const { timeout = this.timeout, skipCache = false } = options;

    // Try cache first for GET requests
    if (method === "GET" && !skipCache && this.cacheConfig.enabled) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check network status
    if (!this.isOnline) {
      const cachedOffline = this.getFromCache<T>(cacheKey);
      if (cachedOffline) {
        return cachedOffline;
      }
      throw ApiError.fromNetworkError(
        new Error("No internet connection"),
        "Device is offline and no cached data available"
      );
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.buildHeaders();

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (body && method !== "GET" && method !== "HEAD") {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Parse response
        let data: unknown;
        try {
          data = await response.json();
        } catch {
          throw new Error(`Invalid JSON response: ${response.statusText}`);
        }

        // Validate response structure
        const validatedResponse = this.validateResponse<T>(data);

        // Handle error responses
        if (validatedResponse.status === "error") {
          const error = ApiError.fromErrorResponse(validatedResponse);
          this.onError?.(error);

          // Don't cache errors
          throw error;
        }

        // Cache successful GET responses
        if (method === "GET" && this.cacheConfig.enabled) {
          this.saveToCache(cacheKey, validatedResponse);
        }

        return validatedResponse as SuccessResponse<T>;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on client errors
        if (
          error instanceof ApiError &&
          error.isClientError &&
          !error.isRateLimited
        ) {
          throw error;
        }

        // Exponential backoff for retries
        if (attempt < this.retries) {
          const delay = Math.pow(2, attempt) * 500; // 500ms base
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Try to return cached data as fallback for GET requests
    if (method === "GET") {
      const cachedFallback = this.getFromCache<T>(cacheKey);
      if (cachedFallback) {
        return cachedFallback;
      }
    }

    throw lastError || new Error("Unknown error");
  }

  /**
   * Validate response conforms to API contract
   */
  private validateResponse<T>(data: unknown): ApiResponse<T> {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid response: not an object");
    }

    const response = data as Record<string, unknown>;
    const status = response.status;

    if (status === "success") {
      if (typeof response.code !== "number") {
        throw new Error("Invalid response: missing or invalid code");
      }
      if (response.data === undefined) {
        throw new Error("Invalid response: missing data");
      }
      return response as SuccessResponse<T>;
    } else if (status === "error") {
      if (typeof response.code !== "number") {
        throw new Error("Invalid error response: missing code");
      }
      if (typeof response.error !== "object" || response.error === null) {
        throw new Error("Invalid error response: missing error object");
      }
      const error = response.error as Record<string, unknown>;
      if (typeof error.code !== "string" || typeof error.message !== "string") {
        throw new Error("Invalid error response: invalid error details");
      }
      return response as ErrorResponse;
    } else {
      throw new Error(`Invalid response: unknown status "${status}"`);
    }
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Build query string
   */
  private buildQueryString(options?: QueryOptions): string {
    if (!options || Object.keys(options).length === 0) {
      return "";
    }

    const params = new URLSearchParams();

    if (options.fields && options.fields.length > 0) {
      params.set("fields", options.fields.join(","));
    }
    if (options.limit !== undefined) {
      params.set("limit", String(options.limit));
    }
    if (options.cursor) {
      params.set("cursor", options.cursor);
    }

    for (const [key, value] of Object.entries(options)) {
      if (!["fields", "limit", "cursor"].includes(key) && value !== undefined) {
        params.set(key, String(value));
      }
    }

    const query = params.toString();
    return query ? `?${query}` : "";
  }

  /**
   * Cache management
   */

  private getFromCache<T>(key: string): ApiResponse<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as ApiResponse<T>;
  }

  private saveToCache<T>(key: string, response: ApiResponse<T>): void {
    const entry: CacheEntry<T> = {
      data: response,
      timestamp: Date.now(),
      ttl: this.cacheConfig.ttl ?? 5 * 60 * 1000,
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific endpoint
   */
  clearEndpointCache(endpoint: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(endpoint)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    options?: QueryOptions
  ): Promise<T> {
    const query = this.buildQueryString(options);
    const response = await this.fetch<T>(
      `${endpoint}${query}`,
      "GET"
    );
    return response.data;
  }

  /**
   * GET request with pagination
   */
  async getPaginated<T>(
    endpoint: string,
    options?: QueryOptions
  ): Promise<PaginatedResponse<T>> {
    const query = this.buildQueryString(options);
    const response = await this.fetch<T[]>(
      `${endpoint}${query}`,
      "GET"
    );

    if (!("pagination" in response) || typeof response.pagination !== "object") {
      throw new Error("Response does not contain pagination metadata");
    }

    return response as unknown as PaginatedResponse<T>;
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await this.fetch<T>(endpoint, "POST", body);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await this.fetch<T>(endpoint, "PUT", body);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await this.fetch<T>(endpoint, "PATCH", body);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = void>(endpoint: string): Promise<T> {
    const response = await this.fetch<T>(endpoint, "DELETE");
    return response.data;
  }
}

/**
 * React Native Hook - useMobileApi
 */

import { useEffect, useState, useCallback } from "react";

export interface UseMobileApiOptions<T> {
  enabled?: boolean;
  onError?: (error: ApiError) => void;
  skipCache?: boolean;
}

export interface UseMobileApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  isOnline: boolean;
}

export function useMobileApi<T>(
  client: MobileApiClient,
  endpoint: string,
  options: QueryOptions = {},
  hookOptions?: UseMobileApiOptions<T>
): UseMobileApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.get<T>(endpoint, options);
      setData(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
        hookOptions?.onError?.(err);
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [client, endpoint, options, hookOptions]);

  useEffect(() => {
    if (hookOptions?.enabled === false) return;
    refetch();
  }, [refetch, hookOptions?.enabled]);

  // Monitor network changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return { data, loading, error, refetch, isOnline };
}

/**
 * React Native Hook - useMobilePaginatedApi
 */

export interface UseMobilePaginatedApiOptions<T> extends UseMobileApiOptions<T[]> {
  onPageChange?: (pagination: CursorPageMeta) => void;
}

export interface UseMobilePaginatedApiResult<T> extends UseMobileApiResult<T[]> {
  pagination: CursorPageMeta | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useMobilePaginatedApi<T>(
  client: MobileApiClient,
  endpoint: string,
  limit: number = 25, // Smaller default for mobile
  hookOptions?: UseMobilePaginatedApiOptions<T>
): UseMobilePaginatedApiResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<CursorPageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [isOnline, setIsOnline] = useState(true);

  const loadMore = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await client.getPaginated<T>(endpoint, { limit, cursor });
      setData((prev) => (cursor ? [...prev, ...result.data] : result.data));
      setPagination(result.pagination);
      hookOptions?.onPageChange?.(result.pagination);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
        hookOptions?.onError?.(err);
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, [client, endpoint, limit, cursor, hookOptions]);

  useEffect(() => {
    if (hookOptions?.enabled === false) return;
    loadMore();
  }, [loadMore, hookOptions?.enabled]);

  // Network monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setCursor(undefined);
      return loadMore();
    },
    pagination,
    hasMore: pagination?.has_next ?? false,
    isOnline,
    loadMore: async () => {
      if (pagination?.next_cursor) {
        setCursor(pagination.next_cursor);
      }
    },
  };
}

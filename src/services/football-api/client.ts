// ============================================================
//  Football API — Base HTTP Client
//  football-data.org · X-Auth-Token · Rate-limit aware
// ============================================================

import type { ApiResponse } from "./types";

// ---- Rate-limit state ----
interface RateLimitState {
  remaining: number;
  resetInSeconds: number;
  lastRequestTime: number;
}

const rateLimit: RateLimitState = {
  remaining: 10,
  resetInSeconds: 60,
  lastRequestTime: 0,
};

function updateRateLimit(headers: Headers): void {
  const remaining = headers.get("X-Requests-Available-Minute");
  const resetIn = headers.get("X-RequestCounter-Reset");
  if (remaining !== null) rateLimit.remaining = parseInt(remaining, 10);
  if (resetIn !== null) rateLimit.resetInSeconds = parseInt(resetIn, 10);
  rateLimit.lastRequestTime = Date.now();
}

async function waitForRateLimit(): Promise<void> {
  if (rateLimit.remaining > 0) return;
  const elapsed = (Date.now() - rateLimit.lastRequestTime) / 1000;
  const waitTime = Math.max(rateLimit.resetInSeconds - elapsed, 1) * 1000;
  console.log(`[FootballAPI] Rate limit reached. Waiting ${(waitTime / 1000).toFixed(0)}s...`);
  await new Promise(resolve => setTimeout(resolve, waitTime + 500));
}

// ---- Configuration ----
interface ClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryCount: number;
  cacheTTL: number;
  mockMode: boolean;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getConfig(): ClientConfig {
  const apiKey =
    process.env.FOOTBALL_API_KEY ||
    process.env.NEXT_PUBLIC_FOOTBALL_API_KEY ||
    "";

  // In browser, use our API proxy to avoid CORS issues
  const baseUrl = isBrowser()
    ? "/api/proxy"
    : process.env.NEXT_PUBLIC_FOOTBALL_API_URL || "https://api.football-data.org/v4";

  return {
    baseUrl,
    apiKey,
    timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS) || 10000,
    retryCount: 2,
    cacheTTL: Number(process.env.NEXT_PUBLIC_API_CACHE_TTL_S) || 60,
    mockMode: process.env.NEXT_PUBLIC_API_MOCK_MODE === "true",
  };
}

// ---- Cache ----
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}
function setCache(key: string, data: unknown, ttlS: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlS * 1000 });
}

// ---- Error ----
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) { super(message); this.name = "ApiError"; }
}

// ---- Response normalization (football-data.org format → our internal format) ----
function normalizeResponse<T>(raw: unknown, endpoint: string): ApiResponse<T> {
  if (!raw || typeof raw !== "object") return { success: true, data: ([] as T) };

  const obj = raw as Record<string, unknown>;

  // football-data.org wraps lists in named keys
  const listKeys = ["teams", "matches", "persons", "competitions", "standings", "scorers"];
  for (const key of listKeys) {
    if (Array.isArray(obj[key])) {
      return {
        success: true,
        data: obj[key] as T,
        meta: {
          page: 1,
          limit: (obj.count as number) || (obj[key] as unknown[]).length,
          total: (obj.count as number) || (obj[key] as unknown[]).length,
          totalPages: 1,
        },
      };
    }
  }

  // Single object responses — just pass through
  return { success: true, data: obj as T };
}

// ---- Core request ----
async function request<T>(
  endpoint: string,
  options: {
    params?: Record<string, string | number | undefined>;
    cacheKey?: string;
    cacheTTL?: number;
    retries?: number;
  } = {},
): Promise<ApiResponse<T>> {
  const config = getConfig();

  if (config.mockMode) {
    console.log(`[FootballAPI Mock] ${endpoint}`);
    // Return empty array for list endpoints, null-like object for single-resource endpoints
    const isSingleResource = /\/[^\/]+\/[^\/]+$/.test(endpoint) && !/^\/(competitions|matches|teams|players|persons|schedule)$/.test(endpoint);
    return { success: true, data: (isSingleResource ? null : []) as unknown as T };
  }

  // Cache hit
  if (options.cacheKey) {
    const cached = getCached<ApiResponse<T>>(options.cacheKey);
    if (cached) return cached;
  }

  // Rate-limit gate
  await waitForRateLimit();

  // Build URL — handle both absolute (server-side) and relative (proxy) base URLs
  const isProxy = config.baseUrl.startsWith("/");
  let urlStr: string;
  if (isProxy) {
    // Relative path for proxy — build as string (new URL() fails with relative paths)
    const params = new URLSearchParams();
    if (options.params) {
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v));
      });
    }
    const qs = params.toString();
    urlStr = `${config.baseUrl}${endpoint}${qs ? "?" + qs : ""}`;
  } else {
    const url = new URL(`${config.baseUrl}${endpoint}`);
    if (options.params) {
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    urlStr = url.toString();
  }

  const maxRetries = options.retries ?? config.retryCount;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Create fresh AbortController + timeout for EACH attempt
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    try {
      // When proxying through our API, don't send auth header (proxy handles it)
      const headers: Record<string, string> = { Accept: "application/json" };
      if (!isProxy) {
        headers["X-Auth-Token"] = config.apiKey;
      }

      const response = await fetch(urlStr, {
        headers,
        signal: controller.signal,
        next: options.cacheKey ? { revalidate: options.cacheTTL ?? config.cacheTTL } : undefined,
      });

      clearTimeout(timeoutId);

      // Parse rate-limit headers
      updateRateLimit(response.headers);

      // Rate limited — wait and retry
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After") || String(rateLimit.resetInSeconds);
        const waitMs = parseInt(retryAfter, 10) * 1000 + 500;
        console.log(`[FootballAPI] 429 Rate limited. Waiting ${retryAfter}s...`);
        await new Promise(r => setTimeout(r, waitMs));
        if (attempt < maxRetries) continue;
        throw new ApiError(429, "RATE_LIMITED", "Rate limit exceeded");
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorBody.errorCode || "API_ERROR",
          errorBody.message || `HTTP ${response.status}`,
        );
      }

      const raw = await response.json();
      // football-data.org wraps responses: unwrap and normalize
      const result = normalizeResponse<T>(raw, endpoint);

      if (options.cacheKey) {
        setCache(options.cacheKey, result, options.cacheTTL ?? config.cacheTTL);
      }

      return result;

    } catch (err) {
      lastError = err as Error;
      clearTimeout(timeoutId);

      if (err instanceof ApiError && err.statusCode >= 400 && err.statusCode < 500 && err.statusCode !== 429) {
        throw err;
      }
      if (err instanceof DOMException && err.name === "AbortError") {
        if (attempt >= maxRetries) {
          throw new ApiError(408, "TIMEOUT", `Timed out after ${config.timeout}ms`);
        }
        // Otherwise retry with exponential backoff
      }
      if (attempt >= maxRetries) {
        throw new ApiError(0, "NETWORK_ERROR", lastError?.message || "Request failed");
      }

      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 800));
    }
  }

  throw lastError || new Error("Unexpected error");
}

// ---- Public API ----
export const apiClient = {
  get: <T>(endpoint: string, options?: Parameters<typeof request>[1]) =>
    request<T>(endpoint, options),

  getCached: <T>(endpoint: string, params: Record<string, string | number | undefined> = {}, ttl = 60) => {
    const cacheKey = `${endpoint}?${new URLSearchParams(
      Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)])
    ).toString()}`;
    return request<T>(endpoint, { params, cacheKey, cacheTTL: ttl });
  },

  invalidateCache: (prefix?: string) => {
    if (prefix) {
      for (const key of cache.keys()) { if (key.startsWith(prefix)) cache.delete(key); }
    } else {
      cache.clear();
    }
  },

  clearCache: () => cache.clear(),

  getRateLimit: () => ({ ...rateLimit }),
};

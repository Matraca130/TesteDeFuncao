// ============================================================
// Axon v4.2 — Typed API Client (Infrastructure)
// Path: /src/app/lib/api-client.ts
// Wrapper tipado sobre fetch para llamadas al servidor Hono.
//
// Usage:
//   const api = createApiClient(baseUrl, token);
//   const cards = await api.get<DueFlashcardsRes>('/flashcards/due', { course_id });
//   const result = await api.post<SubmitReviewReq, SubmitReviewRes>('/reviews', body);
// ============================================================

import type { ApiResponse, ApiError } from '../../types/api-contract';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiClient {
  get<TRes>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<TRes>;
  post<TReq, TRes>(path: string, body: TReq): Promise<TRes>;
  put<TReq, TRes>(path: string, body: TReq): Promise<TRes>;
  del<TRes = void>(path: string): Promise<TRes>;
}

export function createApiClient(baseUrl: string, token: string): ApiClient {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    let url = `${baseUrl}${path}`;

    // Append query params for GET
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) qs.set(k, String(v));
      }
      const qsStr = qs.toString();
      if (qsStr) url += `?${qsStr}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let json: ApiResponse<T> | ApiError;
    try {
      json = await res.json();
    } catch {
      throw new ApiClientError(res.status, undefined, `Non-JSON response from ${method} ${path}`);
    }

    if (!res.ok || !json.success) {
      const err = json as any;
      // Backend returns error as { code, message } object OR as string
      const errorObj = err.error;
      const code = typeof errorObj === 'object' ? errorObj?.code : err.code;
      const message = typeof errorObj === 'object' ? errorObj?.message : (typeof errorObj === 'string' ? errorObj : `Request failed: ${method} ${path}`);
      throw new ApiClientError(res.status, code, message);
    }

    return (json as ApiResponse<T>).data;
  }

  return {
    get: <TRes>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
      request<TRes>('GET', path, undefined, params),
    post: <TReq, TRes>(path: string, body: TReq) =>
      request<TRes>('POST', path, body),
    put: <TReq, TRes>(path: string, body: TReq) =>
      request<TRes>('PUT', path, body),
    del: <TRes = void>(path: string) =>
      request<TRes>('DELETE', path),
  };
}
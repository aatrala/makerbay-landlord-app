const API_BASE = import.meta.env.VITE_API_URL || "";

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | undefined>;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }

  async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOpts } = options;
    const url = this.buildUrl(path, params);

    const response = await fetch(url, {
      ...fetchOpts,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...fetchOpts.headers,
      },
    });

    if (response.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
        code: "UNKNOWN",
      }));
      throw new Error(error.message || "Request failed");
    }

    return response.json();
  }

  // ── Convenience Methods ──

  get<T>(path: string, params?: Record<string, string | number | undefined>) {
    return this.request<T>(path, { method: "GET", params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE);

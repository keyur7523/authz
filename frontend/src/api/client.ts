const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export type ApiError = {
  message: string;
  status?: number;
};

class AuthTokens {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem("access_token");
    this.refreshToken = localStorage.getItem("refresh_token");
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  clear() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  isAuthenticated() {
    return !!this.accessToken;
  }
}

export const authTokens = new AuthTokens();

// Token refresh queue — prevents multiple simultaneous refresh calls
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  refreshQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    // Another refresh is in progress — wait for it
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const refreshToken = authTokens.getRefreshToken();
    if (!refreshToken) throw { message: "No refresh token", status: 401 };

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      authTokens.clear();
      const err = { message: "Session expired", status: 401 };
      processQueue(err, null);
      throw err;
    }

    const data = await response.json();
    authTokens.setTokens(data.access_token, data.refresh_token);
    processQueue(null, data.access_token);
    return data.access_token;
  } catch (error) {
    processQueue(error, null);
    throw error;
  } finally {
    isRefreshing = false;
  }
}

function authHeaders(): Record<string, string> {
  const token = authTokens.getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function fetchWithAuth(
  path: string,
  options: RequestInit,
): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders(),
  });

  // If 401 and we have a refresh token, try refreshing
  if (
    response.status === 401 &&
    authTokens.getRefreshToken() &&
    !path.startsWith("/auth/")
  ) {
    const newToken = await refreshAccessToken();
    // Retry the original request with the new token
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
      },
    });
  }

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw {
      message: error.detail || "Request failed",
      status: response.status,
    } as ApiError;
  }
  return response.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetchWithAuth(path, { method: "GET" });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetchWithAuth(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetchWithAuth(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetchWithAuth(path, { method: "DELETE" });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  return handleResponse<T>(response);
}

// Auth API
export const authApi = {
  register: async (email: string, name: string, password: string) => {
    const data = await apiPost<{
      user: { id: string; email: string; name: string };
      tokens: { access_token: string; refresh_token: string };
    }>("/auth/register", { email, name, password });
    authTokens.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiPost<{
      user: { id: string; email: string; name: string };
      tokens: { access_token: string; refresh_token: string };
    }>("/auth/login", { email, password });
    authTokens.setTokens(data.tokens.access_token, data.tokens.refresh_token);
    return data;
  },

  logout: () => {
    // Revoke the refresh token server-side; local logout proceeds even if this fails
    if (authTokens.getAccessToken()) {
      fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: authHeaders() }).catch(() => {});
    }
    authTokens.clear();
  },

  refresh: async () => {
    const token = await refreshAccessToken();
    return { access_token: token, refresh_token: authTokens.getRefreshToken()! };
  },

  me: async () => {
    return apiGet<{
      id: string;
      email: string;
      name: string;
      organizations: { id: string; name: string; slug: string; role: string }[];
    }>("/auth/me");
  },
};

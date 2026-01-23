const API_BASE = "http://localhost:8000/api";

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw { message: error.detail || "Request failed", status: response.status } as ApiError;
  }
  return response.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authTokens.getAccessToken() && {
        Authorization: `Bearer ${authTokens.getAccessToken()}`,
      }),
    },
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authTokens.getAccessToken() && {
        Authorization: `Bearer ${authTokens.getAccessToken()}`,
      }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(authTokens.getAccessToken() && {
        Authorization: `Bearer ${authTokens.getAccessToken()}`,
      }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(authTokens.getAccessToken() && {
        Authorization: `Bearer ${authTokens.getAccessToken()}`,
      }),
    },
  });

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
    authTokens.clear();
  },

  refresh: async () => {
    const refreshToken = authTokens.getRefreshToken();
    if (!refreshToken) throw { message: "No refresh token", status: 401 };

    const data = await apiPost<{
      access_token: string;
      refresh_token: string;
    }>("/auth/refresh", { refresh_token: refreshToken });
    authTokens.setTokens(data.access_token, data.refresh_token);
    return data;
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

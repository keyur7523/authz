import { create } from "zustand";
import { authApi, authTokens } from "../api/client";
import { setCurrentOrgId, orgsApi } from "../api/endpoints";

type User = {
  id: string;
  email: string;
  name: string;
  organizations: { id: string; name: string; slug: string; role: string }[];
};

type AuthState = {
  user: User | null;
  currentOrgId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setCurrentOrg: (orgId: string) => void;
  createOrg: (name: string, slug: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  currentOrgId: localStorage.getItem("current_org_id"),
  isLoading: true,
  isAuthenticated: authTokens.isAuthenticated(),

  login: async (email: string, password: string) => {
    await authApi.login(email, password);
    const me = await authApi.me();
    set({ user: me, isAuthenticated: true });

    // Auto-select first org if available
    if (me.organizations.length > 0 && !get().currentOrgId) {
      get().setCurrentOrg(me.organizations[0].id);
    }
  },

  register: async (email: string, name: string, password: string) => {
    await authApi.register(email, name, password);
    const me = await authApi.me();
    set({ user: me, isAuthenticated: true });
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false, currentOrgId: null });
    localStorage.removeItem("current_org_id");
  },

  checkAuth: async () => {
    if (!authTokens.isAuthenticated()) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const me = await authApi.me();
      set({ user: me, isAuthenticated: true, isLoading: false });

      // Auto-select first org if available and none selected
      if (me.organizations.length > 0 && !get().currentOrgId) {
        get().setCurrentOrg(me.organizations[0].id);
      }
    } catch {
      // Token might be expired, try refresh
      try {
        await authApi.refresh();
        const me = await authApi.me();
        set({ user: me, isAuthenticated: true, isLoading: false });
      } catch {
        // Refresh failed, logout
        authApi.logout();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },

  setCurrentOrg: (orgId: string) => {
    setCurrentOrgId(orgId);
    set({ currentOrgId: orgId });
  },

  createOrg: async (name: string, slug: string) => {
    const newOrg = await orgsApi.create({ name, slug });
    // Refresh user to get updated org list
    const me = await authApi.me();
    set({ user: me, currentOrgId: newOrg.id });
    setCurrentOrgId(newOrg.id);
  },
}));

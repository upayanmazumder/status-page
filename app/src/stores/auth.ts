import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: { id: string; email: string; name: string } | null;
  orgId: string | null;
  role: string | null;
  setAuth: (token: string, user: any, orgId: string, role: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  orgId: null,
  role: null,
  setAuth: (token, user, orgId, role) =>
    set({ token, user, orgId, role }),
  clearAuth: () =>
    set({ token: null, user: null, orgId: null, role: null }),
}));

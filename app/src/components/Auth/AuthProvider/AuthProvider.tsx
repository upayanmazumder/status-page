"use client";

import {
  createContext,
  useEffect,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  email: string;
}

interface JwtPayload {
  id: string;
  email: string;
  exp?: number;
  iat?: number;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/auth/");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);

        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
          logout();
        } else {
          setUser({ id: decoded.id, email: decoded.email });
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode<JwtPayload>(token);
    setUser({ id: decoded.id, email: decoded.email });
    router.push("/dashboard");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

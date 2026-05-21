"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/stores/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    async function syncAuth() {
      if (isSignedIn && user) {
        const token = await getToken();
        if (token) {
          setAuth(
            token,
            {
              id: user.id,
              email: user.primaryEmailAddress?.emailAddress || "",
              name: user.fullName || "",
            },
            "", // orgId - will be fetched from backend
            "owner"
          );
        }
      }
    }
    syncAuth();
  }, [isSignedIn, user, getToken, setAuth]);

  return <>{children}</>;
}

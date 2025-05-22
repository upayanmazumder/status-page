"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../components/Auth/AuthProvider/AuthProvider";

export default function OAuthSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const token = params.get("token");

  useEffect(() => {
    if (token) {
      login(token);
      router.replace("/dashboard");
    } else {
      router.replace("/auth");
    }
  }, [login, router, token]);

  return <div>Signing you in...</div>;
}

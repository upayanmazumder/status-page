"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/Auth/AuthProvider/AuthProvider";
import Loader from "../../Loader/Loader";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";

export default function OAuthSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const token = params.get("token");
  const [showStuck, setShowStuck] = useState(false);

  useEffect(() => {
    if (token) {
      login(token);
      router.replace("/dashboard");
    } else {
      router.replace("/auth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => setShowStuck(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ProtectedRoute>
      <Loader />
      {showStuck && (
        <p>
          Stuck here?{" "}
          <Link href="/dashboard" className="text-blue-500 hover:underline">
            Go to Dashboard
          </Link>
        </p>
      )}
    </ProtectedRoute>
  );
}

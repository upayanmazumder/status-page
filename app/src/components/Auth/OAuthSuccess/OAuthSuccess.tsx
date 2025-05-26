"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../components/Auth/AuthProvider/AuthProvider";
import Loader from "../../Loader/Loader";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import { useNotification } from "../../Notification/Notification";

export default function OAuthSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { notify } = useNotification();

  const token = params.get("token");
  const [showStuck, setShowStuck] = useState(false);

  useEffect(() => {
    if (token) {
      login(token);
      notify("Logged in via Google!", "success");
      router.replace("/dashboard");
    } else {
      notify("Login failed. Authentication token not found.", "error");
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

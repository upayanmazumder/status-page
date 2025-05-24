"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../Auth/ProtectedRoute/ProtectedRoute";
import Logout from "../Auth/Logout/Logout";
import { useAuth } from "../Auth/AuthProvider/AuthProvider";
import api from "../../utils/api";
import Loader from "../Loader/Loader";
import Image from "next/image";

interface UserDetails {
  email: string;
  username?: string;
  profilePicture?: string;
  createdAt?: string;
  googleId?: string;
  _id?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await api.get("/user/profile");
        setUserDetails(res.data.user);
      } catch {
        setUserDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return <Loader />;
  }

  if (!userDetails) {
    return (
      <ProtectedRoute>
        <main>
          <h1>Dashboard</h1>
          <p className="text-red-500 mt-4">Could not load user details.</p>
          <Logout />
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main>
        <h1>Dashboard</h1>
        <div className="flex items-center gap-3 mt-4">
          {userDetails.profilePicture && (
            <Image
              src={userDetails.profilePicture}
              alt="Profile"
              width={48}
              height={48}
              className="rounded-full border border-gray-300"
            />
          )}
          <div>
            <p>
              <span className="font-bold text-lg">
                {userDetails.username
                  ? `@${userDetails.username}`
                  : userDetails.email}
              </span>
            </p>
            <p className="text-gray-400 text-sm">{userDetails.email}</p>
            {userDetails.createdAt && (
              <p className="text-gray-400 text-xs">
                Joined: {new Date(userDetails.createdAt).toLocaleDateString()}
              </p>
            )}
            {userDetails.googleId && (
              <p className="text-gray-400 text-xs">Google Connected</p>
            )}
            {userDetails._id && (
              <p className="text-gray-400 text-xs">
                User ID: {userDetails._id}
              </p>
            )}
          </div>
        </div>
        <Logout />
      </main>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  name?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  useEffect(() => {
    if (!loading && userDetails && !userDetails.username) {
      router.replace("/auth/onboarding");
    }
  }, [loading, userDetails, router]);

  if (loading) {
    return <Loader />;
  }

  if (!userDetails) {
    return (
      <>
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <p className="mb-6">
          ⚠️ Could not load user details. Please try again later.
        </p>
        <Logout />
      </>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-white">Welcome back!</h1>
      <section className="flex items-center gap-5 mb-8">
        {userDetails.profilePicture ? (
          <Image
            src={userDetails.profilePicture}
            alt="Profile picture"
            width={72}
            height={72}
            className="rounded-full border-2 border-indigo-400 shadow-md transition-transform hover:scale-105"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-indigo-700 flex items-center justify-center text-indigo-300 font-bold text-xl">
            {userDetails.name
              ? userDetails.name.charAt(0).toUpperCase()
              : userDetails.username
              ? userDetails.username.charAt(0).toUpperCase()
              : "U"}
          </div>
        )}

        <div>
          <p className="text-xl font-semibold text-white">
            {userDetails.name
              ? userDetails.name
              : userDetails.username
              ? `@${userDetails.username}`
              : userDetails.email}
          </p>
          <p className="text-indigo-300">{userDetails.email}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 text-indigo-200 text-sm">
        {userDetails.createdAt && (
          <div
            className={`bg-indigo-900 p-3 rounded-md ${
              !userDetails.googleId ? "col-span-2" : ""
            }`}
          >
            <strong className="block text-indigo-400">Joined</strong>
            <span>{new Date(userDetails.createdAt).toLocaleDateString()}</span>
          </div>
        )}
        {userDetails.googleId && (
          <div className="bg-indigo-900 p-3 rounded-md">
            <strong className="block text-indigo-400">Google Account</strong>
            <span>Connected</span>
          </div>
        )}
        {userDetails._id && (
          <div className="bg-indigo-900 p-3 rounded-md col-span-2 break-words">
            <strong className="block text-indigo-400">User ID</strong>
            <span>{userDetails._id}</span>
          </div>
        )}
      </section>

      <section className="mt-8">
        <button
          onClick={() => router.push("/dashboard/applications")}
          className="ml-2 text-indigo-400 hover:underline"
        >
          View Applications
        </button>
      </section>

      <div className="mt-10">
        <Logout />
      </div>
    </>
  );
}

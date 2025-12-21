'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logout from '../Auth/Logout/Logout';
import { useAuth } from '../Auth/AuthProvider/AuthProvider';
import api from '../../utils/api';
import Loader from '../Loader/Loader';
import Image from 'next/image';

interface UserDetails {
  email: string;
  username?: string;
  profilePicture?: string;
  createdAt?: string;
  googleId?: string;
  _id?: string;
  name?: string;
}

interface Stats {
  totalApplications: number;
  subscribedApps: number;
  dashboards: number;
}

export default function Profile() {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    subscribedApps: 0,
    dashboards: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const [profileRes, appsRes, dashboardsRes] = await Promise.all([
          api.get('/user/profile'),
          api.get('/applications'),
          api.get('/dashboards'),
        ]);

        setUserDetails(profileRes.data.user);

        // Calculate stats
        const allApps = appsRes.data.applications || [];
        const subscribedApps = allApps.filter((app: { subscribers: { email: string }[] }) =>
          app.subscribers.some((s: { email: string }) => s.email === user.email)
        );

        setStats({
          totalApplications: allApps.length,
          subscribedApps: subscribedApps.length,
          dashboards: (dashboardsRes.data.dashboards || []).length,
        });
      } catch {
        setUserDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // If user details are loaded but username is missing
  useEffect(() => {
    if (!loading && userDetails && !userDetails.username) {
      router.replace('/auth/onboarding');
    }
  }, [loading, userDetails, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex items-center justify-center">
        <div className="text-center bg-red-900/20 border border-red-800 rounded-2xl p-12 max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-3">Error Loading Profile</h2>
          <p className="text-red-300 mb-6">Could not load user details. Please try again later.</p>
          <Logout />
        </div>
      </div>
    );
  }

  const displayName =
    userDetails.name || (userDetails.username ? `@${userDetails.username}` : userDetails.email);
  const initials = userDetails.name
    ? userDetails.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : userDetails.username
      ? userDetails.username.substring(0, 2).toUpperCase()
      : 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your account settings and view your activity
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-2xl p-8 mb-6 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            <div className="relative">
              {userDetails.profilePicture ? (
                <Image
                  src={userDetails.profilePicture}
                  alt="Profile picture"
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-purple-500/30 shadow-xl transition-transform hover:scale-105"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl border-4 border-purple-500/30">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-gray-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-2">{displayName}</h2>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">{userDetails.email}</span>
                </div>
                {userDetails.username && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-sm">@{userDetails.username}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          <div
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer"
            onClick={() => router.push('/profile/applications')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Subscribed Apps</p>
                <p className="text-4xl font-bold text-blue-400 mt-1">{stats.subscribedApps}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Dashboards</p>
                <p className="text-4xl font-bold text-purple-400 mt-1">{stats.dashboards}</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Apps</p>
                <p className="text-4xl font-bold text-green-400 mt-1">{stats.totalApplications}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div
          className="bg-gradient-to-br from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-2xl p-8 mb-6 backdrop-blur-sm animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userDetails.createdAt && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Member Since</p>
                    <p className="text-white font-semibold">
                      {new Date(userDetails.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {userDetails.googleId && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Connected Account</p>
                    <p className="text-white font-semibold">Google</p>
                  </div>
                </div>
              </div>
            )}
            {userDetails._id && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-400 text-sm font-medium">User ID</p>
                    <p className="text-white font-mono text-sm break-all">{userDetails._id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          <button
            onClick={() => router.push('/profile/applications')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Manage Applications
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            View Dashboards
          </button>
        </div>

        {/* Logout Section */}
        <div
          className="bg-gradient-to-br from-red-900/20 to-red-900/10 border border-red-800/50 rounded-2xl p-6 backdrop-blur-sm animate-fade-in"
          style={{ animationDelay: '400ms' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Sign Out</h3>
              <p className="text-gray-400 text-sm">
                End your current session and return to the home page
              </p>
            </div>
            <Logout />
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
}

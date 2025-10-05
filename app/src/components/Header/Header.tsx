'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '../../utils/api';
import { useAuth } from '../Auth/AuthProvider/AuthProvider';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function formatUptime(seconds: number) {
  const y = Math.floor(seconds / (365 * 24 * 3600));
  seconds %= 365 * 24 * 3600;
  const mo = Math.floor(seconds / (30 * 24 * 3600));
  seconds %= 30 * 24 * 3600;
  const d = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  const parts = [
    y && `${y}y`,
    mo && `${mo}mo`,
    d && `${d}d`,
    h && `${h}h`,
    m && `${m}m`,
    s && `${s}s`,
  ].filter(Boolean);

  return parts.slice(0, 2).join(' ');
}

const Header: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [uptime, setUptime] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const { user } = useAuth();
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const res = await api.get('/');
        if (mounted) {
          setStatus('online');
          setUptime(res.data.uptime);
        }
      } catch {
        if (mounted) {
          setStatus('offline');
          setUptime(null);
        }
      }
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchUsername = async () => {
      if (user?.id) {
        try {
          const res = await api.get('/auth/username');
          if (mounted) setUsername(res.data.username);
        } catch {
          if (mounted) setUsername(undefined);
        }
      } else {
        if (mounted) setUsername(undefined);
      }
    };
    fetchUsername();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      if (user?.id) {
        try {
          const res = await api.get('/user/profile');
          if (mounted) {
            setProfilePicture(res.data.user?.profilePicture);
            setName(res.data.user?.name);
          }
        } catch {
          if (mounted) {
            setProfilePicture(undefined);
            setName(undefined);
          }
        }
      } else {
        if (mounted) {
          setProfilePicture(undefined);
          setName(undefined);
        }
      }
    };
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  const renderStatusIcon = () => {
    if (status === 'loading') return <Loader2 className="animate-spin h-5 w-5 text-gray-400" />;
    if (status === 'online') return <CheckCircle className="h-5 w-5 text-green-400" />;
    return <XCircle className="h-5 w-5 text-red-400" />;
  };

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 w-full sm:w-auto">
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <Image src="/icon.webp" alt="Logo" width={36} height={36} className="rounded" />
            <span className="text-xl font-semibold text-white whitespace-nowrap">Status Page</span>
          </Link>

          <div
            className="relative flex items-center space-x-2 cursor-default mt-2 sm:mt-0"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {renderStatusIcon()}
            <span className="text-sm text-gray-300 font-medium whitespace-nowrap">
              {status === 'loading'
                ? 'Checking...'
                : status === 'online'
                  ? 'Operational'
                  : 'Offline'}
            </span>
            {showTooltip && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-gray-800 text-white text-xs px-3 py-2 rounded shadow-lg whitespace-nowrap z-20">
                {status === 'online' && uptime !== null
                  ? `Uptime: ${formatUptime(uptime)}`
                  : 'API is unreachable'}
              </div>
            )}
          </div>
        </div>

        {user && (
          <Link href="/profile" className="w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm font-medium cursor-pointer hover:bg-gray-700 transition text-center truncate">
              {profilePicture && (
                <Image
                  src={profilePicture}
                  alt="Profile"
                  width={24}
                  height={24}
                  className="rounded-full border border-gray-700"
                />
              )}
              <span className="truncate max-w-[120px]">
                {username
                  ? `@${username}`
                  : name
                    ? name.split(' ')[0]
                    : user.username
                      ? `@${user.username}`
                      : user.email}
              </span>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;

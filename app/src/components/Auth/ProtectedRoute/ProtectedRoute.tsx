'use client';

import { useEffect } from 'react';
import { useAuth } from '../AuthProvider/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/auth');
  }, [user, router]);

  return user ? <>{children}</> : null;
}

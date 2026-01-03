"use client";

import { useAuth } from '@/src/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderThree } from '@/src/components/ui/loader';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderThree />
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return <>{children}</>;
}
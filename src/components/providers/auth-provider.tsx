'use client';

import { useInitialize } from '@/store/auth-store';
import { useEffect } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useInitialize();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

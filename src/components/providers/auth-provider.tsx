'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setIsHydrated(true);

    initialize();
  }, [initialize]);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { ProtectedLayoutClient } from '@/components/dashboard/protected-layout-client';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import PermissionWrapper from '@/components/auth/permission-wrapper';
import { Suspense } from 'react';

type Props = {
  children: ReactNode;
};

/**
 * Settings layout - Handles authentication and layout for settings pages
 * Settings pages require:
 * 1. User authentication (AuthGuard)
 * 2. Basic permission context (PermissionWrapper without admin check)
 * 3. Standard layout (ProtectedLayoutClient)
 * 
 * No admin permissions needed, allowing for static rendering
 */
export default function SettingsLayout({ children }: Props) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AuthGuard useSkeletonFallback>
        <PermissionWrapper checkAdminStatus={false}>
          <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
        </PermissionWrapper>
      </AuthGuard>
    </Suspense>
  );
} 
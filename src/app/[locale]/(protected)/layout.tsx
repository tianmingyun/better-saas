import { AuthGuard } from '@/components/auth-guard';
import PermissionWrapper from '@/components/auth/permission-wrapper';
import { ProtectedLayoutClient } from '@/components/dashboard/protected-layout-client';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

// Force dynamic rendering for all protected routes
export const dynamic = 'force-dynamic';

type Props = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AuthGuard useSkeletonFallback>
        <PermissionWrapper>
          <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
        </PermissionWrapper>
      </AuthGuard>
    </Suspense>
  );
}

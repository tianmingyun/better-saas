import { AuthGuard } from '@/components/auth-guard';
import { PermissionWrapper } from '@/components/auth/permission-wrapper';
import { ProtectedLayoutClient } from '@/components/dashboard/protected-layout-client';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

type Props = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <AuthGuard useSkeletonFallback>
        <PermissionWrapper>
          <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
        </PermissionWrapper>
      </AuthGuard>
    </Suspense>
  );
}

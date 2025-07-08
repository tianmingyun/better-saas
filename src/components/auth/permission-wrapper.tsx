import { getUserPermissions } from '@/server/actions/auth-actions';
import { PermissionProvider } from './permission-provider';
import type { ReactNode } from 'react';

interface PermissionWrapperProps {
  children: ReactNode;
}

/**
 * 服务器组件：获取权限信息并传递给客户端组件
 */
export async function PermissionWrapper({ children }: PermissionWrapperProps) {
  const permissions = await getUserPermissions();

  return (
    <PermissionProvider permissions={permissions}>
      {children}
    </PermissionProvider>
  );
}

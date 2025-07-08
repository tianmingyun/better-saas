'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface UserPermissions {
  isAdmin: boolean;
  role: 'admin' | 'user';
  permissions: {
    'dashboard.view': boolean;
    'users.manage': boolean;
    'files.manage': boolean;
    'admin.access': boolean;
    'settings.view': boolean;
    'profile.edit': boolean;
    'billing.view': boolean;
  };
}

const PermissionContext = createContext<UserPermissions | null>(null);

interface PermissionProviderProps {
  children: ReactNode;
  permissions: UserPermissions;
}

export function PermissionProvider({ children, permissions }: PermissionProviderProps) {
  return (
    <PermissionContext.Provider value={permissions}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === null) {
    // 返回默认的空权限，避免错误
    return {
      isAdmin: false,
      role: 'user' as const,
      permissions: {
        'dashboard.view': false,
        'users.manage': false,
        'files.manage': false,
        'admin.access': false,
        'settings.view': false,
        'profile.edit': false,
        'billing.view': false,
      },
    };
  }
  return context;
}

// 便捷的 hooks
export const useIsAdmin = () => usePermissions().isAdmin;
export const useUserRole = () => usePermissions().role;
export const useHasPermission = (permission: keyof UserPermissions['permissions']) => 
  usePermissions().permissions[permission];

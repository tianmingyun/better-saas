'use server';

import { auth } from '@/lib/auth/auth';
import { isAdmin, getUserRole, hasPermission } from '@/lib/auth/permissions';
import type { Permission, UserRole } from '@/lib/auth/permissions';
import { headers } from 'next/headers';

export interface UserPermissions {
  isAdmin: boolean;
  role: UserRole;
  permissions: {
    [key in Permission]: boolean;
  };
}

/**
 * 获取当前用户的权限信息
 */
export async function getUserPermissions(): Promise<UserPermissions> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user || null;
    const adminStatus = isAdmin(user);
    const role = getUserRole(user);

    // 预计算所有权限
    const permissions: { [key in Permission]: boolean } = {
      'dashboard.view': hasPermission(user, 'dashboard.view'),
      'users.manage': hasPermission(user, 'users.manage'),
      'files.manage': hasPermission(user, 'files.manage'),
      'admin.access': hasPermission(user, 'admin.access'),
      'settings.view': hasPermission(user, 'settings.view'),
      'profile.edit': hasPermission(user, 'profile.edit'),
      'billing.view': hasPermission(user, 'billing.view'),
    };

    return {
      isAdmin: adminStatus,
      role,
      permissions,
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {
      isAdmin: false,
      role: 'user' as UserRole,
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
}

/**
 * 检查用户是否为管理员
 */
export async function checkIsAdmin(): Promise<boolean> {
  const permissions = await getUserPermissions();
  return permissions.isAdmin;
}

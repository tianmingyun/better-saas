import { env } from '@/env';
import type { User } from 'better-auth/types';

/**
 * 获取管理员邮箱列表
 */
export function getAdminEmails(): string[] {
  if (!env.ADMIN_EMAILS) {
    return [];
  }
  
  return env.ADMIN_EMAILS
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
}

/**
 * 检查用户是否为管理员
 * @param user 用户对象
 * @returns 是否为管理员
 */
export function isAdmin(user: User | null): boolean {
  if (!user?.email) {
    return false;
  }
  
  const adminEmails = getAdminEmails();
  return adminEmails.includes(user.email);
}

/**
 * 检查邮箱是否为管理员邮箱
 * @param email 邮箱地址
 * @returns 是否为管理员邮箱
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email);
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * 获取用户角色
 * @param user 用户对象
 * @returns 用户角色
 */
export function getUserRole(user: User | null): UserRole {
  if (isAdmin(user)) {
    return UserRole.ADMIN;
  }
  return UserRole.USER;
}

/**
 * 检查用户是否有指定权限
 * @param user 用户对象
 * @param permission 权限名称
 * @returns 是否有权限
 */
export function hasPermission(user: User | null, permission: string): boolean {
  const role = getUserRole(user);
  
  switch (permission) {
    case 'dashboard.view':
    case 'users.manage':
    case 'files.manage':
    case 'admin.access':
      return role === UserRole.ADMIN;
    
    case 'settings.view':
    case 'profile.edit':
    case 'billing.view':
      return true; // 所有登录用户都可以访问
    
    default:
      return false;
  }
}

/**
 * 权限常量
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  USERS_MANAGE: 'users.manage',
  FILES_MANAGE: 'files.manage',
  ADMIN_ACCESS: 'admin.access',
  SETTINGS_VIEW: 'settings.view',
  PROFILE_EDIT: 'profile.edit',
  BILLING_VIEW: 'billing.view',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]; 
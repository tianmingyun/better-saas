import type { ReactNode } from 'react'
import { PermissionProvider } from './permission-provider'

interface PermissionWrapperProps {
  children: ReactNode
  /**
   * Whether to check admin status. Set to false for non-admin pages to avoid
   * unnecessary headers() calls that force dynamic rendering
   */
  checkAdminStatus?: boolean
}

/**
 * Server component that provides permission context to client components
 * Only checks admin status when explicitly requested to avoid forcing
 * dynamic rendering on pages that don't need admin permissions
 */
export default async function PermissionWrapper({ 
  children, 
  checkAdminStatus = false 
}: PermissionWrapperProps) {
  let isAdmin = false;
  
  if (checkAdminStatus) {
    try {
      // Dynamic import to avoid loading the function when not needed
      const { getUserAdminStatus } = await import('@/server/actions/auth-actions');
      isAdmin = await getUserAdminStatus();
    } catch (error) {
      // Log error but don't fail the entire component
      console.error('Failed to get admin status, defaulting to false:', error);
      isAdmin = false;
    }
  }

  return (
    <PermissionProvider isAdmin={isAdmin}>
      {children}
    </PermissionProvider>
  )
}

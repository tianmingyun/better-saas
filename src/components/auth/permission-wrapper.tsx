import type { ReactNode } from 'react'
import { PermissionProvider } from './permission-provider'
import { getUserAdminStatus } from '@/server/actions/auth-actions'

interface PermissionWrapperProps {
  children: ReactNode
}

/**
 * Server component that fetches user admin status and provides it to client components
 * This component requires dynamic rendering due to headers() usage
 */
export default async function PermissionWrapper({ children }: PermissionWrapperProps) {
  let isAdmin = false;
  
  try {
    isAdmin = await getUserAdminStatus();
  } catch (error) {
    // Log error but don't fail the entire component
    console.error('Failed to get admin status, defaulting to false:', error);
    isAdmin = false;
  }

  return (
    <PermissionProvider isAdmin={isAdmin}>
      {children}
    </PermissionProvider>
  )
}

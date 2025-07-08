import type { ReactNode } from 'react'
import { PermissionProvider } from './permission-provider'
import { getUserAdminStatus } from '@/server/actions/auth-actions'

interface PermissionWrapperProps {
  children: ReactNode
}

/**
 * Server component that fetches user admin status and provides it to client components
 */
export default async function PermissionWrapper({ children }: PermissionWrapperProps) {
  const isAdmin = await getUserAdminStatus()

  return (
    <PermissionProvider isAdmin={isAdmin}>
      {children}
    </PermissionProvider>
  )
}

'use server'

import { auth } from '@/lib/auth/auth'
import { isAdmin } from '@/lib/auth/permissions'
import { headers } from 'next/headers'

/**
 * Get user admin status on server side
 * Only checks if user is admin, no complex permission calculations needed
 */
export async function getUserAdminStatus(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user) {
      return false
    }

    return isAdmin(session.user)
  } catch (error) {
    console.error('Error getting user admin status:', error)
    return false
  }
}

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'

// Mock messages for testing
const messages = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
  },
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    name: 'Name',
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome',
  },
  files: {
    title: 'Files',
    upload: 'Upload',
    download: 'Download',
  },
}

interface AllTheProvidersProps {
  children: React.ReactNode
  locale?: string
}

const AllTheProviders = ({ children, locale = 'en' }: AllTheProvidersProps) => {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { locale, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders locale={locale}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Mock user data for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  banned: false,
  banReason: null,
  banExpires: null,
}

export const mockAdminUser = {
  ...mockUser,
  id: 'test-admin-id',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
}

export const mockSession = {
  id: 'test-session-id',
  token: 'test-token',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  userId: 'test-user-id',
  impersonatedBy: null,
}

export const mockFile = {
  id: 'test-file-id',
  filename: 'test-image.jpg',
  originalName: 'test-image.jpg',
  mimeType: 'image/jpeg',
  size: 1024,
  width: 800,
  height: 600,
  r2Key: 'files/test-image.jpg',
  thumbnailKey: 'thumbnails/test-image.jpg',
  uploadUserId: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Helper function to create mock form data
export const createMockFormData = (data: Record<string, string | File>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

// Helper function to create mock file
export const createMockFile = (
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024
) => {
  return new File(['test content'], name, { type, lastModified: Date.now() })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

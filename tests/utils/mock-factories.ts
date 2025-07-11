/**
 * Mock Factory Functions
 * 提供可重用、可配置的 mock 对象创建
 */

// Mock types for testing - avoiding dependency on @/types to prevent circular imports

// =============================================================================
// User & Auth Mocks
// =============================================================================

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  emailVerified: boolean | string | null;
  permissions?: string[];
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  banned: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    emailVerified: true,
    permissions: ['read_posts'],
    image: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    banned: false,
    banReason: null,
    banExpires: null,
    ...overrides,
  };
}

export function createMockAdminUser(overrides: Partial<MockUser> = {}): MockUser {
  return createMockUser({
    role: 'admin',
    email: 'admin@example.com',
    name: 'Admin User',
    permissions: ['read_posts', 'write_posts', 'manage_users', 'manage_files'],
    ...overrides,
  });
}

// =============================================================================
// Auth Store Mocks
// =============================================================================

export interface MockAuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: MockUser | null;
  error: string | null;
  emailLogin: jest.Mock;
  signInWithGithub: jest.Mock;
  signInWithGoogle: jest.Mock;
  logout: jest.Mock;
  clearError: jest.Mock;
  refreshSession: jest.Mock;
  updateUser: jest.Mock;
}

export function createMockAuthStore(overrides: Partial<MockAuthStore> = {}): MockAuthStore {
  return {
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,
    user: null,
    error: null,
    emailLogin: jest.fn(),
    signInWithGithub: jest.fn(),
    signInWithGoogle: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
    refreshSession: jest.fn(),
    updateUser: jest.fn(),
    ...overrides,
  };
}

// =============================================================================
// File System Mocks
// =============================================================================

export interface MockFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  r2Key: string;
  thumbnailKey?: string;
  uploadUserId: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  thumbnailUrl?: string;
}

export function createMockFile(overrides: Partial<MockFile> = {}): MockFile {
  const id = overrides.id || 'test-file-1';
  const filename = overrides.filename || 'test-image.jpg';
  
  return {
    id,
    filename,
    originalName: filename,
    mimeType: 'image/jpeg',
    size: 1024,
    width: 800,
    height: 600,
    r2Key: `images/${filename}`,
    thumbnailKey: `thumbnails/${filename}`,
    uploadUserId: 'test-user-id',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    url: `https://cdn.example.com/images/${filename}`,
    thumbnailUrl: `https://cdn.example.com/thumbnails/${filename}`,
    ...overrides,
  };
}

export function createMockFileList(count: number = 3): MockFile[] {
  return Array.from({ length: count }, (_, index) => 
    createMockFile({
      id: `test-file-${index + 1}`,
      filename: `test-image-${index + 1}.jpg`,
    })
  );
}

// =============================================================================
// Browser API Mocks
// =============================================================================

export interface MockLocation {
  pathname: string;
  search: string;
  hash: string;
  href: string;
  origin: string;
  reload: jest.Mock;
  assign: jest.Mock;
  replace: jest.Mock;
}

export function createMockLocation(overrides: Partial<MockLocation> = {}): MockLocation {
  const pathname = overrides.pathname || '/';
  const origin = overrides.origin || 'http://localhost:3000';
  
  return {
    pathname,
    search: '',
    hash: '',
    href: `${origin}${pathname}`,
    origin,
    reload: jest.fn(),
    assign: jest.fn(),
    replace: jest.fn(),
    ...overrides,
  };
}

// =============================================================================
// Next.js Router Mocks
// =============================================================================

export interface MockRouter {
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
  forward: jest.Mock;
  refresh: jest.Mock;
  prefetch: jest.Mock;
  pathname?: string;
}

export function createMockRouter(overrides: Partial<MockRouter> = {}): MockRouter {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    ...overrides,
  };
}

// =============================================================================
// SWR Mocks
// =============================================================================

export interface MockSWRResult<T = any> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: jest.Mock;
}

export function createMockSWRResult<T>(overrides: Partial<MockSWRResult<T>> = {}): MockSWRResult<T> {
  return {
    data: undefined,
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
    ...overrides,
  };
}

export interface MockSWRMutationResult<T = any> {
  trigger: jest.Mock;
  data: T | undefined;
  error: Error | undefined;
  isMutating: boolean;
  reset: jest.Mock;
}

export function createMockSWRMutationResult<T>(overrides: Partial<MockSWRMutationResult<T>> = {}): MockSWRMutationResult<T> {
  return {
    trigger: jest.fn(),
    data: undefined,
    error: undefined,
    isMutating: false,
    reset: jest.fn(),
    ...overrides,
  };
}

// =============================================================================
// Toast Messages Mock
// =============================================================================

export interface MockToastMessages {
  success: {
    nameUpdated: jest.Mock;
    avatarUpdated: jest.Mock;
    loginSuccess: jest.Mock;
  };
  error: {
    nameEmpty: jest.Mock;
    nameUpdateFailed: jest.Mock;
    avatarUpdateFailed: jest.Mock;
    fileUploadFailed: jest.Mock;
    loginFailed: jest.Mock;
    socialLoginFailed: jest.Mock;
  };
  info: {
    nameNotChanged: jest.Mock;
  };
}

export function createMockToastMessages(): MockToastMessages {
  return {
    success: {
      nameUpdated: jest.fn(),
      avatarUpdated: jest.fn(),
      loginSuccess: jest.fn(),
    },
    error: {
      nameEmpty: jest.fn(),
      nameUpdateFailed: jest.fn(),
      avatarUpdateFailed: jest.fn(),
      fileUploadFailed: jest.fn(),
      loginFailed: jest.fn(),
      socialLoginFailed: jest.fn(),
    },
    info: {
      nameNotChanged: jest.fn(),
    },
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * 重置所有 mock 函数的调用历史
 */
export function resetAllMocks(...mocks: any[]): void {
  mocks.forEach(mock => {
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach(value => {
        if (jest.isMockFunction(value)) {
          value.mockReset();
        } else if (typeof value === 'object' && value !== null) {
          resetAllMocks(value);
        }
      });
    } else if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
}

/**
 * 创建 File 对象的 mock
 */
export function createMockFileObject(
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024
): File {
  const content = 'a'.repeat(size);
  return new File([content], name, { 
    type, 
    lastModified: Date.now() 
  });
} 
/**
 * Mock Setup Utilities
 * 统一的 Mock 配置管理系统
 */

import {
  createMockAuthStore,
  createMockRouter,
  createMockLocation,
  createMockToastMessages,
  createMockSWRResult,
  createMockSWRMutationResult,
  MockAuthStore,
  MockRouter,
  MockLocation,
  MockToastMessages,
} from './mock-factories';

// =============================================================================
// Global Mock State Management
// =============================================================================

interface GlobalMockState {
  authStore: MockAuthStore;
  router: MockRouter;
  location: MockLocation;
  toastMessages: MockToastMessages;
}

let globalMockState: GlobalMockState | null = null;

/**
 * 初始化全局 Mock 状态
 */
export function initializeGlobalMocks(): GlobalMockState {
  globalMockState = {
    authStore: createMockAuthStore(),
    router: createMockRouter(),
    location: createMockLocation(),
    toastMessages: createMockToastMessages(),
  };

  return globalMockState;
}

/**
 * 获取全局 Mock 状态
 */
export function getGlobalMocks(): GlobalMockState {
  if (!globalMockState) {
    return initializeGlobalMocks();
  }
  return globalMockState;
}

/**
 * 重置全局 Mock 状态
 */
export function resetGlobalMocks(): void {
  if (globalMockState) {
    // Reset all mock functions
    Object.values(globalMockState.authStore).forEach(value => {
      if (jest.isMockFunction(value)) {
        value.mockReset();
      }
    });

    Object.values(globalMockState.router).forEach(value => {
      if (jest.isMockFunction(value)) {
        value.mockReset();
      }
    });

    Object.values(globalMockState.location).forEach(value => {
      if (jest.isMockFunction(value)) {
        value.mockReset();
      }
    });

    // Reset nested toast messages
    Object.values(globalMockState.toastMessages.success).forEach(fn => fn.mockReset());
    Object.values(globalMockState.toastMessages.error).forEach(fn => fn.mockReset());
    Object.values(globalMockState.toastMessages.info).forEach(fn => fn.mockReset());
  }
}

// =============================================================================
// Module Mock Configurations
// =============================================================================

/**
 * 设置 Auth Store Mock
 */
export function setupAuthStoreMock(): void {
  const mocks = getGlobalMocks();
  
  jest.mock('@/store/auth-store', () => ({
    useAuthLoading: () => mocks.authStore.isLoading,
    useAuthError: () => mocks.authStore.error,
    useIsAuthenticated: () => mocks.authStore.isAuthenticated,
    useAuthInitialized: () => mocks.authStore.isInitialized,
    useUser: () => mocks.authStore.user,
    useEmailLogin: () => mocks.authStore.emailLogin,
    useSignInWithGithub: () => mocks.authStore.signInWithGithub,
    useSignInWithGoogle: () => mocks.authStore.signInWithGoogle,
    useLogout: () => mocks.authStore.logout,
    useClearError: () => mocks.authStore.clearError,
    useRefreshSession: () => mocks.authStore.refreshSession,
    useUpdateUser: () => mocks.authStore.updateUser,
  }));
}

/**
 * 设置 Next.js Navigation Mock
 */
export function setupNavigationMock(): void {
  const mocks = getGlobalMocks();

  jest.mock('next/navigation', () => ({
    useRouter: () => mocks.router,
    usePathname: () => mocks.location.pathname,
    useSearchParams: () => ({
      get: jest.fn((key: string) => {
        const params = new URLSearchParams(mocks.location.search);
        return params.get(key);
      }),
    }),
  }));
}

/**
 * 设置 Next-intl Mock
 */
export function setupIntlMock(locale: string = 'en'): void {
  jest.mock('next-intl', () => ({
    useLocale: () => locale,
    useTranslations: () => (key: string) => key,
  }));
}

/**
 * 设置 Toast Messages Mock
 */
export function setupToastMessagesMock(): void {
  const mocks = getGlobalMocks();

  jest.mock('@/hooks/use-toast-messages', () => ({
    useToastMessages: () => mocks.toastMessages,
  }));
}

/**
 * 设置 SWR Mock
 */
export function setupSWRMock(): void {
  const mockUseSWR = jest.fn();
  const mockUseSWRMutation = jest.fn();

  // Default implementations
  mockUseSWR.mockReturnValue(createMockSWRResult());
  mockUseSWRMutation.mockReturnValue(createMockSWRMutationResult());

  jest.mock('swr', () => ({
    __esModule: true,
    default: mockUseSWR,
  }));

  jest.mock('swr/mutation', () => ({
    __esModule: true,
    default: mockUseSWRMutation,
  }));

  // Expose mocks for test configuration
  (global as any).__mockUseSWR = mockUseSWR;
  (global as any).__mockUseSWRMutation = mockUseSWRMutation;
}

/**
 * 设置 Browser APIs Mock
 */
export function setupBrowserAPIMock(): void {
  const mocks = getGlobalMocks();

  // Mock window.location
  delete (window as any).location;
  Object.defineProperty(window, 'location', {
    value: mocks.location,
    writable: true,
    configurable: true,
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver
  (global as any).IntersectionObserver = class MockIntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds: number[] = [];
    
    constructor() {
      // Mock implementation
    }
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() { return []; }
  };
}

// =============================================================================
// Test Environment Setup
// =============================================================================

/**
 * 完整的测试环境设置
 */
export function setupTestEnvironment(options: {
  locale?: string;
  authenticated?: boolean;
  user?: any;
  includeAuth?: boolean;
  includeNavigation?: boolean;
  includeIntl?: boolean;
  includeToast?: boolean;
  includeSWR?: boolean;
  includeBrowserAPI?: boolean;
} = {}): GlobalMockState {
  const {
    locale = 'en',
    authenticated = false,
    user = null,
    includeAuth = true,
    includeNavigation = true,
    includeIntl = true,
    includeToast = true,
    includeSWR = true,
    includeBrowserAPI = true,
  } = options;

  // Initialize global mocks
  const mocks = initializeGlobalMocks();

  // Configure auth state
  if (authenticated) {
    mocks.authStore.isAuthenticated = true;
    mocks.authStore.user = user;
  }

  // Setup module mocks based on options
  if (includeAuth) setupAuthStoreMock();
  if (includeNavigation) setupNavigationMock();
  if (includeIntl) setupIntlMock(locale);
  if (includeToast) setupToastMessagesMock();
  if (includeSWR) setupSWRMock();
  if (includeBrowserAPI) setupBrowserAPIMock();

  return mocks;
}

/**
 * 清理测试环境
 */
export function cleanupTestEnvironment(): void {
  resetGlobalMocks();
  jest.clearAllMocks();
}

// =============================================================================
// Test Scenario Helpers
// =============================================================================

/**
 * 设置认证用户场景
 */
export function setupAuthenticatedUserScenario(user?: any): GlobalMockState {
  return setupTestEnvironment({
    authenticated: true,
    user: user || { id: 'test-user', email: 'test@example.com', role: 'user' },
  });
}

/**
 * 设置管理员用户场景
 */
export function setupAdminUserScenario(): GlobalMockState {
  return setupTestEnvironment({
    authenticated: true,
    user: { id: 'admin-user', email: 'admin@example.com', role: 'admin' },
  });
}

/**
 * 设置未认证用户场景
 */
export function setupUnauthenticatedUserScenario(): GlobalMockState {
  return setupTestEnvironment({
    authenticated: false,
    user: null,
  });
}

/**
 * 设置加载中场景
 */
export function setupLoadingScenario(): GlobalMockState {
  const mocks = setupTestEnvironment();
  mocks.authStore.isLoading = true;
  mocks.authStore.isInitialized = false;
  return mocks;
}

/**
 * 设置错误场景
 */
export function setupErrorScenario(error: string = 'Test error'): GlobalMockState {
  const mocks = setupTestEnvironment();
  mocks.authStore.error = error;
  return mocks;
} 
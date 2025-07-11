import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock user type
interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Simple auth store implementation to test
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  lastUpdated: number;
  cacheExpiry: number;
}

function createAuthStore() {
  let state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isInitialized: false,
    lastUpdated: 0,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
  };

  return {
    getState: () => state,
    setUser: (user: User | null) => {
      state.user = user;
      state.isAuthenticated = !!user;
      state.lastUpdated = Date.now();
    },
    setLoading: (loading: boolean) => {
      state.isLoading = loading;
    },
    setError: (error: string | null) => {
      state.error = error;
    },
    clearError: () => {
      state.error = null;
    },
    setInitialized: (initialized: boolean) => {
      state.isInitialized = initialized;
    },
    clearAuth: () => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.lastUpdated = 0;
    },
    isCacheValid: () => {
      if (state.lastUpdated === 0) return false;
      return Date.now() - state.lastUpdated < state.cacheExpiry;
    },
    invalidateCache: () => {
      state.lastUpdated = 0;
    },
    setCacheExpiry: (expiry: number) => {
      state.cacheExpiry = expiry;
    },
  };
}

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Authentication State Management Tests', () => {
  let authStore: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Create fresh store
    authStore = createAuthStore();

    // Mock Date.now
    const mockDateNow = jest.fn(() => 1640995200000);
    (Date as any).now = mockDateNow;

    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = authStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isInitialized).toBe(false);
      expect(state.lastUpdated).toBe(0);
    });
  });

  describe('User Management', () => {
    it('should correctly set user', () => {
      authStore.setUser(mockUser);
      const state = authStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.lastUpdated).toBeGreaterThan(0);
    });

    it('should correctly clear user', () => {
      // First set a user
      authStore.setUser(mockUser);

      // Then clear
      authStore.setUser(null);
      const state = authStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should correctly set loading state', () => {
      authStore.setLoading(true);
      expect(authStore.getState().isLoading).toBe(true);

      authStore.setLoading(false);
      expect(authStore.getState().isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should correctly set and clear errors', () => {
      authStore.setError('Test error');
      expect(authStore.getState().error).toBe('Test error');

      authStore.clearError();
      expect(authStore.getState().error).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should correctly check cache validity', () => {
      // Initially cache is invalid
      expect(authStore.isCacheValid()).toBe(false);

      // Set user (which updates lastUpdated)
      authStore.setUser(mockUser);

      // Now cache should be valid
      expect(authStore.isCacheValid()).toBe(true);
    });

    it('should correctly invalidate cache', () => {
      // Set user first
      authStore.setUser(mockUser);
      expect(authStore.isCacheValid()).toBe(true);

      // Invalidate cache
      authStore.invalidateCache();
      expect(authStore.isCacheValid()).toBe(false);
    });

    it('should correctly set cache expiry time', () => {
      authStore.setCacheExpiry(5000); // 5 seconds
      expect(authStore.getState().cacheExpiry).toBe(5000);
    });
  });

  describe('Authentication Cleanup', () => {
    it('should correctly clear authentication state', () => {
      // Set some state first
      authStore.setUser(mockUser);
      authStore.setError('Some error');
      authStore.setLoading(true);

      // Clear auth
      authStore.clearAuth();
      const state = authStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.lastUpdated).toBe(0);
      // Error should not be cleared by clearAuth
      expect(state.error).toBe('Some error');
    });
  });
});

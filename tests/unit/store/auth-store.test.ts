import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '@/store/auth-store';
import type { User } from 'better-auth/types';

// Mock auth client
jest.mock('@/lib/auth/auth-client', () => ({
  authClient: {
    signIn: {
      email: jest.fn(),
      social: jest.fn(),
    },
    signUp: {
      email: jest.fn(),
    },
    signOut: jest.fn(),
    getSession: jest.fn(),
    updateUser: jest.fn(),
  },
}));

// Mock permissions
jest.mock('@/lib/auth/permissions', () => ({
  isAdmin: jest.fn(),
  getUserRole: jest.fn(),
  hasPermission: jest.fn(),
  UserRole: {
    ADMIN: 'admin',
    USER: 'user',
  },
  PERMISSIONS: {
    DASHBOARD_VIEW: 'dashboard.view',
  },
}));

// Mock logger
jest.mock('@/lib/logger/logger-utils', () => ({
  ErrorLogger: jest.fn().mockImplementation(() => ({
    logError: jest.fn(),
  })),
}));

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
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset store to initial state
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setInitialized(false);

    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.lastUpdated).toBe(0);
    });
  });

  describe('User Management', () => {
    it('should correctly set user', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('should correctly clear user', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set a user
      act(() => {
        result.current.setUser(mockUser);
      });

      // Then clear
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should correctly set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should correctly set and clear errors', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should correctly check cache validity', () => {
      const { result } = renderHook(() => useAuthStore());

      // Initially cache is invalid
      expect(result.current.isCacheValid()).toBe(false);

      // Set user (which updates lastUpdated)
      act(() => {
        result.current.setUser(mockUser);
      });

      // Now cache should be valid
      expect(result.current.isCacheValid()).toBe(true);
    });

    it('should correctly invalidate cache', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set user first
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isCacheValid()).toBe(true);

      // Invalidate cache
      act(() => {
        result.current.invalidateCache();
      });

      expect(result.current.isCacheValid()).toBe(false);
    });

    it('should correctly set cache expiry time', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCacheExpiry(5000); // 5 seconds
      });

      expect(result.current.cacheExpiry).toBe(5000);
    });
  });

  describe('Authentication Cleanup', () => {
    it('should correctly clear authentication state', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set some state first
      act(() => {
        result.current.setUser(mockUser);
        result.current.setError('Some error');
        result.current.setLoading(true);
      });

      // Clear auth
      act(() => {
        result.current.clearAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastUpdated).toBe(0);
      // Error should not be cleared by clearAuth
      expect(result.current.error).toBe('Some error');
    });
  });

  describe('Persistence', () => {
    it('should persist correct state fields', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
        result.current.setError('Test error');
        result.current.setLoading(true);
      });

      // Check localStorage
      const stored = localStorage.getItem('better-saas-auth');
      expect(stored).toBeTruthy();

      if (stored) {
        const parsedStored = JSON.parse(stored);
        expect(parsedStored.state.user).toEqual(mockUser);
        expect(parsedStored.state.isAuthenticated).toBe(true);
        expect(parsedStored.state.lastUpdated).toBeGreaterThan(0);

        // These should not be persisted
        expect(parsedStored.state.error).toBeUndefined();
        expect(parsedStored.state.isLoading).toBeUndefined();
        expect(parsedStored.state.isInitialized).toBeUndefined();
      }
    });
  });
});

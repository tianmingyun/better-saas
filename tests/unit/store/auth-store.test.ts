import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import { useAuthStore } from '@/store/auth-store'
import type { User } from 'better-auth/types'

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
}))

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
}))

// Mock logger
jest.mock('@/lib/logger/logger-utils', () => ({
  ErrorLogger: jest.fn().mockImplementation(() => ({
    logError: jest.fn(),
  })),
}))

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('认证状态管理测试', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    
    // Reset store to initial state
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setInitialized(false)
    
    jest.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isInitialized).toBe(false)
      expect(result.current.lastUpdated).toBe(0)
    })
  })

  describe('用户设置', () => {
    it('应该正确设置用户', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setUser(mockUser)
      })
      
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.lastUpdated).toBeGreaterThan(0)
    })

    it('应该正确清除用户', () => {
      const { result } = renderHook(() => useAuthStore())
      
      // First set a user
      act(() => {
        result.current.setUser(mockUser)
      })
      
      // Then clear
      act(() => {
        result.current.setUser(null)
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('加载状态', () => {
    it('应该正确设置加载状态', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.isLoading).toBe(true)
      
      act(() => {
        result.current.setLoading(false)
      })
      
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('错误处理', () => {
    it('应该正确设置和清除错误', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setError('Test error')
      })
      
      expect(result.current.error).toBe('Test error')
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('缓存管理', () => {
    it('应该正确检查缓存有效性', () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Initially cache is invalid
      expect(result.current.isCacheValid()).toBe(false)
      
      // Set user (which updates lastUpdated)
      act(() => {
        result.current.setUser(mockUser)
      })
      
      // Now cache should be valid
      expect(result.current.isCacheValid()).toBe(true)
    })

    it('应该正确使缓存失效', () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Set user first
      act(() => {
        result.current.setUser(mockUser)
      })
      
      expect(result.current.isCacheValid()).toBe(true)
      
      // Invalidate cache
      act(() => {
        result.current.invalidateCache()
      })
      
      expect(result.current.isCacheValid()).toBe(false)
    })

    it('应该正确设置缓存过期时间', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setCacheExpiry(5000) // 5 seconds
      })
      
      expect(result.current.cacheExpiry).toBe(5000)
    })
  })

  describe('认证清理', () => {
    it('应该正确清理认证状态', () => {
      const { result } = renderHook(() => useAuthStore())
      
      // Set some state first
      act(() => {
        result.current.setUser(mockUser)
        result.current.setError('Some error')
        result.current.setLoading(true)
      })
      
      // Clear auth
      act(() => {
        result.current.clearAuth()
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.lastUpdated).toBe(0)
      // Error should not be cleared by clearAuth
      expect(result.current.error).toBe('Some error')
    })
  })

  describe('持久化', () => {
    it('应该持久化正确的状态字段', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setUser(mockUser)
        result.current.setError('Test error')
        result.current.setLoading(true)
      })
      
      // Check localStorage
      const stored = localStorage.getItem('better-saas-auth')
      expect(stored).toBeTruthy()
      
      if (stored) {
        const parsedStored = JSON.parse(stored)
        expect(parsedStored.state.user).toEqual(mockUser)
        expect(parsedStored.state.isAuthenticated).toBe(true)
        expect(parsedStored.state.lastUpdated).toBeGreaterThan(0)
        
        // These should not be persisted
        expect(parsedStored.state.error).toBeUndefined()
        expect(parsedStored.state.isLoading).toBeUndefined()
        expect(parsedStored.state.isInitialized).toBeUndefined()
      }
    })
  })
})

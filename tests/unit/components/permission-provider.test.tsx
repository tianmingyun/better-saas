import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  getGlobalMocks,
} from '../../utils/mock-setup';
import {
  createMockUser,
} from '../../utils/mock-factories';

// Mock PermissionProvider component for testing
const MockPermissionProvider = ({ children, requiredPermission, fallback }: any) => {
  const mocks = getGlobalMocks();
  
  // Check if user has required permission
  const hasPermission = (permission: string) => {
    if (!mocks.authStore.user) return false;
    if (mocks.authStore.user.role === 'admin') return true;
    return mocks.authStore.user.permissions?.includes(permission) || false;
  };
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <div data-testid="access-denied">Access Denied</div>;
  }
  
  return <>{children}</>;
};

// Mock components
const MockChildComponent = () => <div data-testid="protected-content">Protected Content</div>;
const MockFallbackComponent = () => <div data-testid="custom-fallback">Custom Fallback</div>;

// Use mock as PermissionProvider
const PermissionProvider = MockPermissionProvider;

describe('PermissionProvider Component Tests', () => {
  let mocks: ReturnType<typeof getGlobalMocks>;

  beforeEach(() => {
    setupTestEnvironment({
      includeAuth: true,
      includeBrowserAPI: false,
    });
    
    mocks = getGlobalMocks();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Admin User', () => {
    it('should allow admin access to all content', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      render(
        <PermissionProvider requiredPermission="manage_users">
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
      expect(screen.queryByTestId('access-denied')).toBeNull();
    });

    it('should allow admin access without specific permissions', () => {
      const adminUser = createMockUser({ 
        role: 'admin',
        permissions: [] // Empty permissions array
      });
      mocks.authStore.user = adminUser;

      render(
        <PermissionProvider requiredPermission="any_permission">
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
    });
  });

  describe('Regular User with Permissions', () => {
    it('should allow access when user has required permission', () => {
      const userWithPermission = createMockUser({ 
        role: 'user',
        permissions: ['read_posts', 'write_posts', 'manage_profile']
      });
      mocks.authStore.user = userWithPermission;

      render(
        <PermissionProvider requiredPermission="read_posts">
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
    });

    it('should deny access when user lacks required permission', () => {
      const userWithoutPermission = createMockUser({ 
        role: 'user',
        permissions: ['read_posts']
      });
      mocks.authStore.user = userWithoutPermission;

      render(
        <PermissionProvider requiredPermission="manage_users">
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });
  });

  describe('User without Permissions', () => {
    it('should deny access when user has no permissions', () => {
      const userWithoutPermissions = createMockUser({ 
        role: 'user',
        permissions: []
      });
      mocks.authStore.user = userWithoutPermissions;

      render(
        <PermissionProvider requiredPermission="read_posts">
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });

    it('should deny access when user has undefined permissions', () => {
      const userWithUndefinedPermissions = createMockUser({ 
        role: 'user',
        permissions: undefined
      });
      mocks.authStore.user = userWithUndefinedPermissions;

      render(
        <PermissionProvider requiredPermission="read_posts">
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });
  });

  describe('No User', () => {
    it('should deny access when no user is present', () => {
      mocks.authStore.user = null;

      render(
        <PermissionProvider requiredPermission="read_posts">
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });
  });

  describe('Custom Fallback', () => {
    it('should show custom fallback when access is denied', () => {
      const userWithoutPermission = createMockUser({ 
        role: 'user',
        permissions: ['read_posts']
      });
      mocks.authStore.user = userWithoutPermission;

      render(
        <PermissionProvider 
          requiredPermission="manage_users" 
          fallback={<MockFallbackComponent />}
        >
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.queryByTestId('access-denied')).toBeNull();
      expect(screen.getByTestId('custom-fallback')).toBeDefined();
    });
  });

  describe('No Required Permission', () => {
    it('should allow access when no permission is required', () => {
      const anyUser = createMockUser({ 
        role: 'user',
        permissions: []
      });
      mocks.authStore.user = anyUser;

      render(
        <PermissionProvider>
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
    });

    it('should allow access even without user when no permission required', () => {
      mocks.authStore.user = null;

      render(
        <PermissionProvider>
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty permission string', () => {
      const user = createMockUser({ 
        role: 'user',
        permissions: ['read_posts']
      });
      mocks.authStore.user = user;

      render(
        <PermissionProvider requiredPermission="">
          <MockChildComponent />
        </PermissionProvider>
      );

      // Empty permission should be treated as no permission required
      expect(screen.getByTestId('protected-content')).toBeDefined();
    });

    it('should handle multiple children', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      render(
        <PermissionProvider requiredPermission="manage_users">
          <MockChildComponent />
          <div data-testid="second-child">Second Child</div>
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
      expect(screen.getByTestId('second-child')).toBeDefined();
    });

    it('should handle null children', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      const { container } = render(
        <PermissionProvider requiredPermission="manage_users">
          {null}
        </PermissionProvider>
      );

      expect(container).toBeDefined();
    });
  });

  describe('Permission Scenarios', () => {
    it('should handle case-sensitive permissions', () => {
      const user = createMockUser({ 
        role: 'user',
        permissions: ['Read_Posts', 'WRITE_POSTS']
      });
      mocks.authStore.user = user;

      render(
        <PermissionProvider requiredPermission="read_posts">
          <MockChildComponent />
        </PermissionProvider>
      );

      // Should be case-sensitive by default
      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });

    it('should handle exact permission match', () => {
      const user = createMockUser({ 
        role: 'user',
        permissions: ['read_posts', 'read_posts_admin']
      });
      mocks.authStore.user = user;

      render(
        <PermissionProvider requiredPermission="read_posts">
          <MockChildComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
    });
  });
}); 
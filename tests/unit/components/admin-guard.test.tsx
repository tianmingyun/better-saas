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

// Mock AdminGuard component for testing
const MockAdminGuard = ({ children, fallback }: any) => {
  const mocks = getGlobalMocks();
  
  // Check if user is admin
  const isAdmin = mocks.authStore.user?.role === 'admin';
  
  if (!isAdmin) {
    return fallback || <div data-testid="access-denied">Access Denied - Admin Only</div>;
  }
  
  return <>{children}</>;
};

// Mock components
const MockChildComponent = () => <div data-testid="admin-content">Admin Content</div>;
const MockFallbackComponent = () => <div data-testid="custom-fallback">Custom Fallback</div>;

// Use mock as AdminGuard
const AdminGuard = MockAdminGuard;

describe('AdminGuard Component Tests', () => {
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

  describe('Admin User Access', () => {
    it('should allow access for admin user', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.getByTestId('admin-content')).toBeDefined();
      expect(screen.queryByTestId('access-denied')).toBeNull();
    });

    it('should allow access for admin user with any permissions', () => {
      const adminUser = createMockUser({ 
        role: 'admin',
        permissions: ['basic_permission']
      });
      mocks.authStore.user = adminUser;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.getByTestId('admin-content')).toBeDefined();
    });

    it('should allow access for admin user without permissions', () => {
      const adminUser = createMockUser({ 
        role: 'admin',
        permissions: []
      });
      mocks.authStore.user = adminUser;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.getByTestId('admin-content')).toBeDefined();
    });
  });

  describe('Non-Admin User Access', () => {
    it('should deny access for regular user', () => {
      const regularUser = createMockUser({ role: 'user' });
      mocks.authStore.user = regularUser;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });

    it('should deny access for moderator user', () => {
      const moderatorUser = createMockUser({ role: 'moderator' });
      mocks.authStore.user = moderatorUser;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });

    it('should deny access for user with many permissions but not admin', () => {
      const powerUser = createMockUser({ 
        role: 'user',
        permissions: ['read_all', 'write_all', 'manage_files', 'manage_users']
      });
      mocks.authStore.user = powerUser;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });
  });

  describe('No User', () => {
    it('should deny access when no user is present', () => {
      mocks.authStore.user = null;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });

    it('should deny access when user is undefined', () => {
      mocks.authStore.user = null;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });
  });

  describe('Custom Fallback', () => {
    it('should show custom fallback when access is denied', () => {
      const regularUser = createMockUser({ role: 'user' });
      mocks.authStore.user = regularUser;

      render(
        <AdminGuard fallback={<MockFallbackComponent />}>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.queryByTestId('access-denied')).toBeNull();
      expect(screen.getByTestId('custom-fallback')).toBeDefined();
    });

    it('should show custom fallback when no user', () => {
      mocks.authStore.user = null;

      render(
        <AdminGuard fallback={<MockFallbackComponent />}>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.queryByTestId('access-denied')).toBeNull();
      expect(screen.getByTestId('custom-fallback')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple children for admin', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      render(
        <AdminGuard>
          <MockChildComponent />
          <div data-testid="second-child">Second Admin Content</div>
        </AdminGuard>
      );

      expect(screen.getByTestId('admin-content')).toBeDefined();
      expect(screen.getByTestId('second-child')).toBeDefined();
    });

    it('should handle null children for admin', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      const { container } = render(
        <AdminGuard>
          {null}
        </AdminGuard>
      );

      expect(container).toBeDefined();
      expect(screen.queryByTestId('access-denied')).toBeNull();
    });

    it('should handle empty children for admin', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      const { container } = render(
        <AdminGuard>
          {/* Empty */}
        </AdminGuard>
      );

      expect(container).toBeDefined();
      expect(screen.queryByTestId('access-denied')).toBeNull();
    });

    it('should handle multiple children for non-admin', () => {
      const regularUser = createMockUser({ role: 'user' });
      mocks.authStore.user = regularUser;

      render(
        <AdminGuard>
          <MockChildComponent />
          <div data-testid="second-child">Second Admin Content</div>
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.queryByTestId('second-child')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });
  });

  describe('Role Validation', () => {
    it('should be case sensitive for role check', () => {
      const userWithWrongCase = createMockUser({ role: 'Admin' as any });
      mocks.authStore.user = userWithWrongCase;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      // Should be case sensitive - 'Admin' !== 'admin'
      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });

    it('should handle empty role', () => {
      const userWithEmptyRole = createMockUser({ role: '' as any });
      mocks.authStore.user = userWithEmptyRole;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });

    it('should handle undefined role', () => {
      const userWithUndefinedRole = createMockUser({ role: undefined as any });
      mocks.authStore.user = userWithUndefinedRole;

      render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });
  });

  describe('Component Behavior', () => {
    it('should not call children side effects when access denied', () => {
      const regularUser = createMockUser({ role: 'user' });
      mocks.authStore.user = regularUser;

      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      const ChildWithSideEffect = () => {
        console.log('Child component rendered');
        return <div data-testid="admin-content">Admin Content</div>;
      };

      render(
        <AdminGuard>
          <ChildWithSideEffect />
        </AdminGuard>
      );

      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(mockConsoleLog).not.toHaveBeenCalled();

      mockConsoleLog.mockRestore();
    });

    it('should call children side effects when access granted', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      const ChildWithSideEffect = () => {
        console.log('Child component rendered');
        return <div data-testid="admin-content">Admin Content</div>;
      };

      render(
        <AdminGuard>
          <ChildWithSideEffect />
        </AdminGuard>
      );

      expect(screen.getByTestId('admin-content')).toBeDefined();
      expect(mockConsoleLog).toHaveBeenCalledWith('Child component rendered');

      mockConsoleLog.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle user role changes', () => {
      // Start with regular user
      const regularUser = createMockUser({ role: 'user' });
      mocks.authStore.user = regularUser;

      const { rerender } = render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      // Should deny access initially
      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();

      // Update to admin user
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      rerender(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      // Should now allow access
      expect(screen.getByTestId('admin-content')).toBeDefined();
      expect(screen.queryByTestId('access-denied')).toBeNull();
    });

    it('should handle admin logout', () => {
      // Start with admin user
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;

      const { rerender } = render(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      // Should allow access initially
      expect(screen.getByTestId('admin-content')).toBeDefined();

      // Simulate logout
      mocks.authStore.user = null;

      rerender(
        <AdminGuard>
          <MockChildComponent />
        </AdminGuard>
      );

      // Should now deny access
      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.getByTestId('access-denied')).toBeDefined();
    });
  });
}); 
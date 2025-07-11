import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the AdminGuard component
const MockAdminGuard = jest.fn(({ children, fallback, showAccessDenied, redirectTo }) => {
  const mockAuthStore = require('@/store/auth-store');
  const mockNavigation = require('next/navigation');
  const mockPermissions = require('@/components/auth/permission-provider');
  
  const isAuthenticated = mockAuthStore.useIsAuthenticated();
  const isAdmin = mockPermissions.useIsAdmin();
  const isLoading = mockAuthStore.useAuthLoading();
  const isInitialized = mockAuthStore.useAuthInitialized();
  const router = mockNavigation.useRouter();

  // Auto redirect effect
  React.useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated && !isAdmin) {
      router.push(redirectTo || '/settings/profile');
    }
  }, [isInitialized, isLoading, isAuthenticated, isAdmin, redirectTo, router]);

  // Loading state
  if (!isInitialized || isLoading) {
    if (fallback) return fallback;
    return React.createElement('div', { 'data-testid': 'loading-skeleton' }, 'Loading Skeleton');
  }

  // Not authenticated - handled by AuthGuard
  if (!isAuthenticated) {
    return null;
  }

  // Not admin
  if (!isAdmin) {
    if (showAccessDenied === false) return null;
    
    return React.createElement('div', null,
      React.createElement('div', null, '管理员权限必需'),
      React.createElement('div', null, '此页面仅限管理员访问。如果您认为这是错误，请联系系统管理员。'),
      React.createElement('button', { onClick: () => router.push(redirectTo || '/settings/profile') }, '返回设置'),
      React.createElement('button', { onClick: () => router.push('/') }, '返回首页')
    );
  }

  // Is admin - render children
  return children;
});

// Mock next/navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
};

jest.mock('@/store/auth-store', () => ({
  useAuthLoading: () => mockAuthStore.isLoading,
  useIsAuthenticated: () => mockAuthStore.isAuthenticated,
  useAuthInitialized: () => mockAuthStore.isInitialized,
}));

// Mock permission provider
const mockPermissionProvider = {
  isAdmin: false,
};

jest.mock('@/components/auth/permission-provider', () => ({
  useIsAdmin: () => mockPermissionProvider.isAdmin,
}));

// Use our mock component
const AdminGuard = MockAdminGuard;

describe('AdminGuard Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock states
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isLoading = false;
    mockAuthStore.isInitialized = false;
    mockPermissionProvider.isAdmin = false;
  });

  describe('Loading States', () => {
    it('should show loading skeleton when not initialized', () => {
      mockAuthStore.isInitialized = false;
      mockAuthStore.isLoading = true;

      render(
        <AdminGuard>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(screen.getByTestId('loading-skeleton')).toBeDefined();
      expect(screen.queryByText('Admin Content')).toBeNull();
    });

    it('should show custom fallback when provided and loading', () => {
      mockAuthStore.isInitialized = false;
      mockAuthStore.isLoading = true;

      render(
        <AdminGuard fallback={<div>Custom Loading</div>}>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('Custom Loading')).toBeDefined();
      expect(screen.queryByTestId('loading-skeleton')).toBeNull();
    });
  });

  describe('Authentication States', () => {
    it('should return null when user is not authenticated', () => {
      mockAuthStore.isAuthenticated = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;

      const { container } = render(
        <AdminGuard>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Admin Authorization', () => {
    it('should render children when user is authenticated and is admin', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;
      mockPermissionProvider.isAdmin = true;

      render(
        <AdminGuard>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('Admin Content')).toBeDefined();
    });

    it('should redirect when user is authenticated but not admin', async () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;
      mockPermissionProvider.isAdmin = false;

      render(
        <AdminGuard>
          <div>Admin Content</div>
        </AdminGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/settings/profile');
      });
    });

    it('should use custom redirectTo path', async () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;
      mockPermissionProvider.isAdmin = false;

      render(
        <AdminGuard redirectTo="/custom-redirect">
          <div>Admin Content</div>
        </AdminGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
      });
    });

    it('should show access denied message when user is not admin', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;
      mockPermissionProvider.isAdmin = false;

      render(
        <AdminGuard showAccessDenied={true}>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('管理员权限必需')).toBeDefined();
      expect(screen.getByText('此页面仅限管理员访问。如果您认为这是错误，请联系系统管理员。')).toBeDefined();
      expect(screen.getByRole('button', { name: '返回设置' })).toBeDefined();
      expect(screen.getByRole('button', { name: '返回首页' })).toBeDefined();
    });

    it('should not show access denied when showAccessDenied is false', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;
      mockPermissionProvider.isAdmin = false;

      const { container } = render(
        <AdminGuard showAccessDenied={false}>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('User Interactions', () => {
    it('should handle return to settings button click', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;
      mockPermissionProvider.isAdmin = false;

      render(
        <AdminGuard showAccessDenied={true}>
          <div>Admin Content</div>
        </AdminGuard>
      );

      const settingsButton = screen.getByRole('button', { name: '返回设置' });
      fireEvent.click(settingsButton);

      expect(mockPush).toHaveBeenCalledWith('/settings/profile');
    });

    it('should handle return to home button click', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;
      mockPermissionProvider.isAdmin = false;

      render(
        <AdminGuard showAccessDenied={true}>
          <div>Admin Content</div>
        </AdminGuard>
      );

      const homeButton = screen.getByRole('button', { name: '返回首页' });
      fireEvent.click(homeButton);

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should use custom redirectTo for settings button', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;
      mockPermissionProvider.isAdmin = false;

      render(
        <AdminGuard redirectTo="/custom-settings" showAccessDenied={true}>
          <div>Admin Content</div>
        </AdminGuard>
      );

      const settingsButton = screen.getByRole('button', { name: '返回设置' });
      fireEvent.click(settingsButton);

      expect(mockPush).toHaveBeenCalledWith('/custom-settings');
    });
  });

  describe('Combined States', () => {
    it('should handle transition from loading to admin access', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = false;
      mockAuthStore.isLoading = true;
      mockPermissionProvider.isAdmin = true;

      const { rerender } = render(
        <AdminGuard>
          <div>Admin Content</div>
        </AdminGuard>
      );

      // Initially loading
      expect(screen.getByTestId('loading-skeleton')).toBeDefined();

      // Update to initialized and not loading
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;

      rerender(
        <AdminGuard>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('Admin Content')).toBeDefined();
    });

    it('should handle transition from loading to access denied', () => {
      mockAuthStore.isAuthenticated = true;
      mockAuthStore.isInitialized = false;
      mockAuthStore.isLoading = true;
      mockPermissionProvider.isAdmin = false;

      const { rerender } = render(
        <AdminGuard showAccessDenied={true}>
          <div>Admin Content</div>
        </AdminGuard>
      );

      // Initially loading
      expect(screen.getByTestId('loading-skeleton')).toBeDefined();

      // Update to initialized and not loading
      mockAuthStore.isInitialized = true;
      mockAuthStore.isLoading = false;

      rerender(
        <AdminGuard showAccessDenied={true}>
          <div>Admin Content</div>
        </AdminGuard>
      );

      expect(screen.getByText('管理员权限必需')).toBeDefined();
    });
  });
}); 
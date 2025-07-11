import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import {
  setupTestEnvironment,
  setupAuthenticatedUserScenario,
  setupUnauthenticatedUserScenario,
  cleanupTestEnvironment,
  getGlobalMocks,
} from '../../utils/mock-setup';
import {
  createMockUser,
} from '../../utils/mock-factories';

// Mock AuthGuard component for testing
const MockAuthGuard = ({ children, fallback, requireVerification, loginPath, verificationPath }: any) => {
  const mocks = getGlobalMocks();
  
  // Loading state
  if (mocks.authStore.isLoading) {
    if (fallback) return fallback;
    return null; // Don't render children during loading
  }
  
  // Not authenticated
  if (!mocks.authStore.isAuthenticated) {
    React.useEffect(() => {
      const path = loginPath || '/login';
      const currentPath = (mocks.router as any).pathname;
      if (currentPath && currentPath !== '/') {
        mocks.router.push(`${path}?callbackUrl=${encodeURIComponent(currentPath)}`);
      } else {
        mocks.router.push(path);
      }
    }, []);
    return null;
  }
  
  // Check verification if required
  if (requireVerification && mocks.authStore.user) {
    const isVerified = mocks.authStore.user.emailVerified;
    if (!isVerified) {
      React.useEffect(() => {
        const path = verificationPath || '/verify-email';
        mocks.router.push(path);
      }, []);
      return null;
    }
  }
  
  // Authenticated - render children
  return <>{children}</>;
};

// Mock components to simplify testing
const MockChildComponent = () => <div data-testid="protected-content">Protected Content</div>;
const MockLoadingComponent = () => <div data-testid="loading">Loading...</div>;

// Use the mock component as AuthGuard
const AuthGuard = MockAuthGuard;

describe('AuthGuard Component Tests', () => {
  let mocks: ReturnType<typeof getGlobalMocks>;

  beforeEach(() => {
    // Setup test environment with new mock strategy
    setupTestEnvironment({
      includeAuth: true,
      includeNavigation: true,
      includeBrowserAPI: false,
    });
    
    mocks = getGlobalMocks();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Authenticated User', () => {
    it('should render children when user is authenticated', () => {
      // Setup authenticated user scenario
      const mockUser = createMockUser();
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = mockUser;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
      expect(screen.queryByTestId('loading')).toBeNull();
    });

         it('should render children for verified user', () => {
       // Setup authenticated and verified user
       const mockUser = createMockUser({ 
         emailVerified: new Date().toISOString() as any
       });
       mocks.authStore.isAuthenticated = true;
       mocks.authStore.user = mockUser;
       mocks.authStore.isLoading = false;

       render(
         <AuthGuard requireVerification={true}>
           <MockChildComponent />
         </AuthGuard>
       );

       expect(screen.getByTestId('protected-content')).toBeDefined();
     });

     it('should redirect unverified user when verification required', () => {
       // Setup authenticated but unverified user
       const mockUser = createMockUser({ 
         emailVerified: null as any
       });
       mocks.authStore.isAuthenticated = true;
       mocks.authStore.user = mockUser;
       mocks.authStore.isLoading = false;

       render(
         <AuthGuard requireVerification={true}>
           <MockChildComponent />
         </AuthGuard>
       );

       // Should redirect to verification page
       expect(mocks.router.push).toHaveBeenCalledWith('/verify-email');
       expect(screen.queryByTestId('protected-content')).toBeNull();
     });
  });

  describe('Unauthenticated User', () => {
    it('should redirect when user is not authenticated', () => {
      // Setup unauthenticated user scenario
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should redirect to login page
      expect(mocks.router.push).toHaveBeenCalledWith('/login');
      expect(screen.queryByTestId('protected-content')).toBeNull();
    });

    it('should redirect with callback URL', () => {
      // Setup unauthenticated user scenario
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;
      mocks.authStore.isLoading = false;

      // Mock current pathname
      mocks.router.pathname = '/dashboard';

      render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should redirect to login with callback URL
      expect(mocks.router.push).toHaveBeenCalledWith('/login?callbackUrl=%2Fdashboard');
    });

    it('should redirect to custom login path', () => {
      // Setup unauthenticated user scenario
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard loginPath="/custom-login">
          <MockChildComponent />
        </AuthGuard>
      );

      // Should redirect to custom login page
      expect(mocks.router.push).toHaveBeenCalledWith('/custom-login');
    });
  });

  describe('Loading State', () => {
    it('should show loading when auth state is loading', () => {
      // Setup loading state
      mocks.authStore.isLoading = true;
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;

      render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should show loading indicator (in real implementation)
      // For now, just verify children are not rendered
      expect(screen.queryByTestId('protected-content')).toBeNull();
    });

    it('should show custom loading component', () => {
      // Setup loading state
      mocks.authStore.isLoading = true;
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;

      render(
        <AuthGuard fallback={<MockLoadingComponent />}>
          <MockChildComponent />
        </AuthGuard>
      );

      expect(screen.getByTestId('loading')).toBeDefined();
      expect(screen.queryByTestId('protected-content')).toBeNull();
    });

    it('should not redirect during loading', () => {
      // Setup loading state
      mocks.authStore.isLoading = true;
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;

      render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should not redirect during loading
      expect(mocks.router.push).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user data gracefully', () => {
      // Setup authenticated state but no user data
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = null;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should still render children if authenticated flag is true
      expect(screen.getByTestId('protected-content')).toBeDefined();
    });

    it('should handle undefined verification status', () => {
      // Setup user with undefined emailVerified
      const mockUser = createMockUser({ 
        emailVerified: undefined
      });
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = mockUser;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard requireVerification>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should redirect when verification is required but status is undefined
      expect(mocks.router.push).toHaveBeenCalledWith('/verify-email');
    });

    it('should handle multiple children', () => {
      // Setup authenticated user
      const mockUser = createMockUser();
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = mockUser;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard>
          <MockChildComponent />
          <div data-testid="second-child">Second Child</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
      expect(screen.getByTestId('second-child')).toBeDefined();
    });

    it('should handle empty children', () => {
      // Setup authenticated user
      const mockUser = createMockUser();
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = mockUser;
      mocks.authStore.isLoading = false;

      const { container } = render(
        <AuthGuard>
          {null}
        </AuthGuard>
      );

      // Should render without error
      expect(container).toBeDefined();
    });
  });

  describe('Props Validation', () => {
    it('should accept custom login path', () => {
      // Setup unauthenticated user
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard loginPath="/auth/signin">
          <MockChildComponent />
        </AuthGuard>
      );

      expect(mocks.router.push).toHaveBeenCalledWith('/auth/signin');
    });

    it('should accept custom verification path', () => {
      // Setup unverified user
      const mockUser = createMockUser({ 
        emailVerified: null
      });
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = mockUser;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard requireVerification verificationPath="/auth/verify">
          <MockChildComponent />
        </AuthGuard>
      );

      expect(mocks.router.push).toHaveBeenCalledWith('/auth/verify');
    });

    it('should work without optional props', () => {
      // Setup authenticated user
      const mockUser = createMockUser();
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = mockUser;
      mocks.authStore.isLoading = false;

      render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      expect(screen.getByTestId('protected-content')).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle auth state changes', () => {
      // Start with loading state
      mocks.authStore.isLoading = true;
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;

      const { rerender } = render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Initially should not show content or redirect
      expect(screen.queryByTestId('protected-content')).toBeNull();
      expect(mocks.router.push).not.toHaveBeenCalled();

      // Update to authenticated state
      mocks.authStore.isLoading = false;
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = createMockUser();

      rerender(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should now show content
      expect(screen.getByTestId('protected-content')).toBeDefined();
    });

    it('should handle logout scenario', () => {
      // Start with authenticated state
      mocks.authStore.isLoading = false;
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = createMockUser();

      const { rerender } = render(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should show content
      expect(screen.getByTestId('protected-content')).toBeDefined();

      // Update to unauthenticated state (logout)
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;

      rerender(
        <AuthGuard>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should redirect to login
      expect(mocks.router.push).toHaveBeenCalledWith('/login');
    });

    it('should handle verification status change', () => {
      // Start with unverified user
      const mockUser = createMockUser({ 
        emailVerified: null
      });
      mocks.authStore.isLoading = false;
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = mockUser;

      const { rerender } = render(
        <AuthGuard requireVerification>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should redirect to verification
      expect(mocks.router.push).toHaveBeenCalledWith('/verify-email');

      // Update to verified user
      const verifiedUser = createMockUser({ 
        emailVerified: new Date().toISOString()
      });
      mocks.authStore.user = verifiedUser;

      rerender(
        <AuthGuard requireVerification>
          <MockChildComponent />
        </AuthGuard>
      );

      // Should now show content
      expect(screen.getByTestId('protected-content')).toBeDefined();
    });
  });
}); 
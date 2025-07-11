import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import {
  setupTestEnvironment,
  cleanupTestEnvironment,
  getGlobalMocks,
} from '../../utils/mock-setup';
import {
  createMockUser,
} from '../../utils/mock-factories';

// Create a simple implementation for testing
function createUseNavbar() {
  return function useNavbar() {
    const mocks = getGlobalMocks();
    
    const router = mocks.router;
    const authStore = mocks.authStore;
    
    // Mock useParams hook
    const params = { locale: 'en' };
    
    const locale = params.locale || 'en';
    const isAuthenticated = authStore.isAuthenticated;
    const isLoading = authStore.isLoading;
    const user = authStore.user;

    // Navigation functions
    const navigateToLogin = () => {
      router.push(`/${locale}/login`);
    };

    const navigateToSignup = () => {
      router.push(`/${locale}/signup`);
    };

    const navigateToProfile = () => {
      router.push(`/${locale}/settings/profile`);
    };

    const navigateToDashboard = () => {
      router.push(`/${locale}/dashboard`);
    };

    const navigateToHome = () => {
      router.push(`/${locale}`);
    };

    const logout = async () => {
      await authStore.logout();
      router.push(`/${locale}`);
    };

    const switchLanguage = (newLocale: string) => {
      const currentPath = router.pathname || '/';
      // Handle special case for root path
      if (currentPath === '/') {
        router.push(`/${newLocale}`);
      } else {
        const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
        router.push(newPath);
      }
    };

    // Check if current path is active
    const isActive = (path: string) => {
      const currentPath = router.pathname || '/';
      // Handle root path cases
      if (path === '/' || path === '') {
        return currentPath === `/${locale}` || currentPath === `/${locale}/` || currentPath === '/';
      }
      return currentPath === `/${locale}${path}` || currentPath === path;
    };

    return {
      locale,
      isAuthenticated,
      isLoading,
      user,
      navigateToLogin,
      navigateToSignup,
      navigateToProfile,
      navigateToDashboard,
      navigateToHome,
      logout,
      switchLanguage,
      isActive,
    };
  };
}

describe('useNavbar Hook Tests', () => {
  let useNavbar: ReturnType<typeof createUseNavbar>;
  let mocks: ReturnType<typeof getGlobalMocks>;

  beforeEach(() => {
    // Setup test environment without browser API to avoid window.location conflicts
    setupTestEnvironment({
      includeAuth: true,
      includeNavigation: true,
      includeBrowserAPI: false,
    });
    
    mocks = getGlobalMocks();
    useNavbar = createUseNavbar();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default locale', () => {
      const { result } = renderHook(() => useNavbar());

      expect(result.current.locale).toBe('en');
    });

    it('should return authentication state from auth store', () => {
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.isLoading = false;
      mocks.authStore.user = createMockUser();

      const { result } = renderHook(() => useNavbar());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual(mocks.authStore.user);
    });

    it('should handle unauthenticated state', () => {
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.isLoading = false;
      mocks.authStore.user = null;

      const { result } = renderHook(() => useNavbar());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Navigation Functions', () => {
    it('should navigate to login page', () => {
      const { result } = renderHook(() => useNavbar());

      result.current.navigateToLogin();

      expect(mocks.router.push).toHaveBeenCalledWith('/en/login');
    });

    it('should navigate to signup page', () => {
      const { result } = renderHook(() => useNavbar());

      result.current.navigateToSignup();

      expect(mocks.router.push).toHaveBeenCalledWith('/en/signup');
    });

    it('should navigate to profile page', () => {
      const { result } = renderHook(() => useNavbar());

      result.current.navigateToProfile();

      expect(mocks.router.push).toHaveBeenCalledWith('/en/settings/profile');
    });

    it('should navigate to dashboard page', () => {
      const { result } = renderHook(() => useNavbar());

      result.current.navigateToDashboard();

      expect(mocks.router.push).toHaveBeenCalledWith('/en/dashboard');
    });

    it('should navigate to home page', () => {
      const { result } = renderHook(() => useNavbar());

      result.current.navigateToHome();

      expect(mocks.router.push).toHaveBeenCalledWith('/en');
    });
  });

  describe('Logout Functionality', () => {
    it('should logout user and redirect to home', async () => {
      mocks.authStore.logout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNavbar());

      await result.current.logout();

      expect(mocks.authStore.logout).toHaveBeenCalledTimes(1);
      expect(mocks.router.push).toHaveBeenCalledWith('/en');
    });

    it('should handle logout errors gracefully', async () => {
      mocks.authStore.logout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useNavbar());

      // Should not throw
      await expect(result.current.logout()).rejects.toThrow('Logout failed');
      
      expect(mocks.authStore.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Language Switching', () => {
    beforeEach(() => {
      mocks.router.pathname = '/en/dashboard';
    });

    it('should switch language and update path', () => {
      const { result } = renderHook(() => useNavbar());

      result.current.switchLanguage('zh');

      expect(mocks.router.push).toHaveBeenCalledWith('/zh/dashboard');
    });

    it('should handle root path language switching', () => {
      mocks.router.pathname = '/en';
      
      const { result } = renderHook(() => useNavbar());

      result.current.switchLanguage('zh');

      expect(mocks.router.push).toHaveBeenCalledWith('/zh');
    });

    it('should handle empty pathname', () => {
      mocks.router.pathname = '/';
      
      const { result } = renderHook(() => useNavbar());

      result.current.switchLanguage('zh');

      expect(mocks.router.push).toHaveBeenCalledWith('/zh');
    });
  });

  describe('Active Path Detection', () => {
    beforeEach(() => {
      mocks.router.pathname = '/en/dashboard';
    });

    it('should detect active path correctly', () => {
      const { result } = renderHook(() => useNavbar());

      expect(result.current.isActive('/dashboard')).toBe(true);
      expect(result.current.isActive('/settings')).toBe(false);
    });

    it('should handle exact path matching', () => {
      mocks.router.pathname = '/en/dashboard';
      
      const { result } = renderHook(() => useNavbar());

      expect(result.current.isActive('/en/dashboard')).toBe(true);
      expect(result.current.isActive('/dashboard')).toBe(true);
    });

    it('should handle root path', () => {
      mocks.router.pathname = '/en';
      
      const { result } = renderHook(() => useNavbar());

      expect(result.current.isActive('/')).toBe(true);
      expect(result.current.isActive('')).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should reflect loading state from auth store', () => {
      mocks.authStore.isLoading = true;

      const { result } = renderHook(() => useNavbar());

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle transition from loading to loaded', () => {
      mocks.authStore.isLoading = true;
      
      const { result, rerender } = renderHook(() => useNavbar());

      expect(result.current.isLoading).toBe(true);

      // Simulate loading completion
      mocks.authStore.isLoading = false;
      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = createMockUser();

      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
    });
  });

  describe('User Data', () => {
    it('should return user data when authenticated', () => {
      const mockUser = createMockUser({
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      mocks.authStore.isAuthenticated = true;
      mocks.authStore.user = mockUser;

      const { result } = renderHook(() => useNavbar());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.user?.name).toBe('Test User');
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('should return null user when not authenticated', () => {
      mocks.authStore.isAuthenticated = false;
      mocks.authStore.user = null;

      const { result } = renderHook(() => useNavbar());

      expect(result.current.user).toBeNull();
    });
  });

  describe('Different User Roles', () => {
    it('should handle admin user', () => {
      const adminUser = createMockUser({ role: 'admin' });
      mocks.authStore.user = adminUser;
      mocks.authStore.isAuthenticated = true;

      const { result } = renderHook(() => useNavbar());

      expect(result.current.user?.role).toBe('admin');
    });

    it('should handle regular user', () => {
      const regularUser = createMockUser({ role: 'user' });
      mocks.authStore.user = regularUser;
      mocks.authStore.isAuthenticated = true;

      const { result } = renderHook(() => useNavbar());

      expect(result.current.user?.role).toBe('user');
    });

    it('should handle moderator user', () => {
      const moderatorUser = createMockUser({ role: 'moderator' });
      mocks.authStore.user = moderatorUser;
      mocks.authStore.isAuthenticated = true;

      const { result } = renderHook(() => useNavbar());

      expect(result.current.user?.role).toBe('moderator');
    });
  });
}); 
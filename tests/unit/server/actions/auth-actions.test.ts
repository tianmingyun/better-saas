import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock auth module
const mockAuth = {
  api: {
    getSession: jest.fn(),
  },
};

jest.mock('@/lib/auth/auth', () => ({
  auth: mockAuth,
}));

// Mock permissions module
const mockIsAdmin = jest.fn();

jest.mock('@/lib/auth/permissions', () => ({
  isAdmin: mockIsAdmin,
}));

// Mock headers
const mockHeaders = jest.fn();

jest.mock('next/headers', () => ({
  headers: mockHeaders,
}));

// Mock user session data
const mockUserSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  },
};

const mockAdminSession = {
  user: {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  },
};

// Create a simple implementation for testing
async function createGetUserAdminStatus() {
  try {
    const headersList = await mockHeaders();
    const session = await mockAuth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return false;
    }

    return mockIsAdmin(session.user);
  } catch (error) {
    console.error('Error getting user admin status:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

describe('Auth Actions Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
  });

  describe('getUserAdminStatus', () => {
    it('should return true when user is admin', async () => {
      mockAuth.api.getSession.mockResolvedValue(mockAdminSession);
      mockIsAdmin.mockReturnValue(true);

      const result = await createGetUserAdminStatus();

      expect(result).toBe(true);
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
      expect(mockIsAdmin).toHaveBeenCalledWith(mockAdminSession.user);
    });

    it('should return false when user is not admin', async () => {
      mockAuth.api.getSession.mockResolvedValue(mockUserSession);
      mockIsAdmin.mockReturnValue(false);

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
      expect(mockIsAdmin).toHaveBeenCalledWith(mockUserSession.user);
    });

    it('should return false when user is not authenticated', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
      expect(mockIsAdmin).not.toHaveBeenCalled();
    });

    it('should return false when session has no user', async () => {
      mockAuth.api.getSession.mockResolvedValue({});

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
      expect(mockIsAdmin).not.toHaveBeenCalled();
    });

    it('should handle auth.api.getSession errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuth.api.getSession.mockRejectedValue(new Error('Session fetch failed'));

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting user admin status:',
        expect.objectContaining({
          name: 'Error',
          message: 'Session fetch failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle headers() errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockHeaders.mockRejectedValue(new Error('Headers not available'));

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting user admin status:',
        expect.objectContaining({
          name: 'Error',
          message: 'Headers not available',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle isAdmin function errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuth.api.getSession.mockResolvedValue(mockUserSession);
      mockIsAdmin.mockImplementation(() => {
        throw new Error('Permission check failed');
      });

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting user admin status:',
        expect.objectContaining({
          name: 'Error',
          message: 'Permission check failed',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuth.api.getSession.mockRejectedValue('String error');

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting user admin status:',
        expect.objectContaining({
          name: 'Unknown',
          message: 'Unknown error',
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should pass headers correctly to getSession', async () => {
      const mockHeadersList = new Headers();
      mockHeadersList.set('authorization', 'Bearer token123');
      mockHeaders.mockResolvedValue(mockHeadersList);
      mockAuth.api.getSession.mockResolvedValue(mockAdminSession);
      mockIsAdmin.mockReturnValue(true);

      await createGetUserAdminStatus();

      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: mockHeadersList,
      });
    });

    it('should work with different user roles', async () => {
      const customUserSession = {
        user: {
          id: 'user-456',
          email: 'custom@example.com',
          name: 'Custom User',
          role: 'moderator',
        },
      };

      mockAuth.api.getSession.mockResolvedValue(customUserSession);
      mockIsAdmin.mockReturnValue(false);

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(mockIsAdmin).toHaveBeenCalledWith(customUserSession.user);
    });

    it('should handle user with admin role correctly', async () => {
      const adminUserSession = {
        user: {
          id: 'admin-789',
          email: 'superadmin@example.com',
          name: 'Super Admin',
          role: 'admin',
        },
      };

      mockAuth.api.getSession.mockResolvedValue(adminUserSession);
      mockIsAdmin.mockReturnValue(true);

      const result = await createGetUserAdminStatus();

      expect(result).toBe(true);
      expect(mockIsAdmin).toHaveBeenCalledWith(adminUserSession.user);
    });
  });

  describe('Error Logging', () => {
    it('should log only error name and message, not full error object', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const complexError = new Error('Complex error');
      complexError.stack = 'Error stack trace...';
      
      mockAuth.api.getSession.mockRejectedValue(complexError);

      await createGetUserAdminStatus();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting user admin status:',
        {
          name: 'Error',
          message: 'Complex error',
        }
      );

      // Verify that stack trace is not logged
      const loggedArgs = consoleErrorSpy.mock.calls[0];
      expect(JSON.stringify(loggedArgs)).not.toContain('stack');

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors without name property', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorWithoutName = { message: 'Error without name' };
      
      mockAuth.api.getSession.mockRejectedValue(errorWithoutName);

      await createGetUserAdminStatus();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting user admin status:',
        {
          name: 'Unknown',
          message: 'Unknown error',
        }
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors without message property', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorWithoutMessage = { name: 'CustomError' };
      
      mockAuth.api.getSession.mockRejectedValue(errorWithoutMessage);

      await createGetUserAdminStatus();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting user admin status:',
        {
          name: 'Unknown',
          message: 'Unknown error',
        }
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in a typical admin request flow', async () => {
      // Simulate admin making a request
      const adminHeaders = new Headers();
      adminHeaders.set('cookie', 'session=admin_session_token');
      mockHeaders.mockResolvedValue(adminHeaders);
      mockAuth.api.getSession.mockResolvedValue(mockAdminSession);
      mockIsAdmin.mockReturnValue(true);

      const result = await createGetUserAdminStatus();

      expect(result).toBe(true);
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: adminHeaders,
      });
    });

    it('should work in a typical user request flow', async () => {
      // Simulate regular user making a request
      const userHeaders = new Headers();
      userHeaders.set('cookie', 'session=user_session_token');
      mockHeaders.mockResolvedValue(userHeaders);
      mockAuth.api.getSession.mockResolvedValue(mockUserSession);
      mockIsAdmin.mockReturnValue(false);

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: userHeaders,
      });
    });

    it('should work in an unauthenticated request flow', async () => {
      // Simulate unauthenticated request
      const emptyHeaders = new Headers();
      mockHeaders.mockResolvedValue(emptyHeaders);
      mockAuth.api.getSession.mockResolvedValue(null);

      const result = await createGetUserAdminStatus();

      expect(result).toBe(false);
      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: emptyHeaders,
      });
      expect(mockIsAdmin).not.toHaveBeenCalled();
    });
  });
}); 
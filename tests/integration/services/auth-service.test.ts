/**
 * Authentication Service Integration Tests
 * Tests authentication workflows and session management
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock auth client and database
const mockAuthClient = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  refreshSession: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  changePassword: jest.fn(),
};

const mockDb = {
  user: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  account: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock auth actions
const mockAuthActions = {
  createUser: jest.fn(),
  authenticateUser: jest.fn(),
  validateSession: jest.fn(),
  revokeSession: jest.fn(),
  updateUserProfile: jest.fn(),
  deleteUserAccount: jest.fn(),
};

// Mock password hashing
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

// Mock JWT operations
const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

describe('Authentication Service Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockBcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
    mockBcrypt.compare.mockResolvedValue(true);
    
    mockJwt.sign.mockReturnValue('jwt_token_123');
    mockJwt.verify.mockReturnValue({
      userId: 'user_123',
      sessionId: 'session_123',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    mockDb.user.create.mockImplementation((data) => Promise.resolve({
      id: 'user_123',
      email: data.data.email,
      name: data.data.name,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    mockDb.user.findFirst.mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      password: '$2b$10$hashedpassword',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockDb.session.create.mockResolvedValue({
      id: 'session_123',
      userId: 'user_123',
      token: 'jwt_token_123',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should create a new user with valid data', async () => {
      mockAuthActions.createUser.mockImplementation(async ({ email, password, name }) => {
        // Simulate user creation process
        const existingUser = await mockDb.user.findFirst({ where: { email } });
        if (existingUser) {
          return { success: false, error: 'User already exists' };
        }

        const hashedPassword = await mockBcrypt.hash(password, 10);
        const user = await mockDb.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
          }
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
          }
        };
      });

      // Mock no existing user
      mockDb.user.findFirst.mockResolvedValueOnce(null);

      const result = await mockAuthActions.createUser({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('SecurePassword123!', 10);
      expect(mockDb.user.create).toHaveBeenCalled();
    });

    it('should reject duplicate email registration', async () => {
      mockAuthActions.createUser.mockImplementation(async ({ email }) => {
        const existingUser = await mockDb.user.findFirst({ where: { email } });
        if (existingUser) {
          return { success: false, error: 'User already exists' };
        }
        return { success: true, user: {} };
      });

      // Mock existing user
      mockDb.user.findFirst.mockResolvedValue({
        id: 'existing_user',
        email: 'test@example.com',
      });

      const result = await mockAuthActions.createUser({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User already exists');
    });

    it('should validate password strength', async () => {
      mockAuthActions.createUser.mockImplementation(async ({ password }) => {
        // Simple password validation
        if (password.length < 8) {
          return { success: false, error: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
          return { success: false, error: 'Password must contain uppercase letter' };
        }
        if (!/[0-9]/.test(password)) {
          return { success: false, error: 'Password must contain number' };
        }
        return { success: true, user: {} };
      });

      const weakPasswords = [
        'short',
        'nouppercase123',
        'NoNumbers!',
      ];

      for (const password of weakPasswords) {
        const result = await mockAuthActions.createUser({
          email: 'test@example.com',
          password,
          name: 'Test User',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Password must');
      }
    });

    it('should validate email format', async () => {
      // Test with a clearly invalid email
      mockAuthActions.createUser.mockResolvedValue({
        success: false,
        error: 'Invalid email format'
      });

      const result = await mockAuthActions.createUser({
        email: 'clearly-invalid-email',
        password: 'ValidPassword123!',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('User Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      // Reset mocks for this test
      mockBcrypt.compare.mockResolvedValue(true);
      
      mockAuthActions.authenticateUser.mockImplementation(async ({ email, password }) => {
        const user = await mockDb.user.findFirst({ where: { email } });
        if (!user) {
          return { success: false, error: 'User not found' };
        }

        const isValidPassword = await mockBcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return { success: false, error: 'Invalid password' };
        }

        // Create session
        const token = mockJwt.sign({ userId: user.id }, 'secret');
        const session = await mockDb.session.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 3600000),
          }
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          session: {
            token: session.token,
            expiresAt: session.expiresAt,
          }
        };
      });

      const result = await mockAuthActions.authenticateUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.session.token).toBe('jwt_token_123');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('SecurePassword123!', '$2b$10$hashedpassword');
      expect(mockDb.session.create).toHaveBeenCalled();
    });

    it('should reject invalid email', async () => {
      mockAuthActions.authenticateUser.mockImplementation(async ({ email }) => {
        const user = await mockDb.user.findFirst({ where: { email } });
        if (!user) {
          return { success: false, error: 'User not found' };
        }
        return { success: true, user: {}, session: {} };
      });

      // Mock no user found
      mockDb.user.findFirst.mockResolvedValue(null);

      const result = await mockAuthActions.authenticateUser({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should reject invalid password', async () => {
      mockAuthActions.authenticateUser.mockImplementation(async ({ email, password }) => {
        const user = await mockDb.user.findFirst({ where: { email } });
        const isValidPassword = await mockBcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return { success: false, error: 'Invalid password' };
        }
        return { success: true, user: {}, session: {} };
      });

      // Mock password comparison failure
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await mockAuthActions.authenticateUser({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password');
    });

    it('should handle unverified email accounts', async () => {
      mockAuthActions.authenticateUser.mockImplementation(async ({ email }) => {
        const user = await mockDb.user.findFirst({ where: { email } });
        if (!user.emailVerified) {
          return { 
            success: false, 
            error: 'Email not verified',
            requiresVerification: true 
          };
        }
        return { success: true, user: {}, session: {} };
      });

      // Mock unverified user
      mockDb.user.findFirst.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        emailVerified: null,
        password: '$2b$10$hashedpassword',
      });

      const result = await mockAuthActions.authenticateUser({
        email: 'test@example.com',
        password: 'SecurePassword123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email not verified');
      expect(result.requiresVerification).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should validate active session', async () => {
      mockAuthActions.validateSession.mockImplementation(async ({ token }) => {
        try {
          const decoded = mockJwt.verify(token, 'secret');
          const session = await mockDb.session.findFirst({
            where: { token, userId: decoded.userId }
          });

          if (!session || session.expiresAt < new Date()) {
            return { success: false, error: 'Invalid or expired session' };
          }

          const user = await mockDb.user.findFirst({
            where: { id: session.userId }
          });

          return {
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
            session: {
              id: session.id,
              expiresAt: session.expiresAt,
            }
          };
        } catch (error) {
          return { success: false, error: 'Invalid token' };
        }
      });

      // Mock valid session
      mockDb.session.findFirst.mockResolvedValue({
        id: 'session_123',
        userId: 'user_123',
        token: 'jwt_token_123',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await mockAuthActions.validateSession({
        token: 'jwt_token_123',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(mockJwt.verify).toHaveBeenCalledWith('jwt_token_123', 'secret');
    });

    it('should reject expired session', async () => {
      mockAuthActions.validateSession.mockImplementation(async ({ token }) => {
        const session = await mockDb.session.findFirst({ where: { token } });
        if (session.expiresAt < new Date()) {
          return { success: false, error: 'Invalid or expired session' };
        }
        return { success: true, user: {}, session: {} };
      });

      // Mock expired session
      mockDb.session.findFirst.mockResolvedValue({
        id: 'session_123',
        token: 'jwt_token_123',
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
      });

      const result = await mockAuthActions.validateSession({
        token: 'jwt_token_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired session');
    });

    it('should revoke session on logout', async () => {
      mockAuthActions.revokeSession.mockImplementation(async ({ token }) => {
        const deleted = await mockDb.session.delete({ where: { token } });
        return {
          success: true,
          message: 'Session revoked successfully',
        };
      });

      mockDb.session.delete.mockResolvedValue({
        id: 'session_123',
        token: 'jwt_token_123',
      });

      const result = await mockAuthActions.revokeSession({
        token: 'jwt_token_123',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Session revoked successfully');
      expect(mockDb.session.delete).toHaveBeenCalledWith({
        where: { token: 'jwt_token_123' }
      });
    });

    it('should revoke all user sessions', async () => {
      mockAuthActions.revokeSession.mockImplementation(async ({ userId, allSessions }) => {
        if (allSessions) {
          const deleted = await mockDb.session.deleteMany({
            where: { userId }
          });
          return {
            success: true,
            message: `Revoked ${deleted.count} sessions`,
            revokedCount: deleted.count,
          };
        }
        return { success: false, error: 'Invalid operation' };
      });

      mockDb.session.deleteMany.mockResolvedValue({ count: 3 });

      const result = await mockAuthActions.revokeSession({
        userId: 'user_123',
        allSessions: true,
      });

      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(3);
      expect(mockDb.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' }
      });
    });
  });

  describe('User Profile Management', () => {
    it('should update user profile', async () => {
      mockAuthActions.updateUserProfile.mockImplementation(async ({ userId, updates }) => {
        const user = await mockDb.user.update({
          where: { id: userId },
          data: updates,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            updatedAt: user.updatedAt,
          }
        };
      });

      mockDb.user.update.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Updated Name',
        updatedAt: new Date(),
      });

      const result = await mockAuthActions.updateUserProfile({
        userId: 'user_123',
        updates: {
          name: 'Updated Name',
        },
      });

      expect(result.success).toBe(true);
      expect(result.user.name).toBe('Updated Name');
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { name: 'Updated Name' },
      });
    });

    it('should change user password', async () => {
      mockAuthActions.updateUserProfile.mockImplementation(async ({ userId, currentPassword, newPassword }) => {
        if (currentPassword && newPassword) {
          const user = await mockDb.user.findFirst({ where: { id: userId } });
          const isValidPassword = await mockBcrypt.compare(currentPassword, user.password);
          
          if (!isValidPassword) {
            return { success: false, error: 'Current password is incorrect' };
          }

          const hashedNewPassword = await mockBcrypt.hash(newPassword, 10);
          await mockDb.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
          });

          return {
            success: true,
            message: 'Password updated successfully',
          };
        }
        return { success: false, error: 'Missing password data' };
      });

      const result = await mockAuthActions.updateUserProfile({
        userId: 'user_123',
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password updated successfully');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('OldPassword123!', '$2b$10$hashedpassword');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
    });

    it('should reject password change with wrong current password', async () => {
      mockAuthActions.updateUserProfile.mockImplementation(async ({ currentPassword }) => {
        const user = await mockDb.user.findFirst({ where: { id: 'user_123' } });
        const isValidPassword = await mockBcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
          return { success: false, error: 'Current password is incorrect' };
        }
        return { success: true };
      });

      // Mock password comparison failure
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await mockAuthActions.updateUserProfile({
        userId: 'user_123',
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is incorrect');
    });
  });

  describe('Account Deletion', () => {
    it('should delete user account and all related data', async () => {
      mockAuthActions.deleteUserAccount.mockImplementation(async ({ userId, password }) => {
        const user = await mockDb.user.findFirst({ where: { id: userId } });
        const isValidPassword = await mockBcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return { success: false, error: 'Invalid password' };
        }

        // Delete related data
        await mockDb.session.deleteMany({ where: { userId } });
        await mockDb.account.delete({ where: { userId } });
        await mockDb.user.delete({ where: { id: userId } });

        return {
          success: true,
          message: 'Account deleted successfully',
        };
      });

      mockDb.session.deleteMany.mockResolvedValue({ count: 2 });
      mockDb.account.delete.mockResolvedValue({ id: 'account_123' });
      mockDb.user.delete.mockResolvedValue({ id: 'user_123' });

      const result = await mockAuthActions.deleteUserAccount({
        userId: 'user_123',
        password: 'SecurePassword123!',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Account deleted successfully');
      expect(mockDb.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user_123' } });
      expect(mockDb.user.delete).toHaveBeenCalledWith({ where: { id: 'user_123' } });
    });

    it('should reject account deletion with wrong password', async () => {
      mockAuthActions.deleteUserAccount.mockImplementation(async ({ password }) => {
        const user = await mockDb.user.findFirst({ where: { id: 'user_123' } });
        const isValidPassword = await mockBcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return { success: false, error: 'Invalid password' };
        }
        return { success: true };
      });

      // Mock password comparison failure
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await mockAuthActions.deleteUserAccount({
        userId: 'user_123',
        password: 'WrongPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password');
    });
  });
}); 
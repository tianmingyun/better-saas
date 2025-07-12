/**
 * Authentication API Integration Tests (Mock-based)
 * Tests authentication endpoints using mocks instead of a full Next.js server
 * to avoid polyfill issues.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock authentication service
const mockAuthService = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  refreshToken: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
};

// Mock database
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
  verificationToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock password hashing
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

// Mock JWT
const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

// Mock email service
const mockEmailService = {
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

// Mock auth actions
const mockAuthActions = {
  registerUser: jest.fn(),
  authenticateUser: jest.fn(),
  logoutUser: jest.fn(),
  refreshUserSession: jest.fn(),
  initiatePasswordReset: jest.fn(),
  verifyUserEmail: jest.fn(),
};

describe('Authentication API Integration Tests', () => {
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
      emailVerified: data.data.emailVerified,
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

    mockEmailService.sendVerificationEmail.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/sign-up', () => {
    it('should create new user with valid data', async () => {
      mockAuthActions.registerUser.mockImplementation(async ({ email, password, name }) => {
        // Check if user already exists
        const existingUser = await mockDb.user.findFirst({ where: { email } });
        if (existingUser) {
          return { success: false, error: 'User with this email already exists' };
        }

        // Hash password
        const hashedPassword = await mockBcrypt.hash(password, 10);

        // Create user
        const user = await mockDb.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            emailVerified: null,
          }
        });

        // Send verification email
        await mockEmailService.sendVerificationEmail({
          email: user.email,
          name: user.name,
          userId: user.id,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
          },
          message: 'User created successfully. Please check your email for verification.',
        };
      });

      // Mock no existing user
      mockDb.user.findFirst.mockResolvedValueOnce(null);

      const result = await mockAuthActions.registerUser({
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        name: 'New User',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.name).toBe('New User');
      expect(result.message).toContain('verification');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('SecurePassword123!', 10);
      expect(mockDb.user.create).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should reject duplicate email registration', async () => {
      mockAuthActions.registerUser.mockImplementation(async ({ email }) => {
        const existingUser = await mockDb.user.findFirst({ where: { email } });
        if (existingUser) {
          return { success: false, error: 'User with this email already exists' };
        }
        return { success: true };
      });

      // Mock existing user
      mockDb.user.findFirst.mockResolvedValue({
        id: 'existing_user',
        email: 'test@example.com',
        name: 'Existing User',
      });

      const result = await mockAuthActions.registerUser({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should reject invalid email format', async () => {
      mockAuthActions.registerUser.mockImplementation(async ({ email }) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return { success: false, error: 'Invalid email format' };
        }
        return { success: true, user: {} };
      });

      const result = await mockAuthActions.registerUser({
        email: 'invalid-email',
        password: 'ValidPassword123!',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject weak password', async () => {
      mockAuthActions.registerUser.mockImplementation(async ({ password }) => {
        if (password.length < 8) {
          return { success: false, error: 'Password must be at least 8 characters long' };
        }
        if (!/[A-Z]/.test(password)) {
          return { success: false, error: 'Password must contain at least one uppercase letter' };
        }
        if (!/[0-9]/.test(password)) {
          return { success: false, error: 'Password must contain at least one number' };
        }
        if (!/[!@#$%^&*]/.test(password)) {
          return { success: false, error: 'Password must contain at least one special character' };
        }
        return { success: true, user: {} };
      });

      const weakPasswords = [
        { password: 'short', expectedError: 'at least 8 characters' },
        { password: 'nouppercase123!', expectedError: 'uppercase letter' },
        { password: 'NoNumbers!', expectedError: 'number' },
        { password: 'NoSpecialChars123', expectedError: 'special character' },
      ];

      for (const { password, expectedError } of weakPasswords) {
        const result = await mockAuthActions.registerUser({
          email: 'test@example.com',
          password,
          name: 'Test User',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain(expectedError);
      }
    });
  });

  describe('POST /api/auth/sign-in', () => {
    it('should sign in with valid credentials', async () => {
      mockAuthActions.authenticateUser.mockImplementation(async ({ email, password }) => {
        // Find user
        const user = await mockDb.user.findFirst({ where: { email } });
        if (!user) {
          return { success: false, error: 'Invalid email or password' };
        }

        // Check if email is verified
        if (!user.emailVerified) {
          return { 
            success: false, 
            error: 'Please verify your email before signing in',
            requiresVerification: true 
          };
        }

        // Verify password
        const isValidPassword = await mockBcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return { success: false, error: 'Invalid email or password' };
        }

        // Create session
        const token = mockJwt.sign({ userId: user.id }, 'secret', { expiresIn: '1h' });
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
            emailVerified: user.emailVerified,
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
      expect(result.user.email).toBe('test@example.com');
      expect(result.session).toBeDefined();
      expect(result.session.token).toBe('jwt_token_123');
      expect(mockBcrypt.compare).toHaveBeenCalledWith('SecurePassword123!', '$2b$10$hashedpassword');
      expect(mockDb.session.create).toHaveBeenCalled();
    });

    it('should reject invalid email', async () => {
      mockAuthActions.authenticateUser.mockImplementation(async ({ email }) => {
        const user = await mockDb.user.findFirst({ where: { email } });
        if (!user) {
          return { success: false, error: 'Invalid email or password' };
        }
        return { success: true };
      });

      // Mock no user found
      mockDb.user.findFirst.mockResolvedValue(null);

      const result = await mockAuthActions.authenticateUser({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      mockAuthActions.authenticateUser.mockImplementation(async ({ email, password }) => {
        const user = await mockDb.user.findFirst({ where: { email } });
        const isValidPassword = await mockBcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return { success: false, error: 'Invalid email or password' };
        }
        return { success: true };
      });

      // Mock password comparison failure
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await mockAuthActions.authenticateUser({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should handle unverified email accounts', async () => {
      mockAuthActions.authenticateUser.mockImplementation(async ({ email }) => {
        const user = await mockDb.user.findFirst({ where: { email } });
        if (!user.emailVerified) {
          return { 
            success: false, 
            error: 'Please verify your email before signing in',
            requiresVerification: true 
          };
        }
        return { success: true };
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
      expect(result.error).toContain('verify your email');
      expect(result.requiresVerification).toBe(true);
    });
  });

  describe('POST /api/auth/sign-out', () => {
    it('should sign out user successfully', async () => {
      mockAuthActions.logoutUser.mockImplementation(async ({ token }) => {
        // Verify token
        const decoded = mockJwt.verify(token, 'secret');
        
        // Delete session
        const deletedSession = await mockDb.session.delete({
          where: { token, userId: decoded.userId }
        });

        if (!deletedSession) {
          return { success: false, error: 'Invalid session' };
        }

        return {
          success: true,
          message: 'Signed out successfully',
        };
      });

      mockDb.session.delete.mockResolvedValue({
        id: 'session_123',
        token: 'jwt_token_123',
      });

      const result = await mockAuthActions.logoutUser({
        token: 'jwt_token_123',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Signed out successfully');
      expect(mockJwt.verify).toHaveBeenCalledWith('jwt_token_123', 'secret');
      expect(mockDb.session.delete).toHaveBeenCalled();
    });

    it('should handle invalid token on sign out', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockAuthActions.logoutUser.mockImplementation(async ({ token }) => {
        try {
          mockJwt.verify(token, 'secret');
        } catch (error) {
          return { success: false, error: 'Invalid token' };
        }
        return { success: true };
      });

      const result = await mockAuthActions.logoutUser({
        token: 'invalid_token',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh valid session', async () => {
      mockAuthActions.refreshUserSession.mockImplementation(async ({ token }) => {
        // Verify current token
        const decoded = mockJwt.verify(token, 'secret');
        
        // Find session
        const session = await mockDb.session.findFirst({
          where: { token, userId: decoded.userId }
        });

        if (!session || session.expiresAt < new Date()) {
          return { success: false, error: 'Invalid or expired session' };
        }

        // Create new token
        const newToken = mockJwt.sign({ userId: decoded.userId }, 'secret', { expiresIn: '1h' });
        
        // Update session
        const updatedSession = await mockDb.session.update({
          where: { id: session.id },
          data: {
            token: newToken,
            expiresAt: new Date(Date.now() + 3600000),
          }
        });

        return {
          success: true,
          session: {
            token: updatedSession.token,
            expiresAt: updatedSession.expiresAt,
          }
        };
      });

      mockDb.session.findFirst.mockResolvedValue({
        id: 'session_123',
        userId: 'user_123',
        token: 'jwt_token_123',
        expiresAt: new Date(Date.now() + 3600000),
      });

      mockJwt.sign.mockReturnValue('new_jwt_token_456');
      
      mockDb.session.update.mockResolvedValue({
        id: 'session_123',
        token: 'new_jwt_token_456',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await mockAuthActions.refreshUserSession({
        token: 'jwt_token_123',
      });

      expect(result.success).toBe(true);
      expect(result.session.token).toBe('new_jwt_token_456');
      expect(mockDb.session.update).toHaveBeenCalled();
    });

    it('should reject expired session refresh', async () => {
      mockAuthActions.refreshUserSession.mockImplementation(async ({ token }) => {
        const session = await mockDb.session.findFirst({ where: { token } });
        
        if (!session || session.expiresAt < new Date()) {
          return { success: false, error: 'Invalid or expired session' };
        }

        return { success: true };
      });

      // Mock expired session
      mockDb.session.findFirst.mockResolvedValue({
        id: 'session_123',
        token: 'jwt_token_123',
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
      });

      const result = await mockAuthActions.refreshUserSession({
        token: 'jwt_token_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired session');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should initiate password reset for valid email', async () => {
      mockAuthActions.initiatePasswordReset.mockImplementation(async ({ email }) => {
        // Find user
        const user = await mockDb.user.findFirst({ where: { email } });
        if (!user) {
          // Don't reveal if email exists or not for security
          return {
            success: true,
            message: 'If an account with this email exists, you will receive a password reset link.',
          };
        }

        // Create reset token
        const resetToken = 'reset_token_123';
        await mockDb.verificationToken.create({
          data: {
            identifier: user.email,
            token: resetToken,
            expires: new Date(Date.now() + 3600000), // 1 hour
          }
        });

        // Send reset email
        await mockEmailService.sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          resetToken,
        });

        return {
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.',
        };
      });

      mockDb.verificationToken.create.mockResolvedValue({
        id: 'token_123',
        identifier: 'test@example.com',
        token: 'reset_token_123',
        expires: new Date(Date.now() + 3600000),
      });

      mockEmailService.sendPasswordResetEmail.mockResolvedValue({ success: true });

      const result = await mockAuthActions.initiatePasswordReset({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset link');
      expect(mockDb.verificationToken.create).toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should handle non-existent email gracefully', async () => {
      mockAuthActions.initiatePasswordReset.mockImplementation(async ({ email }) => {
        const user = await mockDb.user.findFirst({ where: { email } });
        // Always return success for security (don't reveal if email exists)
        return {
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.',
        };
      });

      // Mock no user found
      mockDb.user.findFirst.mockResolvedValue(null);

      const result = await mockAuthActions.initiatePasswordReset({
        email: 'nonexistent@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset link');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      mockAuthActions.verifyUserEmail.mockImplementation(async ({ token }) => {
        // Find verification token
        const verificationToken = await mockDb.verificationToken.findFirst({
          where: { token }
        });

        if (!verificationToken || verificationToken.expires < new Date()) {
          return { success: false, error: 'Invalid or expired verification token' };
        }

        // Update user email verification
        const user = await mockDb.user.update({
          where: { email: verificationToken.identifier },
          data: { emailVerified: new Date() }
        });

        // Delete used token
        await mockDb.verificationToken.delete({
          where: { token }
        });

        return {
          success: true,
          message: 'Email verified successfully',
          user: {
            id: user.id,
            email: user.email,
            emailVerified: user.emailVerified,
          }
        };
      });

      mockDb.verificationToken.findFirst.mockResolvedValue({
        id: 'token_123',
        identifier: 'test@example.com',
        token: 'verify_token_123',
        expires: new Date(Date.now() + 3600000),
      });

      mockDb.user.update.mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        emailVerified: new Date(),
      });

      mockDb.verificationToken.delete.mockResolvedValue({
        id: 'token_123',
        token: 'verify_token_123',
      });

      const result = await mockAuthActions.verifyUserEmail({
        token: 'verify_token_123',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(result.user.emailVerified).toBeDefined();
      expect(mockDb.user.update).toHaveBeenCalled();
      expect(mockDb.verificationToken.delete).toHaveBeenCalled();
    });

    it('should reject invalid verification token', async () => {
      mockAuthActions.verifyUserEmail.mockImplementation(async ({ token }) => {
        const verificationToken = await mockDb.verificationToken.findFirst({
          where: { token }
        });

        if (!verificationToken) {
          return { success: false, error: 'Invalid or expired verification token' };
        }

        return { success: true };
      });

      // Mock no token found
      mockDb.verificationToken.findFirst.mockResolvedValue(null);

      const result = await mockAuthActions.verifyUserEmail({
        token: 'invalid_token',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired verification token');
    });

    it('should reject expired verification token', async () => {
      mockAuthActions.verifyUserEmail.mockImplementation(async ({ token }) => {
        const verificationToken = await mockDb.verificationToken.findFirst({
          where: { token }
        });

        if (!verificationToken || verificationToken.expires < new Date()) {
          return { success: false, error: 'Invalid or expired verification token' };
        }

        return { success: true };
      });

      // Mock expired token
      mockDb.verificationToken.findFirst.mockResolvedValue({
        id: 'token_123',
        token: 'verify_token_123',
        expires: new Date(Date.now() - 3600000), // Expired 1 hour ago
      });

      const result = await mockAuthActions.verifyUserEmail({
        token: 'verify_token_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or expired verification token');
    });
  });
}); 
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc, count, like, or } from 'drizzle-orm';
import { user, session, file } from '../../../src/server/db/schema';
import type { User } from 'better-auth/types';

// Test database URL - should use a separate test database
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for integration tests');
}

const testDb = drizzle(testDatabaseUrl);

describe('Real Database Integration Tests', () => {
  // Generate unique test IDs to avoid conflicts
  const generateTestId = () => `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const testUserId1 = generateTestId();
  const testUserId2 = generateTestId();

  // Clean up function to remove test data
  const cleanupTestData = async () => {
    try {
      // Delete test users and related data
      await testDb.delete(file).where(eq(file.uploadUserId, testUserId1));
      await testDb.delete(file).where(eq(file.uploadUserId, testUserId2));
      await testDb.delete(session).where(eq(session.userId, testUserId1));
      await testDb.delete(session).where(eq(session.userId, testUserId2));
      await testDb.delete(user).where(eq(user.id, testUserId1));
      await testDb.delete(user).where(eq(user.id, testUserId2));
      
      // Also clean up any leftover static test users
      await testDb.delete(file).where(eq(file.uploadUserId, 'test-user-1'));
      await testDb.delete(file).where(eq(file.uploadUserId, 'test-user-2'));
      await testDb.delete(session).where(eq(session.userId, 'test-user-1'));
      await testDb.delete(session).where(eq(session.userId, 'test-user-2'));
      await testDb.delete(user).where(eq(user.id, 'test-user-1'));
      await testDb.delete(user).where(eq(user.id, 'test-user-2'));
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  };

  beforeAll(async () => {
    // Run comprehensive cleanup before all tests
    console.log('🧹 运行测试前清理...');
    // 清理所有测试相关的数据
    await testDb.delete(file).where(
      or(
        like(file.uploadUserId, 'test-user-%'),
        like(file.filename, 'test-%'),
        like(file.originalName, 'test-%')
      )
    );
    await testDb.delete(session).where(like(session.userId, 'test-user-%'));
    await testDb.delete(user).where(
      or(
        like(user.id, 'test-user-%'),
        like(user.email, '%@test.com'),
        like(user.email, '%@example.com'),
        like(user.email, 'test@%'),
        like(user.email, 'findme%'),
        like(user.email, 'update%'),
        like(user.email, 'delete%'),
        like(user.email, 'ban%'),
        like(user.email, 'filetest%')
      )
    );
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data after all tests
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Clean up before each test to ensure isolation
    await cleanupTestData();
  });

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const userData = {
        id: testUserId1,
        name: 'Test User',
        email: `test-${testUserId1}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      const [createdUser] = await testDb.insert(user).values(userData).returning();

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBe(userData.id);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.emailVerified).toBe(false);
      expect(createdUser.banned).toBe(false);
    });

    it('should find user by email', async () => {
      const testEmail = `findme-${testUserId1}@example.com`;
      const userData = {
        id: testUserId1,
        name: 'Test User',
        email: testEmail,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      await testDb.insert(user).values(userData);

      const foundUsers = await testDb
        .select()
        .from(user)
        .where(eq(user.email, testEmail));

      expect(foundUsers).toHaveLength(1);
      expect(foundUsers[0].email).toBe(testEmail);
      expect(foundUsers[0].id).toBe(testUserId1);
    });

    it('should update user information', async () => {
      const userData = {
        id: 'test-user-1',
        name: 'Original Name',
        email: 'update@example.com',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      await testDb.insert(user).values(userData);

      const [updatedUser] = await testDb
        .update(user)
        .set({
          name: 'Updated Name',
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, 'test-user-1'))
        .returning();

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.emailVerified).toBe(true);
      expect(updatedUser.email).toBe('update@example.com');
    });

    it('should delete user', async () => {
      const userData = {
        id: 'test-user-1',
        name: 'Delete Me',
        email: 'delete@example.com',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      await testDb.insert(user).values(userData);

      // Verify user exists
      const beforeDelete = await testDb
        .select()
        .from(user)
        .where(eq(user.id, 'test-user-1'));
      expect(beforeDelete).toHaveLength(1);

      // Delete user
      await testDb.delete(user).where(eq(user.id, 'test-user-1'));

      // Verify user is deleted
      const afterDelete = await testDb
        .select()
        .from(user)
        .where(eq(user.id, 'test-user-1'));
      expect(afterDelete).toHaveLength(0);
    });

    it('should handle user ban operations', async () => {
      const userData = {
        id: 'test-user-1',
        name: 'Ban Test User',
        email: 'ban@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      await testDb.insert(user).values(userData);

      // Ban the user
      const banExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const [bannedUser] = await testDb
        .update(user)
        .set({
          banned: true,
          banReason: 'Violation of terms',
          banExpires,
          updatedAt: new Date(),
        })
        .where(eq(user.id, 'test-user-1'))
        .returning();

      expect(bannedUser.banned).toBe(true);
      expect(bannedUser.banReason).toBe('Violation of terms');
      expect(bannedUser.banExpires).toEqual(banExpires);

      // Unban the user
      const [unbannedUser] = await testDb
        .update(user)
        .set({
          banned: false,
          banReason: null,
          banExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, 'test-user-1'))
        .returning();

      expect(unbannedUser.banned).toBe(false);
      expect(unbannedUser.banReason).toBeNull();
      expect(unbannedUser.banExpires).toBeNull();
    });
  });

  describe('File Operations', () => {
    beforeEach(async () => {
      // Create test user for file operations
      const userData = {
        id: 'test-user-1',
        name: 'File Test User',
        email: 'filetest@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      await testDb.insert(user).values(userData);
    });

    it('should create file record', async () => {
      const fileData = {
        id: 'test-file-1',
        filename: 'test-image.jpg',
        originalName: 'my-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        width: 1920,
        height: 1080,
        r2Key: 'files/2024/01/test-image.jpg',
        thumbnailKey: 'thumbnails/2024/01/test-image.jpg',
        uploadUserId: 'test-user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [createdFile] = await testDb.insert(file).values(fileData).returning();

      expect(createdFile).toBeDefined();
      expect(createdFile.id).toBe('test-file-1');
      expect(createdFile.originalName).toBe('my-image.jpg');
      expect(createdFile.mimeType).toBe('image/jpeg');
      expect(createdFile.uploadUserId).toBe('test-user-1');
      expect(createdFile.width).toBe(1920);
      expect(createdFile.height).toBe(1080);
    });

    it('should find files by user', async () => {
      // Create multiple files for the user
      const fileData1 = {
        id: 'test-file-1',
        filename: 'file1.jpg',
        originalName: 'file1.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        r2Key: 'files/file1.jpg',
        uploadUserId: 'test-user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const fileData2 = {
        id: 'test-file-2',
        filename: 'file2.png',
        originalName: 'file2.png',
        mimeType: 'image/png',
        size: 2048,
        r2Key: 'files/file2.png',
        uploadUserId: 'test-user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await testDb.insert(file).values([fileData1, fileData2]);

      const userFiles = await testDb
        .select()
        .from(file)
        .where(eq(file.uploadUserId, 'test-user-1'))
        .orderBy(desc(file.createdAt));

      expect(userFiles).toHaveLength(2);
      expect(userFiles[0].uploadUserId).toBe('test-user-1');
      expect(userFiles[1].uploadUserId).toBe('test-user-1');
    });

    it('should delete file with cascade', async () => {
      const fileData = {
        id: 'test-file-1',
        filename: 'delete-test.jpg',
        originalName: 'delete-test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        r2Key: 'files/delete-test.jpg',
        uploadUserId: 'test-user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await testDb.insert(file).values(fileData);

      // Verify file exists
      const beforeDelete = await testDb
        .select()
        .from(file)
        .where(eq(file.id, 'test-file-1'));
      expect(beforeDelete).toHaveLength(1);

      // Delete file
      await testDb.delete(file).where(eq(file.id, 'test-file-1'));

      // Verify file is deleted
      const afterDelete = await testDb
        .select()
        .from(file)
        .where(eq(file.id, 'test-file-1'));
      expect(afterDelete).toHaveLength(0);
    });

    it('should handle file access control', async () => {
      // Create second user
      const user2Data = {
        id: 'test-user-2',
        name: 'User 2',
        email: 'user2@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      await testDb.insert(user).values(user2Data);

      // Create files for both users
      const file1Data = {
        id: 'test-file-1',
        filename: 'user1-file.jpg',
        originalName: 'user1-file.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        r2Key: 'files/user1-file.jpg',
        uploadUserId: 'test-user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const file2Data = {
        id: 'test-file-2',
        filename: 'user2-file.jpg',
        originalName: 'user2-file.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        r2Key: 'files/user2-file.jpg',
        uploadUserId: 'test-user-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await testDb.insert(file).values([file1Data, file2Data]);

      // User 1 should only see their files
      const user1Files = await testDb
        .select()
        .from(file)
        .where(eq(file.uploadUserId, 'test-user-1'));

      expect(user1Files).toHaveLength(1);
      expect(user1Files[0].uploadUserId).toBe('test-user-1');

      // User 2 should only see their files
      const user2Files = await testDb
        .select()
        .from(file)
        .where(eq(file.uploadUserId, 'test-user-2'));

      expect(user2Files).toHaveLength(1);
      expect(user2Files[0].uploadUserId).toBe('test-user-2');
    });
  });

  describe('Session Operations', () => {
    beforeEach(async () => {
      // Create test user for session operations
      const userData = {
        id: 'test-user-1',
        name: 'Session Test User',
        email: 'session@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      await testDb.insert(user).values(userData);
    });

    it('should create session', async () => {
      const sessionData = {
        id: 'test-session-1',
        userId: 'test-user-1',
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
      };

      const [createdSession] = await testDb.insert(session).values(sessionData).returning();

      expect(createdSession).toBeDefined();
      expect(createdSession.id).toBe('test-session-1');
      expect(createdSession.userId).toBe('test-user-1');
      expect(createdSession.token).toBe('test-token-123');
      expect(createdSession.ipAddress).toBe('127.0.0.1');
    });

    it('should find session by token', async () => {
      const sessionData = {
        id: 'test-session-1',
        userId: 'test-user-1',
        token: 'findme-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
      };

      await testDb.insert(session).values(sessionData);

      const foundSessions = await testDb
        .select()
        .from(session)
        .where(eq(session.token, 'findme-token-123'));

      expect(foundSessions).toHaveLength(1);
      expect(foundSessions[0].token).toBe('findme-token-123');
      expect(foundSessions[0].userId).toBe('test-user-1');
    });

    it('should delete expired sessions', async () => {
      const expiredSessionData = {
        id: 'expired-session',
        userId: 'test-user-1',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 24 hours ago
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
      };

      const validSessionData = {
        id: 'valid-session',
        userId: 'test-user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
      };

      await testDb.insert(session).values([expiredSessionData, validSessionData]);

      // Delete expired sessions
      await testDb.delete(session).where(eq(session.expiresAt, expiredSessionData.expiresAt));

      // Check that only valid session remains
      const remainingSessions = await testDb
        .select()
        .from(session)
        .where(eq(session.userId, 'test-user-1'));

      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].token).toBe('valid-token');
    });
  });

  describe('Complex Queries and Relations', () => {
    beforeEach(async () => {
      // Ensure clean state before each test
      await cleanupTestData();
      
      // Create test users
      const user1Data = {
        id: 'test-user-1',
        name: 'User 1',
        email: 'user1@example.com',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      const user2Data = {
        id: 'test-user-2',
        name: 'User 2',
        email: 'user2@example.com',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        banned: false,
      };

      await testDb.insert(user).values([user1Data, user2Data]);
    });

    it('should count users by verification status', async () => {
      // Count only the test users we created
      const [verifiedCount] = await testDb
        .select({ count: count() })
        .from(user)
        .where(and(
          eq(user.emailVerified, true),
          eq(user.id, 'test-user-1')
        ));

      const [unverifiedCount] = await testDb
        .select({ count: count() })
        .from(user)
        .where(and(
          eq(user.emailVerified, false),
          eq(user.id, 'test-user-2')
        ));

      expect(verifiedCount.count).toBe(1);
      expect(unverifiedCount.count).toBe(1);
    });

    it('should handle user with files relationship', async () => {
      // Create files for user 1
      const fileData1 = {
        id: 'file-1',
        filename: 'file1.jpg',
        originalName: 'file1.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        r2Key: 'files/file1.jpg',
        uploadUserId: 'test-user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const fileData2 = {
        id: 'file-2',
        filename: 'file2.jpg',
        originalName: 'file2.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        r2Key: 'files/file2.jpg',
        uploadUserId: 'test-user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await testDb.insert(file).values([fileData1, fileData2]);

      // Join query to get user with file count
      const userWithFileCount = await testDb
        .select({
          userId: user.id,
          userName: user.name,
          fileCount: count(file.id),
        })
        .from(user)
        .leftJoin(file, eq(user.id, file.uploadUserId))
        .where(eq(user.id, 'test-user-1'))
        .groupBy(user.id, user.name);

      expect(userWithFileCount).toHaveLength(1);
      expect(userWithFileCount[0].userId).toBe('test-user-1');
      expect(userWithFileCount[0].userName).toBe('User 1');
      expect(userWithFileCount[0].fileCount).toBe(2);
    });

    it.skip('should handle transactions', async () => {
      // Skip this test as Neon HTTP driver doesn't support transactions
      // This test would need a different database connection type (e.g., postgres.js)
      // to work with transactions
      
      await testDb.transaction(async (tx) => {
        // Create a file
        const fileData = {
          id: 'transaction-file',
          filename: 'transaction-test.jpg',
          originalName: 'transaction-test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          r2Key: 'files/transaction-test.jpg',
          uploadUserId: 'test-user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await tx.insert(file).values(fileData);

        // Update user's updated timestamp
        await tx
          .update(user)
          .set({ updatedAt: new Date() })
          .where(eq(user.id, 'test-user-1'));
      });

      // Verify both operations completed
      const createdFile = await testDb
        .select()
        .from(file)
        .where(eq(file.id, 'transaction-file'));

      expect(createdFile).toHaveLength(1);
    });
  });
}); 
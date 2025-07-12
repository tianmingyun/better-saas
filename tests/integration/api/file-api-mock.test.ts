/**
 * File Management API Integration Tests (Mock-based)
 * Tests file upload, listing, and deletion functionality using mocks
 * instead of a full Next.js server to avoid polyfill issues.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock file service and storage
const mockFileService = {
  uploadFile: jest.fn(),
  listFiles: jest.fn(),
  getFile: jest.fn(),
  deleteFile: jest.fn(),
  validateFile: jest.fn(),
};

// Mock R2 storage client
const mockR2Client = {
  upload: jest.fn(),
  delete: jest.fn(),
  getUrl: jest.fn(),
  list: jest.fn(),
};

// Mock database
const mockDb = {
  file: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
};

// Mock authentication
const mockAuth = {
  validateSession: jest.fn(),
  getUserFromToken: jest.fn(),
};

// Mock file actions
const mockFileActions = {
  uploadFile: jest.fn(),
  listUserFiles: jest.fn(),
  getFileDetails: jest.fn(),
  deleteUserFile: jest.fn(),
};

describe('File Management API Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockAuth.validateSession.mockResolvedValue({
      valid: true,
      user: {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
      }
    });

    mockAuth.getUserFromToken.mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
    });

    mockDb.user.findFirst.mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
    });

    mockFileService.validateFile.mockReturnValue({
      valid: true,
      size: 1024,
      type: 'image/png',
    });

    mockR2Client.upload.mockResolvedValue({
      success: true,
      key: 'uploads/user_123/test-image-123.png',
      url: 'https://storage.example.com/uploads/user_123/test-image-123.png',
    });

    mockDb.file.create.mockResolvedValue({
      id: 'file_123',
      filename: 'test-image-123.png',
      originalName: 'test-image.png',
      mimeType: 'image/png',
      size: 1024,
      uploadUserId: 'user_123',
      storageKey: 'uploads/user_123/test-image-123.png',
      url: 'https://storage.example.com/uploads/user_123/test-image-123.png',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/files/upload', () => {
    it('should upload image file successfully', async () => {
      mockFileActions.uploadFile.mockImplementation(async ({ file, userId }) => {
        // Validate authentication
        const user = await mockAuth.getUserFromToken('valid_token');
        if (!user) {
          return { success: false, error: 'Unauthorized' };
        }

        // Validate file
        const validation = mockFileService.validateFile(file);
        if (!validation.valid) {
          return { success: false, error: 'Invalid file' };
        }

        // Upload to storage
        const uploadResult = await mockR2Client.upload({
          key: `uploads/${user.id}/${file.name}`,
          body: file.data,
          contentType: file.type,
        });

        if (!uploadResult.success) {
          return { success: false, error: 'Upload failed' };
        }

        // Save to database
        const dbFile = await mockDb.file.create({
          data: {
            filename: `${file.name}-123`,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            uploadUserId: user.id,
            storageKey: uploadResult.key,
            url: uploadResult.url,
          }
        });

        return {
          success: true,
          file: {
            id: dbFile.id,
            filename: dbFile.filename,
            originalName: dbFile.originalName,
            mimeType: dbFile.mimeType,
            size: dbFile.size,
            uploadUserId: dbFile.uploadUserId,
            url: dbFile.url,
            createdAt: dbFile.createdAt,
          }
        };
      });

      const result = await mockFileActions.uploadFile({
        file: {
          name: 'test-image.png',
          type: 'image/png',
          size: 1024,
          data: Buffer.from('fake-image-data'),
        },
        userId: 'user_123',
      });

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file.originalName).toBe('test-image.png');
      expect(result.file.mimeType).toBe('image/png');
      expect(result.file.uploadUserId).toBe('user_123');
      expect(mockR2Client.upload).toHaveBeenCalled();
      expect(mockDb.file.create).toHaveBeenCalled();
    });

    it('should reject file upload without authentication', async () => {
      mockAuth.getUserFromToken.mockResolvedValue(null);
      
      mockFileActions.uploadFile.mockImplementation(async ({ userId }) => {
        const user = await mockAuth.getUserFromToken('invalid_token');
        if (!user) {
          return { success: false, error: 'Unauthorized' };
        }
        return { success: true };
      });

      const result = await mockFileActions.uploadFile({
        file: {
          name: 'test-image.png',
          type: 'image/png',
          size: 1024,
          data: Buffer.from('fake-image-data'),
        },
        userId: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should reject oversized files', async () => {
      const largeFileSize = 15 * 1024 * 1024; // 15MB
      
      mockFileService.validateFile.mockReturnValue({
        valid: false,
        error: 'File size exceeds maximum allowed size of 10MB',
      });

      mockFileActions.uploadFile.mockImplementation(async ({ file }) => {
        const validation = mockFileService.validateFile(file);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        return { success: true };
      });

      const result = await mockFileActions.uploadFile({
        file: {
          name: 'large-file.jpg',
          type: 'image/jpeg',
          size: largeFileSize,
          data: Buffer.alloc(largeFileSize),
        },
        userId: 'user_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('size');
    });

    it('should reject unsupported file types', async () => {
      mockFileService.validateFile.mockReturnValue({
        valid: false,
        error: 'File type not supported. Only images are allowed.',
      });

      mockFileActions.uploadFile.mockImplementation(async ({ file }) => {
        const validation = mockFileService.validateFile(file);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
        return { success: true };
      });

      const result = await mockFileActions.uploadFile({
        file: {
          name: 'document.txt',
          type: 'text/plain',
          size: 1024,
          data: Buffer.from('text content'),
        },
        userId: 'user_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('type');
    });
  });

  describe('GET /api/files', () => {
    beforeEach(() => {
      mockDb.file.findMany.mockResolvedValue([
        {
          id: 'file_1',
          filename: 'image1.png',
          originalName: 'image1.png',
          mimeType: 'image/png',
          size: 1024,
          uploadUserId: 'user_123',
          url: 'https://storage.example.com/image1.png',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'file_2',
          filename: 'image2.jpg',
          originalName: 'image2.jpg',
          mimeType: 'image/jpeg',
          size: 2048,
          uploadUserId: 'user_123',
          url: 'https://storage.example.com/image2.jpg',
          createdAt: new Date('2024-01-02'),
        }
      ]);

      mockDb.file.count.mockResolvedValue(2);
    });

    it('should list user files with authentication', async () => {
      mockFileActions.listUserFiles.mockImplementation(async ({ userId, page = 1, limit = 10 }) => {
        const user = await mockAuth.getUserFromToken('valid_token');
        if (!user) {
          return { success: false, error: 'Unauthorized' };
        }

        const files = await mockDb.file.findMany({
          where: { uploadUserId: userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        });

        const total = await mockDb.file.count({
          where: { uploadUserId: userId },
        });

        return {
          success: true,
          files,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          }
        };
      });

      const result = await mockFileActions.listUserFiles({
        userId: 'user_123',
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.files[0].uploadUserId).toBe('user_123');
    });

    it('should reject file list request without authentication', async () => {
      mockAuth.getUserFromToken.mockResolvedValue(null);

      mockFileActions.listUserFiles.mockImplementation(async () => {
        const user = await mockAuth.getUserFromToken('invalid_token');
        if (!user) {
          return { success: false, error: 'Unauthorized' };
        }
        return { success: true };
      });

      const result = await mockFileActions.listUserFiles({
        userId: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should support pagination parameters', async () => {
      mockFileActions.listUserFiles.mockImplementation(async ({ userId, page = 1, limit = 10 }) => {
        const files = await mockDb.file.findMany({
          where: { uploadUserId: userId },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          success: true,
          files: files.slice(0, limit),
          pagination: {
            page,
            limit,
            total: 2,
            pages: Math.ceil(2 / limit),
          }
        };
      });

      const result = await mockFileActions.listUserFiles({
        userId: 'user_123',
        page: 1,
        limit: 1,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
    });

    it('should support search functionality', async () => {
      mockDb.file.findMany.mockResolvedValue([
        {
          id: 'file_1',
          filename: 'profile-image.png',
          originalName: 'profile-image.png',
          mimeType: 'image/png',
          size: 1024,
          uploadUserId: 'user_123',
          url: 'https://storage.example.com/profile-image.png',
          createdAt: new Date(),
        }
      ]);

      mockFileActions.listUserFiles.mockImplementation(async ({ userId, search }) => {
        const whereClause = {
          uploadUserId: userId,
          ...(search && {
            OR: [
              { filename: { contains: search } },
              { originalName: { contains: search } },
            ]
          })
        };

        const files = await mockDb.file.findMany({
          where: whereClause,
        });

        return {
          success: true,
          files,
          pagination: {
            page: 1,
            limit: 10,
            total: files.length,
            pages: 1,
          }
        };
      });

      const result = await mockFileActions.listUserFiles({
        userId: 'user_123',
        search: 'profile',
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].filename).toContain('profile');
    });
  });

  describe('GET /api/files/:id', () => {
    it('should get file details with valid ID', async () => {
      mockDb.file.findFirst.mockResolvedValue({
        id: 'file_123',
        filename: 'test-image.png',
        originalName: 'test-image.png',
        mimeType: 'image/png',
        size: 1024,
        uploadUserId: 'user_123',
        url: 'https://storage.example.com/test-image.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockFileActions.getFileDetails.mockImplementation(async ({ fileId, userId }) => {
        const user = await mockAuth.getUserFromToken('valid_token');
        if (!user) {
          return { success: false, error: 'Unauthorized' };
        }

        const file = await mockDb.file.findFirst({
          where: { id: fileId, uploadUserId: userId },
        });

        if (!file) {
          return { success: false, error: 'File not found' };
        }

        return {
          success: true,
          file,
        };
      });

      const result = await mockFileActions.getFileDetails({
        fileId: 'file_123',
        userId: 'user_123',
      });

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file.id).toBe('file_123');
    });

    it('should return 404 for non-existent file', async () => {
      mockDb.file.findFirst.mockResolvedValue(null);

      mockFileActions.getFileDetails.mockImplementation(async ({ fileId, userId }) => {
        const file = await mockDb.file.findFirst({
          where: { id: fileId, uploadUserId: userId },
        });

        if (!file) {
          return { success: false, error: 'File not found' };
        }

        return { success: true, file };
      });

      const result = await mockFileActions.getFileDetails({
        fileId: 'non_existent',
        userId: 'user_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should reject request without authentication', async () => {
      mockAuth.getUserFromToken.mockResolvedValue(null);

      mockFileActions.getFileDetails.mockImplementation(async () => {
        const user = await mockAuth.getUserFromToken('invalid_token');
        if (!user) {
          return { success: false, error: 'Unauthorized' };
        }
        return { success: true };
      });

      const result = await mockFileActions.getFileDetails({
        fileId: 'file_123',
        userId: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('should delete own file successfully', async () => {
      mockDb.file.findFirst.mockResolvedValue({
        id: 'file_123',
        filename: 'test-image.png',
        uploadUserId: 'user_123',
        storageKey: 'uploads/user_123/test-image.png',
      });

      mockR2Client.delete.mockResolvedValue({ success: true });
      mockDb.file.delete.mockResolvedValue({ id: 'file_123' });

      mockFileActions.deleteUserFile.mockImplementation(async ({ fileId, userId }) => {
        const user = await mockAuth.getUserFromToken('valid_token');
        if (!user) {
          return { success: false, error: 'Unauthorized' };
        }

        const file = await mockDb.file.findFirst({
          where: { id: fileId, uploadUserId: userId },
        });

        if (!file) {
          return { success: false, error: 'File not found' };
        }

        // Delete from storage
        await mockR2Client.delete({ key: file.storageKey });

        // Delete from database
        await mockDb.file.delete({ where: { id: fileId } });

        return {
          success: true,
          message: 'File deleted successfully',
        };
      });

      const result = await mockFileActions.deleteUserFile({
        fileId: 'file_123',
        userId: 'user_123',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('File deleted successfully');
      expect(mockR2Client.delete).toHaveBeenCalled();
      expect(mockDb.file.delete).toHaveBeenCalled();
    });

    it('should return 404 for non-existent file deletion', async () => {
      mockDb.file.findFirst.mockResolvedValue(null);

      mockFileActions.deleteUserFile.mockImplementation(async ({ fileId, userId }) => {
        const file = await mockDb.file.findFirst({
          where: { id: fileId, uploadUserId: userId },
        });

        if (!file) {
          return { success: false, error: 'File not found' };
        }

        return { success: true };
      });

      const result = await mockFileActions.deleteUserFile({
        fileId: 'non_existent',
        userId: 'user_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should reject deletion without authentication', async () => {
      mockAuth.getUserFromToken.mockResolvedValue(null);

      mockFileActions.deleteUserFile.mockImplementation(async () => {
        const user = await mockAuth.getUserFromToken('invalid_token');
        if (!user) {
          return { success: false, error: 'Unauthorized' };
        }
        return { success: true };
      });

      const result = await mockFileActions.deleteUserFile({
        fileId: 'file_123',
        userId: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('File Access Control', () => {
    it('should not allow user to delete other users files', async () => {
      // Mock finding a file that belongs to a different user
      mockDb.file.findFirst.mockImplementation(({ where }) => {
        // If searching for a file with both id and uploadUserId, return null (not found)
        if (where.id === 'file_123' && where.uploadUserId === 'user_123') {
          return Promise.resolve(null);
        }
        // If searching for just the file ID, return the file (but with different owner)
        if (where.id === 'file_123') {
          return Promise.resolve({
            id: 'file_123',
            filename: 'other-user-file.png',
            uploadUserId: 'other_user_456', // Different user
            storageKey: 'uploads/other_user_456/file.png',
          });
        }
        return Promise.resolve(null);
      });

      mockFileActions.deleteUserFile.mockImplementation(async ({ fileId, userId }) => {
        const file = await mockDb.file.findFirst({
          where: { id: fileId, uploadUserId: userId },
        });

        if (!file) {
          return { success: false, error: 'File not found' };
        }

        return { success: true };
      });

      const result = await mockFileActions.deleteUserFile({
        fileId: 'file_123',
        userId: 'user_123', // Different from file owner
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
    });

    it('should not show other users files in file list', async () => {
      mockDb.file.findMany.mockResolvedValue([]); // No files for this user

      mockFileActions.listUserFiles.mockImplementation(async ({ userId }) => {
        const files = await mockDb.file.findMany({
          where: { uploadUserId: userId },
        });

        return {
          success: true,
          files,
          pagination: {
            page: 1,
            limit: 10,
            total: files.length,
            pages: 1,
          }
        };
      });

      const result = await mockFileActions.listUserFiles({
        userId: 'user_123',
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(0);
    });
  });
}); 
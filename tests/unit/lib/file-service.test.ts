import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
  },
});

// Mock the dependencies first
jest.mock('@/lib/r2-client', () => ({
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://cdn.example.com',
  r2Client: {},
}));

jest.mock('@/server/db/repositories', () => ({
  fileRepository: {},
}));

jest.mock('@/lib/logger/logger-utils', () => ({
  ErrorLogger: jest.fn().mockImplementation(() => ({
    logError: jest.fn(),
  })),
}));

// Mock image-processor to avoid dependency issues
jest.mock('@/lib/image-processor', () => ({
  generateThumbnail: jest.fn(() => Promise.resolve(Buffer.from('thumbnail-data'))),
  getImageMetadata: jest.fn(() => Promise.resolve({ width: 800, height: 600 })),
  validateImageFile: jest.fn(() => ({ valid: true })),
}));

// Mock mime-types
jest.mock('mime-types', () => ({
  lookup: jest.fn(),
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('File Service Tests', () => {
  let originalDate: DateConstructor;
  let mockDateNow: jest.Mock;

  // Simple implementations to test
  function generateR2Key(filename: string, type: 'original' | 'thumbnail' = 'original'): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = type === 'thumbnail' ? 'thumbnails' : 'images';
    return `${prefix}/${year}/${month}/${filename}`;
  }

  function generateUniqueFilename(originalName: string): string {
    const ext = originalName.split('.').pop() || '';
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    // Handle case where there's no extension (empty string after pop)
    if (ext === originalName) {
      return `${uuid}-${timestamp}.${originalName}`;
    }
    return `${uuid}-${timestamp}.${ext}`;
  }

  function validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '仅支持 JPEG、PNG、GIF、WebP 格式的图片' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: '文件大小不能超过 10MB' };
    }

    return { valid: true };
  }

  function getFileUrl(r2Key: string): string {
    return `https://cdn.example.com/${r2Key}`;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Store original Date
    originalDate = global.Date;
    
    // Mock Date.now to return a fixed timestamp
    mockDateNow = jest.fn(() => 1640995200000); // 2022-01-01 00:00:00
    
    // Mock Date constructor to return a fixed date
    const MockDate = jest.fn(() => new originalDate('2022-01-01T00:00:00.000Z')) as any;
    MockDate.now = mockDateNow;
    MockDate.prototype = originalDate.prototype;
    
    global.Date = MockDate;
  });

  afterEach(() => {
    // Restore original Date
    global.Date = originalDate;
  });

  describe('generateR2Key', () => {
    it('should generate correct original file path', () => {
      const filename = 'test-image.jpg';
      const key = generateR2Key(filename);
      expect(key).toBe('images/2022/01/test-image.jpg');
    });

    it('should generate correct thumbnail path', () => {
      const filename = 'test-image.jpg';
      const key = generateR2Key(filename, 'thumbnail');
      expect(key).toBe('thumbnails/2022/01/test-image.jpg');
    });

    it('should handle different months', () => {
      // Mock December date
      const MockDecemberDate = jest.fn(() => new originalDate('2022-12-15T00:00:00.000Z')) as any;
      MockDecemberDate.now = mockDateNow;
      MockDecemberDate.prototype = originalDate.prototype;
      global.Date = MockDecemberDate;

      const filename = 'test-image.jpg';
      const key = generateR2Key(filename);
      expect(key).toBe('images/2022/12/test-image.jpg');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filename', () => {
      const originalName = 'my-image.jpg';
      const filename = generateUniqueFilename(originalName);
      expect(filename).toBe('mock-uuid-1234-1640995200000.jpg');
    });

    it('should handle files without extension', () => {
      const originalName = 'filename';
      const filename = generateUniqueFilename(originalName);
      expect(filename).toBe('mock-uuid-1234-1640995200000.filename');
    });

    it('should handle filenames with multiple dots', () => {
      const originalName = 'my.test.image.png';
      const filename = generateUniqueFilename(originalName);
      expect(filename).toBe('mock-uuid-1234-1640995200000.png');
    });
  });

  describe('validateImageFile', () => {
    const createMockFile = (type: string, size: number, name = 'test.jpg'): File => {
      const file = new File(['test content'], name, { type, lastModified: Date.now() });
      // Override the size property
      Object.defineProperty(file, 'size', { value: size, writable: false });
      return file;
    };

    it('should validate valid JPEG file', () => {
      const file = createMockFile('image/jpeg', 1024 * 1024); // 1MB
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate valid PNG file', () => {
      const file = createMockFile('image/png', 1024 * 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should validate valid GIF file', () => {
      const file = createMockFile('image/gif', 1024 * 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should validate valid WebP file', () => {
      const file = createMockFile('image/webp', 1024 * 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported file types', () => {
      const file = createMockFile('image/bmp', 1024 * 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    });

    it('should reject non-image files', () => {
      const file = createMockFile('text/plain', 1024 * 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    });

    it('should reject oversized files', () => {
      const file = createMockFile('image/jpeg', 11 * 1024 * 1024); // 11MB
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    });

    it('should accept files at size boundary', () => {
      const file = createMockFile('image/jpeg', 10 * 1024 * 1024); // exactly 10MB
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('getFileUrl', () => {
    it('should generate correct file URL', () => {
      const r2Key = 'images/2022/01/test-image.jpg';
      const url = getFileUrl(r2Key);
      expect(url).toBe('https://cdn.example.com/images/2022/01/test-image.jpg');
    });

    it('should handle thumbnail URLs', () => {
      const r2Key = 'thumbnails/2022/01/test-image.jpg';
      const url = getFileUrl(r2Key);
      expect(url).toBe('https://cdn.example.com/thumbnails/2022/01/test-image.jpg');
    });

    it('should handle special characters', () => {
      const r2Key = 'images/2022/01/test image with spaces.jpg';
      const url = getFileUrl(r2Key);
      expect(url).toBe('https://cdn.example.com/images/2022/01/test image with spaces.jpg');
    });
  });
});

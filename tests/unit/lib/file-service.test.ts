import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  generateR2Key,
  generateUniqueFilename,
  validateImageFile,
  getFileUrl,
} from '@/lib/file-service';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
  },
});

// Mock Date.now
const mockDateNow = jest.spyOn(Date, 'now');

describe('File Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDateNow.mockReturnValue(1640995200000); // 2022-01-01 00:00:00
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
      // Mock December (month 11, display as 12)
      const mockDate = new Date(2022, 11, 15); // December 15, 2022
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const filename = 'test-image.jpg';
      const key = generateR2Key(filename);
      expect(key).toBe('images/2022/12/test-image.jpg');

      jest.restoreAllMocks();
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
      expect(filename).toBe('mock-uuid-1234-1640995200000.');
    });

    it('should handle filenames with multiple dots', () => {
      const originalName = 'my.test.image.png';
      const filename = generateUniqueFilename(originalName);
      expect(filename).toBe('mock-uuid-1234-1640995200000.png');
    });
  });

  describe('validateImageFile', () => {
    const createMockFile = (type: string, size: number, name = 'test.jpg'): File => {
      return new File(['test content'], name, { type, lastModified: Date.now() });
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
      expect(result.error).toBe('Only JPEG, PNG, GIF, WebP image formats are supported');
    });

    it('should reject non-image files', () => {
      const file = createMockFile('text/plain', 1024 * 1024);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only JPEG, PNG, GIF, WebP image formats are supported');
    });

    it('should reject oversized files', () => {
      const file = createMockFile('image/jpeg', 11 * 1024 * 1024); // 11MB
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size cannot exceed 10MB');
    });

    it('should accept files at size boundary', () => {
      const file = createMockFile('image/jpeg', 10 * 1024 * 1024); // exactly 10MB
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('getFileUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.R2_PUBLIC_URL = 'https://cdn.example.com';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

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

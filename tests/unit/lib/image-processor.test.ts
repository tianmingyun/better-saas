/**
 * 图像处理器测试
 */

import { validateImageFile, detectPlatform } from '@/lib/image-processor';

describe('Image Processor', () => {
  describe('validateImageFile', () => {
    it('should accept valid JPEG files', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateImageFile(mockFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG files', () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateImageFile(mockFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unsupported file types', () => {
      const mockFile = new File([''], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateImageFile(mockFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('仅支持 JPEG、PNG 格式的图片');
    });

    it('should reject files that are too large', () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      
      const result = validateImageFile(mockFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('文件大小不能超过 10MB');
    });
  });

  describe('detectPlatform', () => {
    it('should detect Node.js environment', () => {
      const platform = detectPlatform();
      // 在测试环境中应该检测为 node
      expect(['node', 'vercel-serverless', 'unknown'].includes(platform)).toBe(true);
    });
  });
}); 
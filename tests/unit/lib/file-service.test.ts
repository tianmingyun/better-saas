import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  generateR2Key,
  generateUniqueFilename,
  validateImageFile,
  getFileUrl,
} from '@/lib/file-service'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
  },
})

// Mock Date.now
const mockDateNow = jest.spyOn(Date, 'now')

describe('文件服务测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDateNow.mockReturnValue(1640995200000) // 2022-01-01 00:00:00
  })

  describe('generateR2Key', () => {
    it('应该生成正确的原始文件路径', () => {
      const filename = 'test-image.jpg'
      const key = generateR2Key(filename)
      expect(key).toBe('images/2022/01/test-image.jpg')
    })

    it('应该生成正确的缩略图路径', () => {
      const filename = 'test-image.jpg'
      const key = generateR2Key(filename, 'thumbnail')
      expect(key).toBe('thumbnails/2022/01/test-image.jpg')
    })

    it('应该处理不同月份', () => {
      // Mock December (month 11, display as 12)
      const mockDate = new Date(2022, 11, 15) // December 15, 2022
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
      
      const filename = 'test-image.jpg'
      const key = generateR2Key(filename)
      expect(key).toBe('images/2022/12/test-image.jpg')
      
      jest.restoreAllMocks()
    })
  })

  describe('generateUniqueFilename', () => {
    it('应该生成唯一的文件名', () => {
      const originalName = 'my-image.jpg'
      const filename = generateUniqueFilename(originalName)
      expect(filename).toBe('mock-uuid-1234-1640995200000.jpg')
    })

    it('应该处理没有扩展名的文件', () => {
      const originalName = 'filename'
      const filename = generateUniqueFilename(originalName)
      expect(filename).toBe('mock-uuid-1234-1640995200000.')
    })

    it('应该处理多个点的文件名', () => {
      const originalName = 'my.test.image.png'
      const filename = generateUniqueFilename(originalName)
      expect(filename).toBe('mock-uuid-1234-1640995200000.png')
    })
  })

  describe('validateImageFile', () => {
    const createMockFile = (type: string, size: number, name = 'test.jpg'): File => {
      return new File(['test content'], name, { type, lastModified: Date.now() })
    }

    it('应该验证有效的JPEG文件', () => {
      const file = createMockFile('image/jpeg', 1024 * 1024) // 1MB
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('应该验证有效的PNG文件', () => {
      const file = createMockFile('image/png', 1024 * 1024)
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('应该验证有效的GIF文件', () => {
      const file = createMockFile('image/gif', 1024 * 1024)
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('应该验证有效的WebP文件', () => {
      const file = createMockFile('image/webp', 1024 * 1024)
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('应该拒绝不支持的文件类型', () => {
      const file = createMockFile('image/bmp', 1024 * 1024)
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('仅支持 JPEG、PNG、GIF、WebP 格式的图片')
    })

    it('应该拒绝非图片文件', () => {
      const file = createMockFile('text/plain', 1024 * 1024)
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('仅支持 JPEG、PNG、GIF、WebP 格式的图片')
    })

    it('应该拒绝过大的文件', () => {
      const file = createMockFile('image/jpeg', 11 * 1024 * 1024) // 11MB
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('文件大小不能超过 10MB')
    })

    it('应该接受边界大小的文件', () => {
      const file = createMockFile('image/jpeg', 10 * 1024 * 1024) // exactly 10MB
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })
  })

  describe('getFileUrl', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
      process.env.R2_PUBLIC_URL = 'https://cdn.example.com'
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('应该生成正确的文件URL', () => {
      const r2Key = 'images/2022/01/test-image.jpg'
      const url = getFileUrl(r2Key)
      expect(url).toBe('https://cdn.example.com/images/2022/01/test-image.jpg')
    })

    it('应该处理缩略图URL', () => {
      const r2Key = 'thumbnails/2022/01/test-image.jpg'
      const url = getFileUrl(r2Key)
      expect(url).toBe('https://cdn.example.com/thumbnails/2022/01/test-image.jpg')
    })

    it('应该处理特殊字符', () => {
      const r2Key = 'images/2022/01/test image with spaces.jpg'
      const url = getFileUrl(r2Key)
      expect(url).toBe('https://cdn.example.com/images/2022/01/test image with spaces.jpg')
    })
  })
})
